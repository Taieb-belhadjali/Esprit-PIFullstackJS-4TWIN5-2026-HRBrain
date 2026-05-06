import { Test, TestingModule } from '@nestjs/testing';
import { RecommendationController } from './recommendation.controller';
import { RecommendationService } from './recommendation.service';

describe('RecommendationController', () => {
  let controller: RecommendationController;
  let service: RecommendationService;

  const mockRecommendation = {
    _id: '507f1f77bcf86cd799439011',
    activityId: '507f1f77bcf86cd799439012',
    rankings: [],
  };

  const mockRecoService = {
    generateAndSave: jest.fn(),
    generateAll: jest.fn(),
    saveDecision: jest.fn(),
    getDecisions: jest.fn(),
    findByActivity: jest.fn(),
    findAllByActivity: jest.fn(),
    getTop100: jest.fn(),
    getStatus: jest.fn(),
    getGenerationStatus: jest.fn(),
    getApprovedActivitiesForEmployee: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [RecommendationController],
      providers: [{ provide: RecommendationService, useValue: mockRecoService }],
    }).compile();

    controller = module.get<RecommendationController>(RecommendationController);
    service = module.get<RecommendationService>(RecommendationService);
    jest.clearAllMocks();
  });

  describe('generate', () => {
    // Generation is fire-and-forget — the controller returns 'started' immediately without awaiting the result
    it('should start generation in background and return started status', () => {
      mockRecoService.generateAndSave.mockResolvedValue(undefined);
      const result = controller.generate('507f1f77bcf86cd799439012', { top_k: 5 });
      expect(result).toEqual({
        status: 'started',
        activityId: '507f1f77bcf86cd799439012',
        message: 'Génération lancée en arrière-plan',
      });
    });

    // When top_k is omitted from the body, the default value of 5 is used
    it('should use default top_k of 5 when not provided', () => {
      mockRecoService.generateAndSave.mockResolvedValue(undefined);
      const result = controller.generate('507f1f77bcf86cd799439012', {});
      expect(result.status).toBe('started');
      expect(service.generateAndSave).toHaveBeenCalledWith(
        '507f1f77bcf86cd799439012',
        5,
        undefined,
      );
    });

    // When top_k is explicitly provided, it is forwarded to the service as-is
    it('should use provided top_k', () => {
      mockRecoService.generateAndSave.mockResolvedValue(undefined);
      controller.generate('507f1f77bcf86cd799439012', { top_k: 10 });
      expect(service.generateAndSave).toHaveBeenCalledWith(
        '507f1f77bcf86cd799439012',
        10,
        undefined,
      );
    });
  });

  describe('generateAll', () => {
    // Bulk generation runs in the background — the controller returns 'started' immediately
    it('should start generateAll in background', () => {
      mockRecoService.generateAll.mockResolvedValue(undefined);
      const result = controller.generateAll({});
      expect(result).toEqual({
        status: 'started',
        message: 'Run All lancé en arrière-plan',
      });
    });
  });

  describe('saveDecision', () => {
    // Forwards the HR decision DTO to the service for persistence
    it('should save HR decision', async () => {
      const decision = {
        employeeId: '507f1f77bcf86cd799439013',
        decision: 'approved' as const,
        aiScore: 85,
        aiReasons: ['Good skills'],
        hrComment: 'Approved',
      };
      mockRecoService.saveDecision.mockResolvedValue({ success: true });
      const result = await controller.saveDecision('507f1f77bcf86cd799439012', decision);
      expect(service.saveDecision).toHaveBeenCalledWith('507f1f77bcf86cd799439012', decision);
    });
  });

  describe('getDecisions', () => {
    // Returns all HR decisions for the given activity
    it('should return decisions for an activity', async () => {
      const decisions = [{ employeeId: '507f1f77bcf86cd799439013', decision: 'approved' }];
      mockRecoService.getDecisions.mockResolvedValue(decisions);
      const result = await controller.getDecisions('507f1f77bcf86cd799439012');
      expect(result).toEqual(decisions);
      expect(service.getDecisions).toHaveBeenCalledWith('507f1f77bcf86cd799439012');
    });
  });

  describe('findByActivity', () => {
    // Returns the most recent recommendation document for the activity
    it('should return recommendation for an activity', async () => {
      mockRecoService.findByActivity.mockResolvedValue(mockRecommendation);
      const result = await controller.findByActivity('507f1f77bcf86cd799439012');
      expect(result).toEqual(mockRecommendation);
      expect(service.findByActivity).toHaveBeenCalledWith('507f1f77bcf86cd799439012');
    });
  });

  describe('findAllByActivity', () => {
    // Returns the full history of recommendation runs for the activity
    it('should return all recommendations history for an activity', async () => {
      const history = [mockRecommendation];
      mockRecoService.findAllByActivity.mockResolvedValue(history);
      const result = await controller.findAllByActivity('507f1f77bcf86cd799439012');
      expect(result).toEqual(history);
    });
  });

  describe('getTop100', () => {
    // Returns the top-scored employee candidates for the activity before Ollama is run
    it('should return top 100 employees for an activity', async () => {
      const top100 = [{ employeeId: '507f1f77bcf86cd799439013', score: 95 }];
      mockRecoService.getTop100.mockResolvedValue(top100);
      const result = await controller.getTop100('507f1f77bcf86cd799439012');
      expect(result).toEqual(top100);
    });
  });

  describe('getStatus', () => {
    // When no generation is running, the controller returns idle status so the frontend can show the correct UI state
    it('should return idle status when no generation running', () => {
      mockRecoService.getGenerationStatus = jest.fn().mockReturnValue(null);
      const result = controller.getStatus('507f1f77bcf86cd799439012');
      expect(result).toEqual({ status: 'idle', activityId: '507f1f77bcf86cd799439012' });
    });

    // When a generation is in progress, the live status object is returned so the frontend can poll progress
    it('should return generation status when running', () => {
      const state = { status: 'running', startedAt: new Date() };
      mockRecoService.getGenerationStatus = jest.fn().mockReturnValue(state);
      const result = controller.getStatus('507f1f77bcf86cd799439012');
      expect(result).toMatchObject({ activityId: '507f1f77bcf86cd799439012', status: 'running' });
    });
  });

  describe('getApprovedForEmployee', () => {
    // Returns the list of activities that the employee has been approved for
    it('should return approved activities for an employee', async () => {
      const activities = [{ activityId: '507f1f77bcf86cd799439012', decision: 'approved' }];
      mockRecoService.getApprovedActivitiesForEmployee.mockResolvedValue(activities);
      const result = await controller.getApprovedForEmployee('507f1f77bcf86cd799439013');
      expect(result).toEqual(activities);
    });
  });
});
