import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { AppController } from './app.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule } from '@nestjs/config';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { SkillModule } from './skill/skill.module';
import { DepartmentModule } from './department/department.module';
import { ActivityModule } from './activity/activity.module';
import { NlpModule } from './nlp/nlp.module';
import { RecommendationModule } from './recommendation/recommendation.module';
import { NotificationModule } from './notification/notification.module';
import { MetricsModule } from './metrics/metrics.module';
import { MetricsMiddleware } from './metrics/metrics.middleware';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    MongooseModule.forRoot(
      'mongodb+srv://taiebaminebelhadjali_db_user:Complexatom88@cluster0.wczwpwn.mongodb.net/HRBrain_db',
    ),
    MetricsModule,
    UsersModule,
    AuthModule,
    SkillModule,
    DepartmentModule,
    ActivityModule,
    NlpModule,
    RecommendationModule,
    NotificationModule,
  ],
  controllers: [AppController],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(MetricsMiddleware).forRoutes('*');
  }
}
