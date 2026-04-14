// Types partagés du module Skills
// Utilisés par SkillCard, SkillForm, SkillGrandFormatCard et la vue Skills

// Modèle d'un skill — correspond au document MongoDB retourné par GET /skills
export interface Skill {
  _id: string;
  name: string;
  description?: string;
  departmentId: string;
}

// Options de tri : A→Z, Z→A, ou skills avec description en premier
export type SkillSortBy = 'name-asc' | 'name-desc' | 'desc-first';
