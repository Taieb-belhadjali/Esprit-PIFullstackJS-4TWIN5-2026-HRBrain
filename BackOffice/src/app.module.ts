import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { MongooseModule } from '@nestjs/mongoose';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { ConfigModule } from '@nestjs/config';
import { SkillModule } from './skill/skill.module';
import { DepartmentModule } from './department/department.module';
import { ActivityModule } from './activity/activity.module';
import { NlpModule } from './nlp/nlp.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    MongooseModule.forRoot(
      'mongodb+srv://taiebaminebelhadjali_db_user:1uK23IXEAS7NMcZs@cluster0.wczwpwn.mongodb.net/HRBrain_db',
    ),
    UsersModule,
    AuthModule,
    SkillModule,
    DepartmentModule,
    ActivityModule,
    NlpModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
