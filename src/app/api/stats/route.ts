import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    const [totalReports, totalSystemicIssues, verifiedIssues, resolvedOutcomes, totalSupports, totalCitizens] = await Promise.all([
      db.report.count(),
      db.systemicIssue.count(),
      db.systemicIssue.count({ where: { status: { in: ['VERIFIED', 'IN_ACTION', 'RESOLVED', 'PARTIALLY_RESOLVED'] } } }),
      db.systemicIssue.count({ where: { status: { in: ['RESOLVED', 'PARTIALLY_RESOLVED'] } } }),
      db.reportSupport.count(),
      db.user.count({ where: { role: 'CITIZEN', isActive: true } }),
    ]);

    const activeDistrictsCount = (
      await db.report.groupBy({
        by: ['locationDistrict'],
      })
    ).length;

    return NextResponse.json({
      totalReports,
      totalSystemicIssues,
      verifiedIssues,
      resolvedOutcomes,
      totalSupports,
      totalCitizens,
      activeDistrictsCount,
    });
  } catch (error) {
    console.error('Stats query error:', error);
    return NextResponse.json({
      totalReports: 0,
      totalSystemicIssues: 0,
      verifiedIssues: 0,
      resolvedOutcomes: 0,
      totalSupports: 0,
      totalCitizens: 0,
      activeDistrictsCount: 0,
    });
  }
}
