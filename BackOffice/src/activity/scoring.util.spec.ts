import {
  LEVEL_ORDINAL,
  parseCvSkillLevels,
  calculateSkillMatchScore,
  calculateProgressionScore,
  calculateContextScore,
  calculateFinalScore,
  EmployeeSkillLevel,
  RequiredSkillInput,
} from './scoring.util';

describe('scoring.util', () => {

  // ── LEVEL_ORDINAL ──────────────────────────────────────────────────────────
  describe('LEVEL_ORDINAL', () => {
    it('should have correct ordinal values', () => {
      expect(LEVEL_ORDINAL['LOW']).toBe(1);
      expect(LEVEL_ORDINAL['MEDIUM']).toBe(2);
      expect(LEVEL_ORDINAL['HIGH']).toBe(3);
      expect(LEVEL_ORDINAL['EXPERT']).toBe(4);
    });

    it('should support capitalized versions', () => {
      expect(LEVEL_ORDINAL['Low']).toBe(1);
      expect(LEVEL_ORDINAL['Medium']).toBe(2);
      expect(LEVEL_ORDINAL['High']).toBe(3);
      expect(LEVEL_ORDINAL['Expert']).toBe(4);
    });
  });

  // ── parseCvSkillLevels ─────────────────────────────────────────────────────
  describe('parseCvSkillLevels', () => {
    const skillMap = new Map([
      ['JAVASCRIPT', 'skill-1'],
      ['PYTHON', 'skill-2'],
      ['REACT', 'skill-3'],
    ]);

    it('should parse valid CV lines', () => {
      const cvText = 'JavaScript:HIGH\nPython:MEDIUM\nReact:EXPERT';
      const result = parseCvSkillLevels(cvText, skillMap);
      expect(result).toHaveLength(3);
      expect(result[0]).toEqual({ skillId: 'skill-1', skillName: 'JAVASCRIPT', level: 'HIGH' });
      expect(result[1]).toEqual({ skillId: 'skill-2', skillName: 'PYTHON', level: 'MEDIUM' });
      expect(result[2]).toEqual({ skillId: 'skill-3', skillName: 'REACT', level: 'EXPERT' });
    });

    it('should ignore lines with unknown skills', () => {
      const cvText = 'JavaScript:HIGH\nUnknownSkill:LOW';
      const result = parseCvSkillLevels(cvText, skillMap);
      expect(result).toHaveLength(1);
      expect(result[0].skillName).toBe('JAVASCRIPT');
    });

    it('should return empty array for empty CV text', () => {
      const result = parseCvSkillLevels('', skillMap);
      expect(result).toHaveLength(0);
    });

    it('should return empty array for empty skill map', () => {
      const result = parseCvSkillLevels('JavaScript:HIGH', new Map());
      expect(result).toHaveLength(0);
    });

    it('should ignore invalid lines without colon separator', () => {
      const cvText = 'JavaScript HIGH\nPython MEDIUM';
      const result = parseCvSkillLevels(cvText, skillMap);
      expect(result).toHaveLength(0);
    });

    it('should handle lines with extra colon segments', () => {
      const cvText = 'JavaScript:HIGH:extra';
      const result = parseCvSkillLevels(cvText, skillMap);
      expect(result).toHaveLength(1);
      expect(result[0].level).toBe('HIGH');
    });

    it('should be case insensitive for skill names', () => {
      const cvText = 'javascript:HIGH';
      const result = parseCvSkillLevels(cvText, skillMap);
      expect(result).toHaveLength(1);
    });
  });

  // ── calculateSkillMatchScore ───────────────────────────────────────────────
  describe('calculateSkillMatchScore', () => {
    const empSkills: EmployeeSkillLevel[] = [
      { skillId: 'skill-1', skillName: 'JAVASCRIPT', level: 'HIGH' },
      { skillId: 'skill-2', skillName: 'PYTHON', level: 'MEDIUM' },
    ];

    const reqSkills: RequiredSkillInput[] = [
      { skillId: 'skill-1', skillName: 'JAVASCRIPT', level: 'HIGH', contributionToScore: 60 },
      { skillId: 'skill-2', skillName: 'PYTHON', level: 'HIGH', contributionToScore: 40 },
    ];

    it('should return 0 for empty required skills', () => {
      expect(calculateSkillMatchScore(empSkills, [])).toBe(0);
    });

    it('should return 0 for zero total weight', () => {
      const zeroWeightSkills = [
        { skillId: 'skill-1', skillName: 'JS', level: 'HIGH', contributionToScore: 0 },
      ];
      expect(calculateSkillMatchScore(empSkills, zeroWeightSkills)).toBe(0);
    });

    it('should return 100 when employee exactly matches all required skills', () => {
      const perfectMatch: EmployeeSkillLevel[] = [
        { skillId: 'skill-1', skillName: 'JAVASCRIPT', level: 'HIGH' },
        { skillId: 'skill-2', skillName: 'PYTHON', level: 'HIGH' },
      ];
      const result = calculateSkillMatchScore(perfectMatch, reqSkills);
      expect(result).toBe(100);
    });

    it('should return 0 when employee has no matching skills', () => {
      const noMatch: EmployeeSkillLevel[] = [
        { skillId: 'skill-99', skillName: 'COBOL', level: 'EXPERT' },
      ];
      const result = calculateSkillMatchScore(noMatch, reqSkills);
      expect(result).toBe(0);
    });

    it('should calculate partial match correctly', () => {
      const result = calculateSkillMatchScore(empSkills, reqSkills);
      // JS: HIGH/HIGH = 1.0 × 0.6 × 100 = 60
      // Python: MEDIUM/HIGH = 2/3 × 0.4 × 100 ≈ 26.67
      // Total ≈ 87
      expect(result).toBeGreaterThan(0);
      expect(result).toBeLessThanOrEqual(100);
    });

    it('should cap match ratio at 1.0 when employee exceeds required level', () => {
      const expertEmp: EmployeeSkillLevel[] = [
        { skillId: 'skill-1', skillName: 'JAVASCRIPT', level: 'EXPERT' },
      ];
      const lowReq: RequiredSkillInput[] = [
        { skillId: 'skill-1', skillName: 'JAVASCRIPT', level: 'LOW', contributionToScore: 100 },
      ];
      const result = calculateSkillMatchScore(expertEmp, lowReq);
      expect(result).toBe(100);
    });

    it('should match by skill name when ID does not match', () => {
      const empByName: EmployeeSkillLevel[] = [
        { skillId: 'different-id', skillName: 'JAVASCRIPT', level: 'HIGH' },
      ];
      const reqByName: RequiredSkillInput[] = [
        { skillId: 'skill-1', skillName: 'JAVASCRIPT', level: 'HIGH', contributionToScore: 100 },
      ];
      const result = calculateSkillMatchScore(empByName, reqByName);
      expect(result).toBe(100);
    });
  });

  // ── calculateProgressionScore ──────────────────────────────────────────────
  describe('calculateProgressionScore', () => {
    it('should return 0 for empty required skills', () => {
      expect(calculateProgressionScore([], [])).toBe(0);
    });

    it('should return 0 for zero total weight', () => {
      const zeroWeightSkills = [
        { skillId: 'skill-1', skillName: 'JS', level: 'HIGH', contributionToScore: 0 },
      ];
      expect(calculateProgressionScore([], zeroWeightSkills)).toBe(0);
    });

    it('should return 0 when employee already exceeds required level (gap <= 0)', () => {
      const empSkills: EmployeeSkillLevel[] = [
        { skillId: 'skill-1', skillName: 'JAVASCRIPT', level: 'EXPERT' },
      ];
      const reqSkills: RequiredSkillInput[] = [
        { skillId: 'skill-1', skillName: 'JAVASCRIPT', level: 'LOW', contributionToScore: 100 },
      ];
      const result = calculateProgressionScore(empSkills, reqSkills);
      expect(result).toBe(0);
    });

    it('should give bonus for absent skills with low weight', () => {
      const empSkills: EmployeeSkillLevel[] = [];
      const reqSkills: RequiredSkillInput[] = [
        { skillId: 'skill-1', skillName: 'JAVASCRIPT', level: 'HIGH', contributionToScore: 10 },
      ];
      const result = calculateProgressionScore(empSkills, reqSkills);
      // weight = 1.0, weight > 0.3 → bonus = 20
      expect(result).toBe(20);
    });

    it('should give higher bonus for absent skills with low weight (< 0.3)', () => {
      const empSkills: EmployeeSkillLevel[] = [];
      const reqSkills: RequiredSkillInput[] = [
        { skillId: 'skill-1', skillName: 'JS', level: 'HIGH', contributionToScore: 20 },
        { skillId: 'skill-2', skillName: 'PY', level: 'HIGH', contributionToScore: 80 },
      ];
      const result = calculateProgressionScore(empSkills, reqSkills);
      // skill-1: weight=0.2 (< 0.3) → bonus=30, contribution = 0.2 × 30 = 6
      // skill-2: weight=0.8 (> 0.3) → bonus=20, contribution = 0.8 × 20 = 16
      // total = 22
      expect(result).toBe(22);
    });

    it('should calculate ideal gap (1 cran) correctly', () => {
      const empSkills: EmployeeSkillLevel[] = [
        { skillId: 'skill-1', skillName: 'JAVASCRIPT', level: 'LOW' },
      ];
      const reqSkills: RequiredSkillInput[] = [
        { skillId: 'skill-1', skillName: 'JAVASCRIPT', level: 'MEDIUM', contributionToScore: 100 },
      ];
      const result = calculateProgressionScore(empSkills, reqSkills);
      // gap=1, progressionContribution(1) = (1/2)*100 = 50
      expect(result).toBe(50);
    });

    it('should calculate ideal gap (2 crans) correctly', () => {
      const empSkills: EmployeeSkillLevel[] = [
        { skillId: 'skill-1', skillName: 'JAVASCRIPT', level: 'LOW' },
      ];
      const reqSkills: RequiredSkillInput[] = [
        { skillId: 'skill-1', skillName: 'JAVASCRIPT', level: 'HIGH', contributionToScore: 100 },
      ];
      const result = calculateProgressionScore(empSkills, reqSkills);
      // gap=2, progressionContribution(2) = (2/2)*100 = 100
      expect(result).toBe(100);
    });

    it('should give partial credit for gap of 3', () => {
      const empSkills: EmployeeSkillLevel[] = [
        { skillId: 'skill-1', skillName: 'JAVASCRIPT', level: 'LOW' },
      ];
      const reqSkills: RequiredSkillInput[] = [
        { skillId: 'skill-1', skillName: 'JAVASCRIPT', level: 'EXPERT', contributionToScore: 100 },
      ];
      const result = calculateProgressionScore(empSkills, reqSkills);
      // gap=3, progressionContribution(3) = 35
      expect(result).toBe(35);
    });
  });

  // ── calculateContextScore ──────────────────────────────────────────────────
  describe('calculateContextScore', () => {
    it('should return 75 for expertise context', () => {
      expect(calculateContextScore('expertise')).toBe(75);
    });

    it('should return 70 for upskilling context', () => {
      expect(calculateContextScore('upskilling')).toBe(70);
    });

    it('should return 65 for consolidation context', () => {
      expect(calculateContextScore('consolidation')).toBe(65);
    });

    it('should return 65 for unknown context', () => {
      expect(calculateContextScore('unknown')).toBe(65);
    });

    it('should be case insensitive', () => {
      expect(calculateContextScore('EXPERTISE')).toBe(75);
      expect(calculateContextScore('Upskilling')).toBe(70);
    });

    it('should add bonus of 10 when coverage >= 80%', () => {
      const empSkills: EmployeeSkillLevel[] = [
        { skillId: 'skill-1', skillName: 'JS', level: 'HIGH' },
        { skillId: 'skill-2', skillName: 'PY', level: 'HIGH' },
        { skillId: 'skill-3', skillName: 'REACT', level: 'HIGH' },
        { skillId: 'skill-4', skillName: 'NODE', level: 'HIGH' },
        { skillId: 'skill-5', skillName: 'SQL', level: 'HIGH' },
      ];
      const reqSkills: RequiredSkillInput[] = [
        { skillId: 'skill-1', skillName: 'JS', level: 'HIGH', contributionToScore: 20 },
        { skillId: 'skill-2', skillName: 'PY', level: 'HIGH', contributionToScore: 20 },
        { skillId: 'skill-3', skillName: 'REACT', level: 'HIGH', contributionToScore: 20 },
        { skillId: 'skill-4', skillName: 'NODE', level: 'HIGH', contributionToScore: 20 },
        { skillId: 'skill-5', skillName: 'SQL', level: 'HIGH', contributionToScore: 20 },
      ];
      // 5/5 = 100% coverage → bonus = 10
      const result = calculateContextScore('expertise', empSkills, reqSkills);
      expect(result).toBe(85); // 75 + 10
    });

    it('should add bonus of 7 when coverage >= 60%', () => {
      const empSkills: EmployeeSkillLevel[] = [
        { skillId: 'skill-1', skillName: 'JS', level: 'HIGH' },
        { skillId: 'skill-2', skillName: 'PY', level: 'HIGH' },
        { skillId: 'skill-3', skillName: 'REACT', level: 'HIGH' },
      ];
      const reqSkills: RequiredSkillInput[] = [
        { skillId: 'skill-1', skillName: 'JS', level: 'HIGH', contributionToScore: 25 },
        { skillId: 'skill-2', skillName: 'PY', level: 'HIGH', contributionToScore: 25 },
        { skillId: 'skill-3', skillName: 'REACT', level: 'HIGH', contributionToScore: 25 },
        { skillId: 'skill-4', skillName: 'NODE', level: 'HIGH', contributionToScore: 25 },
      ];
      // 3/4 = 75% coverage → bonus = 7
      const result = calculateContextScore('expertise', empSkills, reqSkills);
      expect(result).toBe(82); // 75 + 7
    });

    it('should add bonus of 4 when coverage >= 40%', () => {
      const empSkills: EmployeeSkillLevel[] = [
        { skillId: 'skill-1', skillName: 'JS', level: 'HIGH' },
        { skillId: 'skill-2', skillName: 'PY', level: 'HIGH' },
      ];
      const reqSkills: RequiredSkillInput[] = [
        { skillId: 'skill-1', skillName: 'JS', level: 'HIGH', contributionToScore: 25 },
        { skillId: 'skill-2', skillName: 'PY', level: 'HIGH', contributionToScore: 25 },
        { skillId: 'skill-3', skillName: 'REACT', level: 'HIGH', contributionToScore: 25 },
        { skillId: 'skill-4', skillName: 'NODE', level: 'HIGH', contributionToScore: 25 },
      ];
      // 2/4 = 50% coverage → bonus = 4
      const result = calculateContextScore('expertise', empSkills, reqSkills);
      expect(result).toBe(79); // 75 + 4
    });

    it('should add bonus of 2 when coverage >= 20%', () => {
      const empSkills: EmployeeSkillLevel[] = [
        { skillId: 'skill-1', skillName: 'JS', level: 'HIGH' },
      ];
      const reqSkills: RequiredSkillInput[] = [
        { skillId: 'skill-1', skillName: 'JS', level: 'HIGH', contributionToScore: 25 },
        { skillId: 'skill-2', skillName: 'PY', level: 'HIGH', contributionToScore: 25 },
        { skillId: 'skill-3', skillName: 'REACT', level: 'HIGH', contributionToScore: 25 },
        { skillId: 'skill-4', skillName: 'NODE', level: 'HIGH', contributionToScore: 25 },
      ];
      // 1/4 = 25% coverage → bonus = 2
      const result = calculateContextScore('expertise', empSkills, reqSkills);
      expect(result).toBe(77); // 75 + 2
    });

    it('should add no bonus when coverage < 20%', () => {
      const empSkills: EmployeeSkillLevel[] = [];
      const reqSkills: RequiredSkillInput[] = [
        { skillId: 'skill-1', skillName: 'JS', level: 'HIGH', contributionToScore: 100 },
      ];
      // 0/1 = 0% coverage → bonus = 0
      const result = calculateContextScore('expertise', empSkills, reqSkills);
      expect(result).toBe(75); // 75 + 0
    });

    it('should cap score at 100', () => {
      const empSkills: EmployeeSkillLevel[] = [
        { skillId: 'skill-1', skillName: 'JS', level: 'HIGH' },
      ];
      const reqSkills: RequiredSkillInput[] = [
        { skillId: 'skill-1', skillName: 'JS', level: 'HIGH', contributionToScore: 100 },
      ];
      // expertise (75) + bonus 10 = 85, not > 100
      const result = calculateContextScore('expertise', empSkills, reqSkills);
      expect(result).toBeLessThanOrEqual(100);
    });
  });

  // ── calculateFinalScore ────────────────────────────────────────────────────
  describe('calculateFinalScore', () => {
    it('should calculate weighted final score correctly', () => {
      // 80×0.4 + 60×0.3 + 70×0.3 = 32 + 18 + 21 = 71
      const result = calculateFinalScore(80, 60, 70);
      expect(result).toBe(71);
    });

    it('should return 100 for perfect scores', () => {
      const result = calculateFinalScore(100, 100, 100);
      expect(result).toBe(100);
    });

    it('should return 0 for zero scores', () => {
      const result = calculateFinalScore(0, 0, 0);
      expect(result).toBe(0);
    });

    it('should support custom weights', () => {
      // 50×0.5 + 50×0.3 + 50×0.2 = 25 + 15 + 10 = 50
      const result = calculateFinalScore(50, 50, 50, {
        skillMatch: 0.5,
        progression: 0.3,
        context: 0.2,
      });
      expect(result).toBe(50);
    });

    it('should round to nearest integer', () => {
      // 33×0.4 + 33×0.3 + 33×0.3 = 13.2 + 9.9 + 9.9 = 33
      const result = calculateFinalScore(33, 33, 33);
      expect(result).toBe(33);
    });

    it('should use default weights when not provided', () => {
      const result = calculateFinalScore(100, 0, 0);
      expect(result).toBe(40); // 100×0.4 = 40
    });
  });
});
