// Niveaux ordinaux (entiers) pour les calculs de gap et ratio
export const LEVEL_ORDINAL: Record<string, number> = {
  LOW: 1,    Low: 1,
  MEDIUM: 2, Medium: 2,
  HIGH: 3,   High: 3,
  EXPERT: 4, Expert: 4,
};

export interface EmployeeSkillLevel {
  skillId: string;
  skillName: string;
  level: string;
}

export interface RequiredSkillInput {
  skillId: string;
  skillName: string;
  level: string;           // niveau désiré
  contributionToScore: number; // poids brut (ex: 30, 50, 20 — somme libre)
}

export function parseCvSkillLevels(
  cvText: string,
  skillMap: Map<string, string>,
): EmployeeSkillLevel[] {
  const result: EmployeeSkillLevel[] = [];
  for (const line of cvText.split('\n')) {
    const trimmed = line.trim();
    const match = trimmed.match(/^([A-Za-z0-9\s#\+\.\-\_@]+):([A-Za-z]+)$/i);
    if (!match) continue;
    const name = match[1].trim().toUpperCase();
    const level = match[2].toUpperCase();
    const skillId = skillMap.get(name);
    if (skillId) result.push({ skillId, skillName: name, level });
  }
  return result;
}

/**
 * Score 1 — Skill Match (0–100)
 *
 * Pour chaque compétence requise :
 *   weight      = contributionToScore / totalContribution
 *   matchRatio  = min(empOrdinal / reqOrdinal, 1.0)
 *   contribution = matchRatio × weight × 100
 *
 * Si l'employé n'a pas la compétence → contribution = 0
 */
export function calculateSkillMatchScore(
  employeeSkills: EmployeeSkillLevel[],
  requiredSkills: RequiredSkillInput[],
): number {
  if (requiredSkills.length === 0) return 0;

  const totalWeight = requiredSkills.reduce((s, r) => s + r.contributionToScore, 0);
  if (totalWeight === 0) return 0;

  const empMap = new Map(employeeSkills.map((s) => [s.skillId, s]));
  let score = 0;

  for (const req of requiredSkills) {
    const weight = req.contributionToScore / totalWeight;
    const emp = empMap.get(req.skillId);
    if (!emp) continue; // pas la compétence → 0

    const empOrdinal = LEVEL_ORDINAL[emp.level] ?? 1;
    const reqOrdinal = LEVEL_ORDINAL[req.level] ?? 1;
    const matchRatio = Math.min(empOrdinal / reqOrdinal, 1.0);
    score += matchRatio * weight * 100;
  }

  return Math.round(score * 100) / 100;
}

/**
 * Score 2 — Progression (0–100)
 *
 * Pour chaque compétence requise :
 *   weight = contributionToScore / totalWeight
 *
 *   Si l'employé A la compétence :
 *     gap = reqOrdinal - empOrdinal
 *     si gap == 1 ou gap == 2 → contribution = (gap / 2) × weight × 100
 *     sinon (gap ≤ 0 ou gap > 2) → contribution = 0
 *
 *   Si l'employé N'A PAS la compétence :
 *     contribution = weight × 50   (bonus fixe "à acquérir")
 */
export function calculateProgressionScore(
  employeeSkills: EmployeeSkillLevel[],
  requiredSkills: RequiredSkillInput[],
): number {
  if (requiredSkills.length === 0) return 0;

  const totalWeight = requiredSkills.reduce((s, r) => s + r.contributionToScore, 0);
  if (totalWeight === 0) return 0;

  const empMap = new Map(employeeSkills.map((s) => [s.skillId, s]));
  let score = 0;

  for (const req of requiredSkills) {
    const weight = req.contributionToScore / totalWeight;
    const emp = empMap.get(req.skillId);

    if (!emp) {
      // Compétence absente → bonus fixe
      score += weight * 50;
    } else {
      const empOrdinal = LEVEL_ORDINAL[emp.level] ?? 1;
      const reqOrdinal = LEVEL_ORDINAL[req.level] ?? 1;
      const gap = reqOrdinal - empOrdinal;

      if (gap === 1 || gap === 2) {
        score += (gap / 2) * weight * 100;
      }
      // gap <= 0 (déjà au niveau) ou gap > 2 (trop loin) → 0
    }
  }

  return Math.round(score * 100) / 100;
}

/**
 * Score 3 — Context (50–75)
 *
 * Identique pour tous les employés d'une même activité.
 * base = 50
 * + Upskilling    → +20 → 70
 * + Consolidation → +15 → 65
 * + Expertise     → +25 → 75
 */
export function calculateContextScore(activityContext: string): number {
  const ctx = (activityContext ?? '').toLowerCase();
  let bonus = 0;
  if (ctx === 'upskilling')    bonus = 20;
  else if (ctx === 'consolidation') bonus = 15;
  else if (ctx === 'expertise')     bonus = 25;
  return Math.min(50 + bonus, 100);
}

/**
 * Score final pondéré
 *
 * totalScore = skillMatch × 0.40 + progression × 0.30 + context × 0.30
 * Arrondi : Math.round(score × 100) / 100
 */
export function calculateFinalScore(
  skillMatch: number,
  progressionScore: number,
  contextScore: number,
  weights = { skillMatch: 0.40, progression: 0.30, context: 0.30 },
): number {
  const raw =
    skillMatch      * weights.skillMatch +
    progressionScore * weights.progression +
    contextScore    * weights.context;
  return Math.round(raw * 100) / 100;
}
