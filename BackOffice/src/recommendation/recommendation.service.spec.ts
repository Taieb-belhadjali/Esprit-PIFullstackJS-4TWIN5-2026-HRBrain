jest.mock('fs', () => ({
  ...jest.requireActual('fs'),
  existsSync: jest.fn().mockReturnValue(false),
  readFileSync: jest.fn().mockReturnValue('prompt template {{top_k}}'),
  appendFileSync: jest.fn(),
  mkdirSync: jest.fn(),
}));

jest.mock('axios');

import { Test, TestingModule } from '@nestjs/testing';
import { RecommendationService } from './recommendation.service';
import { getModelToken } from '@nestjs/mongoose';
import { Recommendation } from './recommendation.schema';
import { HrDecision } from './hr-decision.schema';
import { Activity } from '../activity/activity.schema';
import { User } from '../users/shemas/user.shema';
import { Skill } from '../skill/skill.schema';
import { NotificationService } from '../notification/notification.service';

const mockRecoModel = { findOne: jest.fn(), find: jest.fn(), create: jest.fn() };
const mockDecisionModel = { find: jest.fn(), findOneAndUpdate: jest.fn() };
const mockActivityModel = { findById: jest.fn(), find: jest.fn() };
const mockUserModel = { find: jest.fn(), findByIdAndUpdate: jest.fn() };
const mockSkillModel = { find: jest.fn() };
const mockNotifService = {
  notifyRecommendationReady: jest.fn(),
  notifyEmployeeApproved: jest.fn(),
};

