/**
 * Deterministic Priority Engine
 * Authoritative implementation of Section 12 of NAGRIK specification.
 * 
 * Formula:
 * Priority = 10 * (0.25*Sev + 0.20*Urg + 0.15*Scale + 0.10*Geo + 0.15*Evid + 0.10*Pers + 0.05*Growth)
 * Factors range from 1.0 to 10.0 -> Output score ranges from 10.0 to 100.0
 */

export interface PriorityFactors {
  severity: number;         // 1.0 - 10.0: Potential magnitude of civic harm/hazard
  urgency: number;          // 1.0 - 10.0: Risk of rapid worsening if delayed
  scaleEstimate: number;    // 1.0 - 10.0: Estimated affected population reach
  geographicSpread: number; // 1.0 - 10.0: Local (2.5), District (5.0), Multi-District (7.5), State/National (10.0)
  evidenceStrength: number; // 1.0 - 10.0: Quality & corroboration of documents/photos
  persistenceScore: number; // 1.0 - 10.0: Duration/repetition of failure
  growthRate: number;       // 1.0 - 10.0: Velocity of incoming related reports
}

export interface PriorityWeights {
  severity: number;
  urgency: number;
  scaleEstimate: number;
  geographicSpread: number;
  evidenceStrength: number;
  persistenceScore: number;
  growthRate: number;
}

export const DEFAULT_PRIORITY_WEIGHTS: PriorityWeights = {
  severity: 0.25,
  urgency: 0.20,
  scaleEstimate: 0.15,
  geographicSpread: 0.10,
  evidenceStrength: 0.15,
  persistenceScore: 0.10,
  growthRate: 0.05,
};

export interface PriorityCalculationResult {
  score: number; // 10.0 - 100.0
  factors: PriorityFactors;
  weights: PriorityWeights;
  explanation: string;
  factorContributions: Record<keyof PriorityFactors, { value: number; weight: number; contribution: number }>;
  priorityBand: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'MODERATE' | 'LOW';
}

export function clampFactor(val: number): number {
  if (isNaN(val)) return 5.0;
  return Math.max(1.0, Math.min(10.0, Number(val)));
}

export function calculatePriority(
  inputFactors: Partial<PriorityFactors>,
  weights: PriorityWeights = DEFAULT_PRIORITY_WEIGHTS
): PriorityCalculationResult {
  const factors: PriorityFactors = {
    severity: clampFactor(inputFactors.severity ?? 5.0),
    urgency: clampFactor(inputFactors.urgency ?? 5.0),
    scaleEstimate: clampFactor(inputFactors.scaleEstimate ?? 5.0),
    geographicSpread: clampFactor(inputFactors.geographicSpread ?? 5.0),
    evidenceStrength: clampFactor(inputFactors.evidenceStrength ?? 5.0),
    persistenceScore: clampFactor(inputFactors.persistenceScore ?? 5.0),
    growthRate: clampFactor(inputFactors.growthRate ?? 5.0),
  };

  const rawSum =
    factors.severity * weights.severity +
    factors.urgency * weights.urgency +
    factors.scaleEstimate * weights.scaleEstimate +
    factors.geographicSpread * weights.geographicSpread +
    factors.evidenceStrength * weights.evidenceStrength +
    factors.persistenceScore * weights.persistenceScore +
    factors.growthRate * weights.growthRate;

  // Scale 1-10 to 10-100
  const score = Number((rawSum * 10).toFixed(1));

  let priorityBand: PriorityCalculationResult['priorityBand'] = 'LOW';
  if (score >= 80.0) priorityBand = 'CRITICAL';
  else if (score >= 65.0) priorityBand = 'HIGH';
  else if (score >= 50.0) priorityBand = 'MEDIUM';
  else if (score >= 35.0) priorityBand = 'MODERATE';
  else priorityBand = 'LOW';

  const factorContributions: PriorityCalculationResult['factorContributions'] = {
    severity: { value: factors.severity, weight: weights.severity, contribution: Number((factors.severity * weights.severity * 10).toFixed(1)) },
    urgency: { value: factors.urgency, weight: weights.urgency, contribution: Number((factors.urgency * weights.urgency * 10).toFixed(1)) },
    scaleEstimate: { value: factors.scaleEstimate, weight: weights.scaleEstimate, contribution: Number((factors.scaleEstimate * weights.scaleEstimate * 10).toFixed(1)) },
    geographicSpread: { value: factors.geographicSpread, weight: weights.geographicSpread, contribution: Number((factors.geographicSpread * weights.geographicSpread * 10).toFixed(1)) },
    evidenceStrength: { value: factors.evidenceStrength, weight: weights.evidenceStrength, contribution: Number((factors.evidenceStrength * weights.evidenceStrength * 10).toFixed(1)) },
    persistenceScore: { value: factors.persistenceScore, weight: weights.persistenceScore, contribution: Number((factors.persistenceScore * weights.persistenceScore * 10).toFixed(1)) },
    growthRate: { value: factors.growthRate, weight: weights.growthRate, contribution: Number((factors.growthRate * weights.growthRate * 10).toFixed(1)) },
  };

  const explanation = generatePriorityExplanation(factors, score, priorityBand);

  return {
    score,
    factors,
    weights,
    explanation,
    factorContributions,
    priorityBand,
  };
}

function generatePriorityExplanation(
  f: PriorityFactors,
  score: number,
  band: PriorityCalculationResult['priorityBand']
): string {
  const drivers: string[] = [];

  if (f.severity >= 7.5) drivers.push(`Critical civic hazard level (${f.severity.toFixed(1)}/10)`);
  if (f.urgency >= 7.5) drivers.push(`High risk of rapid escalation if unaddressed (${f.urgency.toFixed(1)}/10)`);
  if (f.scaleEstimate >= 7.0) drivers.push(`Significant population exposure (${f.scaleEstimate.toFixed(1)}/10)`);
  if (f.geographicSpread >= 7.0) drivers.push(`Multi-jurisdictional geographic footprint (${f.geographicSpread.toFixed(1)}/10)`);
  if (f.evidenceStrength >= 7.5) drivers.push(`Strong evidentiary corroboration (${f.evidenceStrength.toFixed(1)}/10)`);
  if (f.persistenceScore >= 7.5) drivers.push(`Protracted unresolved timeline (${f.persistenceScore.toFixed(1)}/10)`);
  if (f.growthRate >= 7.5) drivers.push(`Accelerating report influx (${f.growthRate.toFixed(1)}/10)`);

  const driverText = drivers.length > 0
    ? `Key contributors include: ${drivers.join('; ')}.`
    : `Balanced distribution across all seven weighted civic criteria.`;

  return `Evaluated at ${score.toFixed(1)}/100 (${band} Priority Band). ${driverText} Derived deterministically from verified signal weights without popularity bias.`;
}
