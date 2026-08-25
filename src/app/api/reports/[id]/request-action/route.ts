import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { logAuditEvent } from '@/lib/audit';

export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const idOrTracking = params.id;
    const report = await db.report.findFirst({
      where: {
        OR: [{ id: idOrTracking }, { trackingId: idOrTracking }],
      },
    });

    if (!report) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 });
    }

    // Server-side ownership enforcement
    if (report.userId !== currentUser.userId && currentUser.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'You do not have permission to request actions on this report.' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const requestType = body.requestType === 'WITHDRAWAL' ? 'WITHDRAWAL' : 'CORRECTION';
    const reason = (body.reason as string) || '';
    const proposedChanges = body.proposedChanges || null;

    if (!reason.trim()) {
      return NextResponse.json(
        { error: 'Please provide a clear reason or description for your request.' },
        { status: 400 }
      );
    }

    const auditAction =
      requestType === 'WITHDRAWAL' ? 'REQUEST_REPORT_WITHDRAWAL' : 'REQUEST_REPORT_CORRECTION';

    await logAuditEvent({
      actorId: currentUser.userId,
      actorRole: currentUser.role as any,
      actionType: auditAction,
      targetEntity: 'Report',
      targetId: report.id,
      diff: {
        trackingId: report.trackingId,
        currentStatus: report.status,
        requestType,
        reason: reason.trim(),
        proposedChanges,
        submittedAt: new Date().toISOString(),
      },
    });

    return NextResponse.json({
      success: true,
      message: `Your ${requestType.toLowerCase()} request has been securely recorded in the audit trail and forwarded to the investigative panel for review.`,
    });
  } catch (error: any) {
    console.error('Report request-action error:', error);
    return NextResponse.json({ error: error.message || 'Failed to submit request' }, { status: 500 });
  }
}
