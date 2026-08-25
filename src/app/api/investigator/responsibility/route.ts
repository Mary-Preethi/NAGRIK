import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireRole } from '@/lib/auth';
import { logAuditEvent } from '@/lib/audit';

export async function POST(request: Request) {
  try {
    const user = await requireRole(['INVESTIGATOR', 'ADMIN']);
    const body = await request.json();
    const { systemicIssueId, nodes, edges } = body;

    if (!systemicIssueId || !Array.isArray(nodes)) {
      return NextResponse.json({ error: 'Missing required responsibility graph parameters' }, { status: 400 });
    }

    const issue = await db.systemicIssue.findUnique({
      where: { id: systemicIssueId },
    });

    if (!issue) {
      return NextResponse.json({ error: 'Systemic issue not found' }, { status: 404 });
    }

    // Replace existing graph with verified investigator graph
    await db.responsibilityEdge.deleteMany({ where: { systemicIssueId: issue.id } });
    await db.responsibilityNode.deleteMany({ where: { systemicIssueId: issue.id } });

    const createdNodesMap = new Map<string | number, string>();

    for (let i = 0; i < nodes.length; i++) {
      const n = nodes[i];
      const createdNode = await db.responsibilityNode.create({
        data: {
          systemicIssueId: issue.id,
          name: n.name.trim(),
          level: n.level,
          jurisdiction: n.jurisdiction || 'District',
          description: n.description || null,
          confidenceScore: n.confidenceScore || 0.9,
          isVerified: n.isVerified !== false, // default verified upon investigator submission
        },
      });
      createdNodesMap.set(n.id || i, createdNode.id);
    }

    if (Array.isArray(edges)) {
      for (const e of edges) {
        const sourceDbId = createdNodesMap.get(e.sourceNodeId ?? e.sourceIndex);
        const targetDbId = createdNodesMap.get(e.targetNodeId ?? e.targetIndex);

        if (sourceDbId && targetDbId) {
          await db.responsibilityEdge.create({
            data: {
              systemicIssueId: issue.id,
              sourceNodeId: sourceDbId,
              targetNodeId: targetDbId,
              relationshipType: e.relationshipType || 'SUPERVISES',
              rationale: e.rationale || 'Statutory departmental relationship.',
              evidenceSource: e.evidenceSource || null,
              isVerified: e.isVerified !== false,
            },
          });
        }
      }
    }

    await logAuditEvent({
      actorId: user.userId,
      actorRole: user.role,
      actionType: 'UPDATE_RESPONSIBILITY_GRAPH',
      targetEntity: 'SystemicIssue',
      targetId: issue.id,
      diff: {
        nodeCount: nodes.length,
        edgeCount: edges?.length || 0,
        investigator: user.displayName,
      },
    });

    const updatedNodes = await db.responsibilityNode.findMany({ where: { systemicIssueId: issue.id } });
    const updatedEdges = await db.responsibilityEdge.findMany({ where: { systemicIssueId: issue.id } });

    return NextResponse.json({
      success: true,
      nodes: updatedNodes,
      edges: updatedEdges,
      message: 'Responsibility graph successfully updated and verified.',
    });
  } catch (error: any) {
    if (error.message === 'UNAUTHORIZED' || error.message === 'FORBIDDEN') {
      return NextResponse.json({ error: 'Investigator authorization required' }, { status: 403 });
    }
    console.error('Responsibility update error:', error);
    return NextResponse.json({ error: 'Failed to update responsibility graph' }, { status: 500 });
  }
}
