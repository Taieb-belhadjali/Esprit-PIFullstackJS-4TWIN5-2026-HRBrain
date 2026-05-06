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
    it('should return null when activityId is unknown', () => {
      expect(service.getGenerationStatus('unknown-id')).toBeNull();
    });

    it('should return the status when a generation is tracked', () => {
      const state = { status: 'running' as const, startedAt: new Date(), top_k: 5 };
      (service as any).generationStatus.set('act1', state);
      expect(service.getGenerationStatus('act1')).toEqual(state);
    });

    it('should return done status', () => {
      const state = { status: 'done' as const, startedAt: new Date(), finishedAt: new Date(), top_k: 10 };
      (service as any).generationStatus.set('act2', state);
      expect(service.getGenerationStatus('act2')?.status).toBe('done');
    });
  });

  describe('findByActivity', () => {
    it('should return latest recommendation for an activity', async () => {
      const reco = { activityId: 'act1', jsonOllama: { rankings: [] } };
      mockRecoModel.findOne.mockReturnValue({
        sort: jest.fn().mockReturnValue({ exec: jest.fn().mockResolvedValue(reco) }),
      });
      const result = await service.findByActivity('act1');
      expect(result).toEqual(reco);
      expect(mockRecoModel.findOne).toHaveBeenCalledWith({ activityId: 'act1' });
    });

    it('should return null when no recommendation exists', async () => {
      mockRecoModel.findOne.mockReturnValue({
        sort: jest.fn().mockReturnValue({ exec: jest.fn().mockResolvedValue(null) }),
      });
      expect(await service.findByActivity('nonexistent')).toBeNull();
    });
  });

  describe('findAllByActivity', () => {
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
    it('should return all HR decisions for an activity', async () => {
      const decisions = [{ employeeId: 'emp1', decision: 'approved' }];
      mockDecisionModel.find.mockReturnValue({ lean: jest.fn().mockResolvedValue(decisions) });
      const result = await service.getDecisions('act1');
      expect(result).toEqual(decisions);
      expect(mockDecisionModel.find).toHaveBeenCalledWith({ activityId: 'act1' });
    });

    it('should return empty array when no decisions', async () => {
      mockDecisionModel.find.mockReturnValue({ lean: jest.fn().mockResolvedValue([]) });
      expect(await service.getDecisions('act1')).toEqual([]);
    });
  });

  describe('getApprovedActivitiesForEmployee', () => {
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

    it('should return empty when no approved decisions', async () => {
      mockDecisionModel.find.mockReturnValue({ lean: jest.fn().mockResolvedValue([]) });
      mockActivityModel.find.mockReturnValue({
        populate: jest.fn().mockReturnValue({ lean: jest.fn().mockResolvedValue([]) }),
      });
      const result = await service.getApprovedActivitiesForEmployee('emp1');
      expect(result).toEqual([]);
    });
  });

  describe('extractFirstValidRankingsJson (private)', () => {
    it('should extract JSON from markdown code block', () => {
      const raw = '```json\n{"rankings":[{"employeeId":"1","score":90,"reasons":["Good"]}]}\n```';
      const result = (service as any).extractFirstValidRankingsJson(raw);
      expect(result).not.toBeNull();
      expect(result.rankings).toHaveLength(1);
      expect(result.rankings[0].employeeId).toBe('1');
    });

    it('should extract JSON directly from plain text', () => {
      const raw = 'Here is the result: {"rankings":[{"employeeId":"2","score":75,"reasons":[]}]} end.';
      const result = (service as any).extractFirstValidRankingsJson(raw);
      expect(result.rankings).toHaveLength(1);
    });

    it('should return null when no JSON found', () => {
      expect((service as any).extractFirstValidRankingsJson('no json here')).toBeNull();
    });

    it('should return null for empty rankings array', () => {
      expect((service as any).extractFirstValidRankingsJson('{"rankings":[]}')).toBeNull();
    });

    it('should extract from code block without json tag', () => {
      const raw = '```\n{"rankings":[{"employeeId":"3","score":80,"reasons":["Match"]}]}\n```';
      const result = (service as any).extractFirstValidRankingsJson(raw);
      expect(result?.rankings).toHaveLength(1);
    });
  });
});
