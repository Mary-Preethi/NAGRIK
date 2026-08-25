-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'CITIZEN',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "UserPrivacySettings" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "displayPublicly" BOOLEAN NOT NULL DEFAULT false,
    "allowInvestigatorContact" BOOLEAN NOT NULL DEFAULT true,
    "anonymizeReports" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "UserPrivacySettings_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Report" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "trackingId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "locationState" TEXT NOT NULL,
    "locationDistrict" TEXT NOT NULL,
    "locationGeneral" TEXT NOT NULL,
    "incidentDate" DATETIME,
    "status" TEXT NOT NULL DEFAULT 'SUBMITTED',
    "aiProcessed" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Report_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ReportEvidence" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "reportId" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "filePath" TEXT NOT NULL,
    "fileType" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "description" TEXT,
    "isPrivate" BOOLEAN NOT NULL DEFAULT true,
    "uploadedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ReportEvidence_reportId_fkey" FOREIGN KEY ("reportId") REFERENCES "Report" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ReportSupport" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "reportId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ReportSupport_reportId_fkey" FOREIGN KEY ("reportId") REFERENCES "Report" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ReportSupport_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SystemicIssue" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "trackingId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "regionScope" TEXT NOT NULL DEFAULT 'DISTRICT',
    "status" TEXT NOT NULL DEFAULT 'CANDIDATE',
    "severity" REAL NOT NULL DEFAULT 5.0,
    "urgency" REAL NOT NULL DEFAULT 5.0,
    "scaleEstimate" REAL NOT NULL DEFAULT 5.0,
    "geographicSpread" REAL NOT NULL DEFAULT 5.0,
    "evidenceStrength" REAL NOT NULL DEFAULT 5.0,
    "persistenceScore" REAL NOT NULL DEFAULT 5.0,
    "growthRate" REAL NOT NULL DEFAULT 5.0,
    "priorityScore" REAL NOT NULL DEFAULT 50.0,
    "priorityExplanation" TEXT,
    "isPublic" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "ReportSystemicIssueLink" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "reportId" TEXT NOT NULL,
    "systemicIssueId" TEXT NOT NULL,
    "confidenceScore" REAL NOT NULL DEFAULT 0.8,
    "rationale" TEXT,
    "linkedBy" TEXT NOT NULL DEFAULT 'AI_SUGGESTED',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ReportSystemicIssueLink_reportId_fkey" FOREIGN KEY ("reportId") REFERENCES "Report" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ReportSystemicIssueLink_systemicIssueId_fkey" FOREIGN KEY ("systemicIssueId") REFERENCES "SystemicIssue" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PriorityAssessment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "systemicIssueId" TEXT NOT NULL,
    "weightsSnapshot" TEXT NOT NULL,
    "inputFactors" TEXT NOT NULL,
    "calculatedScore" REAL NOT NULL,
    "explanation" TEXT NOT NULL,
    "assessedBy" TEXT NOT NULL DEFAULT 'SYSTEM',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PriorityAssessment_systemicIssueId_fkey" FOREIGN KEY ("systemicIssueId") REFERENCES "SystemicIssue" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AIAnalysis" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "targetType" TEXT NOT NULL,
    "targetId" TEXT NOT NULL,
    "modelVersion" TEXT NOT NULL DEFAULT 'gemini-2.5-flash',
    "extractedSignals" TEXT NOT NULL,
    "clusteringSuggestions" TEXT,
    "responsibilitySuggestions" TEXT,
    "status" TEXT NOT NULL DEFAULT 'SUCCESS',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "VerificationReview" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "systemicIssueId" TEXT NOT NULL,
    "reviewerId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "notes" TEXT NOT NULL,
    "previousStatus" TEXT NOT NULL,
    "newStatus" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "VerificationReview_systemicIssueId_fkey" FOREIGN KEY ("systemicIssueId") REFERENCES "SystemicIssue" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "VerificationReview_reviewerId_fkey" FOREIGN KEY ("reviewerId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ResponsibilityNode" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "systemicIssueId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "level" TEXT NOT NULL,
    "jurisdiction" TEXT NOT NULL,
    "description" TEXT,
    "confidenceScore" REAL NOT NULL DEFAULT 0.85,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ResponsibilityNode_systemicIssueId_fkey" FOREIGN KEY ("systemicIssueId") REFERENCES "SystemicIssue" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ResponsibilityEdge" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "systemicIssueId" TEXT NOT NULL,
    "sourceNodeId" TEXT NOT NULL,
    "targetNodeId" TEXT NOT NULL,
    "relationshipType" TEXT NOT NULL,
    "rationale" TEXT NOT NULL,
    "evidenceSource" TEXT,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ResponsibilityEdge_systemicIssueId_fkey" FOREIGN KEY ("systemicIssueId") REFERENCES "SystemicIssue" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ResponsibilityEdge_sourceNodeId_fkey" FOREIGN KEY ("sourceNodeId") REFERENCES "ResponsibilityNode" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ResponsibilityEdge_targetNodeId_fkey" FOREIGN KEY ("targetNodeId") REFERENCES "ResponsibilityNode" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "InstitutionalResponse" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "systemicIssueId" TEXT NOT NULL,
    "authorityName" TEXT NOT NULL,
    "authorityLevel" TEXT NOT NULL,
    "responseSummary" TEXT NOT NULL,
    "responseDate" DATETIME NOT NULL,
    "responseType" TEXT NOT NULL,
    "sourceReferenceUrl" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "InstitutionalResponse_systemicIssueId_fkey" FOREIGN KEY ("systemicIssueId") REFERENCES "SystemicIssue" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ActionCommitment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "responseId" TEXT NOT NULL,
    "commitmentDetails" TEXT NOT NULL,
    "deadlineDate" DATETIME,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ActionCommitment_responseId_fkey" FOREIGN KEY ("responseId") REFERENCES "InstitutionalResponse" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "OutcomeUpdate" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "systemicIssueId" TEXT NOT NULL,
    "actorId" TEXT NOT NULL,
    "outcomeStatus" TEXT NOT NULL,
    "verificationNotes" TEXT NOT NULL,
    "isIndependentVerification" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "OutcomeUpdate_systemicIssueId_fkey" FOREIGN KEY ("systemicIssueId") REFERENCES "SystemicIssue" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "OutcomeUpdate_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "actorId" TEXT NOT NULL,
    "actorRole" TEXT NOT NULL,
    "actionType" TEXT NOT NULL,
    "targetEntity" TEXT NOT NULL,
    "targetId" TEXT NOT NULL,
    "diffJson" TEXT,
    "ipHash" TEXT,
    "timestamp" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "linkUrl" TEXT,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_email_idx" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_role_idx" ON "User"("role");

-- CreateIndex
CREATE UNIQUE INDEX "UserPrivacySettings_userId_key" ON "UserPrivacySettings"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Report_trackingId_key" ON "Report"("trackingId");

-- CreateIndex
CREATE INDEX "Report_trackingId_idx" ON "Report"("trackingId");

-- CreateIndex
CREATE INDEX "Report_userId_idx" ON "Report"("userId");

-- CreateIndex
CREATE INDEX "Report_category_idx" ON "Report"("category");

-- CreateIndex
CREATE INDEX "Report_locationState_locationDistrict_idx" ON "Report"("locationState", "locationDistrict");

-- CreateIndex
CREATE INDEX "Report_status_idx" ON "Report"("status");

-- CreateIndex
CREATE INDEX "ReportEvidence_reportId_idx" ON "ReportEvidence"("reportId");

-- CreateIndex
CREATE INDEX "ReportSupport_reportId_idx" ON "ReportSupport"("reportId");

-- CreateIndex
CREATE INDEX "ReportSupport_userId_idx" ON "ReportSupport"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "ReportSupport_reportId_userId_key" ON "ReportSupport"("reportId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "SystemicIssue_trackingId_key" ON "SystemicIssue"("trackingId");

-- CreateIndex
CREATE INDEX "SystemicIssue_trackingId_idx" ON "SystemicIssue"("trackingId");

-- CreateIndex
CREATE INDEX "SystemicIssue_category_idx" ON "SystemicIssue"("category");

-- CreateIndex
CREATE INDEX "SystemicIssue_status_idx" ON "SystemicIssue"("status");

-- CreateIndex
CREATE INDEX "SystemicIssue_priorityScore_idx" ON "SystemicIssue"("priorityScore");

-- CreateIndex
CREATE INDEX "SystemicIssue_isPublic_idx" ON "SystemicIssue"("isPublic");

-- CreateIndex
CREATE INDEX "ReportSystemicIssueLink_reportId_idx" ON "ReportSystemicIssueLink"("reportId");

-- CreateIndex
CREATE INDEX "ReportSystemicIssueLink_systemicIssueId_idx" ON "ReportSystemicIssueLink"("systemicIssueId");

-- CreateIndex
CREATE UNIQUE INDEX "ReportSystemicIssueLink_reportId_systemicIssueId_key" ON "ReportSystemicIssueLink"("reportId", "systemicIssueId");

-- CreateIndex
CREATE INDEX "PriorityAssessment_systemicIssueId_idx" ON "PriorityAssessment"("systemicIssueId");

-- CreateIndex
CREATE INDEX "AIAnalysis_targetType_targetId_idx" ON "AIAnalysis"("targetType", "targetId");

-- CreateIndex
CREATE INDEX "AIAnalysis_status_idx" ON "AIAnalysis"("status");

-- CreateIndex
CREATE INDEX "VerificationReview_systemicIssueId_idx" ON "VerificationReview"("systemicIssueId");

-- CreateIndex
CREATE INDEX "VerificationReview_reviewerId_idx" ON "VerificationReview"("reviewerId");

-- CreateIndex
CREATE INDEX "ResponsibilityNode_systemicIssueId_idx" ON "ResponsibilityNode"("systemicIssueId");

-- CreateIndex
CREATE INDEX "ResponsibilityNode_level_idx" ON "ResponsibilityNode"("level");

-- CreateIndex
CREATE INDEX "ResponsibilityEdge_systemicIssueId_idx" ON "ResponsibilityEdge"("systemicIssueId");

-- CreateIndex
CREATE INDEX "ResponsibilityEdge_sourceNodeId_idx" ON "ResponsibilityEdge"("sourceNodeId");

-- CreateIndex
CREATE INDEX "ResponsibilityEdge_targetNodeId_idx" ON "ResponsibilityEdge"("targetNodeId");

-- CreateIndex
CREATE INDEX "InstitutionalResponse_systemicIssueId_idx" ON "InstitutionalResponse"("systemicIssueId");

-- CreateIndex
CREATE INDEX "ActionCommitment_responseId_idx" ON "ActionCommitment"("responseId");

-- CreateIndex
CREATE INDEX "ActionCommitment_status_idx" ON "ActionCommitment"("status");

-- CreateIndex
CREATE INDEX "OutcomeUpdate_systemicIssueId_idx" ON "OutcomeUpdate"("systemicIssueId");

-- CreateIndex
CREATE INDEX "AuditLog_actorId_idx" ON "AuditLog"("actorId");

-- CreateIndex
CREATE INDEX "AuditLog_actionType_idx" ON "AuditLog"("actionType");

-- CreateIndex
CREATE INDEX "AuditLog_targetEntity_targetId_idx" ON "AuditLog"("targetEntity", "targetId");

-- CreateIndex
CREATE INDEX "AuditLog_timestamp_idx" ON "AuditLog"("timestamp");

-- CreateIndex
CREATE INDEX "Notification_userId_idx" ON "Notification"("userId");

-- CreateIndex
CREATE INDEX "Notification_isRead_idx" ON "Notification"("isRead");

