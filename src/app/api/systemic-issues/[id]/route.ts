import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { serializePublicSystemicIssue } from '@/lib/dto';

export async function GET(request: Request, { params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  const isInvestigator = user && (user.role === 'INVESTIGATOR' || user.role === 'ADMIN');
  const idOrTracking = params.id;

  const issue = await db.systemicIssue.findFirst({
    where: {
      OR: [{ id: idOrTracking }, { trackingId: idOrTracking }],
    },
    include: {
      reportLinks: {
        include: {
          report: {
            include: { evidence: true, supports: true },
          },
        },
      },
      responsibilityNodes: true,
      responsibilityEdges: true,
      institutionalResponses: {
        include: { commitments: true },
      },
      outcomeUpdates: true,
      verificationReviews: {
        include: { reviewer: { select: { displayName: true, role: true } } },
        orderBy: { createdAt: 'desc' },
      },
    },
  });

  if (!issue) {
    return NextResponse.json({ error: 'Systemic issue not found' }, { status: 404 });
  }

  // If issue is private candidate and user is not an investigator/admin
  if (!issue.isPublic && !isInvestigator) {
    return NextResponse.json({ error: 'Systemic issue under preliminary internal analysis' }, { status: 403 });
  }

  // Deduplicate support count
  const supporterUserIds = new Set<string>();
  issue.reportLinks.forEach((link) => {
    link.report.supports.forEach((s) => supporterUserIds.add(s.userId));
  });

  const publicData = serializePublicSystemicIssue(issue, supporterUserIds.size);

  if (isInvestigator) {
    return NextResponse.json({
      issue: {
        ...publicData,
        isPublic: issue.isPublic,
        rawNodes: issue.responsibilityNodes,
        rawEdges: issue.responsibilityEdges,
        verificationHistory: issue.verificationReviews.map((v) => ({
          id: v.id,
          action: v.action,
          notes: v.notes,
          reviewer: v.reviewer.displayName,
          previousStatus: v.previousStatus,
          newStatus: v.newStatus,
          createdAt: v.createdAt,
        })),
        linkedReports: issue.reportLinks.map((l) => ({
          id: l.report.id,
          trackingId: l.report.trackingId,
          title: l.report.title,
          category: l.report.category,
          locationDistrict: l.report.locationDistrict,
          locationState: l.report.locationState,
          status: l.report.status,
          hasEvidence: l.report.evidence.length > 0,
          confidenceScore: l.confidenceScore,
          rationale: l.rationale,
          createdAt: l.report.createdAt,
        })),
      },
    });
  }

  return NextResponse.json({ issue: publicData });
}
