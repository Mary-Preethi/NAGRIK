import { NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth';
import { getAuditLogs } from '@/lib/audit';

export async function GET(request: Request) {
  try {
    await requireRole(['ADMIN']);
    const { searchParams } = new URL(request.url);
    const targetEntity = searchParams.get('entity') || undefined;
    const actionType = searchParams.get('action') || undefined;
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);

    const logs = await getAuditLogs({
      targetEntity,
      limit,
      offset,
    });

    return NextResponse.json({ logs });
  } catch (error: any) {
    if (error.message === 'UNAUTHORIZED' || error.message === 'FORBIDDEN') {
      return NextResponse.json({ error: 'Administrator access required' }, { status: 403 });
    }
    return NextResponse.json({ error: 'Failed to retrieve audit logs' }, { status: 500 });
  }
}
