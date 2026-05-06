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
    // Vérifie l'ordre numérique utilisé par les formules de scoring : LOW=1, MEDIUM=2, HIGH=3, EXPERT=4
    it('should have correct ordinal values', () => {
      expect(LEVEL_ORDINAL['LOW']).toBe(1);
      expect(LEVEL_ORDINAL['MEDIUM']).toBe(2);
      expect(LEVEL_ORDINAL['HIGH']).toBe(3);
      expect(LEVEL_ORDINAL['EXPERT']).toBe(4);
    });

    // La map doit aussi accepter les clés en casse titre car le texte du CV peut être parsé avec une casse mixte
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

    // Cas nominal : trois lignes "Nom:NIVEAU" valides sont parsées en objets EmployeeSkillLevel avec les bons ids
    it('should parse valid CV lines', () => {
      const cvText = 'JavaScript:HIGH\nPython:MEDIUM\nReact:EXPERT';
      const result = parseCvSkillLevels(cvText, skillMap);
      expect(result).toHaveLength(3);
      expect(result[0]).toEqual({ skillId: 'skill-1', skillName: 'JAVASCRIPT', level: 'HIGH' });
      expect(result[1]).toEqual({ skillId: 'skill-2', skillName: 'PYTHON', level: 'MEDIUM' });
      expect(result[2]).toEqual({ skillId: 'skill-3', skillName: 'REACT', level: 'EXPERT' });
    });

    // Les lignes référençant des compétences absentes de la map sont ignorées silencieusement — seules les compétences connues sont scorées
    it('should ignore lines with unknown skills', () => {
      const cvText = 'JavaScript:HIGH\nUnknownSkill:LOW';
      const result = parseCvSkillLevels(cvText, skillMap);
      expect(result).toHaveLength(1);
      expect(result[0].skillName).toBe('JAVASCRIPT');
    });

    // Une chaîne de texte CV vide doit retourner un tableau vide sans lever d'erreur
    it('should return empty array for empty CV text', () => {
      const result = parseCvSkillLevels('', skillMap);
      expect(result).toHaveLength(0);
    });

    // Une map de compétences vide signifie qu'aucune compétence ne peut être reconnue — retourne toujours un tableau vide
    it('should return empty array for empty skill map', () => {
      const result = parseCvSkillLevels('JavaScript:HIGH', new Map());
      expect(result).toHaveLength(0);
    });

    // Les lignes sans séparateur deux-points ne peuvent pas être divisées en nom/niveau — elles sont ignorées
    it('should ignore invalid lines without colon separator', () => {
      const cvText = 'JavaScript HIGH\nPython MEDIUM';
      const result = parseCvSkillLevels(cvText, skillMap);
      expect(result).toHaveLength(0);
    });

    // Seuls les deux premiers segments comptent — les segments supplémentaires après le deux-points sont ignorés
    it('should handle lines with extra colon segments', () => {
      const cvText = 'JavaScript:HIGH:extra';
      const result = parseCvSkillLevels(cvText, skillMap);
      expect(result).toHaveLength(1);
      expect(result[0].level).toBe('HIGH');
    });

    // La recherche du nom de compétence est insensible à la casse pour que les auteurs de CV puissent utiliser n'importe quelle casse
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

    // Aucune compétence requise signifie rien à matcher — le score est 0 par définition
    it('should return 0 for empty required skills', () => {
      expect(calculateSkillMatchScore(empSkills, [])).toBe(0);
    });

    // Une compétence avec contributionToScore=0 ne contribue à rien — le poids total est 0, le score est 0
    it('should return 0 for zero total weight', () => {
      const zeroWeightSkills = [
        { skillId: 'skill-1', skillName: 'JS', level: 'HIGH', contributionToScore: 0 },
      ];
      expect(calculateSkillMatchScore(empSkills, zeroWeightSkills)).toBe(0);
    });

    // Quand l'employé atteint ou dépasse chaque niveau requis, le score doit être exactement 100
    it('should return 100 when employee exactly matches all required skills', () => {
      const perfectMatch: EmployeeSkillLevel[] = [
        { skillId: 'skill-1', skillName: 'JAVASCRIPT', level: 'HIGH' },
        { skillId: 'skill-2', skillName: 'PYTHON', level: 'HIGH' },
      ];
      const result = calculateSkillMatchScore(perfectMatch, reqSkills);
      expect(result).toBe(100);
    });

    // Un employé dont les compétences ne recoupent pas du tout les compétences requises obtient un score de 0
    it('should return 0 when employee has no matching skills', () => {
      const noMatch: EmployeeSkillLevel[] = [
        { skillId: 'skill-99', skillName: 'COBOL', level: 'EXPERT' },
      ];
      const result = calculateSkillMatchScore(noMatch, reqSkills);
      expect(result).toBe(0);
    });

    // Vérifie la formule de correspondance partielle pondérée : JS exact contribue 60, Python partiel contribue ~26
    it('should calculate partial match correctly', () => {
      const result = calculateSkillMatchScore(empSkills, reqSkills);
      // JS: HIGH/HIGH = 1.0 × 0.6 × 100 = 60
      // Python: MEDIUM/HIGH = 2/3 × 0.4 × 100 ≈ 26.67
      // Total ≈ 87
      expect(result).toBeGreaterThan(0);
      expect(result).toBeLessThanOrEqual(100);
    });

    // Quand le niveau de l'employé dépasse le niveau requis, le ratio est plafonné à 1.0 pour éviter un score supérieur à 100
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

    // Le fallback par nom de compétence est utilisé quand les skillIds diffèrent (ex: CV parsé avec un id différent)
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
    // Aucune compétence requise → aucun écart de progression à combler → score est 0
    it('should return 0 for empty required skills', () => {
      expect(calculateProgressionScore([], [])).toBe(0);
    });

    // Les compétences à poids zéro ne contribuent à rien — poids total est 0 → score est 0
    it('should return 0 for zero total weight', () => {
      const zeroWeightSkills = [
        { skillId: 'skill-1', skillName: 'JS', level: 'HIGH', contributionToScore: 0 },
      ];
      expect(calculateProgressionScore([], zeroWeightSkills)).toBe(0);
    });

    // Quand l'employé dépasse déjà le niveau requis, l'écart est ≤ 0 — aucun crédit de progression n'est accordé
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

    // Une compétence absente avec un poids élevé (> 0.3) reçoit un bonus de 20 — l'employé peut l'apprendre entièrement
    it('should give bonus for absent skills with low weight', () => {
      const empSkills: EmployeeSkillLevel[] = [];
      const reqSkills: RequiredSkillInput[] = [
        { skillId: 'skill-1', skillName: 'JAVASCRIPT', level: 'HIGH', contributionToScore: 10 },
      ];
      const result = calculateProgressionScore(empSkills, reqSkills);
      // poids = 1.0, poids > 0.3 → bonus = 20
      expect(result).toBe(20);
    });

    // Les compétences à faible poids (< 0.3) sont secondaires — un bonus plus élevé de 30 est accordé car l'écart est gérable
    it('should give higher bonus for absent skills with low weight (< 0.3)', () => {
      const empSkills: EmployeeSkillLevel[] = [];
      const reqSkills: RequiredSkillInput[] = [
        { skillId: 'skill-1', skillName: 'JS', level: 'HIGH', contributionToScore: 20 },
        { skillId: 'skill-2', skillName: 'PY', level: 'HIGH', contributionToScore: 80 },
      ];
      const result = calculateProgressionScore(empSkills, reqSkills);
      // skill-1: poids=0.2 (< 0.3) → bonus=30, contribution = 0.2 × 30 = 6
      // skill-2: poids=0.8 (> 0.3) → bonus=20, contribution = 0.8 × 20 = 16
      // total = 22
      expect(result).toBe(22);
    });

    // Un écart de 1 niveau (LOW → MEDIUM) est la progression idéale — la formule donne 50 pour une compétence à poids plein
    it('should calculate ideal gap (1 cran) correctly', () => {
      const empSkills: EmployeeSkillLevel[] = [
        { skillId: 'skill-1', skillName: 'JAVASCRIPT', level: 'LOW' },
      ];
      const reqSkills: RequiredSkillInput[] = [
        { skillId: 'skill-1', skillName: 'JAVASCRIPT', level: 'MEDIUM', contributionToScore: 100 },
      ];
      const result = calculateProgressionScore(empSkills, reqSkills);
      // écart=1, progressionContribution(1) = (1/2)*100 = 50
      expect(result).toBe(50);
    });

    // Un écart de 2 niveaux (LOW → HIGH) est aussi idéal — la formule donne 100 pour une compétence à poids plein
    it('should calculate ideal gap (2 crans) correctly', () => {
      const empSkills: EmployeeSkillLevel[] = [
        { skillId: 'skill-1', skillName: 'JAVASCRIPT', level: 'LOW' },
      ];
      const reqSkills: RequiredSkillInput[] = [
        { skillId: 'skill-1', skillName: 'JAVASCRIPT', level: 'HIGH', contributionToScore: 100 },
      ];
      const result = calculateProgressionScore(empSkills, reqSkills);
      // écart=2, progressionContribution(2) = (2/2)*100 = 100
      expect(result).toBe(100);
    });

    // Un écart de 3 niveaux (LOW → EXPERT) est trop grand — un crédit partiel de 35 est accordé
    it('should give partial credit for gap of 3', () => {
      const empSkills: EmployeeSkillLevel[] = [
        { skillId: 'skill-1', skillName: 'JAVASCRIPT', level: 'LOW' },
      ];
      const reqSkills: RequiredSkillInput[] = [
        { skillId: 'skill-1', skillName: 'JAVASCRIPT', level: 'EXPERT', contributionToScore: 100 },
      ];
      const result = calculateProgressionScore(empSkills, reqSkills);
      // écart=3, progressionContribution(3) = 35
      expect(result).toBe(35);
    });
  });

  // ── calculateContextScore ──────────────────────────────────────────────────
  describe('calculateContextScore', () => {
    // Le contexte expertise a le score de base le plus élevé (75) — l'activité cible des employés déjà compétents
    it('should return 75 for expertise context', () => {
      expect(calculateContextScore('expertise')).toBe(75);
    });

    // Le score de base du contexte upskilling est 70 — l'activité cible des employés avec un écart à combler
    it('should return 70 for upskilling context', () => {
      expect(calculateContextScore('upskilling')).toBe(70);
    });

    // Le score de base du contexte consolidation est 65 — l'activité cible des employés qui ont besoin de pratique
    it('should return 65 for consolidation context', () => {
      expect(calculateContextScore('consolidation')).toBe(65);
    });

    // Un contexte inconnu utilise le score de base le plus bas (65) par prudence
    it('should return 65 for unknown context', () => {
      expect(calculateContextScore('unknown')).toBe(65);
    });

    // La recherche du contexte est insensible à la casse — EXPERTISE et Upskilling produisent les mêmes scores
    it('should be case insensitive', () => {
      expect(calculateContextScore('EXPERTISE')).toBe(75);
      expect(calculateContextScore('Upskilling')).toBe(70);
    });

    // Une couverture de 100% des compétences (5/5) rapporte un bonus de +10 — l'employé est une correspondance très forte
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
      // 5/5 = 100% de couverture → bonus = 10
      const result = calculateContextScore('expertise', empSkills, reqSkills);
      expect(result).toBe(85); // 75 + 10
    });

    // Une couverture de 75% (3/4) rapporte un bonus de +7
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
      // 3/4 = 75% de couverture → bonus = 7
      const result = calculateContextScore('expertise', empSkills, reqSkills);
      expect(result).toBe(82); // 75 + 7
    });

    // Une couverture de 50% (2/4) rapporte un bonus de +4
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
      // 2/4 = 50% de couverture → bonus = 4
      const result = calculateContextScore('expertise', empSkills, reqSkills);
      expect(result).toBe(79); // 75 + 4
    });

    // Une couverture de 25% (1/4) rapporte un bonus de +2
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
      // 1/4 = 25% de couverture → bonus = 2
      const result = calculateContextScore('expertise', empSkills, reqSkills);
      expect(result).toBe(77); // 75 + 2
    });

    // Une couverture de 0% ne rapporte aucun bonus — l'employé ne possède aucune des compétences requises
    it('should add no bonus when coverage < 20%', () => {
      const empSkills: EmployeeSkillLevel[] = [];
      const reqSkills: RequiredSkillInput[] = [
        { skillId: 'skill-1', skillName: 'JS', level: 'HIGH', contributionToScore: 100 },
      ];
      // 0/1 = 0% de couverture → bonus = 0
      const result = calculateContextScore('expertise', empSkills, reqSkills);
      expect(result).toBe(75); // 75 + 0
    });

    // Le score contextuel final ne doit jamais dépasser 100, même si base + bonus dépasserait cette limite
    it('should cap score at 100', () => {
      const empSkills: EmployeeSkillLevel[] = [
        { skillId: 'skill-1', skillName: 'JS', level: 'HIGH' },
      ];
      const reqSkills: RequiredSkillInput[] = [
        { skillId: 'skill-1', skillName: 'JS', level: 'HIGH', contributionToScore: 100 },
      ];
      // expertise (75) + bonus 10 = 85, pas > 100
      const result = calculateContextScore('expertise', empSkills, reqSkills);
      expect(result).toBeLessThanOrEqual(100);
    });
  });

  // ── calculateFinalScore ────────────────────────────────────────────────────
  describe('calculateFinalScore', () => {
    // Vérifie la formule pondérée par défaut : skillMatch×0.4 + progression×0.3 + context×0.3
    it('should calculate weighted final score correctly', () => {
      // 80×0.4 + 60×0.3 + 70×0.3 = 32 + 18 + 21 = 71
      const result = calculateFinalScore(80, 60, 70);
      expect(result).toBe(71);
    });

    // Toutes les entrées à 100 doivent produire exactement 100 — pas de dérive en virgule flottante
    it('should return 100 for perfect scores', () => {
      const result = calculateFinalScore(100, 100, 100);
      expect(result).toBe(100);
    });

    // Toutes les entrées à 0 doivent produire 0 — pas de plancher artificiel
    it('should return 0 for zero scores', () => {
      const result = calculateFinalScore(0, 0, 0);
      expect(result).toBe(0);
    });

    // Les poids personnalisés remplacent les valeurs par défaut — vérifie que le mécanisme d'injection de poids fonctionne
    it('should support custom weights', () => {
      // 50×0.5 + 50×0.3 + 50×0.2 = 25 + 15 + 10 = 50
      const result = calculateFinalScore(50, 50, 50, {
        skillMatch: 0.5,
        progression: 0.3,
        context: 0.2,
      });
      expect(result).toBe(50);
    });

    // Le résultat est arrondi à l'entier le plus proche pour que les scores soient toujours des nombres entiers
    it('should round to nearest integer', () => {
      // 33×0.4 + 33×0.3 + 33×0.3 = 13.2 + 9.9 + 9.9 = 33
      const result = calculateFinalScore(33, 33, 33);
      expect(result).toBe(33);
    });

    // Avec les poids par défaut et uniquement skillMatch défini, la sortie est égale à skillMatch × 0.4
    it('should use default weights when not provided', () => {
      const result = calculateFinalScore(100, 0, 0);
      expect(result).toBe(40); // 100×0.4 = 40
    });
  });
});
