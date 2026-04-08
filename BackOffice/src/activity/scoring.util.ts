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
    // Accept both "NAME:LEVEL" and "NAME:LEVEL:optionalId"
    const match = trimmed.match(/^([A-Za-z0-9\s#\+\.\-\_@]+):([A-Za-z]+)(?::[^\s]*)?$/i);
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

  // Match by ID first, then by name (handles duplicate skill names in DB)
  const empById  = new Map(employeeSkills.map((s) => [s.skillId, s]));
  const empByName = new Map(employeeSkills.map((s) => [s.skillName.toUpperCase(), s]));
  let score = 0;

  for (const req of requiredSkills) {
    const weight = req.contributionToScore / totalWeight;
    const emp = empById.get(req.skillId) ?? empByName.get(req.skillName.toUpperCase());
    if (!emp) continue;

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
 *     gap 1 ou 2 → contribution = (gap / 2) × weight × 100  ← zone idéale
 *     gap 0      → 0  (déjà au niveau, rien à apprendre)
 *     gap > 2    → weight × 50  (trop loin, crédit partiel)
 *
 *   Si l'employé N'A PAS la compétence :
 *     contribution = weight × 25   (bonus acquisition réduit — moins bien que gap idéal)
 *
 * Différenciation : avoir le skill à LOW avec gap=1 (score 50) > absent (score 25)
 * Cela évite que "aucun skill" == "skill à LOW" dans le classement.
 */
export function calculateProgressionScore(
  employeeSkills: EmployeeSkillLevel[],
  requiredSkills: RequiredSkillInput[],
): number {
  if (requiredSkills.length === 0) return 0;

  const totalWeight = requiredSkills.reduce((s, r) => s + r.contributionToScore, 0);
  if (totalWeight === 0) return 0;

  // Match by ID first, then by name
  const empById   = new Map(employeeSkills.map((s) => [s.skillId, s]));
  const empByName = new Map(employeeSkills.map((s) => [s.skillName.toUpperCase(), s]));
  let score = 0;

  for (const req of requiredSkills) {
    const weight = req.contributionToScore / totalWeight;
    const emp = empById.get(req.skillId) ?? empByName.get(req.skillName.toUpperCase());

    if (!emp) {
      score += weight * 25;
    } else {
      const empOrdinal = LEVEL_ORDINAL[emp.level] ?? 1;
      const reqOrdinal = LEVEL_ORDINAL[req.level] ?? 1;
      const gap = reqOrdinal - empOrdinal;

      if (gap === 1 || gap === 2) {
        score += (gap / 2) * weight * 100;
      } else if (gap > 2) {
        score += weight * 50;
      }
    }
  }

  return Math.round(score * 100) / 100;
}

/**
 * Score 3 — Context (fixe par activité)
 *
 * Identique pour tous les employés d'une même activité.
 * Upskilling    → 70
 * Expertise     → 75
 * Consolidation → 65
 * Autre         → 65 (valeur par défaut)
 */
export function calculateContextScore(activityContext: string): number {
  const ctx = (activityContext ?? '').toLowerCase();
  if (ctx === 'upskilling')    return 70;
  if (ctx === 'expertise')     return 75;
  if (ctx === 'consolidation') return 65;
  return 65;
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
