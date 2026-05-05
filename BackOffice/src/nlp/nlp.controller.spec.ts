import { Test, TestingModule } from '@nestjs/testing';
import { NlpController } from './nlp.controller';
import { NlpService } from './nlp.service';

describe('NlpController', () => {
  let controller: NlpController;
  let service: NlpService;

  const mockNlpService = {
    extractSkills: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [NlpController],
      providers: [{ provide: NlpService, useValue: mockNlpService }],
    }).compile();

    controller = module.get<NlpController>(NlpController);
    service = module.get<NlpService>(NlpService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  // ── extractSkills ──────────────────────────────────────────────────────────

  describe('extractSkills', () => {
    it('should return extracted skills from description', async () => {
      mockNlpService.extractSkills.mockResolvedValue(['JavaScript', 'React']);

      const result = await controller.extractSkills({ description: 'I know JavaScript and React' });

      expect(result).toEqual({ skills: ['JavaScript', 'React'] });
      expect(service.extractSkills).toHaveBeenCalledWith('I know JavaScript and React');
    });

    it('should return empty skills array for empty description', async () => {
      mockNlpService.extractSkills.mockResolvedValue([]);

      const result = await controller.extractSkills({ description: '' });

      expect(result).toEqual({ skills: [] });
      expect(service.extractSkills).toHaveBeenCalledWith('');
    });

    it('should call service.extractSkills with the exact description text', async () => {
      mockNlpService.extractSkills.mockResolvedValue(['Python']);

      await controller.extractSkills({ description: 'Python developer' });

      expect(service.extractSkills).toHaveBeenCalledTimes(1);
      expect(service.extractSkills).toHaveBeenCalledWith('Python developer');
    });

    it('should wrap skills in response object', async () => {
      mockNlpService.extractSkills.mockResolvedValue(['Node.js', 'TypeScript', 'Docker']);

      const result = await controller.extractSkills({ description: 'Backend engineer' });

      expect(result).toHaveProperty('skills');
      expect(result.skills).toHaveLength(3);
    });

    it('should propagate service errors', async () => {
      mockNlpService.extractSkills.mockRejectedValue(new Error('DB error'));

      await expect(controller.extractSkills({ description: 'test' })).rejects.toThrow('DB error');
    });
  });
});
