import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import fs from 'fs';
import path from 'path';

// Native .env parser for Node.js
function loadEnv() {
  const envPath = path.join(process.cwd(), '.env');
  if (fs.existsSync(envPath)) {
    const content = fs.readFileSync(envPath, 'utf-8');
    content.split('\n').forEach((line) => {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#')) {
        const [key, ...values] = trimmed.split('=');
        if (key && values.length > 0) {
          const val = values.join('=').trim().replace(/^["'](.*)["']$/, '$1');
          if (!process.env[key.trim()]) {
            process.env[key.trim()] = val;
          }
        }
      }
    });
  }
}

loadEnv();

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding NAGRIK synthetic demo dataset...');

  const adminEmail = process.env.ADMIN_EMAIL;
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (!adminEmail || !adminPassword || adminPassword.trim() === '' || adminPassword.includes('<set-your-own')) {
    console.error('\n========================================================================');
    console.error(' [ERROR: ADMIN_EMAIL or ADMIN_PASSWORD ENVIRONMENT VARIABLE MISSING]');
    console.error('========================================================================');
    console.error(' To provision the secure Administrator account, you must define:');
    console.error('   ADMIN_EMAIL=admin@nagrik.in');
    console.error('   ADMIN_PASSWORD=YourSecurePassword123!');
    console.error(' in your environment variables before running the seed script.');
    console.error('========================================================================\n');
    process.exit(1);
  }

  // Clear existing records
  await prisma.auditLog.deleteMany();
  await prisma.actionCommitment.deleteMany();
  await prisma.institutionalResponse.deleteMany();
  await prisma.outcomeUpdate.deleteMany();
  await prisma.responsibilityEdge.deleteMany();
  await prisma.responsibilityNode.deleteMany();
  await prisma.verificationReview.deleteMany();
  await prisma.priorityAssessment.deleteMany();
  await prisma.reportSystemicIssueLink.deleteMany();
  await prisma.reportSupport.deleteMany();
  await prisma.reportEvidence.deleteMany();
  await prisma.report.deleteMany();
  await prisma.systemicIssue.deleteMany();
  await prisma.userPrivacySettings.deleteMany();
  await prisma.user.deleteMany();

  // 1. Seed Authorized Users
  const citizenPass = await bcrypt.hash('Nagrik@2026', 10);
  const investigatorPass = await bcrypt.hash('Investigator@2026', 10);
  const adminPass = await bcrypt.hash(adminPassword.trim(), 10);

  const citizen = await prisma.user.create({
    data: {
      email: 'citizen@nagrik.in',
      passwordHash: citizenPass,
      displayName: 'Aarav Sharma',
      role: 'CITIZEN',
      privacySettings: {
        create: { displayPublicly: false, allowInvestigatorContact: true, anonymizeReports: true },
      },
    },
  });

  const citizen2 = await prisma.user.create({
    data: {
      email: 'priya@nagrik.in',
      passwordHash: citizenPass,
      displayName: 'Priya Sundaram',
      role: 'CITIZEN',
      privacySettings: {
        create: { displayPublicly: false, allowInvestigatorContact: true, anonymizeReports: true },
      },
    },
  });

  const investigator = await prisma.user.create({
    data: {
      email: 'investigator@nagrik.in',
      passwordHash: investigatorPass,
      displayName: 'Dr. Ananya Sen (Civic Investigator)',
      role: 'INVESTIGATOR',
      privacySettings: {
        create: { displayPublicly: true, allowInvestigatorContact: true, anonymizeReports: false },
      },
    },
  });

  const admin = await prisma.user.create({
    data: {
      email: adminEmail.trim().toLowerCase(),
      passwordHash: adminPass,
      displayName: 'System Administrator',
      role: 'ADMIN',
      privacySettings: {
        create: { displayPublicly: false, allowInvestigatorContact: false, anonymizeReports: true },
      },
    },
  });

  console.log(`✓ Pre-seeded accounts created (Citizen, Investigator, Admin: ${admin.email})`);

  // 2. Seed Systemic Issue 1: High Priority - Verified & In Action
  const issue1 = await prisma.systemicIssue.create({
    data: {
      trackingId: 'SYS-2026-0014',
      title: 'Recurrent Chemical Contamination and Pipeline Ruptures in North District Water Grid',
      summary:
        'Corroborating citizen reports across 6 municipal wards indicate recurring potable water discoloration, sulfurous odor, and pipeline pressure drops affecting an estimated 42,000 residents.',
      category: 'WATER_SANITATION',
      regionScope: 'DISTRICT',
      status: 'IN_ACTION',
      severity: 9.2,
      urgency: 8.8,
      scaleEstimate: 8.5,
      geographicSpread: 8.0,
      evidenceStrength: 8.5,
      persistenceScore: 8.5,
      growthRate: 7.5,
      priorityScore: 87.5,
      priorityExplanation:
        'Evaluated at 87.5/100 (Critical Priority Band). Key contributors include: Critical civic hazard level (9.2/10); High risk of rapid escalation (8.8/10); Significant population exposure (8.5/10); Strong evidentiary corroboration (8.5/10). Derived deterministically from verified signal weights without popularity bias.',
      isPublic: true,
    },
  });

  // Responsibility Nodes for Issue 1
  const node1 = await prisma.responsibilityNode.create({
    data: {
      systemicIssueId: issue1.id,
      name: 'Municipal Water Supply & Sewerage Board (Division 4)',
      level: 'OPERATIONAL',
      jurisdiction: 'North District Wards 12-18',
      description: 'Executes daily distribution, intake filtration, and main distribution pipe maintenance.',
      confidenceScore: 0.95,
      isVerified: true,
    },
  });

  const node2 = await prisma.responsibilityNode.create({
    data: {
      systemicIssueId: issue1.id,
      name: 'District Public Health & Water Quality Inspectorate',
      level: 'SUPERVISORY',
      jurisdiction: 'North District',
      description: 'Statutory mandate to conduct bi-weekly microbiological and chemical potable water tests.',
      confidenceScore: 0.9,
      isVerified: true,
    },
  });

  const node3 = await prisma.responsibilityNode.create({
    data: {
      systemicIssueId: issue1.id,
      name: 'State Pollution Control Board (Water Quality Division)',
      level: 'REGULATORY_POLICY',
      jurisdiction: 'State Government',
      description: 'Monitors compliance with industrial discharge benchmarks and upstream intake protection.',
      confidenceScore: 0.88,
      isVerified: true,
    },
  });

  const node4 = await prisma.responsibilityNode.create({
    data: {
      systemicIssueId: issue1.id,
      name: 'State Urban Infrastructure & Water Works Commission',
      level: 'CORRECTIVE',
      jurisdiction: 'State Government',
      description: 'Empowered statutory authority to sanction capital pipeline replacement tenders.',
      confidenceScore: 0.92,
      isVerified: true,
    },
  });

  // Responsibility Edges
  await prisma.responsibilityEdge.create({
    data: {
      systemicIssueId: issue1.id,
      sourceNodeId: node2.id,
      targetNodeId: node1.id,
      relationshipType: 'SUPERVISES',
      rationale: 'Health inspectorate conducts mandatory water sampling on municipal line outputs.',
      evidenceSource: 'Public Health Sanitation Act (Section 14)',
      isVerified: true,
    },
  });

  await prisma.responsibilityEdge.create({
    data: {
      systemicIssueId: issue1.id,
      sourceNodeId: node3.id,
      targetNodeId: node1.id,
      relationshipType: 'REGULATES',
      rationale: 'Pollution Control Board enforces state water purity guidelines and intake norms.',
      evidenceSource: 'State Water Cleanliness Directives 2024',
      isVerified: true,
    },
  });

  await prisma.responsibilityEdge.create({
    data: {
      systemicIssueId: issue1.id,
      sourceNodeId: node4.id,
      targetNodeId: node1.id,
      relationshipType: 'CORRECTS',
      rationale: 'Sanctions emergency capital overhaul grant for obsolete 30-year cast-iron feeder line.',
      evidenceSource: 'Urban Development Mission Fund Circular',
      isVerified: true,
    },
  });

  // Institutional Response & Commitment
  const resp1 = await prisma.institutionalResponse.create({
    data: {
      systemicIssueId: issue1.id,
      authorityName: 'Office of the District Magistrate & Municipal Commissioner',
      authorityLevel: 'District',
      responseSummary:
        'Formal joint inspection conducted on 12th August 2026. Acknowledged localized industrial seepage into aged water feeder lines. Sanctioned immediate clean tanker supply and emergency replacement tender.',
      responseDate: new Date('2026-08-14'),
      responseType: 'WORK_INITIATED',
      sourceReferenceUrl: 'https://demo-civic-portal.gov.in/notices/2026-w-41',
      commitments: {
        create: [
          {
            commitmentDetails: 'Deployment of 15 emergency potable water tankers to Sector 4 and 6',
            deadlineDate: new Date('2026-08-20'),
            status: 'MET',
          },
          {
            commitmentDetails: 'Tender award for 4.2 km ductile iron pipeline replacement (₹1.85 Cr)',
            deadlineDate: new Date('2026-11-15'),
            status: 'IN_PROGRESS',
          },
        ],
      },
    },
  });

  // Outcome Update
  await prisma.outcomeUpdate.create({
    data: {
      systemicIssueId: issue1.id,
      actorId: investigator.id,
      outcomeStatus: 'PARTIALLY_RESOLVED',
      verificationNotes:
        'Emergency tankers verified on ground by citizen reports. Permanent pipeline replacement remains actively tracked.',
      isIndependentVerification: true,
    },
  });

  // Reports linked to Issue 1
  const report1 = await prisma.report.create({
    data: {
      trackingId: 'NAG-2026-1001',
      userId: citizen.id,
      title: 'Discolored tap water with strong chemical odor in Sector 4 Ward 14',
      category: 'WATER_SANITATION',
      description:
        'For the past two weeks, morning tap water has had a strong sulfurous smell and yellowish sediment. Neighbors in Block B report identical contamination.',
      locationState: 'Delhi',
      locationDistrict: 'North District',
      locationGeneral: 'Sector 4, Block B',
      status: 'LINKED_TO_SYSTEMIC',
      evidence: {
        create: {
          fileName: 'water_sample_test_report.pdf',
          filePath: '/uploads/evidence/demo-water-test.pdf',
          fileType: 'application/pdf',
          fileSize: 45200,
          description: 'Independent laboratory water quality test report showing elevated TDS and coliform count',
          isPrivate: true,
        },
      },
    },
  });

  const report2 = await prisma.report.create({
    data: {
      trackingId: 'NAG-2026-1002',
      userId: citizen2.id,
      title: 'Water main rupture and wastewater mixing near Central Market',
      category: 'WATER_SANITATION',
      description:
        'Water pipeline leaking under storm drain pavement. Contaminated runoff entering residential drinking lines during low pressure hours.',
      locationState: 'Delhi',
      locationDistrict: 'North District',
      locationGeneral: 'Central Market Junction',
      status: 'LINKED_TO_SYSTEMIC',
    },
  });

  await prisma.reportSystemicIssueLink.create({
    data: {
      reportId: report1.id,
      systemicIssueId: issue1.id,
      confidenceScore: 0.95,
      rationale: 'Direct geographic and qualitative match on potable water grid contamination in North District.',
      linkedBy: 'INVESTIGATOR_CONFIRMED',
    },
  });

  await prisma.reportSystemicIssueLink.create({
    data: {
      reportId: report2.id,
      systemicIssueId: issue1.id,
      confidenceScore: 0.92,
      rationale: 'Direct geographic proximity to Sector 4 feeder pipeline failure.',
      linkedBy: 'INVESTIGATOR_CONFIRMED',
    },
  });

  // Supports
  await prisma.reportSupport.create({ data: { reportId: report1.id, userId: citizen2.id } });
  await prisma.reportSupport.create({ data: { reportId: report1.id, userId: investigator.id } });

  // 3. Seed Systemic Issue 2: Medium Priority (Under Investigation)
  const issue2 = await prisma.systemicIssue.create({
    data: {
      trackingId: 'SYS-2026-0022',
      title: 'Frequent Diagnostic Equipment Downtime at Sub-District Community Health Centres',
      summary:
        'Reports across 3 peripheral rural health centres indicate ultrasound and X-ray machinery non-operational for over 45 days due to lack of certified maintenance technicians.',
      category: 'HEALTHCARE',
      regionScope: 'DISTRICT',
      status: 'UNDER_INVESTIGATION',
      severity: 7.5,
      urgency: 7.0,
      scaleEstimate: 6.5,
      geographicSpread: 6.0,
      evidenceStrength: 6.0,
      persistenceScore: 7.5,
      growthRate: 5.5,
      priorityScore: 68.0,
      priorityExplanation:
        'Evaluated at 68.0/100 (High Priority Band). Key contributors include: Critical civic hazard level (7.5/10); High risk of escalation if delayed (7.0/10); Protracted unresolved timeline (7.5/10).',
      isPublic: true,
    },
  });

  // Responsibility Nodes for Issue 2
  const node2_1 = await prisma.responsibilityNode.create({
    data: {
      systemicIssueId: issue2.id,
      name: 'District Health Society & Chief Medical Officer',
      level: 'SUPERVISORY',
      jurisdiction: 'North-West District',
      description: 'Statutory oversight authority responsible for annual maintenance contracts (AMC) and clinical equipment uptime.',
      confidenceScore: 0.92,
      isVerified: true,
    },
  });

  const node2_2 = await prisma.responsibilityNode.create({
    data: {
      systemicIssueId: issue2.id,
      name: 'Community Health Centre Administration (Sub-District Network)',
      level: 'OPERATIONAL',
      jurisdiction: 'Rural Block Wards 1-4',
      description: 'Local primary diagnostic center operators and day-to-day healthcare service delivery.',
      confidenceScore: 0.95,
      isVerified: true,
    },
  });

  await prisma.responsibilityEdge.create({
    data: {
      systemicIssueId: issue2.id,
      sourceNodeId: node2_1.id,
      targetNodeId: node2_2.id,
      relationshipType: 'SUPERVISES',
      rationale: 'District Health Society manages state diagnostic equipment maintenance contracts for local health centres.',
      evidenceSource: 'State Health Mission Framework Guidelines',
      isVerified: true,
    },
  });

  const report3 = await prisma.report.create({
    data: {
      trackingId: 'NAG-2026-1021',
      userId: citizen.id,
      title: 'Ultrasonic scanner and X-Ray unit broken for 6 weeks at Rural Block CHC',
      category: 'HEALTHCARE',
      description:
        'Patients are turned away and referred to private diagnostic clinics 28km away due to broken ultrasound probe and offline X-Ray machine.',
      locationState: 'Delhi',
      locationDistrict: 'North-West District',
      locationGeneral: 'Block Primary Health Center',
      status: 'LINKED_TO_SYSTEMIC',
    },
  });

  await prisma.reportSystemicIssueLink.create({
    data: {
      reportId: report3.id,
      systemicIssueId: issue2.id,
      confidenceScore: 0.94,
      rationale: 'Direct clinical equipment maintenance failure reported at Sub-District CHC.',
      linkedBy: 'INVESTIGATOR_CONFIRMED',
    },
  });

  // 4. Seed Systemic Issue 3: Candidate Review Queue for Investigator Workbench
  const issue3 = await prisma.systemicIssue.create({
    data: {
      trackingId: 'SYS-2026-0035',
      title: 'Recurrent Monsoon Waterlogging and Obstructed Storm Drains in South District Wards',
      summary:
        'Cluster of 8 citizen reports indicates severe inundation during moderate rainfall due to uncleaned storm drain culverts and blocked arterial outlets.',
      category: 'CIVIC_SERVICES',
      regionScope: 'LOCAL',
      status: 'CANDIDATE',
      severity: 6.8,
      urgency: 6.5,
      scaleEstimate: 6.0,
      geographicSpread: 5.5,
      evidenceStrength: 5.8,
      persistenceScore: 6.2,
      growthRate: 5.0,
      priorityScore: 61.2,
      priorityExplanation:
        'Evaluated at 61.2/100. AI-suggested candidate cluster pending investigator verification and statutory graph publication.',
      isPublic: false,
    },
  });

  const node3_1 = await prisma.responsibilityNode.create({
    data: {
      systemicIssueId: issue3.id,
      name: 'South Municipal Corporation (Drainage & Flood Control Division)',
      level: 'OPERATIONAL',
      jurisdiction: 'South District Wards 32-38',
      description: 'Pre-monsoon desilting and arterial storm drain maintenance execution.',
      confidenceScore: 0.85,
      isVerified: false,
    },
  });

  const node3_2 = await prisma.responsibilityNode.create({
    data: {
      systemicIssueId: issue3.id,
      name: 'State Urban Development Department (Stormwater Oversight Cell)',
      level: 'REGULATORY_POLICY',
      jurisdiction: 'State Government',
      description: 'Capital drain remodeling and urban flood mitigation policy.',
      confidenceScore: 0.82,
      isVerified: false,
    },
  });

  await prisma.responsibilityEdge.create({
    data: {
      systemicIssueId: issue3.id,
      sourceNodeId: node3_2.id,
      targetNodeId: node3_1.id,
      relationshipType: 'REGULATES',
      rationale: 'State urban policy sets annual desilting completion mandates before monsoon season.',
      evidenceSource: 'Urban Flood Management Directive 2025',
      isVerified: false,
    },
  });

  // 5. Seed Standalone Reports
  const report4 = await prisma.report.create({
    data: {
      trackingId: 'NAG-2026-1045',
      userId: citizen.id,
      title: 'Waterlogged intersection and blocked storm culverts along Outer Ring Road',
      category: 'CIVIC_SERVICES',
      description:
        'Severe 2-foot waterlogging persists for 48 hours after rain near pedestrian crossing due to clogged storm sewer drains.',
      locationState: 'Delhi',
      locationDistrict: 'South District',
      locationGeneral: 'Outer Ring Road Pillar 42',
      status: 'PRELIMINARY_ANALYSIS',
    },
  });

  await prisma.reportSystemicIssueLink.create({
    data: {
      reportId: report4.id,
      systemicIssueId: issue3.id,
      confidenceScore: 0.88,
      rationale: 'AI signal similarity with South District stormwater drainage disruption.',
      linkedBy: 'AI_SUGGESTED',
    },
  });

  await prisma.report.create({
    data: {
      trackingId: 'NAG-2026-1046',
      userId: citizen2.id,
      title: 'Repeated cancellation of morning feeder bus route 414B',
      category: 'PUBLIC_TRANSPORT',
      description: 'Morning 7:45 AM feeder bus has failed to operate 8 times this month without passenger notification.',
      locationState: 'Delhi',
      locationDistrict: 'East District',
      locationGeneral: 'Metro Station Bus Bay 3',
      status: 'SUBMITTED',
    },
  });

  // 5. Append-only Audit Log initialization
  await prisma.auditLog.create({
    data: {
      actorId: admin.id,
      actorRole: 'ADMIN',
      actionType: 'ADMIN_CONFIG_CHANGE',
      targetEntity: 'SystemConfig',
      targetId: 'GLOBAL_WEIGHTS_V1',
      diffJson: JSON.stringify({ formula: '0.25*Sev + 0.20*Urg + 0.15*Scale + 0.10*Geo + 0.15*Evid + 0.10*Pers + 0.05*Growth' }),
    },
  });

  await prisma.auditLog.create({
    data: {
      actorId: investigator.id,
      actorRole: 'INVESTIGATOR',
      actionType: 'VERIFY_SYSTEMIC_ISSUE',
      targetEntity: 'SystemicIssue',
      targetId: issue1.id,
      diffJson: JSON.stringify({ previousStatus: 'CANDIDATE', newStatus: 'IN_ACTION', reviewer: investigator.displayName }),
    },
  });

  console.log('✓ NAGRIK synthetic demo seed completed successfully.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
