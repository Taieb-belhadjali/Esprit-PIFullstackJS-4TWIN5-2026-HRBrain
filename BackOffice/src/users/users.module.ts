import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from './shemas/user.shema';
import { Skill, SkillSchema } from '../skill/skill.schema';
import { Department, DepartmentSchema } from '../department/department.schema';
import { Activity, ActivitySchema } from '../activity/activity.schema';
import { NotificationModule } from '../notification/notification.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name,       schema: UserSchema },
      { name: Skill.name,      schema: SkillSchema },
      { name: Department.name, schema: DepartmentSchema },
      { name: Activity.name,   schema: ActivitySchema },
    ]),
    NotificationModule,
  ],
  providers: [UsersService],
  controllers: [UsersController],
  exports: [UsersService],
})
export class UsersModule {}
