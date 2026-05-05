import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  Request,
  ForbiddenException,
  Header,
} from '@nestjs/common';
import { ActivityService } from './activity.service';
import { CreateActivityDto } from './dto-activity/create-activity.dto';
import { UpdateActivityDto } from './dto-activity/update-activity.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard, Roles } from '../auth/roles.guard';

@Controller('activities')
export class ActivityController {
  constructor(private readonly activityService: ActivityService) {}

  /** Seul un Manager (ou SUPERADMIN) peut créer une activité — createdById injecté depuis le token */
  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('MANAGER', 'SUPERADMIN')
  async create(@Body() dto: CreateActivityDto, @Request() req: any) {
    // Vérifier que le manager ne crée que pour ses propres départements
    if (req.user.role === 'MANAGER') {
      const isOwner = await this.activityService.isManagerOfDepartment(
        req.user.sub,
        dto.targetedDepartmentId,
      );
      if (!isOwner) {
        throw new ForbiddenException("Vous ne gérez pas ce département");
      }
    }
    dto.createdById = req.user.sub;
    return this.activityService.create(dto);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  @Header('Cache-Control', 'no-store')
  findAll(@Query('departmentId') departmentId?: string, @Request() req?: any) {
    if (req?.user?.role === 'MANAGER') {
      return this.activityService.findAllForManager(req.user.sub, departmentId);
    }
    if (req?.user?.role === 'EMPLOYEE') {
      return this.activityService.findAllForEmployee(req.user.sub);
    }
    return this.activityService.findAll(departmentId);
  }

  /** Fast aggregated stats — no population, for dashboard widgets */
  @Get('stats')
  @UseGuards(JwtAuthGuard)
  getStats(@Request() req: any) {
    return this.activityService.getStats(req.user?.role ?? '', req.user?.sub ?? '');
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.activityService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('MANAGER', 'SUPERADMIN')
  update(@Param('id') id: string, @Body() dto: UpdateActivityDto) {
    return this.activityService.update(id, dto);
  }

  @Get(':id/recommendations')
  getRecommendations(@Param('id') id: string) {
    return this.activityService.getRecommendations(id);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('MANAGER', 'SUPERADMIN')
  remove(@Param('id') id: string) {
    return this.activityService.remove(id);
  }
}
