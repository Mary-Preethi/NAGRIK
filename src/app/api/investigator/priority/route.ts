import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireRole } from '@/lib/auth';
import { calculatePriority } from '@/lib/priority-engine';
import { logAuditEvent } from '@/lib/audit';

export async function POST(request: Request) {
  try {
    const user = await requireRole(['INVESTIGATOR', 'ADMIN']);
    const body = await request.json();
    const { systemicIssueId, factors, reason } = body;

    if (!systemicIssueId || !factors) {
      return NextResponse.json({ error: 'Missing required priority parameters' }, { status: 400 });
    }

    const issue = await db.systemicIssue.findUnique({
      where: { id: systemicIssueId },
    });

    if (!issue) {
      return NextResponse.json({ error: 'Systemic issue not found' }, { status: 404 });
    }

    const priorityResult = calculatePriority({
      severity: factors.severity ?? issue.severity,
      urgency: factors.urgency ?? issue.urgency,
      scaleEstimate: factors.scaleEstimate ?? issue.scaleEstimate,
      geographicSpread: factors.geographicSpread ?? issue.geographicSpread,
      evidenceStrength: factors.evidenceStrength ?? issue.evidenceStrength,
      persistenceScore: factors.persistenceScore ?? issue.persistenceScore,
      growthRate: factors.growthRate ?? issue.growthRate,
    });

    const updatedIssue = await db.systemicIssue.update({
      where: { id: issue.id },
      data: {
        severity: priorityResult.factors.severity,
        urgency: priorityResult.factors.urgency,
        scaleEstimate: priorityResult.factors.scaleEstimate,
        geographicSpread: priorityResult.factors.geographicSpread,
        evidenceStrength: priorityResult.factors.evidenceStrength,
        persistenceScore: priorityResult.factors.persistenceScore,
        growthRate: priorityResult.factors.growthRate,
        priorityScore: priorityResult.score,
        priorityExplanation: priorityResult.explanation,
      },
    });

    // Record Priority Assessment history
    await db.priorityAssessment.create({
      data: {
        systemicIssueId: issue.id,
        weightsSnapshot: JSON.stringify(priorityResult.weights),
        inputFactors: JSON.stringify(priorityResult.factors),
        calculatedScore: priorityResult.score,
        explanation: priorityResult.explanation,
        assessedBy: 'INVESTIGATOR_OVERRIDE',
      },
    });

    // Log append-only audit event
    await logAuditEvent({
      actorId: user.userId,
      actorRole: user.role,
      actionType: 'UPDATE_PRIORITY_FACTORS',
      targetEntity: 'SystemicIssue',
      targetId: issue.id,
      diff: {
        previousScore: issue.priorityScore,
        newScore: priorityResult.score,
        factors: priorityResult.factors,
        reason: reason || 'Investigator factor adjustment after evidence verification.',
      },
    });

    return NextResponse.json({
      success: true,
      issue: updatedIssue,
      priorityResult,
    });
  } catch (error: any) {
    if (error.message === 'UNAUTHORIZED' || error.message === 'FORBIDDEN') {
      return NextResponse.json({ error: 'Investigator authorization required' }, { status: 403 });
    }
    console.error('Priority update error:', error);
    return NextResponse.json({ error: 'Failed to update priority factors' }, { status: 500 });
  }
}
