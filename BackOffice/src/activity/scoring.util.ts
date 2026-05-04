/**
 * scoring.util.ts — Système de scoring HRBrain
 *
 * Score final = skillMatch×40% + progression×30% + context×30%
 * Chaque score est dans [0, 100].
 */

// ── Niveaux ordinaux ─────────────────────────────────────────────────────────
export const LEVEL_ORDINAL: Record<string, number> = {
  LOW: 1,    Low: 1,
  MEDIUM: 2, Medium: 2,
  HIGH: 3,   High: 3,
  EXPERT: 4, Expert: 4,
};

// ── Interfaces ───────────────────────────────────────────────────────────────
export interface EmployeeSkillLevel {
  skillId: string;
  skillName: string;
  level: string;
}

export interface RequiredSkillInput {
  skillId: string;
  skillName: string;
  level: string;
  contributionToScore: number; // poids brut (somme libre)
}

// ── Parser CV ────────────────────────────────────────────────────────────────
export function parseCvSkillLevels(
  cvText: string,
  skillMap: Map<string, string>,
): EmployeeSkillLevel[] {
  const result: EmployeeSkillLevel[] = [];
  for (const line of cvText.split('\n')) {
    const trimmed = line.trim();
    const match = trimmed.match(/^([A-Za-z0-9\s#+.\-_@]+):([A-Za-z]+)(?::[^\s]*)?$/i);
    if (!match) continue;
    const name  = match[1].trim().toUpperCase();
    const level = match[2].toUpperCase();
    const skillId = skillMap.get(name);
    if (skillId) result.push({ skillId, skillName: name, level });
  }
  return result;
}

// ── Helpers internes ─────────────────────────────────────────────────────────

/** Résout l'employé pour un skill requis (ID d'abord, puis nom) */
function resolveEmp(
  req: RequiredSkillInput,
  empById: Map<string, EmployeeSkillLevel>,
  empByName: Map<string, EmployeeSkillLevel>,
): EmployeeSkillLevel | undefined {
  return empById.get(req.skillId) ?? empByName.get(req.skillName.toUpperCase());
}

/**
 * Score de progression pour un gap donné.
 *
 * gap = reqOrdinal - empOrdinal  (peut être négatif si emp > req)
 *
 * | gap | signification              | score contribution (×weight×100) |
 * |-----|----------------------------|----------------------------------|
 * | ≤0  | déjà au niveau ou au-delà  | 0   (rien à apprendre)           |
 * |  1  | zone idéale (1 cran)       | 50  (gap/2 × 100)                |
 * |  2  | zone idéale (2 crans)      | 100 (gap/2 × 100)                |
 * |  3  | trop loin, crédit partiel  | 35                               |
 * |  4  | très loin                  | 20                               |
 * | ≥5  | hors portée               | 10                               |
 */
function progressionContribution(gap: number): number {
  if (gap <= 0) return 0;
  if (gap <= 2) return (gap / 2) * 100;
  if (gap === 3) return 35;
  if (gap === 4) return 20;
  return 10;
}

// ── Score 1 — Skill Match (0–100) ────────────────────────────────────────────
/**
 * Mesure la couverture des skills requis.
 *
 * Pour chaque skill requis :
 *   matchRatio = min(empOrdinal / reqOrdinal, 1.0)
 *   contribution = matchRatio × weight × 100
 *
 * Absent → contribution = 0
 */
export function calculateSkillMatchScore(
  employeeSkills: EmployeeSkillLevel[],
  requiredSkills: RequiredSkillInput[],
): number {
  if (requiredSkills.length === 0) return 0;

  const totalWeight = requiredSkills.reduce((s, r) => s + r.contributionToScore, 0);
  if (totalWeight === 0) return 0;

  const empById   = new Map(employeeSkills.map((s) => [s.skillId, s]));
  const empByName = new Map(employeeSkills.map((s) => [s.skillName.toUpperCase(), s]));
  let score = 0;

  for (const req of requiredSkills) {
    const weight = req.contributionToScore / totalWeight;
    const emp = resolveEmp(req, empById, empByName);
    if (!emp) continue;

    const empOrdinal = LEVEL_ORDINAL[emp.level] ?? 1;
    const reqOrdinal = LEVEL_ORDINAL[req.level] ?? 1;
    const matchRatio = Math.min(empOrdinal / reqOrdinal, 1.0);
    score += matchRatio * weight * 100;
  }

  return Math.round(score);
}

// ── Score 2 — Progression (0–100) ────────────────────────────────────────────
/**
 * Mesure le potentiel d'apprentissage pendant l'activité.
 *
 * Présent  → progressionContribution(gap) × weight × 1
 * Absent   → bonus acquisition pondéré par le poids du skill :
 *              skill important (weight > 0.3) → 20
 *              skill secondaire               → 30
 *            (absent = moins bien que gap idéal, mais skill secondaire absent
 *             est moins pénalisant qu'un skill clé absent)
 */
export function calculateProgressionScore(
  employeeSkills: EmployeeSkillLevel[],
  requiredSkills: RequiredSkillInput[],
): number {
  if (requiredSkills.length === 0) return 0;

  const totalWeight = requiredSkills.reduce((s, r) => s + r.contributionToScore, 0);
  if (totalWeight === 0) return 0;

  const empById   = new Map(employeeSkills.map((s) => [s.skillId, s]));
  const empByName = new Map(employeeSkills.map((s) => [s.skillName.toUpperCase(), s]));
  let score = 0;

  for (const req of requiredSkills) {
    const weight = req.contributionToScore / totalWeight;
    const emp = resolveEmp(req, empById, empByName);

    if (!emp) {
      // Absent : bonus acquisition inversement proportionnel à l'importance
      const absentBonus = weight > 0.3 ? 20 : 30;
      score += weight * absentBonus;
    } else {
      const empOrdinal = LEVEL_ORDINAL[emp.level] ?? 1;
      const reqOrdinal = LEVEL_ORDINAL[req.level] ?? 1;
      const gap = reqOrdinal - empOrdinal;
      score += weight * progressionContribution(gap);
    }
  }

  return Math.round(score);
}

// ── Score 3 — Context (0–100) ─────────────────────────────────────────────────
/**
 * Score contextuel : fixe par type d'activité + bonus dynamique
 * basé sur le ratio de skills couverts par l'employé.
 *
 * Base :
 *   Expertise     → 75  (profil expert attendu)
 *   Upskilling    → 70  (montée en compétence)
 *   Consolidation → 65  (renforcement)
 *   Autre         → 65
 *
 * Bonus dynamique (+0 à +10) selon la couverture des skills requis :
 *   couverture ≥ 80% → +10
 *   couverture ≥ 60% → +7
 *   couverture ≥ 40% → +4
 *   couverture ≥ 20% → +2
 *   couverture < 20% → +0
 *
 * Score final capé à 100.
 */
export function calculateContextScore(
  activityContext: string,
  employeeSkills: EmployeeSkillLevel[] = [],
  requiredSkills: RequiredSkillInput[] = [],
): number {
  const ctx = (activityContext ?? '').toLowerCase();
  let base = 65;
  if (ctx === 'expertise')     base = 75;
  else if (ctx === 'upskilling')    base = 70;
  else if (ctx === 'consolidation') base = 65;

  // Bonus dynamique si on a les données
  if (requiredSkills.length > 0 && employeeSkills.length > 0) {
    const empById   = new Map(employeeSkills.map((s) => [s.skillId, s]));
    const empByName = new Map(employeeSkills.map((s) => [s.skillName.toUpperCase(), s]));
    const covered = requiredSkills.filter((r) => resolveEmp(r, empById, empByName)).length;
    const ratio = covered / requiredSkills.length;

    let bonus = 0;
    if (ratio >= 0.8)      bonus = 10;
    else if (ratio >= 0.6) bonus = 7;
    else if (ratio >= 0.4) bonus = 4;
    else if (ratio >= 0.2) bonus = 2;

    return Math.min(base + bonus, 100);
  }

  return base;
}

// ── Score final ───────────────────────────────────────────────────────────────
/**
 * Score final pondéré (entier 0–100)
 *
 * total = skillMatch×40% + progression×30% + context×30%
 */
export function calculateFinalScore(
  skillMatch: number,
  progressionScore: number,
  contextScore: number,
  weights = { skillMatch: 0.40, progression: 0.30, context: 0.30 },
): number {
  const raw =
    skillMatch       * weights.skillMatch +
    progressionScore * weights.progression +
    contextScore     * weights.context;
  return Math.round(raw);
}
