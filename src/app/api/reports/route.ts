import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentUser, requireRole } from '@/lib/auth';
import { serializePublicReport, serializeCitizenReport } from '@/lib/dto';
import { logAuditEvent } from '@/lib/audit';
import { processReportAggregation } from '@/lib/clustering';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import crypto from 'crypto';

const ALLOWED_EXTENSIONS = ['.pdf', '.png', '.jpg', '.jpeg', '.doc', '.docx'];
const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'image/png',
  'image/jpeg',
  'image/jpg',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const mine = searchParams.get('mine') === 'true';
  const category = searchParams.get('category');
  const district = searchParams.get('district');
  const state = searchParams.get('state');

  const currentUser = await getCurrentUser();

  if (mine) {
    if (!currentUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const reports = await db.report.findMany({
      where: { userId: currentUser.userId },
      include: {
        evidence: true,
        supports: true,
        systemicLinks: {
          include: { systemicIssue: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ reports: reports.map(serializeCitizenReport) });
  }

  // Public Reports Feed (Excludes withdrawn reports)
  const reports = await db.report.findMany({
    where: {
      status: { not: 'WITHDRAWN' },
      ...(category ? { category } : {}),
      ...(district ? { locationDistrict: { contains: district } } : {}),
      ...(state ? { locationState: { contains: state } } : {}),
    },
    include: {
      evidence: true,
      supports: true,
    },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });

  return NextResponse.json({ reports: reports.map(serializePublicReport) });
}

export async function POST(request: Request) {
  try {
    const user = await requireRole(['CITIZEN']);
    const contentType = request.headers.get('content-type') || '';

    let title: string = '';
    let category: string = '';
    let description: string = '';
    let locationState: string = '';
    let locationDistrict: string = '';
    let locationGeneral: string = '';
    let incidentDate: string | null = null;
    let evidenceDescription: string = '';
    let uploadedFile: File | null = null;
    let legacyEvidenceList: any[] = [];

    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      title = (formData.get('title') as string) || '';
      category = (formData.get('category') as string) || '';
      description = (formData.get('description') as string) || '';
      locationState = (formData.get('locationState') as string) || '';
      locationDistrict = (formData.get('locationDistrict') as string) || '';
      locationGeneral = (formData.get('locationGeneral') as string) || '';
      incidentDate = (formData.get('incidentDate') as string) || null;
      evidenceDescription = (formData.get('evidenceDescription') as string) || '';
      uploadedFile = (formData.get('evidenceFile') as File) || null;
    } else {
      const body = await request.json();
      title = body.title || '';
      category = body.category || '';
      description = body.description || '';
      locationState = body.locationState || '';
      locationDistrict = body.locationDistrict || '';
      locationGeneral = body.locationGeneral || '';
      incidentDate = body.incidentDate || null;
      legacyEvidenceList = Array.isArray(body.evidence) ? body.evidence : [];
    }

    if (!title || !category || !description || !locationState || !locationDistrict) {
      return NextResponse.json({ error: 'Missing required report fields' }, { status: 400 });
    }

    // Process real file upload if provided
    let evidenceCreateData: any = undefined;

    if (uploadedFile && uploadedFile.size > 0) {
      // 1. File Size Validation
      if (uploadedFile.size > MAX_FILE_SIZE) {
        return NextResponse.json(
          { error: 'File size exceeds maximum allowed limit of 10MB.' },
          { status: 400 }
        );
      }

      // 2. File Extension & MIME Validation
      const originalFileName = path.basename(uploadedFile.name);
      const ext = path.extname(originalFileName).toLowerCase();

      if (!ALLOWED_EXTENSIONS.includes(ext)) {
        return NextResponse.json(
          { error: `File type "${ext}" is not permitted. Supported formats: PDF, PNG, JPG, JPEG, DOC, DOCX.` },
          { status: 400 }
        );
      }

      // 3. Save File to Secure Local Storage
      const uploadsDir = path.join(process.cwd(), 'public', 'uploads', 'evidence');
      await mkdir(uploadsDir, { recursive: true });

      const uniqueSuffix = `${Date.now()}_${crypto.randomBytes(6).toString('hex')}`;
      const safeStoredFileName = `evidence_${uniqueSuffix}${ext}`;
      const diskFilePath = path.join(uploadsDir, safeStoredFileName);
      const publicRelativePath = `/uploads/evidence/${safeStoredFileName}`;

      const bytes = await uploadedFile.arrayBuffer();
      const buffer = Buffer.from(bytes);
      await writeFile(diskFilePath, buffer);

      evidenceCreateData = {
        create: [
          {
            fileName: originalFileName,
            filePath: publicRelativePath,
            fileType: uploadedFile.type || 'application/octet-stream',
            fileSize: uploadedFile.size,
            description: evidenceDescription.trim() || null,
            isPrivate: true, // Always private by default to protect citizen privacy
          },
        ],
      };
    } else if (legacyEvidenceList.length > 0) {
      evidenceCreateData = {
        create: legacyEvidenceList.map((e: any) => ({
          fileName: e.fileName || 'evidence-document',
          filePath: e.filePath || '/uploads/sample-evidence.pdf',
          fileType: e.fileType || 'application/pdf',
          fileSize: e.fileSize || 1024,
          description: e.description || null,
          isPrivate: e.isPrivate !== false,
        })),
      };
    }

    // Generate unique tracking ID
    const year = new Date().getFullYear();
    const totalCount = await db.report.count();
    const trackingId = `NAG-${year}-${String(totalCount + 1001).padStart(4, '0')}`;

    const report = await db.report.create({
      data: {
        trackingId,
        userId: user.userId,
        title: title.trim(),
        category,
        description: description.trim(),
        locationState: locationState.trim(),
        locationDistrict: locationDistrict.trim(),
        locationGeneral: (locationGeneral || locationDistrict).trim(),
        incidentDate: incidentDate ? new Date(incidentDate) : null,
        status: 'SUBMITTED',
        evidence: evidenceCreateData,
      },
      include: {
        evidence: true,
      },
    });

    await logAuditEvent({
      actorId: user.userId,
      actorRole: user.role,
      actionType: 'SUBMIT_REPORT',
      targetEntity: 'Report',
      targetId: report.id,
      diff: {
        trackingId: report.trackingId,
        category: report.category,
        location: `${report.locationDistrict}, ${report.locationState}`,
        hasEvidence: !!evidenceCreateData,
      },
    });

    // Run systemic clustering asynchronously
    processReportAggregation(report.id).catch((err) => {
      console.error('[AGGREGATION_ASYNC_ERROR]', err);
    });

    return NextResponse.json({
      success: true,
      report: serializeCitizenReport(report),
      message: 'Report submitted successfully and assigned permanent tracking ID.',
    });
  } catch (error: any) {
    if (error.message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Authentication required to submit reports.' }, { status: 401 });
    }
    if (error.message === 'FORBIDDEN') {
      return NextResponse.json({ error: 'Only citizen accounts can submit civic reports.' }, { status: 403 });
    }
    console.error('Report submission error:', error);
    return NextResponse.json({ error: 'Failed to submit report' }, { status: 500 });
  }
}
