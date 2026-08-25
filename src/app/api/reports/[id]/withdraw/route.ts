import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { serializeCitizenReport } from '@/lib/dto';
import { logAuditEvent } from '@/lib/audit';

const DIRECT_WITHDRAW_STATUSES = ['SUBMITTED', 'DRAFT', 'PENDING_TRIAGE', 'PRELIMINARY_ANALYSIS', 'AGGREGATING'];

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
      include: {
        evidence: true,
        supports: true,
        systemicLinks: {
          include: { systemicIssue: true },
        },
      },
    });

    if (!report) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 });
    }

    // Server-side ownership enforcement
    if (report.userId !== currentUser.userId && currentUser.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'You do not have permission to withdraw this report. Citizens can only withdraw their own reports.' },
        { status: 403 }
      );
    }

    if (report.status === 'WITHDRAWN') {
      return NextResponse.json({ error: 'This report is already withdrawn.' }, { status: 400 });
    }

    let reason = '';
    try {
      const body = await request.json();
      reason = body.reason || '';
    } catch {
      // Empty or non-JSON body is valid since reason is optional
    }

    // If report is in editable state: allow direct withdrawal
    if (DIRECT_WITHDRAW_STATUSES.includes(report.status)) {
      const updatedReport = await db.report.update({
        where: { id: report.id },
        data: {
          status: 'WITHDRAWN',
        },
        include: {
          evidence: true,
          supports: true,
          systemicLinks: {
            include: { systemicIssue: true },
          },
        },
      });

      await logAuditEvent({
        actorId: currentUser.userId,
        actorRole: currentUser.role as any,
        actionType: 'WITHDRAW_REPORT',
        targetEntity: 'Report',
        targetId: report.id,
        diff: {
          trackingId: report.trackingId,
          previousStatus: report.status,
          newStatus: 'WITHDRAWN',
          withdrawalReason: reason.trim() || 'No reason provided by reporter',
        },
      });

      return NextResponse.json({
        success: true,
        message: 'Your report has been withdrawn and removed from active civic tracking. It remains securely preserved in the immutable audit log.',
        report: serializeCitizenReport(updatedReport),
      });
    }

    // If report is already under active investigation / verified: record withdrawal request
    await logAuditEvent({
      actorId: currentUser.userId,
      actorRole: currentUser.role as any,
      actionType: 'REQUEST_REPORT_WITHDRAWAL',
      targetEntity: 'Report',
      targetId: report.id,
      diff: {
        trackingId: report.trackingId,
        currentStatus: report.status,
        requestReason: reason.trim() || 'Reporter requested withdrawal of issue under investigation',
      },
    });

    return NextResponse.json({
      success: true,
      isRequest: true,
      message: 'This report is currently part of an active civic investigation. Your withdrawal request has been recorded in the audit trail and submitted to the investigation team.',
      report: serializeCitizenReport(report),
    });
  } catch (error: any) {
    console.error('Report withdrawal error:', error);
    return NextResponse.json({ error: error.message || 'Failed to withdraw report' }, { status: 500 });
  }
}
