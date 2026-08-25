import { GoogleGenerativeAI } from '@google/generative-ai';
import { db } from '../db';
import { logAuditEvent } from '../audit';

export interface ExtractedReportSignals {
  severity: number;
  severityReasoning: string;
  urgency: number;
  urgencyReasoning: string;
  scaleEstimate: number;
  keyEntities: string[];
  systemicTags: string[];
  suggestedSummary: string;
  confidenceScore: number;
  source: 'GEMINI_AI' | 'FALLBACK_HEURISTICS';
}

export interface PreliminaryResponsibilityResult {
  nodes: Array<{
    name: string;
    level: 'OPERATIONAL' | 'SUPERVISORY' | 'REGULATORY_POLICY' | 'POLITICAL_MINISTERIAL' | 'CORRECTIVE';
    jurisdiction: string;
    description: string;
    confidenceScore: number;
  }>;
  edges: Array<{
    sourceIndex: number;
    targetIndex: number;
    relationshipType: 'SUPERVISES' | 'REGULATES' | 'EXECUTES' | 'CORRECTS';
    rationale: string;
    evidenceSource?: string;
  }>;
  uncertaintyNotes: string;
  source: 'GEMINI_AI' | 'FALLBACK_HEURISTICS';
}

/**
 * Server-Side AI Service with Resilience & Fallback Guarantees
 */
export async function analyzeReportWithAI(report: {
  id: string;
  title: string;
  description: string;
  category: string;
  locationState: string;
  locationDistrict: string;
}): Promise<ExtractedReportSignals> {
  const apiKey = process.env.GEMINI_API_KEY?.trim();

  if (apiKey) {
    try {
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({
        model: 'gemini-1.5-flash',
        generationConfig: {
          responseMimeType: 'application/json',
          temperature: 0.1,
        },
      });

      const prompt = `You are the NAGRIK civic intelligence assistant. Analyze this citizen civic issue report.
You must NOT judge guilt, name individual persons, or invent accusations. Focus on civic severity, urgency, scale, and administrative context.

Report Data:
Title: ${report.title}
Category: ${report.category}
Location: ${report.locationDistrict}, ${report.locationState}
Description: ${report.description}

Return ONLY valid JSON matching this schema:
{
  "severity": number (1.0 to 10.0),
  "severityReasoning": string,
  "urgency": number (1.0 to 10.0),
  "urgencyReasoning": string,
  "scaleEstimate": number (1.0 to 10.0),
  "keyEntities": string[] (institutional departments or offices, e.g. "Municipal Water Supply Division"),
  "systemicTags": string[] (3-5 clustering keywords),
  "suggestedSummary": string (concise neutral summary),
  "confidenceScore": number (0.0 to 1.0)
}`;

      const result = await model.generateContent(prompt);
      const text = result.response.text();
      const parsed = JSON.parse(text);

      const signals: ExtractedReportSignals = {
        severity: Math.max(1, Math.min(10, Number(parsed.severity) || 5)),
        severityReasoning: parsed.severityReasoning || 'Assessed based on reported civic impact.',
        urgency: Math.max(1, Math.min(10, Number(parsed.urgency) || 5)),
        urgencyReasoning: parsed.urgencyReasoning || 'Assessed based on ongoing operational timeline.',
        scaleEstimate: Math.max(1, Math.min(10, Number(parsed.scaleEstimate) || 5)),
        keyEntities: Array.isArray(parsed.keyEntities) ? parsed.keyEntities : [],
        systemicTags: Array.isArray(parsed.systemicTags) ? parsed.systemicTags : [report.category.toLowerCase()],
        suggestedSummary: parsed.suggestedSummary || report.title,
        confidenceScore: Math.max(0.1, Math.min(1.0, Number(parsed.confidenceScore) || 0.85)),
        source: 'GEMINI_AI',
      };

      // Persist AI Analysis Record
      await db.aIAnalysis.create({
        data: {
          targetType: 'REPORT',
          targetId: report.id,
          modelVersion: 'gemini-1.5-flash',
          extractedSignals: JSON.stringify(signals),
          status: 'SUCCESS',
        },
      });

      return signals;
    } catch (error) {
      console.warn('[GEMINI_AI_FALLBACK] Gemini API failed or malformed, utilizing deterministic heuristics:', error);
    }
  }

  // Deterministic Heuristic Fallback
  return executeFallbackReportAnalysis(report);
}

/**
 * Deterministic Heuristic Fallback Analyzer (Zero-downtime offline mode)
 */
