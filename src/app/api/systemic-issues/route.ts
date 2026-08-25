import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { serializePublicSystemicIssue } from '@/lib/dto';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get('category');
  const status = searchParams.get('status');
  const allCandidates = searchParams.get('all') === 'true';

  const user = await getCurrentUser();
  const isInvestigator = user && (user.role === 'INVESTIGATOR' || user.role === 'ADMIN');

  // If investigator requests candidate review queue
  const isPublicOnly = !isInvestigator || (!allCandidates && !status);

  const issues = await db.systemicIssue.findMany({
    where: {
      ...(isPublicOnly ? { isPublic: true } : {}),
      ...(category ? { category } : {}),
      ...(status ? { status } : {}),
    },
    include: {
      reportLinks: {
        include: {
          report: {
            include: { supports: true },
          },
        },
      },
      responsibilityNodes: true,
      responsibilityEdges: true,
      institutionalResponses: {
        include: { commitments: true },
      },
      outcomeUpdates: true,
    },
    orderBy: { priorityScore: 'desc' },
  });

  const serialized = issues.map((issue) => {
    // Deduplicated support count across all linked reports
    const supporterUserIds = new Set<string>();
    issue.reportLinks.forEach((link) => {
      link.report.supports.forEach((s) => supporterUserIds.add(s.userId));
    });

    if (isInvestigator && !isPublicOnly) {
      // Return full investigator view including unverified nodes/edges
      return {
        ...serializePublicSystemicIssue(issue, supporterUserIds.size),
        rawNodes: issue.responsibilityNodes,
        rawEdges: issue.responsibilityEdges,
        isPublic: issue.isPublic,
      };
    }

    return serializePublicSystemicIssue(issue, supporterUserIds.size);
  });

  return NextResponse.json({ issues: serialized });
}
