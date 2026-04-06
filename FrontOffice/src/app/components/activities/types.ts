export interface RequiredSkill {
  skillId: string | { _id: string; name: string };
  level: string;
  contributionToScore: number;
}

export interface Activity {
  _id: string;
  title: string;
  description?: string;
  type?: string;
  context?: string;
  status: string;
  startDate?: string;
  endDate?: string;
  createdById?: string;
  nombreDePlaces: number;
  targetedDepartmentId?: string;
  requiredSkills: RequiredSkill[];
  createdAt?: string;
  updatedAt?: string;
}
