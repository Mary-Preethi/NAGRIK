import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireRole } from '@/lib/auth';
import { logAuditEvent } from '@/lib/audit';

export async function POST(request: Request) {
  try {
    const user = await requireRole(['INVESTIGATOR', 'ADMIN']);
    const body = await request.json();
    const { systemicIssueId, action, notes } = body;

    if (!systemicIssueId || !action || !notes) {
      return NextResponse.json({ error: 'Missing required verification fields' }, { status: 400 });
    }

    const issue = await db.systemicIssue.findUnique({
      where: { id: systemicIssueId },
    });

    if (!issue) {
      return NextResponse.json({ error: 'Systemic issue not found' }, { status: 404 });
    }

    const prevStatus = issue.status;
    let newStatus = prevStatus;
    let makePublic = issue.isPublic;

    switch (action) {
      case 'VERIFY':
        newStatus = 'VERIFIED';
        makePublic = true;
        break;
      case 'REQUEST_MORE_EVIDENCE':
        newStatus = 'UNDER_INVESTIGATION';
        break;
      case 'MARK_INSUFFICIENT':
        newStatus = 'UNDER_INVESTIGATION';
        break;
      case 'REJECT':
        newStatus = 'REJECTED';
        makePublic = false;
        break;
      case 'ESCALATE':
        newStatus = 'IN_ACTION';
        makePublic = true;
        break;
      default:
        return NextResponse.json({ error: 'Invalid verification action' }, { status: 400 });
    }

    const updatedIssue = await db.systemicIssue.update({
      where: { id: issue.id },
      data: {
        status: newStatus,
        isPublic: makePublic,
      },
    });

    // Record formal verification review
    const review = await db.verificationReview.create({
      data: {
        systemicIssueId: issue.id,
        reviewerId: user.userId,
        action,
        notes: notes.trim(),
        previousStatus: prevStatus,
        newStatus,
      },
    });

    // Record immutable audit event
    await logAuditEvent({
      actorId: user.userId,
      actorRole: user.role,
      actionType: 'VERIFY_SYSTEMIC_ISSUE',
      targetEntity: 'SystemicIssue',
      targetId: issue.id,
      diff: {
        action,
        previousStatus: prevStatus,
        newStatus,
        notes: notes.trim(),
        reviewerName: user.displayName,
      },
    });

    return NextResponse.json({
      success: true,
      issue: updatedIssue,
      review,
      message: `Systemic issue status updated from ${prevStatus} to ${newStatus}.`,
    });
  } catch (error: any) {
    if (error.message === 'UNAUTHORIZED' || error.message === 'FORBIDDEN') {
      return NextResponse.json({ error: 'Investigator or Admin authorization required' }, { status: 403 });
    }
    console.error('Verification error:', error);
    return NextResponse.json({ error: 'Verification action failed' }, { status: 500 });
  }
}
