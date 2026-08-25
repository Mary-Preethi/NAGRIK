/**
 * Data Transfer Objects (DTO) and Privacy Boundary Serializers
 * Strictly enforces Section 5.4, 25, and 26 of the NAGRIK specification.
 */

export interface PublicSystemicIssueDTO {
  id: string;
  trackingId: string;
  title: string;
  summary: string;
  category: string;
  regionScope: string;
  status: string;
  priorityScore: number;
  priorityExplanation: string | null;
  factorBreakdown: {
    severity: number;
    urgency: number;
    scaleEstimate: number;
    geographicSpread: number;
    evidenceStrength: number;
    persistenceScore: number;
    growthRate: number;
  };
  linkedReportCount: number;
  totalSupportCount: number;
  createdAt: string;
  updatedAt: string;
  responsibilityGraph: {
    nodes: Array<{
      id: string;
      name: string;
      level: string;
      jurisdiction: string;
      description: string | null;
    }>;
    edges: Array<{
      id: string;
      sourceNodeId: string;
      targetNodeId: string;
      relationshipType: string;
      rationale: string;
      evidenceSource: string | null;
    }>;
  };
  institutionalResponses: Array<{
    id: string;
    authorityName: string;
    authorityLevel: string;
    responseSummary: string;
    responseDate: string;
    responseType: string;
    sourceReferenceUrl: string | null;
    commitments: Array<{
      id: string;
      commitmentDetails: string;
      deadlineDate: string | null;
      status: string;
    }>;
  }>;
  outcomes: Array<{
    id: string;
    outcomeStatus: string;
    verificationNotes: string;
    isIndependentVerification: boolean;
    createdAt: string;
  }>;
}

export interface PublicReportDTO {
  id: string;
  trackingId: string;
  title: string;
  category: string;
  description: string;
  locationState: string;
  locationDistrict: string;
  locationGeneral: string;
  incidentDate: string | null;
  status: string;
  supportCount: number;
  hasEvidence: boolean;
  publicEvidenceCount: number;
  createdAt: string;
}

export function serializePublicSystemicIssue(issue: any, totalSupports: number = 0): PublicSystemicIssueDTO {
  return {
    id: issue.id,
    trackingId: issue.trackingId,
    title: issue.title,
    summary: issue.summary,
    category: issue.category,
    regionScope: issue.regionScope,
    status: issue.status,
    priorityScore: Number(issue.priorityScore.toFixed(1)),
    priorityExplanation: issue.priorityExplanation,
    factorBreakdown: {
      severity: Number(issue.severity.toFixed(1)),
      urgency: Number(issue.urgency.toFixed(1)),
      scaleEstimate: Number(issue.scaleEstimate.toFixed(1)),
      geographicSpread: Number(issue.geographicSpread.toFixed(1)),
      evidenceStrength: Number(issue.evidenceStrength.toFixed(1)),
      persistenceScore: Number(issue.persistenceScore.toFixed(1)),
      growthRate: Number(issue.growthRate.toFixed(1)),
    },
    linkedReportCount: issue.reportLinks?.length || 0,
    totalSupportCount: totalSupports,
    createdAt: issue.createdAt instanceof Date ? issue.createdAt.toISOString() : issue.createdAt,
    updatedAt: issue.updatedAt instanceof Date ? issue.updatedAt.toISOString() : issue.updatedAt,
    responsibilityGraph: {
      nodes: (issue.responsibilityNodes || [])
        .filter((n: any) => n.isVerified)
        .map((n: any) => ({
          id: n.id,
          name: n.name,
          level: n.level,
          jurisdiction: n.jurisdiction,
          description: n.description,
        })),
      edges: (issue.responsibilityEdges || [])
        .filter((e: any) => e.isVerified)
        .map((e: any) => ({
          id: e.id,
          sourceNodeId: e.sourceNodeId,
          targetNodeId: e.targetNodeId,
          relationshipType: e.relationshipType,
          rationale: e.rationale,
          evidenceSource: e.evidenceSource,
        })),
    },
    institutionalResponses: (issue.institutionalResponses || []).map((r: any) => ({
      id: r.id,
      authorityName: r.authorityName,
      authorityLevel: r.authorityLevel,
      responseSummary: r.responseSummary,
      responseDate: r.responseDate instanceof Date ? r.responseDate.toISOString() : r.responseDate,
      responseType: r.responseType,
      sourceReferenceUrl: r.sourceReferenceUrl,
      commitments: (r.commitments || []).map((c: any) => ({
        id: c.id,
        commitmentDetails: c.commitmentDetails,
        deadlineDate: c.deadlineDate ? (c.deadlineDate instanceof Date ? c.deadlineDate.toISOString() : c.deadlineDate) : null,
        status: c.status,
      })),
    })),
    outcomes: (issue.outcomeUpdates || []).map((o: any) => ({
      id: o.id,
      outcomeStatus: o.outcomeStatus,
      verificationNotes: o.verificationNotes,
      isIndependentVerification: o.isIndependentVerification,
      createdAt: o.createdAt instanceof Date ? o.createdAt.toISOString() : o.createdAt,
    })),
  };
}

export function serializePublicReport(report: any): PublicReportDTO {
  const publicEvidence = (report.evidence || []).filter((e: any) => !e.isPrivate);
  return {
    id: report.id,
    trackingId: report.trackingId,
    title: report.title,
    category: report.category,
    description: report.description,
    locationState: report.locationState,
    locationDistrict: report.locationDistrict,
    locationGeneral: report.locationGeneral,
    incidentDate: report.incidentDate ? (report.incidentDate instanceof Date ? report.incidentDate.toISOString() : report.incidentDate) : null,
    status: report.status,
    supportCount: report.supports?.length || 0,
    hasEvidence: (report.evidence?.length || 0) > 0,
    publicEvidenceCount: publicEvidence.length,
    createdAt: report.createdAt instanceof Date ? report.createdAt.toISOString() : report.createdAt,
  };
}

export function serializeCitizenReport(report: any) {
  return {
    id: report.id,
    trackingId: report.trackingId,
    title: report.title,
    category: report.category,
    description: report.description,
    locationState: report.locationState,
    locationDistrict: report.locationDistrict,
    locationGeneral: report.locationGeneral,
    incidentDate: report.incidentDate,
    status: report.status,
    createdAt: report.createdAt,
    updatedAt: report.updatedAt,
    supportsCount: report.supports?.length || 0,
    evidence: (report.evidence || []).map((e: any) => ({
      id: e.id,
      fileName: e.fileName,
      filePath: e.filePath,
      fileType: e.fileType,
      fileSize: e.fileSize,
      description: e.description,
      isPrivate: e.isPrivate,
      uploadedAt: e.uploadedAt,
    })),
    systemicIssue: report.systemicLinks?.[0]?.systemicIssue
      ? {
          id: report.systemicLinks[0].systemicIssue.id,
          trackingId: report.systemicLinks[0].systemicIssue.trackingId,
          title: report.systemicLinks[0].systemicIssue.title,
          status: report.systemicLinks[0].systemicIssue.status,
          priorityScore: report.systemicLinks[0].systemicIssue.priorityScore,
        }
      : null,
  };
}
