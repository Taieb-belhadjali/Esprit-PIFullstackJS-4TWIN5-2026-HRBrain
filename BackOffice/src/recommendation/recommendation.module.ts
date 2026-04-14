import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { RecommendationController } from './recommendation.controller';
import { RecommendationService } from './recommendation.service';
import { Recommendation, RecommendationSchema } from './recommendation.schema';
import { HrDecision, HrDecisionSchema } from './hr-decision.schema';
import { Activity, ActivitySchema } from '../activity/activity.schema';
import { User, UserSchema } from '../users/shemas/user.shema';
import { Skill, SkillSchema } from '../skill/skill.schema';
import { NotificationModule } from '../notification/notification.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Recommendation.name, schema: RecommendationSchema },
      { name: HrDecision.name,     schema: HrDecisionSchema },
      { name: Activity.name,       schema: ActivitySchema },
      { name: User.name,           schema: UserSchema },
      { name: Skill.name,          schema: SkillSchema },
    ]),
    NotificationModule,
  ],
  controllers: [RecommendationController],
  providers: [RecommendationService],
  exports: [RecommendationService],
})
export class RecommendationModule {}