describe('RecommendationService', () => {
  let service: RecommendationService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RecommendationService,
        { provide: getModelToken(Recommendation.name), useValue: mockRecoModel },
        { provide: getModelToken(HrDecision.name),     useValue: mockDecisionModel },
        { provide: getModelToken(Activity.name),       useValue: mockActivityModel },
        { provide: getModelToken(User.name),           useValue: mockUserModel },
        { provide: getModelToken(Skill.name),          useValue: mockSkillModel },
        { provide: NotificationService, useValue: mockNotifService },
      ],
    }).compile();

    service = module.get<RecommendationService>(RecommendationService);
    jest.clearAllMocks();
  });

  describe('getGenerationStatus', () => {
    // Returns null when no generation has been started for the given activityId
    it('should return null when activityId is unknown', () => {
      expect(service.getGenerationStatus('unknown-id')).toBeNull();
    });

    // Returns the full status object when a generation has been registered in the in-memory map
    it('should return the status when a generation is tracked', () => {
      const state = { status: 'running' as const, startedAt: new Date(), top_k: 5 };
      (service as any).generationStatus.set('act1', state);
      expect(service.getGenerationStatus('act1')).toEqual(state);
    });

    // Verifies that the 'done' status is correctly stored and retrieved after a completed generation
    it('should return done status', () => {
      const state = { status: 'done' as const, startedAt: new Date(), finishedAt: new Date(), top_k: 10 };
      (service as any).generationStatus.set('act2', state);
      expect(service.getGenerationStatus('act2')?.status).toBe('done');
    });
  });

  describe('findByActivity', () => {
    // Returns the most recent recommendation document for the given activity
    it('should return latest recommendation for an activity', async () => {
      const reco = { activityId: 'act1', jsonOllama: { rankings: [] } };
      mockRecoModel.findOne.mockReturnValue({
        sort: jest.fn().mockReturnValue({ exec: jest.fn().mockResolvedValue(reco) }),
      });
      const result = await service.findByActivity('act1');
      expect(result).toEqual(reco);
      expect(mockRecoModel.findOne).toHaveBeenCalledWith({ activityId: 'act1' });
    });

    // Returns null when no recommendation exists yet for the activity — not an error
    it('should return null when no recommendation exists', async () => {
      mockRecoModel.findOne.mockReturnValue({
        sort: jest.fn().mockReturnValue({ exec: jest.fn().mockResolvedValue(null) }),
      });
      expect(await service.findByActivity('nonexistent')).toBeNull();
    });
  });

  describe('findAllByActivity', () => {
    // Returns all historical recommendation documents for an activity, sorted by date
    it('should return all recommendations sorted by date', async () => {
      const recos = [{ activityId: 'act1' }, { activityId: 'act1' }];
      mockRecoModel.find.mockReturnValue({
        sort: jest.fn().mockReturnValue({ exec: jest.fn().mockResolvedValue(recos) }),
      });
      const result = await service.findAllByActivity('act1');
      expect(result).toHaveLength(2);
    });
  });

  describe('getDecisions', () => {
    // Returns all HR decisions (approved/rejected) that have been made for an activity
    it('should return all HR decisions for an activity', async () => {
      const decisions = [{ employeeId: 'emp1', decision: 'approved' }];
      mockDecisionModel.find.mockReturnValue({ lean: jest.fn().mockResolvedValue(decisions) });
      const result = await service.getDecisions('act1');
      expect(result).toEqual(decisions);
      expect(mockDecisionModel.find).toHaveBeenCalledWith({ activityId: 'act1' });
    });

    // Empty array is returned when no decisions have been made yet for the activity
    it('should return empty array when no decisions', async () => {
      mockDecisionModel.find.mockReturnValue({ lean: jest.fn().mockResolvedValue([]) });
      expect(await service.getDecisions('act1')).toEqual([]);
    });
  });

  describe('getApprovedActivitiesForEmployee', () => {
    // Returns a list of approved activities enriched with AI score and reasons from the decision record
    it('should return approved activities with AI scores', async () => {
      const decidedAt = new Date();
      const decisions = [{
        employeeId: 'emp1',
        activityId: 'act1',
        decision: 'approved',
        aiScore: 85,
        aiReasons: ['Good skill match'],
        history: [{ decidedAt }],
      }];
      const activities = [{ _id: { toString: () => 'act1' }, title: 'Test', requiredSkills: [] }];
      mockDecisionModel.find.mockReturnValue({ lean: jest.fn().mockResolvedValue(decisions) });
      mockActivityModel.find.mockReturnValue({
        populate: jest.fn().mockReturnValue({ lean: jest.fn().mockResolvedValue(activities) }),
      });
      const result = await service.getApprovedActivitiesForEmployee('emp1');
      expect(result).toHaveLength(1);
      expect(result[0].aiScore).toBe(85);
      expect(result[0].aiReasons).toEqual(['Good skill match']);
    });

    // When the employee has no approved decisions, an empty array is returned
    it('should return empty when no approved decisions', async () => {
      mockDecisionModel.find.mockReturnValue({ lean: jest.fn().mockResolvedValue([]) });
      mockActivityModel.find.mockReturnValue({
        populate: jest.fn().mockReturnValue({ lean: jest.fn().mockResolvedValue([]) }),
      });
      const result = await service.getApprovedActivitiesForEmployee('emp1');
      expect(result).toEqual([]);
    });
  });

  describe('getTop100', () => {
    // A non-existent activityId must throw a clear error before any scoring is attempted
    it('should throw NotFoundException when activity does not exist', async () => {
      mockActivityModel.findById.mockReturnValue({
        populate: jest.fn().mockReturnValue({ exec: jest.fn().mockResolvedValue(null) }),
      });
      await expect(service.getTop100('nonexistent')).rejects.toThrow('Activity nonexistent not found');
    });

    // When no employees are found, the result has an empty candidates list alongside the activity
    it('should return activity and empty candidates when no employees', async () => {
      const activity = { _id: 'act1', title: 'Test', requiredSkills: [], context: '' };
      mockActivityModel.findById.mockReturnValue({
        populate: jest.fn().mockReturnValue({ exec: jest.fn().mockResolvedValue(activity) }),
      });
      mockSkillModel.find.mockReturnValue({ lean: jest.fn().mockResolvedValue([]) });
      mockUserModel.find.mockReturnValue({
        populate: jest.fn().mockReturnValue({ lean: jest.fn().mockResolvedValue([]) }),
      });
      const result = await service.getTop100('act1');
      expect(result.activity).toEqual(activity);
      expect(result.candidates).toHaveLength(0);
    });

    // When an employee has no CV, their skills array is used to build the skill profile for scoring
    it('should score employees without cv using their skills array', async () => {
      const activity = { _id: 'act1', title: 'Test', requiredSkills: [], context: '' };
      const employee = {
        _id: 'emp1',
        name: 'Alice',
        email: 'alice@test.com',
        role: 'EMPLOYEE',
        skills: [{ _id: 'skill1', name: 'React' }],
        cv: null,
      };
      mockActivityModel.findById.mockReturnValue({
        populate: jest.fn().mockReturnValue({ exec: jest.fn().mockResolvedValue(activity) }),
      });
      mockSkillModel.find.mockReturnValue({ lean: jest.fn().mockResolvedValue([{ _id: 'skill1', name: 'React' }]) });
      mockUserModel.find.mockReturnValue({
        populate: jest.fn().mockReturnValue({ lean: jest.fn().mockResolvedValue([employee]) }),
      });
      const result = await service.getTop100('act1');
      expect(result.candidates).toHaveLength(1);
      expect(result.candidates[0].rank).toBe(1);
    });
  });

  describe('saveDecision', () => {
    // A rejected decision is saved without updating employee skills or sending a notification
    it('should save a rejected decision without updating employee skills', async () => {
      const savedDecision = { activityId: 'act1', employeeId: 'emp1', decision: 'rejected' };
      mockDecisionModel.findOneAndUpdate.mockResolvedValue(savedDecision);

      const result = await service.saveDecision('act1', {
        employeeId: 'emp1',
        decision: 'rejected',
        aiScore: 55,
      });

      expect(result).toEqual(savedDecision);
      expect(mockUserModel.findByIdAndUpdate).not.toHaveBeenCalled();
      expect(mockNotifService.notifyEmployeeApproved).not.toHaveBeenCalled();
    });

    // An approved decision updates the employee's skills with the activity's required skills and sends a notification
    it('should save an approved decision and update employee skills', async () => {
      const savedDecision = { activityId: 'act1', employeeId: 'emp1', decision: 'approved' };
      const activity = {
        _id: 'act1',
        title: 'React Training',
        requiredSkills: [{ skillId: { _id: 'skill1', name: 'React' } }],
      };
      mockDecisionModel.findOneAndUpdate.mockResolvedValue(savedDecision);
      mockActivityModel.findById.mockReturnValue({
        populate: jest.fn().mockReturnValue({ lean: jest.fn().mockResolvedValue(activity) }),
      });
      mockUserModel.findByIdAndUpdate.mockResolvedValue({});
      mockNotifService.notifyEmployeeApproved.mockResolvedValue(undefined);

      const result = await service.saveDecision('act1', {
        employeeId: 'emp1',
        decision: 'approved',
        aiScore: 88,
        hrComment: 'Great candidate',
      });

      expect(result).toEqual(savedDecision);
      expect(mockUserModel.findByIdAndUpdate).toHaveBeenCalledWith(
        'emp1',
        expect.objectContaining({ $addToSet: expect.anything() }),
      );
      expect(mockNotifService.notifyEmployeeApproved).toHaveBeenCalledWith('emp1', 'React Training');
    });

    // When the activity is not found during skill update, the decision is still saved — graceful degradation
    it('should not throw when approved but activity not found', async () => {
      const savedDecision = { activityId: 'act1', employeeId: 'emp1', decision: 'approved' };
      mockDecisionModel.findOneAndUpdate.mockResolvedValue(savedDecision);
      mockActivityModel.findById.mockReturnValue({
        populate: jest.fn().mockReturnValue({ lean: jest.fn().mockResolvedValue(null) }),
      });

      const result = await service.saveDecision('act1', { employeeId: 'emp1', decision: 'approved' });
      expect(result).toEqual(savedDecision);
    });
  });

  describe('generateAndSave', () => {
    // When _doGenerate throws, the error status is recorded in the in-memory map and the error is re-thrown
    it('should set generation status to error when _doGenerate throws', async () => {
      jest.spyOn(service as any, '_doGenerate').mockRejectedValue(new Error('Ollama unavailable'));

      await expect(service.generateAndSave('act1')).rejects.toThrow('Ollama unavailable');
      expect(service.getGenerationStatus('act1')?.status).toBe('error');
      expect(service.getGenerationStatus('act1')?.error).toBe('Ollama unavailable');
    });

    // On success, the done status is recorded with the correct top_k and the saved document is returned
    it('should set generation status to done when _doGenerate succeeds', async () => {
      const mockDoc = { activityId: 'act1', jsonOllama: { rankings: [] } };
      jest.spyOn(service as any, '_doGenerate').mockResolvedValue(mockDoc);

      const result = await service.generateAndSave('act1', 5);
      expect(result).toEqual(mockDoc);
      expect(service.getGenerationStatus('act1')?.status).toBe('done');
      expect(service.getGenerationStatus('act1')?.top_k).toBe(5);
    });
  });

  describe('loadPrompt (private)', () => {
    // First call reads the prompt template from disk via fs.readFileSync
    it('should read and cache prompt from disk on first call', () => {
      const result = (service as any).loadPrompt('recommendation');
      expect(result).toBe('prompt template {{top_k}}');
    });

    // Subsequent calls return the cached value without hitting the filesystem again
    it('should return cached value on subsequent calls without re-reading disk', () => {
      const fs = require('fs');
      (service as any).promptCache.set('recommendation', 'cached-template');
      const result = (service as any).loadPrompt('recommendation');
      expect(result).toBe('cached-template');
      expect(fs.readFileSync).not.toHaveBeenCalled();
    });
  });

  describe('generateAll', () => {
    // Results array contains one entry per activity — successes include ranking count, failures include error message
    it('should return results for all activities', async () => {
      const activities = [
        { _id: { toString: () => 'act1' }, title: 'Activity 1' },
        { _id: { toString: () => 'act2' }, title: 'Activity 2' },
      ];
      mockActivityModel.find.mockReturnValue({ lean: jest.fn().mockResolvedValue(activities) });
      jest.spyOn(service, 'generateAndSave')
        .mockResolvedValueOnce({ jsonOllama: { elapsedMs: 100, rankings: [{}] } } as any)
        .mockRejectedValueOnce(new Error('Ollama timeout'));

      const results = await service.generateAll(3);
      expect(results).toHaveLength(2);
      expect(results[0].rankings).toBe(1);
      expect(results[1].error).toBe('Ollama timeout');
    });
  });

  describe('callOllama (private)', () => {
    // Happy path: the LLM response string is extracted from data.response and returned as-is
    it('should return the LLM response string', async () => {
      const axios = require('axios');
      axios.post.mockResolvedValueOnce({ data: { response: '{"rankings":[{"employeeId":"1","score":90,"reasons":[]}]}' } });

      const result = await (service as any).callOllama('test prompt', 'test context', 3);
      expect(result).toBe('{"rankings":[{"employeeId":"1","score":90,"reasons":[]}]}');
      expect(axios.post).toHaveBeenCalledWith(
        expect.stringContaining('/api/generate'),
        expect.objectContaining({ prompt: 'test prompt' }),
        expect.anything(),
      );
    });

    // When the response has no response field (e.g. unexpected Ollama output), an empty string is returned safely
    it('should return empty string when response has no response field', async () => {
      const axios = require('axios');
      axios.post.mockResolvedValueOnce({ data: {} });

      const result = await (service as any).callOllama('prompt', undefined, 5);
      expect(result).toBe('');
    });
  });

  describe('extractFirstValidRankingsJson (private)', () => {
    // Extracts and parses JSON from a markdown ```json ... ``` code block in the LLM output
    it('should extract JSON from markdown code block', () => {
      const raw = '```json\n{"rankings":[{"employeeId":"1","score":90,"reasons":["Good"]}]}\n```';
      const result = (service as any).extractFirstValidRankingsJson(raw);
      expect(result).not.toBeNull();
      expect(result.rankings).toHaveLength(1);
      expect(result.rankings[0].employeeId).toBe('1');
    });

    // Extracts JSON directly when it appears inline without a code block fence
    it('should extract JSON directly from plain text', () => {
      const raw = 'Here is the result: {"rankings":[{"employeeId":"2","score":75,"reasons":[]}]} end.';
      const result = (service as any).extractFirstValidRankingsJson(raw);
      expect(result.rankings).toHaveLength(1);
    });

    // Returns null when the LLM output contains no parseable JSON — caller must handle gracefully
    it('should return null when no JSON found', () => {
      expect((service as any).extractFirstValidRankingsJson('no json here')).toBeNull();
    });

    // Returns null for an empty rankings array — an empty result is not useful for HR decisions
    it('should return null for empty rankings array', () => {
      expect((service as any).extractFirstValidRankingsJson('{"rankings":[]}')).toBeNull();
    });

    // Extracts JSON from a code block without the 'json' language tag
    it('should extract from code block without json tag', () => {
      const raw = '```\n{"rankings":[{"employeeId":"3","score":80,"reasons":["Match"]}]}\n```';
      const result = (service as any).extractFirstValidRankingsJson(raw);
      expect(result?.rankings).toHaveLength(1);
    });
  });
});
