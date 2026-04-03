import { Test, TestingModule } from '@nestjs/testing';
import { NlpController } from './nlp.controller';

describe('NlpController', () => {
  let controller: NlpController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [NlpController],
    }).compile();

    controller = module.get<NlpController>(NlpController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
