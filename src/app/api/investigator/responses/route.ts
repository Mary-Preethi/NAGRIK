import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireRole } from '@/lib/auth';
import { logAuditEvent } from '@/lib/audit';

export async function POST(request: Request) {
  try {
    const user = await requireRole(['INVESTIGATOR', 'ADMIN']);
    const body = await request.json();
    const {
      systemicIssueId,
      authorityName,
      authorityLevel,
      responseSummary,
      responseDate,
      responseType,
      sourceReferenceUrl,
      commitments,
      outcomeUpdate,
    } = body;

    if (!systemicIssueId || !authorityName || !responseSummary) {
      return NextResponse.json({ error: 'Missing required institutional response fields' }, { status: 400 });
    }

    const response = await db.institutionalResponse.create({
      data: {
        systemicIssueId,
        authorityName: authorityName.trim(),
        authorityLevel: authorityLevel || 'District',
        responseSummary: responseSummary.trim(),
        responseDate: responseDate ? new Date(responseDate) : new Date(),
        responseType: responseType || 'OFFICIAL_STATEMENT',
        sourceReferenceUrl: sourceReferenceUrl || null,
        commitments: Array.isArray(commitments) && commitments.length > 0
          ? {
              create: commitments.map((c: any) => ({
                commitmentDetails: c.commitmentDetails.trim(),
                deadlineDate: c.deadlineDate ? new Date(c.deadlineDate) : null,
                status: c.status || 'PENDING',
              })),
            }
          : undefined,
      },
      include: { commitments: true },
    });

    if (outcomeUpdate) {
      await db.outcomeUpdate.create({
        data: {
          systemicIssueId,
          actorId: user.userId,
          outcomeStatus: outcomeUpdate.status || 'IN_ACTION',
          verificationNotes: outcomeUpdate.notes || 'Institutional response recorded.',
          isIndependentVerification: outcomeUpdate.isIndependentVerification || false,
        },
      });

      // Update systemic issue overall status
      if (['RESOLVED', 'PARTIALLY_RESOLVED', 'UNRESOLVED'].includes(outcomeUpdate.status)) {
        await db.systemicIssue.update({
          where: { id: systemicIssueId },
          data: { status: outcomeUpdate.status },
        });
      }
    }

    await logAuditEvent({
      actorId: user.userId,
      actorRole: user.role,
      actionType: 'RECORD_INSTITUTIONAL_RESPONSE',
      targetEntity: 'SystemicIssue',
      targetId: systemicIssueId,
      diff: {
        authorityName,
        responseType,
        commitmentsCount: commitments?.length || 0,
        outcomeStatus: outcomeUpdate?.status,
      },
    });

    return NextResponse.json({
      success: true,
      response,
      message: 'Institutional response and accountability commitments recorded.',
    });
  } catch (error: any) {
    if (error.message === 'UNAUTHORIZED' || error.message === 'FORBIDDEN') {
      return NextResponse.json({ error: 'Investigator authorization required' }, { status: 403 });
    }
    console.error('Response logging error:', error);
    return NextResponse.json({ error: 'Failed to record institutional response' }, { status: 500 });
  }
}