export async function executeFallbackReportAnalysis(report: {
  id: string;
  title: string;
  description: string;
  category: string;
  locationState: string;
  locationDistrict: string;
}): Promise<ExtractedReportSignals> {
  const content = `${report.title} ${report.description}`.toLowerCase();

  let severity = 5.0;
  let urgency = 5.0;
  let scaleEstimate = 5.0;

  // Severe civic keywords
  if (content.match(/death|casualty|fatal|poison|toxic|collapse|outbreak|epidemic|hospital|emergency|critical|electrocution/)) {
    severity += 3.5;
    urgency += 3.5;
    scaleEstimate += 2.5;
  } else if (content.match(/contaminat|overflow|sewage|broken|burst|outage|shortage|blocked|hazard|danger|leak/)) {
    severity += 2.0;
    urgency += 2.0;
    scaleEstimate += 1.5;
  } else if (content.match(/pothole|delay|streetlight|garbage|uncleaned|noise|dust/)) {
    severity += 0.5;
    urgency += 0.5;
  }

  // Category baselines
  if (report.category === 'HEALTHCARE' || report.category === 'WATER_SANITATION') {
    severity = Math.max(severity, 7.0);
    urgency = Math.max(urgency, 6.5);
  }

  severity = Math.min(10.0, Math.max(1.0, Number(severity.toFixed(1))));
  urgency = Math.min(10.0, Math.max(1.0, Number(urgency.toFixed(1))));
  scaleEstimate = Math.min(10.0, Math.max(1.0, Number(scaleEstimate.toFixed(1))));

  const tags = [
    report.category.toLowerCase().replace(/_/g, '-'),
    report.locationDistrict.toLowerCase(),
    report.locationState.toLowerCase(),
  ];

  const signals: ExtractedReportSignals = {
    severity,
    severityReasoning: `Heuristically evaluated via category (${report.category}) and civic impact indicators.`,
    urgency,
    urgencyReasoning: `Heuristically determined based on reported operational hazard factors.`,
    scaleEstimate,
    keyEntities: [`District ${report.category.replace(/_/g, ' ')} Authority`],
    systemicTags: tags,
    suggestedSummary: report.title,
    confidenceScore: 0.75,
    source: 'FALLBACK_HEURISTICS',
  };

  try {
    await db.aIAnalysis.create({
      data: {
        targetType: 'REPORT',
        targetId: report.id,
        modelVersion: 'heuristic-engine-v1',
        extractedSignals: JSON.stringify(signals),
        status: 'FALLBACK',
      },
    });
  } catch (err) {
    // Non-blocking
  }

  return signals;
}

/**
 * Generate Preliminary Institutional Responsibility Graph
 */
export async function generatePreliminaryResponsibilityGraph(issue: {
  id: string;
  title: string;
  summary: string;
  category: string;
  regionScope: string;
  locationDistrict?: string;
  locationState?: string;
}): Promise<PreliminaryResponsibilityResult> {
  const apiKey = process.env.GEMINI_API_KEY?.trim();

  if (apiKey) {
    try {
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({
        model: 'gemini-1.5-flash',
        generationConfig: {
          responseMimeType: 'application/json',
          temperature: 0.1,
        },
      });

      const prompt = `You are NAGRIK's statutory institutional mapping assistant.
Generate a preliminary responsibility graph mapping institutional offices and departments in the Indian administrative framework for this systemic issue.

Rules:
1. Do NOT map individual persons, politicians by name, or photographs. Use institutional office names only (e.g., "District Water Supply Board", "State Pollution Control Board").
2. Categorize each node into one of: 'OPERATIONAL', 'SUPERVISORY', 'REGULATORY_POLICY', 'POLITICAL_MINISTERIAL', 'CORRECTIVE'.
3. Detail clear relationship edges ('SUPERVISES', 'REGULATES', 'EXECUTES', 'CORRECTS') with concise administrative rationale.
4. Highlight uncertainty wherever statutory boundaries overlap.

Issue:
Title: ${issue.title}
Category: ${issue.category}
Summary: ${issue.summary}
Region Scope: ${issue.regionScope}

Return valid JSON matching:
{
  "nodes": [
    {
      "name": string,
      "level": "OPERATIONAL" | "SUPERVISORY" | "REGULATORY_POLICY" | "POLITICAL_MINISTERIAL" | "CORRECTIVE",
      "jurisdiction": string,
      "description": string,
      "confidenceScore": number (0.0 - 1.0)
    }
  ],
  "edges": [
    {
      "sourceIndex": number (index into nodes array),
      "targetIndex": number (index into nodes array),
      "relationshipType": "SUPERVISES" | "REGULATES" | "EXECUTES" | "CORRECTS",
      "rationale": string,
      "evidenceSource": string
    }
  ],
  "uncertaintyNotes": string
}`;

      const result = await model.generateContent(prompt);
      const parsed = JSON.parse(result.response.text());

      return {
        nodes: parsed.nodes || [],
        edges: parsed.edges || [],
        uncertaintyNotes: parsed.uncertaintyNotes || 'Preliminary statutory mapping generated by AI assistance. Requires investigator verification before public publication.',
        source: 'GEMINI_AI',
      };
    } catch (error) {
      console.warn('[GEMINI_RESPONSIBILITY_FALLBACK] Falling back to standard administrative taxonomy:', error);
    }
  }

  // Statutory Administrative Fallback Mapping
  return getFallbackResponsibilityTaxonomy(issue);
}

