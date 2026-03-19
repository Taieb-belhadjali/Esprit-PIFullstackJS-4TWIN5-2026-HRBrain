export interface Skill {
  _id: string;
  name: string;
  description?: string;
}

export type SkillSortBy = 'name-asc' | 'name-desc' | 'desc-first';
