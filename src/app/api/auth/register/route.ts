import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { hashPassword, createToken, setSessionCookie } from '@/lib/auth';
import { logAuditEvent } from '@/lib/audit';

/**
 * Public Self-Registration Endpoint
 * Strict Security Invariant: Public self-registration creates ONLY 'CITIZEN' accounts.
 * Any user-supplied role in the payload is strictly discarded to prevent privilege escalation.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password, displayName } = body;

    if (!email || !password || !displayName) {
      return NextResponse.json({ error: 'Missing required registration fields' }, { status: 400 });
    }

    if (password.length < 8) {
      return NextResponse.json({ error: 'Password must be at least 8 characters long' }, { status: 400 });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const existing = await db.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existing) {
      return NextResponse.json({ error: 'An account with this email already exists' }, { status: 409 });
    }

    const passwordHash = await hashPassword(password);

    // SECURITY ENFORCEMENT: Hardcoded CITIZEN role.
    // Privileged roles (INVESTIGATOR, ADMIN) can only be provisioned via secure seed or admin provisioning.
    const assignedRole = 'CITIZEN';

    const user = await db.user.create({
      data: {
        email: normalizedEmail,
        passwordHash,
        displayName: displayName.trim(),
        role: assignedRole,
        privacySettings: {
          create: {
            displayPublicly: false,
            allowInvestigatorContact: true,
            anonymizeReports: true,
          },
        },
      },
    });

    const token = createToken({
      userId: user.id,
      email: user.email,
      role: user.role as any,
      displayName: user.displayName,
    });

    await setSessionCookie(token);

    await logAuditEvent({
      actorId: user.id,
      actorRole: 'CITIZEN',
      actionType: 'USER_REGISTER',
      targetEntity: 'User',
      targetId: user.id,
      diff: { email: user.email, role: 'CITIZEN' },
    });

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        displayName: user.displayName,
        role: user.role,
      },
    });
  } catch (error: any) {
    console.error('Registration error:', error);
    return NextResponse.json({ error: 'Registration failed' }, { status: 500 });
  }
}