function getFallbackResponsibilityTaxonomy(issue: {
  category: string;
  regionScope: string;
}): PreliminaryResponsibilityResult {
  const category = issue.category.toUpperCase();

  if (category === 'WATER_SANITATION') {
    return {
      nodes: [
        {
          name: 'Municipal Water Supply & Sewerage Division',
          level: 'OPERATIONAL',
          jurisdiction: 'Local / Ward',
          description: 'Responsible for daily pipeline maintenance, water distribution, and intake filtration.',
          confidenceScore: 0.9,
        },
        {
          name: 'District Health & Public Sanitation Inspectorate',
          level: 'SUPERVISORY',
          jurisdiction: 'District',
          description: 'Supervises potable water testing, public health safety compliance, and contamination audits.',
          confidenceScore: 0.85,
        },
        {
          name: 'State Pollution Control Board (SPCB)',
          level: 'REGULATORY_POLICY',
          jurisdiction: 'State',
          description: 'Sets statutory discharge standards and monitors industrial and municipal water effluents.',
          confidenceScore: 0.9,
        },
        {
          name: 'Department of Urban Development & Municipal Affairs',
          level: 'POLITICAL_MINISTERIAL',
          jurisdiction: 'State Government',
          description: 'Ministerial portfolio overseeing urban infrastructure budgets, capital grants, and policy reform.',
          confidenceScore: 0.8,
        },
        {
          name: 'State Infrastructure & Water Works Commission',
          level: 'CORRECTIVE',
          jurisdiction: 'State',
          description: 'Statutory body with authority to sanction emergency infrastructure overhaul funds and remediation tenders.',
          confidenceScore: 0.85,
        },
      ],
      edges: [
        {
          sourceIndex: 1,
          targetIndex: 0,
          relationshipType: 'SUPERVISES',
          rationale: 'Health inspectorate conducts mandatory periodic testing of municipal water outputs.',
          evidenceSource: 'Public Health Sanitation Act',
        },
        {
          sourceIndex: 2,
          targetIndex: 0,
          relationshipType: 'REGULATES',
          rationale: 'Pollution Control Board enforces environmental compliance and water quality benchmarks.',
          evidenceSource: 'Water (Prevention and Control of Pollution) Act',
        },
        {
          sourceIndex: 3,
          targetIndex: 1,
          relationshipType: 'SUPERVISES',
          rationale: 'Ministerial department allocates budgetary oversight and performance metrics.',
          evidenceSource: 'State Allocation of Business Rules',
        },
        {
          sourceIndex: 4,
          targetIndex: 0,
          relationshipType: 'CORRECTS',
          rationale: 'Empowered to execute major capital replacement tenders when local maintenance fails.',
          evidenceSource: 'Urban Development Project Directives',
        },
      ],
      uncertaintyNotes: 'Preliminary statutory map derived from standard state municipal water governance taxonomy. Requires investigator sign-off before public release.',
      source: 'FALLBACK_HEURISTICS',
    };
  }

  // Standard Default Civic Hierarchy
  return {
    nodes: [
      {
        name: 'Local Municipal / Civic Maintenance Ward',
        level: 'OPERATIONAL',
        jurisdiction: 'Local Ward',
        description: 'Direct field execution and operational maintenance unit.',
        confidenceScore: 0.85,
      },
      {
        name: 'District Magistrate / Municipal Commissioner Office',
        level: 'SUPERVISORY',
        jurisdiction: 'District Level',
        description: 'District administrative authority overseeing civic compliance and departmental coordination.',
        confidenceScore: 0.85,
      },
      {
        name: 'State Department of Public Works / Civic Administration',
        level: 'REGULATORY_POLICY',
        jurisdiction: 'State',
        description: 'Formulates technical specifications, state norms, and administrative standards.',
        confidenceScore: 0.8,
      },
      {
        name: 'Ministry of Urban Development / Local Self-Government',
        level: 'POLITICAL_MINISTERIAL',
        jurisdiction: 'State Government',
        description: 'Ministerial office answerable for public utility governance and civic capital outlays.',
        confidenceScore: 0.75,
      },
    ],
    edges: [
      {
        sourceIndex: 1,
        targetIndex: 0,
        relationshipType: 'SUPERVISES',
        rationale: 'Administrative supervision over municipal field operations and grievance redressal.',
        evidenceSource: 'Municipal Corporation Act',
      },
      {
        sourceIndex: 2,
        targetIndex: 0,
        relationshipType: 'REGULATES',
        rationale: 'Establishes technical standards and regulatory compliance protocols.',
        evidenceSource: 'State Public Works Manual',
      },
      {
        sourceIndex: 3,
        targetIndex: 1,
        relationshipType: 'SUPERVISES',
        rationale: 'Executive accountability and policy direction over district civic bodies.',
        evidenceSource: 'State Administrative Directives',
      },
    ],
    uncertaintyNotes: 'Preliminary statutory structure based on standard Indian administrative hierarchy. Requires investigator verification.',
    source: 'FALLBACK_HEURISTICS',
  };
}
