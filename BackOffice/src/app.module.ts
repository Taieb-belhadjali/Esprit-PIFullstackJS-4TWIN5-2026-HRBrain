import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { MongooseModule } from '@nestjs/mongoose';
import { SkillModule } from './skill/skill.module';

@Module({
  imports: [
    MongooseModule.forRoot(
      'mongodb+srv://taiebaminebelhadjali_db_user:1uK23IXEAS7NMcZs@cluster0.wczwpwn.mongodb.net/HRBrain_db',
    ),
    SkillModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
