import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { db } from '@/lib/db';

export async function GET() {
  const session = await getCurrentUser();
  if (!session) {
    return NextResponse.json({ user: null });
  }

  const user = await db.user.findUnique({
    where: { id: session.userId },
    include: { privacySettings: true },
  });

  if (!user || !user.isActive) {
    return NextResponse.json({ user: null });
  }

  return NextResponse.json({
    user: {
      id: user.id,
      email: user.email,
      displayName: user.displayName,
      role: user.role,
      privacySettings: user.privacySettings,
      createdAt: user.createdAt,
    },
  });
}
