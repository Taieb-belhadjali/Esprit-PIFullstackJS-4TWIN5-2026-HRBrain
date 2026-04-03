import { Controller, Get, Post, Patch, Delete, Param, Body, Query } from '@nestjs/common';
import { ActivityService } from './activity.service';
import { CreateActivityDto } from './dto-activity/create-activity.dto';
import { UpdateActivityDto } from './dto-activity/update-activity.dto';

@Controller('activities')
export class ActivityController {
  constructor(private readonly activityService: ActivityService) {}

  @Post()
  create(@Body() dto: CreateActivityDto) {
    return this.activityService.create(dto);
  }

  @Get()
  findAll(@Query('departmentId') departmentId?: string) {
    return this.activityService.findAll(departmentId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.activityService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateActivityDto) {
    return this.activityService.update(id, dto);
  }

  @Get(':id/recommendations')
  getRecommendations(@Param('id') id: string) {
    return this.activityService.getRecommendations(id);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.activityService.remove(id);
  }
}
