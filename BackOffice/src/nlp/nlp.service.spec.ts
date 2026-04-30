import { Test, TestingModule } from '@nestjs/testing';
import { NlpService } from './nlp.service';
import { getModelToken } from '@nestjs/mongoose';
import { Skill, SkillDocument } from '../skill/skill.schema';

describe('NlpService', () => {
  let service: NlpService;
  const mockSkillModel = {
    find: jest.fn().mockReturnThis(),
    lean: jest.fn().mockReturnThis(),
    exec: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NlpService,
        { provide: getModelToken(Skill.name), useValue: mockSkillModel },
      ],
    }).compile();

    service = module.get<NlpService>(NlpService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
