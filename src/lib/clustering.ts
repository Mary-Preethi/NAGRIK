import { db } from './db';
import { calculatePriority } from './priority-engine';
import { logAuditEvent } from './audit';
import { analyzeReportWithAI, generatePreliminaryResponsibilityGraph } from './ai/gemini-service';

/**
 * Process a new or updated report through the Systemic Aggregation Pipeline
 */
export async function processReportAggregation(reportId: string) {
  const report = await db.report.findUnique({
    where: { id: reportId },
    include: { evidence: true },
  });

  if (!report) return null;

  // Step 1: Extract AI / Heuristic signals
  const signals = await analyzeReportWithAI({
    id: report.id,
    title: report.title,
    description: report.description,
    category: report.category,
    locationState: report.locationState,
    locationDistrict: report.locationDistrict,
  });

  await db.report.update({
    where: { id: report.id },
    data: {
      aiProcessed: true,
      status: report.status === 'SUBMITTED' ? 'PRELIMINARY_ANALYSIS' : report.status,
    },
  });

  // Step 2: Search for candidate systemic clusters in the same category & region
  const matchingIssues = await db.systemicIssue.findMany({
    where: {
      category: report.category,
      status: { notIn: ['RESOLVED', 'REJECTED'] },
    },
    include: {
      reportLinks: {
        include: { report: true },
      },
    },
  });

  let targetIssue = matchingIssues.find((issue) => {
    // Check geographic compatibility
    const hasSameDistrict = issue.reportLinks.some(
      (link) => link.report.locationDistrict.toLowerCase() === report.locationDistrict.toLowerCase()
    );
    return hasSameDistrict;
  });

  if (targetIssue) {
    // Link to existing systemic issue
    const existingLink = await db.reportSystemicIssueLink.findUnique({
      where: {
        reportId_systemicIssueId: {
          reportId: report.id,
          systemicIssueId: targetIssue.id,
        },
      },
    });

    if (!existingLink) {
      await db.reportSystemicIssueLink.create({
        data: {
          reportId: report.id,
          systemicIssueId: targetIssue.id,
          confidenceScore: signals.confidenceScore,
          rationale: `Semantic category match (${report.category}) and district proximity (${report.locationDistrict}).`,
          linkedBy: 'AI_SUGGESTED',
        },
      });

      await db.report.update({
        where: { id: report.id },
        data: { status: 'LINKED_TO_SYSTEMIC' },
      });

      // Recalculate systemic issue metrics
      await recalculateSystemicIssueMetrics(targetIssue.id);

      await logAuditEvent({
        actionType: 'LINK_REPORT_TO_SYSTEMIC',
        targetEntity: 'SystemicIssue',
        targetId: targetIssue.id,
        diff: {
          reportId: report.id,
          reportTrackingId: report.trackingId,
          systemicTrackingId: targetIssue.trackingId,
        },
      });
    }
  } else {
    // Check if there are enough unclustered reports in this district + category to form a new candidate
    const unlinkedReports = await db.report.findMany({
      where: {
        category: report.category,
        locationDistrict: report.locationDistrict,
        locationState: report.locationState,
        systemicLinks: { none: {} },
      },
    });

    if (unlinkedReports.length >= 3) {
      // Create new candidate systemic issue
      const dateStr = new Date().getFullYear();
      const count = await db.systemicIssue.count();
      const trackingId = `SYS-${dateStr}-${String(count + 1).padStart(4, '0')}`;

      const initialPriority = calculatePriority({
        severity: signals.severity,
        urgency: signals.urgency,
        scaleEstimate: signals.scaleEstimate,
        geographicSpread: 5.0, // District level
        evidenceStrength: unlinkedReports.some((r) => r.id === report.id && report.evidence.length > 0) ? 6.5 : 4.0,
        persistenceScore: 6.0,
        growthRate: 6.0,
      });

      const newIssue = await db.systemicIssue.create({
        data: {
          trackingId,
          title: `Systemic ${report.category.replace(/_/g, ' ')} Failures in ${report.locationDistrict}`,
          summary: `Aggregated cluster of ${unlinkedReports.length} citizen reports indicating recurring ${report.category.toLowerCase().replace(/_/g, ' ')} operational and maintenance defects across ${report.locationDistrict}, ${report.locationState}.`,
          category: report.category,
          regionScope: 'DISTRICT',
          status: 'CANDIDATE',
          severity: initialPriority.factors.severity,
          urgency: initialPriority.factors.urgency,
          scaleEstimate: initialPriority.factors.scaleEstimate,
          geographicSpread: initialPriority.factors.geographicSpread,
          evidenceStrength: initialPriority.factors.evidenceStrength,
          persistenceScore: initialPriority.factors.persistenceScore,
          growthRate: initialPriority.factors.growthRate,
          priorityScore: initialPriority.score,
          priorityExplanation: initialPriority.explanation,
          isPublic: false, // Internal candidate until reviewed
        },
      });

      // Link all unlinked reports
      for (const r of unlinkedReports) {
        await db.reportSystemicIssueLink.create({
          data: {
            reportId: r.id,
            systemicIssueId: newIssue.id,
            confidenceScore: 0.85,
            rationale: 'District-level semantic cluster aggregation.',
            linkedBy: 'AI_SUGGESTED',
          },
        });
        await db.report.update({
          where: { id: r.id },
          data: { status: 'LINKED_TO_SYSTEMIC' },
        });
      }

      // Generate Preliminary Responsibility Draft
      const prelimGraph = await generatePreliminaryResponsibilityGraph({
        id: newIssue.id,
        title: newIssue.title,
        summary: newIssue.summary,
        category: newIssue.category,
        regionScope: newIssue.regionScope,
      });

      const createdNodeIds: string[] = [];
      for (const n of prelimGraph.nodes) {
        const nodeRecord = await db.responsibilityNode.create({
          data: {
            systemicIssueId: newIssue.id,
            name: n.name,
            level: n.level,
            jurisdiction: n.jurisdiction,
            description: n.description,
            confidenceScore: n.confidenceScore,
            isVerified: false,
          },
        });
        createdNodeIds.push(nodeRecord.id);
      }

      for (const e of prelimGraph.edges) {
        const sourceId = createdNodeIds[e.sourceIndex];
        const targetId = createdNodeIds[e.targetIndex];
        if (sourceId && targetId) {
          await db.responsibilityEdge.create({
            data: {
              systemicIssueId: newIssue.id,
              sourceNodeId: sourceId,
              targetNodeId: targetId,
              relationshipType: e.relationshipType,
              rationale: e.rationale,
              evidenceSource: e.evidenceSource,
              isVerified: false,
            },
          });
        }
      }

      await logAuditEvent({
        actionType: 'CREATE_SYSTEMIC_ISSUE',
        targetEntity: 'SystemicIssue',
        targetId: newIssue.id,
        diff: {
          trackingId: newIssue.trackingId,
          linkedReportCount: unlinkedReports.length,
          calculatedPriority: initialPriority.score,
        },
      });
    }
  }
}

