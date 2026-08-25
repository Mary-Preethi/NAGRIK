import { db } from './db';
import crypto from 'crypto';

export type AuditActionType =
  | 'USER_REGISTER'
  | 'USER_LOGIN'
  | 'SUBMIT_REPORT'
  | 'UPDATE_REPORT'
  | 'UPDATE_EVIDENCE'
  | 'REMOVE_EVIDENCE'
  | 'WITHDRAW_REPORT'
  | 'REQUEST_REPORT_CORRECTION'
  | 'REQUEST_REPORT_WITHDRAWAL'
  | 'UPDATE_REPORT_STATUS'
  | 'UPLOAD_EVIDENCE'
  | 'SUPPORT_REPORT'
  | 'CREATE_SYSTEMIC_ISSUE'
  | 'LINK_REPORT_TO_SYSTEMIC'
  | 'UPDATE_PRIORITY_FACTORS'
  | 'VERIFY_SYSTEMIC_ISSUE'
  | 'INVESTIGATOR_ACTION'
  | 'UPDATE_RESPONSIBILITY_GRAPH'
  | 'RECORD_INSTITUTIONAL_RESPONSE'
  | 'UPDATE_ACTION_COMMITMENT'
  | 'RECORD_OUTCOME'
  | 'ADMIN_CONFIG_CHANGE'
  | 'AI_ANALYSIS_EXECUTED';

export interface AuditLogParams {
  actorId?: string;
  actorRole?: 'CITIZEN' | 'INVESTIGATOR' | 'ADMIN' | 'SYSTEM' | 'ANONYMOUS';
  actionType: AuditActionType;
  targetEntity: string;
  targetId: string;
  diff?: Record<string, any>;
  ipAddress?: string;
}

/**
 * Append-Only Audit Logger.
 * Strict Invariant: Records are only created. No mutation or deletion methods exist in the application.
 */
export async function logAuditEvent(params: AuditLogParams) {
  try {
    const ipHash = params.ipAddress
      ? crypto.createHash('sha256').update(params.ipAddress).digest('hex').substring(0, 16)
      : undefined;

    return await db.auditLog.create({
      data: {
        actorId: params.actorId || 'SYSTEM',
        actorRole: params.actorRole || 'SYSTEM',
        actionType: params.actionType,
        targetEntity: params.targetEntity,
        targetId: params.targetId,
        diffJson: params.diff ? JSON.stringify(params.diff) : null,
        ipHash: ipHash,
      },
    });
  } catch (error) {
    // Non-blocking for high availability, but logged to stderr
    console.error('[AUDIT_LOG_FAILURE] Failed to persist append-only audit log:', error);
    return null;
  }
}

/**
 * Query Audit Logs (Read-only access for authorized Admins/Investigator views)
 */
export async function getAuditLogs(options?: {
  targetEntity?: string;
  targetId?: string;
  actorId?: string;
  limit?: number;
  offset?: number;
}) {
  const limit = options?.limit ?? 50;
  const offset = options?.offset ?? 0;

  return await db.auditLog.findMany({
    where: {
      ...(options?.targetEntity ? { targetEntity: options.targetEntity } : {}),
      ...(options?.targetId ? { targetId: options.targetId } : {}),
      ...(options?.actorId ? { actorId: options.actorId } : {}),
    },
    orderBy: {
      timestamp: 'desc',
    },
    take: limit,
    skip: offset,
  });
}
