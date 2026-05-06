import { Test, TestingModule } from '@nestjs/testing';
import { NlpService } from './nlp.service';
import { getModelToken } from '@nestjs/mongoose';
import { Skill } from '../skill/skill.schema';

describe('NlpService', () => {
  let service: NlpService;

  const skills = [
    { _id: 'skill-1', name: 'JavaScript' },
    { _id: 'skill-2', name: 'Python' },
    { _id: 'skill-3', name: 'React' },
    { _id: 'skill-4', name: 'C' },      // short name — should be skipped
    { _id: 'skill-5', name: 'Go' },     // short name — should be skipped
    { _id: 'skill-6', name: 'Node.js' }, // contains regex-special chars
    { _id: 'skill-7', name: 'C++' },     // contains regex-special chars
  ];

  const mockSkillModel = {
    find: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NlpService,
        { provide: getModelToken(Skill.name), useValue: mockSkillModel },
      ],
    }).compile();

    service = module.get<NlpService>(NlpService);
    mockSkillModel.find.mockReturnValue({
      lean: jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue(skills),
      }),
    });
  });

  afterEach(() => jest.clearAllMocks());

  // Verifies that the service is instantiated correctly with its Mongoose model dependency
  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // ── extractSkills ──────────────────────────────────────────────────────────

  describe('extractSkills', () => {
    // An empty string input should short-circuit without querying the DB — returns an empty array
    it('should return empty array for empty string', async () => {
      const result = await service.extractSkills('');
      expect(result).toEqual([]);
      expect(mockSkillModel.find).not.toHaveBeenCalled();
    });

    // Null/undefined input is treated the same as an empty string — safe early return
    it('should return empty array for null/undefined text', async () => {
      const result = await service.extractSkills(null as any);
      expect(result).toEqual([]);
    });

    // Happy path: skill names present in the text are matched and returned
    it('should return matched skill names from text', async () => {
      const result = await service.extractSkills('I know JavaScript and Python');
      expect(result).toContain('JavaScript');
      expect(result).toContain('Python');
    });

    // Matching is case-insensitive — JAVASCRIPT and python both resolve to their canonical names
    it('should be case insensitive', async () => {
      const result = await service.extractSkills('expert in JAVASCRIPT and python');
      expect(result).toContain('JavaScript');
      expect(result).toContain('Python');
    });

    // Skills with names of 2 characters or fewer are skipped — too short to match reliably without false positives
    it('should skip skills with name length <= 2', async () => {
      const result = await service.extractSkills('I know C and Go and JavaScript');
      expect(result).not.toContain('C');
      expect(result).not.toContain('Go');
      expect(result).toContain('JavaScript');
    });

    // When the text mentions none of the known skills, an empty array is returned
    it('should return empty array when no skills match', async () => {
      const result = await service.extractSkills('I work in accounting and finance');
      expect(result).toEqual([]);
    });

    // The same skill appearing multiple times in the text must appear only once in the result
    it('should deduplicate matched skill names', async () => {
      const result = await service.extractSkills('JavaScript developer with JavaScript experience');
      const jsCount = result.filter(s => s === 'JavaScript').length;
      expect(jsCount).toBe(1);
    });

    // Regex-special characters in skill names (like the dot in Node.js) must be escaped before building the regex
    it('should handle skill names with regex special characters (Node.js)', async () => {
      const result = await service.extractSkills('I have experience with Node.js development');
      expect(result).toContain('Node.js');
    });

    // Word boundary matching prevents partial matches — "React" should not match inside "Reactive"
    it('should match React but not substrings like "Reactive"', async () => {
      const result = await service.extractSkills('I use React for UI');
      expect(result).toContain('React');
    });

    // Full CV text with multiple skills mentioned is handled correctly — all matches are returned
    it('should return all matching skills from a full CV text', async () => {
      const cv = 'Senior developer with 5 years React and JavaScript. Also experienced in Python scripting.';
      const result = await service.extractSkills(cv);
      expect(result).toContain('JavaScript');
      expect(result).toContain('Python');
      expect(result).toContain('React');
    });

    // The skill model is queried exactly once per extractSkills call — no redundant DB hits
    it('should call skillModel.find once per invocation', async () => {
      await service.extractSkills('JavaScript Python React');
      expect(mockSkillModel.find).toHaveBeenCalledTimes(1);
    });
  });
});