/**
 * Deterministically update priority scores and factor metrics for a systemic issue
 */
export async function recalculateSystemicIssueMetrics(systemicIssueId: string) {
  const issue = await db.systemicIssue.findUnique({
    where: { id: systemicIssueId },
    include: {
      reportLinks: {
        include: {
          report: {
            include: { evidence: true, supports: true },
          },
        },
      },
    },
  });

  if (!issue) return;

  const totalReports = issue.reportLinks.length;
  const distinctDistricts = new Set(issue.reportLinks.map((l) => l.report.locationDistrict)).size;
  const reportsWithEvidence = issue.reportLinks.filter((l) => l.report.evidence.length > 0).length;

  // Geographic Spread: 1 dist = 4.0, 2-3 dist = 7.0, 4+ dist = 9.5
  let geoSpread = 4.0;
  if (distinctDistricts >= 4) geoSpread = 9.5;
  else if (distinctDistricts >= 2) geoSpread = 7.0;

  // Evidence strength based on corroboration ratio
  const evidenceRatio = totalReports > 0 ? reportsWithEvidence / totalReports : 0;
  const evidenceStrength = Math.min(10.0, Math.max(3.0, 3.5 + evidenceRatio * 5.5));

  // Scale estimate based on volume of reports
  const scale = Math.min(10.0, Math.max(4.0, 4.0 + totalReports * 0.8));

  // Growth rate based on recent submissions
  const growth = Math.min(10.0, Math.max(4.0, 4.0 + totalReports * 0.5));

  const priorityResult = calculatePriority({
    severity: issue.severity,
    urgency: issue.urgency,
    scaleEstimate: scale,
    geographicSpread: geoSpread,
    evidenceStrength: evidenceStrength,
    persistenceScore: issue.persistenceScore,
    growthRate: growth,
  });

  await db.systemicIssue.update({
    where: { id: issue.id },
    data: {
      scaleEstimate: priorityResult.factors.scaleEstimate,
      geographicSpread: priorityResult.factors.geographicSpread,
      evidenceStrength: priorityResult.factors.evidenceStrength,
      growthRate: priorityResult.factors.growthRate,
      priorityScore: priorityResult.score,
      priorityExplanation: priorityResult.explanation,
    },
  });
}
