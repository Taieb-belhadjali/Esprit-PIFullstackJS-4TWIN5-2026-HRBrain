import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { AppController } from './app.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule, ConfigService } from '@nestjs/config';
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
    // Load .env variables globally — must be first so other modules can use ConfigService
    ConfigModule.forRoot({ isGlobal: true }),

    // MongoDB connection — URI read from environment variable (never hardcoded)
    MongooseModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        uri: config.get<string>('MONGO_URI'),
      }),
    }),

    // Feature modules
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
  /** Apply request metrics middleware to every route */
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(MetricsMiddleware).forRoutes('*');
  }
}
