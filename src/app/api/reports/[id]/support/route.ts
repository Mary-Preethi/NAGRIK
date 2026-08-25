import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import { logAuditEvent } from '@/lib/audit';

export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    const user = await requireAuth();
    const idOrTracking = params.id;

    const report = await db.report.findFirst({
      where: {
        OR: [{ id: idOrTracking }, { trackingId: idOrTracking }],
      },
    });

    if (!report) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 });
    }

    const existing = await db.reportSupport.findUnique({
      where: {
        reportId_userId: {
          reportId: report.id,
          userId: user.userId,
        },
      },
    });

    if (existing) {
      // Remove support (toggle)
      await db.reportSupport.delete({
        where: { id: existing.id },
      });

      const updatedCount = await db.reportSupport.count({ where: { reportId: report.id } });
      return NextResponse.json({ supported: false, supportCount: updatedCount });
    }

    // Add support
    await db.reportSupport.create({
      data: {
        reportId: report.id,
        userId: user.userId,
      },
    });

    await logAuditEvent({
      actorId: user.userId,
      actorRole: user.role,
      actionType: 'SUPPORT_REPORT',
      targetEntity: 'Report',
      targetId: report.id,
    });

    const updatedCount = await db.reportSupport.count({ where: { reportId: report.id } });
    return NextResponse.json({ supported: true, supportCount: updatedCount });
  } catch (error: any) {
    if (error.message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Authentication required to support issues.' }, { status: 401 });
    }
    return NextResponse.json({ error: 'Failed to update support status' }, { status: 500 });
  }
}
