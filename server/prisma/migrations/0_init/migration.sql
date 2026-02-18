-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "passwordHash" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Content" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "type" TEXT,
    "status" TEXT,
    "topic" TEXT,
    "hook" TEXT,
    "notes" TEXT,
    "scheduledDate" TEXT,
    "publishedDate" TEXT,
    "presentationReady" BOOLEAN DEFAULT false,
    "sourceVideoId" TEXT,
    "slideDetails" JSONB,
    "comments" JSONB,
    "urls" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "Content_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Lead" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "company" TEXT,
    "contactPerson" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "status" TEXT,
    "source" TEXT,
    "industry" TEXT,
    "website" TEXT,
    "websiteIssues" JSONB,
    "tags" JSONB,
    "linkedBoardId" TEXT,
    "followUpDate" TIMESTAMP(3),
    "lastContactedAt" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "typeId" TEXT,
    "userId" TEXT NOT NULL,

    CONSTRAINT "Lead_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LeadType" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "boardId" TEXT,
    "defaultColumns" JSONB,
    "agentConfig" JSONB,
    "webhookSecret" TEXT,
    "autoCallEnabled" BOOLEAN NOT NULL DEFAULT true,
    "autoCallDelay" INTEGER NOT NULL DEFAULT 30000,
    "emailFollowUp" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "LeadType_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Job" (
    "id" TEXT NOT NULL,
    "title" TEXT,
    "role" TEXT,
    "company" TEXT NOT NULL,
    "location" TEXT,
    "locationType" TEXT,
    "status" TEXT,
    "description" TEXT,
    "contactPerson" TEXT,
    "contactEmail" TEXT,
    "experienceLevel" TEXT,
    "priority" TEXT,
    "notes" TEXT,
    "source" TEXT,
    "sourceUrl" TEXT,
    "requirements" JSONB,
    "skills" JSONB,
    "salaryCurrency" TEXT,
    "salaryMin" DOUBLE PRECISION,
    "salaryMax" DOUBLE PRECISION,
    "appliedAt" TIMESTAMP(3),
    "interviewDates" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "Job_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Task" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "status" TEXT,
    "priority" TEXT,
    "columnId" TEXT,
    "position" INTEGER DEFAULT 0,
    "assignee" TEXT,
    "leadId" TEXT,
    "subtasks" JSONB,
    "tags" JSONB,
    "dueDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "boardId" TEXT,
    "userId" TEXT NOT NULL,

    CONSTRAINT "Task_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TaskBoard" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "columns" JSONB,
    "leadId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "TaskBoard_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Template" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT,
    "description" TEXT,
    "icon" TEXT,
    "coverImage" TEXT,
    "content" JSONB,
    "rawMarkdown" TEXT,
    "subject" TEXT,
    "status" TEXT,
    "tags" JSONB,
    "variables" JSONB,
    "isFavorite" BOOLEAN DEFAULT false,
    "isPinned" BOOLEAN DEFAULT false,
    "isLocked" BOOLEAN DEFAULT false,
    "lockedBy" TEXT,
    "lastUsedAt" TIMESTAMP(3),
    "usageCount" INTEGER DEFAULT 0,
    "version" INTEGER DEFAULT 1,
    "permissions" JSONB,
    "createdBy" TEXT,
    "updatedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "folderId" TEXT,
    "userId" TEXT NOT NULL,

    CONSTRAINT "Template_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TemplateFolder" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "icon" TEXT,
    "color" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "TemplateFolder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Message" (
    "id" TEXT NOT NULL,
    "leadId" TEXT,
    "type" TEXT NOT NULL,
    "channel" TEXT NOT NULL,
    "subject" TEXT,
    "body" TEXT,
    "templateId" TEXT,
    "status" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "Message_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmailTemplate" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "subject" TEXT,
    "body" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "EmailTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmailSettings" (
    "id" TEXT NOT NULL,
    "config" JSONB,
    "userId" TEXT NOT NULL,

    CONSTRAINT "EmailSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Settings" (
    "id" TEXT NOT NULL,
    "config" JSONB,
    "userId" TEXT NOT NULL,

    CONSTRAINT "Settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "JobTemplate" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "userId" TEXT NOT NULL,

    CONSTRAINT "JobTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "JobSearchPrompt" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "source" TEXT,
    "description" TEXT,
    "url" TEXT,
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "prompt" TEXT,
    "userId" TEXT NOT NULL,

    CONSTRAINT "JobSearchPrompt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CVFile" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "filename" TEXT,
    "originalName" TEXT,
    "type" TEXT,
    "url" TEXT,
    "cloudUrl" TEXT,
    "size" INTEGER,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "CVFile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TemplateHistory" (
    "id" TEXT NOT NULL,
    "templateId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "details" TEXT,
    "version" INTEGER,
    "content" JSONB,
    "rawMarkdown" TEXT,
    "changeSummary" TEXT,
    "changeType" TEXT,
    "changedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT NOT NULL,

    CONSTRAINT "TemplateHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TemplateComment" (
    "id" TEXT NOT NULL,
    "templateId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "parentId" TEXT,
    "reactions" JSONB,
    "mentions" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "TemplateComment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SkillMastery" (
    "id" TEXT NOT NULL,
    "data" JSONB,
    "userId" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SkillMastery_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Call" (
    "id" TEXT NOT NULL,
    "leadId" TEXT NOT NULL,
    "direction" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "duration" INTEGER,
    "recordingUrl" TEXT,
    "transcription" TEXT,
    "summary" TEXT,
    "sentiment" TEXT,
    "outcome" TEXT,
    "scriptId" TEXT,
    "agentInstanceId" TEXT,
    "providerCallId" TEXT,
    "errorReason" TEXT,
    "failedAt" TIMESTAMP(3),
    "scheduledAt" TIMESTAMP(3),
    "startedAt" TIMESTAMP(3),
    "endedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "Call_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CallScript" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "purpose" TEXT,
    "industry" TEXT,
    "openingLine" TEXT,
    "talkingPoints" JSONB,
    "objectionHandlers" JSONB,
    "closingStrategy" TEXT,
    "rateRange" JSONB,
    "assistantConfig" JSONB,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "usageCount" INTEGER NOT NULL DEFAULT 0,
    "successRate" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "CallScript_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MeetingNote" (
    "id" TEXT NOT NULL,
    "callId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "summary" TEXT,
    "actionItems" JSONB,
    "decisions" JSONB,
    "followUpDate" TIMESTAMP(3),
    "tags" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "MeetingNote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RateNegotiation" (
    "id" TEXT NOT NULL,
    "callId" TEXT NOT NULL,
    "leadId" TEXT NOT NULL,
    "initialRate" DOUBLE PRECISION,
    "proposedRate" DOUBLE PRECISION,
    "finalRate" DOUBLE PRECISION,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "status" TEXT NOT NULL,
    "strategy" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "RateNegotiation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CallLog" (
    "id" TEXT NOT NULL,
    "callId" TEXT NOT NULL,
    "event" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "details" JSONB,
    "level" TEXT NOT NULL DEFAULT 'info',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT NOT NULL,

    CONSTRAINT "CallLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AgentInstance" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "status" TEXT NOT NULL DEFAULT 'idle',
    "currentStep" TEXT,
    "currentLeadId" TEXT,
    "currentLeadName" TEXT,
    "scriptId" TEXT,
    "leadQueue" JSONB,
    "completedLeads" JSONB,
    "config" JSONB,
    "stats" JSONB,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "AgentInstance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AutomationRule" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "trigger" TEXT NOT NULL,
    "conditions" JSONB,
    "actions" JSONB NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "isSystem" BOOLEAN NOT NULL DEFAULT false,
    "runCount" INTEGER NOT NULL DEFAULT 0,
    "lastRunAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "AutomationRule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "actionUrl" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT NOT NULL,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ScheduledAction" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "scheduledAt" TIMESTAMP(3) NOT NULL,
    "executed" BOOLEAN NOT NULL DEFAULT false,
    "executedAt" TIMESTAMP(3),
    "error" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT NOT NULL,

    CONSTRAINT "ScheduledAction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LeadIntelligence" (
    "id" TEXT NOT NULL,
    "leadId" TEXT NOT NULL,
    "dealHeat" INTEGER,
    "buyingIntent" TEXT,
    "budget" TEXT,
    "timeline" TEXT,
    "decisionMaker" TEXT,
    "painPoints" JSONB,
    "keyInsights" JSONB,
    "risks" JSONB,
    "nextBestAction" TEXT,
    "summary" TEXT,
    "lastAnalyzedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "LeadIntelligence_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Proposal" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "content" JSONB,
    "totalValue" DOUBLE PRECISION,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "validUntil" TIMESTAMP(3),
    "sentAt" TIMESTAMP(3),
    "acceptedAt" TIMESTAMP(3),
    "rejectionReason" TEXT,
    "leadId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Proposal_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "Content_userId_idx" ON "Content"("userId");

-- CreateIndex
CREATE INDEX "Lead_userId_status_idx" ON "Lead"("userId", "status");

-- CreateIndex
CREATE INDEX "Lead_userId_createdAt_idx" ON "Lead"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "Lead_typeId_idx" ON "Lead"("typeId");

-- CreateIndex
CREATE UNIQUE INDEX "LeadType_userId_slug_key" ON "LeadType"("userId", "slug");

-- CreateIndex
CREATE INDEX "Job_userId_status_idx" ON "Job"("userId", "status");

-- CreateIndex
CREATE INDEX "Task_boardId_columnId_idx" ON "Task"("boardId", "columnId");

-- CreateIndex
CREATE INDEX "Task_userId_idx" ON "Task"("userId");

-- CreateIndex
CREATE INDEX "TaskBoard_userId_idx" ON "TaskBoard"("userId");

-- CreateIndex
CREATE INDEX "Template_userId_category_idx" ON "Template"("userId", "category");

-- CreateIndex
CREATE INDEX "Template_folderId_idx" ON "Template"("folderId");

-- CreateIndex
CREATE INDEX "TemplateFolder_userId_idx" ON "TemplateFolder"("userId");

-- CreateIndex
CREATE INDEX "Message_leadId_idx" ON "Message"("leadId");

-- CreateIndex
CREATE INDEX "Message_userId_createdAt_idx" ON "Message"("userId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "EmailSettings_userId_key" ON "EmailSettings"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Settings_userId_key" ON "Settings"("userId");

-- CreateIndex
CREATE INDEX "TemplateHistory_templateId_idx" ON "TemplateHistory"("templateId");

-- CreateIndex
CREATE INDEX "TemplateComment_templateId_idx" ON "TemplateComment"("templateId");

-- CreateIndex
CREATE UNIQUE INDEX "SkillMastery_userId_key" ON "SkillMastery"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Call_providerCallId_key" ON "Call"("providerCallId");

-- CreateIndex
CREATE INDEX "Call_userId_status_idx" ON "Call"("userId", "status");

-- CreateIndex
CREATE INDEX "Call_leadId_idx" ON "Call"("leadId");

-- CreateIndex
CREATE INDEX "Call_agentInstanceId_idx" ON "Call"("agentInstanceId");

-- CreateIndex
CREATE INDEX "CallScript_userId_idx" ON "CallScript"("userId");

-- CreateIndex
CREATE INDEX "CallLog_callId_idx" ON "CallLog"("callId");

-- CreateIndex
CREATE INDEX "CallLog_userId_createdAt_idx" ON "CallLog"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "AgentInstance_userId_status_idx" ON "AgentInstance"("userId", "status");

-- CreateIndex
CREATE INDEX "AutomationRule_userId_trigger_idx" ON "AutomationRule"("userId", "trigger");

-- CreateIndex
CREATE INDEX "AutomationRule_enabled_idx" ON "AutomationRule"("enabled");

-- CreateIndex
CREATE INDEX "Notification_userId_read_idx" ON "Notification"("userId", "read");

-- CreateIndex
CREATE INDEX "Notification_userId_createdAt_idx" ON "Notification"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "ScheduledAction_executed_scheduledAt_idx" ON "ScheduledAction"("executed", "scheduledAt");

-- CreateIndex
CREATE INDEX "ScheduledAction_userId_idx" ON "ScheduledAction"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "LeadIntelligence_leadId_key" ON "LeadIntelligence"("leadId");

-- CreateIndex
CREATE INDEX "LeadIntelligence_userId_dealHeat_idx" ON "LeadIntelligence"("userId", "dealHeat");

-- CreateIndex
CREATE INDEX "Proposal_userId_status_idx" ON "Proposal"("userId", "status");

-- CreateIndex
CREATE INDEX "Proposal_leadId_idx" ON "Proposal"("leadId");

-- AddForeignKey
ALTER TABLE "Content" ADD CONSTRAINT "Content_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lead" ADD CONSTRAINT "Lead_typeId_fkey" FOREIGN KEY ("typeId") REFERENCES "LeadType"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lead" ADD CONSTRAINT "Lead_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeadType" ADD CONSTRAINT "LeadType_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Job" ADD CONSTRAINT "Job_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_boardId_fkey" FOREIGN KEY ("boardId") REFERENCES "TaskBoard"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskBoard" ADD CONSTRAINT "TaskBoard_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Template" ADD CONSTRAINT "Template_folderId_fkey" FOREIGN KEY ("folderId") REFERENCES "TemplateFolder"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Template" ADD CONSTRAINT "Template_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TemplateFolder" ADD CONSTRAINT "TemplateFolder_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmailTemplate" ADD CONSTRAINT "EmailTemplate_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmailSettings" ADD CONSTRAINT "EmailSettings_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Settings" ADD CONSTRAINT "Settings_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JobTemplate" ADD CONSTRAINT "JobTemplate_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JobSearchPrompt" ADD CONSTRAINT "JobSearchPrompt_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CVFile" ADD CONSTRAINT "CVFile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TemplateHistory" ADD CONSTRAINT "TemplateHistory_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TemplateComment" ADD CONSTRAINT "TemplateComment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SkillMastery" ADD CONSTRAINT "SkillMastery_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Call" ADD CONSTRAINT "Call_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Call" ADD CONSTRAINT "Call_scriptId_fkey" FOREIGN KEY ("scriptId") REFERENCES "CallScript"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Call" ADD CONSTRAINT "Call_agentInstanceId_fkey" FOREIGN KEY ("agentInstanceId") REFERENCES "AgentInstance"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Call" ADD CONSTRAINT "Call_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CallScript" ADD CONSTRAINT "CallScript_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MeetingNote" ADD CONSTRAINT "MeetingNote_callId_fkey" FOREIGN KEY ("callId") REFERENCES "Call"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MeetingNote" ADD CONSTRAINT "MeetingNote_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RateNegotiation" ADD CONSTRAINT "RateNegotiation_callId_fkey" FOREIGN KEY ("callId") REFERENCES "Call"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RateNegotiation" ADD CONSTRAINT "RateNegotiation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CallLog" ADD CONSTRAINT "CallLog_callId_fkey" FOREIGN KEY ("callId") REFERENCES "Call"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CallLog" ADD CONSTRAINT "CallLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AgentInstance" ADD CONSTRAINT "AgentInstance_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AutomationRule" ADD CONSTRAINT "AutomationRule_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeadIntelligence" ADD CONSTRAINT "LeadIntelligence_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeadIntelligence" ADD CONSTRAINT "LeadIntelligence_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Proposal" ADD CONSTRAINT "Proposal_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Proposal" ADD CONSTRAINT "Proposal_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

