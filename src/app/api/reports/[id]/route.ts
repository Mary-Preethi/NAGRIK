import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { serializePublicReport, serializeCitizenReport } from '@/lib/dto';
import { logAuditEvent } from '@/lib/audit';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import crypto from 'crypto';

const ALLOWED_EXTENSIONS = ['.pdf', '.png', '.jpg', '.jpeg', '.doc', '.docx'];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const EDITABLE_STATUSES = ['SUBMITTED', 'DRAFT', 'PENDING_TRIAGE', 'PRELIMINARY_ANALYSIS', 'AGGREGATING'];

export async function GET(request: Request, { params }: { params: { id: string } }) {
  const currentUser = await getCurrentUser();
  const idOrTracking = params.id;

  const report = await db.report.findFirst({
    where: {
      OR: [{ id: idOrTracking }, { trackingId: idOrTracking }],
    },
    include: {
      evidence: true,
      supports: true,
      systemicLinks: {
        include: { systemicIssue: true },
      },
    },
  });

  if (!report) {
    return NextResponse.json({ error: 'Report not found' }, { status: 404 });
  }

  // If report is withdrawn, only author or authorized investigators/admins can view it
  if (report.status === 'WITHDRAWN') {
    if (!currentUser || (currentUser.userId !== report.userId && currentUser.role === 'CITIZEN')) {
      return NextResponse.json({ error: 'Report not found or has been withdrawn' }, { status: 404 });
    }
  }

  // If author or investigator/admin, return full citizen view
  if (currentUser && (currentUser.userId === report.userId || currentUser.role !== 'CITIZEN')) {
    return NextResponse.json({ report: serializeCitizenReport(report) });
  }

  // Public visitor view
  return NextResponse.json({ report: serializePublicReport(report) });
}

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const idOrTracking = params.id;
    const report = await db.report.findFirst({
      where: {
        OR: [{ id: idOrTracking }, { trackingId: idOrTracking }],
      },
      include: {
        evidence: true,
        supports: true,
        systemicLinks: {
          include: { systemicIssue: true },
        },
      },
    });

    if (!report) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 });
    }

    // Server-side ownership enforcement
    if (report.userId !== currentUser.userId && currentUser.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'You do not have permission to edit this report. Citizens can only edit their own reports.' },
        { status: 403 }
      );
    }

    // Lifecycle state validation
    if (report.status === 'WITHDRAWN') {
      return NextResponse.json(
        { error: 'This report has been withdrawn and cannot be modified.' },
        { status: 400 }
      );
    }

    if (!EDITABLE_STATUSES.includes(report.status)) {
      return NextResponse.json(
        {
          error:
            'This report is currently under investigation or verified. Direct editing is locked to preserve evidence integrity. Please submit a "Request Correction" instead.',
          isLocked: true,
          currentStatus: report.status,
        },
        { status: 409 }
      );
    }

    // Parse form data or json body
    const contentType = request.headers.get('content-type') || '';
    let title: string | undefined;
    let category: string | undefined;
    let description: string | undefined;
    let locationState: string | undefined;
    let locationDistrict: string | undefined;
    let locationGeneral: string | undefined;
    let incidentDate: string | null | undefined;
    let removeEvidenceIds: string[] = [];
    let uploadedFile: File | null = null;
    let evidenceDescription: string = '';

    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      if (formData.has('title')) title = formData.get('title') as string;
      if (formData.has('category')) category = formData.get('category') as string;
      if (formData.has('description')) description = formData.get('description') as string;
      if (formData.has('locationState')) locationState = formData.get('locationState') as string;
      if (formData.has('locationDistrict')) locationDistrict = formData.get('locationDistrict') as string;
      if (formData.has('locationGeneral')) locationGeneral = formData.get('locationGeneral') as string;
      if (formData.has('incidentDate')) incidentDate = (formData.get('incidentDate') as string) || null;
      if (formData.has('evidenceDescription')) evidenceDescription = formData.get('evidenceDescription') as string;
      if (formData.has('removeEvidenceIds')) {
        const raw = formData.get('removeEvidenceIds') as string;
        try {
          removeEvidenceIds = JSON.parse(raw);
        } catch {
          removeEvidenceIds = raw.split(',').map((s) => s.trim()).filter(Boolean);
        }
      }
      uploadedFile = (formData.get('evidenceFile') as File) || null;
    } else {
      const body = await request.json();
      title = body.title;
      category = body.category;
      description = body.description;
      locationState = body.locationState;
      locationDistrict = body.locationDistrict;
      locationGeneral = body.locationGeneral;
      incidentDate = body.incidentDate;
      if (Array.isArray(body.removeEvidenceIds)) {
        removeEvidenceIds = body.removeEvidenceIds;
      }
    }

    // Validate updated text values if provided
    if (title !== undefined && !title.trim()) {
      return NextResponse.json({ error: 'Title cannot be empty.' }, { status: 400 });
    }
    if (category !== undefined && !category.trim()) {
      return NextResponse.json({ error: 'Category cannot be empty.' }, { status: 400 });
    }
    if (description !== undefined && !description.trim()) {
      return NextResponse.json({ error: 'Description cannot be empty.' }, { status: 400 });
    }
    if (locationState !== undefined && !locationState.trim()) {
      return NextResponse.json({ error: 'Location state cannot be empty.' }, { status: 400 });
    }
    if (locationDistrict !== undefined && !locationDistrict.trim()) {
      return NextResponse.json({ error: 'Location district cannot be empty.' }, { status: 400 });
    }

    // 1. Process Evidence Removal
    if (removeEvidenceIds.length > 0) {
      const validEvidenceIds = report.evidence
        .filter((e) => removeEvidenceIds.includes(e.id))
        .map((e) => e.id);

      if (validEvidenceIds.length > 0) {
        await db.reportEvidence.deleteMany({
          where: {
            id: { in: validEvidenceIds },
            reportId: report.id,
          },
        });

        await logAuditEvent({
          actorId: currentUser.userId,
          actorRole: currentUser.role as any,
          actionType: 'REMOVE_EVIDENCE',
          targetEntity: 'Report',
          targetId: report.id,
          diff: {
            trackingId: report.trackingId,
            removedEvidenceIds: validEvidenceIds,
            reason: 'Removed by report author during report correction',
          },
        });
      }
    }

    // 2. Process New Evidence File Upload
    if (uploadedFile && uploadedFile.size > 0) {
      if (uploadedFile.size > MAX_FILE_SIZE) {
        return NextResponse.json(
          { error: 'Evidence file size exceeds maximum allowed limit of 10MB.' },
          { status: 400 }
        );
      }

      const originalFileName = path.basename(uploadedFile.name);
      const ext = path.extname(originalFileName).toLowerCase();

      if (!ALLOWED_EXTENSIONS.includes(ext)) {
        return NextResponse.json(
          { error: `File type "${ext}" is not permitted. Supported formats: PDF, PNG, JPG, JPEG, DOC, DOCX.` },
          { status: 400 }
        );
      }

      const uploadsDir = path.join(process.cwd(), 'public', 'uploads', 'evidence');
      await mkdir(uploadsDir, { recursive: true });

      const uniqueSuffix = `${Date.now()}_${crypto.randomBytes(6).toString('hex')}`;
      const safeStoredFileName = `evidence_${uniqueSuffix}${ext}`;
      const diskFilePath = path.join(uploadsDir, safeStoredFileName);
      const publicRelativePath = `/uploads/evidence/${safeStoredFileName}`;

      const bytes = await uploadedFile.arrayBuffer();
      const buffer = Buffer.from(bytes);
      await writeFile(diskFilePath, buffer);

      const newEvidence = await db.reportEvidence.create({
        data: {
          reportId: report.id,
          fileName: originalFileName,
          filePath: publicRelativePath,
          fileType: uploadedFile.type || 'application/octet-stream',
          fileSize: uploadedFile.size,
          description: evidenceDescription.trim() || null,
          isPrivate: true,
        },
      });

      await logAuditEvent({
        actorId: currentUser.userId,
        actorRole: currentUser.role as any,
        actionType: 'UPDATE_EVIDENCE',
        targetEntity: 'Report',
        targetId: report.id,
        diff: {
          trackingId: report.trackingId,
          evidenceId: newEvidence.id,
          fileName: originalFileName,
          fileSize: uploadedFile.size,
          description: evidenceDescription.trim() || null,
        },
      });
    }

    // 3. Update Report Text Fields & Record Audit Diff
    const updateData: any = {};
    const fieldDiff: Record<string, { before: any; after: any }> = {};

    if (title !== undefined && title.trim() !== report.title) {
      updateData.title = title.trim();
      fieldDiff.title = { before: report.title, after: title.trim() };
    }
    if (category !== undefined && category !== report.category) {
      updateData.category = category;
      fieldDiff.category = { before: report.category, after: category };
    }
    if (description !== undefined && description.trim() !== report.description) {
      updateData.description = description.trim();
      fieldDiff.description = { before: report.description, after: description.trim() };
    }
    if (locationState !== undefined && locationState.trim() !== report.locationState) {
      updateData.locationState = locationState.trim();
      fieldDiff.locationState = { before: report.locationState, after: locationState.trim() };
    }
    if (locationDistrict !== undefined && locationDistrict.trim() !== report.locationDistrict) {
      updateData.locationDistrict = locationDistrict.trim();
      fieldDiff.locationDistrict = { before: report.locationDistrict, after: locationDistrict.trim() };
    }
    if (locationGeneral !== undefined && locationGeneral.trim() !== report.locationGeneral) {
      updateData.locationGeneral = locationGeneral.trim();
      fieldDiff.locationGeneral = { before: report.locationGeneral, after: locationGeneral.trim() };
    }
    if (incidentDate !== undefined) {
      const parsedDate = incidentDate ? new Date(incidentDate) : null;
      updateData.incidentDate = parsedDate;
      fieldDiff.incidentDate = { before: report.incidentDate, after: parsedDate };
    }

    let updatedReport = report;
    if (Object.keys(updateData).length > 0) {
      updatedReport = await db.report.update({
        where: { id: report.id },
        data: updateData,
        include: {
          evidence: true,
          supports: true,
          systemicLinks: {
            include: { systemicIssue: true },
          },
        },
      });

      await logAuditEvent({
        actorId: currentUser.userId,
        actorRole: currentUser.role as any,
        actionType: 'UPDATE_REPORT',
        targetEntity: 'Report',
        targetId: report.id,
        diff: {
          trackingId: report.trackingId,
          changes: fieldDiff,
        },
      });
    } else {
      // Re-fetch report with updated evidence
      updatedReport = (await db.report.findUnique({
        where: { id: report.id },
        include: {
          evidence: true,
          supports: true,
          systemicLinks: {
            include: { systemicIssue: true },
          },
        },
      })) || report;
    }

    return NextResponse.json({
      success: true,
      message: 'Report updated successfully.',
      report: serializeCitizenReport(updatedReport),
    });
  } catch (error: any) {
    console.error('Report update error:', error);
    return NextResponse.json({ error: error.message || 'Failed to update report' }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  // Hard delete is strictly disabled for citizens to preserve accountability
  return NextResponse.json(
    {
      error:
        'Permanent hard-deletion of submitted reports is disabled for civic auditability and accountability. Please use "Withdraw Report" to remove the issue from active civic tracking while preserving the secure audit record.',
      action: 'USE_WITHDRAWAL',
    },
    { status: 403 }
  );
}
