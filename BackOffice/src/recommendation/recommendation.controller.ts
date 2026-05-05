import { Controller, Post, Get, Param, Body, UseGuards } from '@nestjs/common';
import { RecommendationService } from './recommendation.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard, Roles } from '../auth/roles.guard';

@Controller('recommendations')
@UseGuards(JwtAuthGuard)
export class RecommendationController {
  constructor(private readonly recoService: RecommendationService) {}

  @Post(':activityId/generate')
  @UseGuards(RolesGuard)
  @Roles('MANAGER', 'HR', 'SUPERADMIN')
  generate(
    @Param('activityId') activityId: string,
    @Body() body: { top_k?: number; weights?: { skillMatch: number; progression: number; context: number } },
  ) {
    this.recoService.generateAndSave(activityId, body.top_k ?? 5, body.weights)
      .catch((err) => console.error(`[generate] ${activityId} failed:`, err.message));
    return { status: 'started', activityId, message: 'Génération lancée en arrière-plan' };
  }

  @Post('generate-all')
  @UseGuards(RolesGuard)
  @Roles('HR', 'SUPERADMIN')
  generateAll(
    @Body() body: { top_k?: number; weights?: { skillMatch: number; progression: number; context: number } },
  ) {
    this.recoService.generateAll(body.top_k ?? 5, body.weights)
      .catch((err) => console.error('[generate-all] failed:', err.message));
    return { status: 'started', message: 'Run All lancé en arrière-plan' };
  }

  /** Enregistre une décision RH (approuver/rejeter) */
  @Post(':activityId/decision')
  @UseGuards(RolesGuard)
  @Roles('MANAGER', 'HR', 'SUPERADMIN')
  saveDecision(
    @Param('activityId') activityId: string,
    @Body() body: {
      employeeId: string;
      decision: 'approved' | 'rejected';
      aiScore?: number;
      aiReasons?: string[];
      hrComment?: string;
    },
  ) {
    return this.recoService.saveDecision(activityId, body);
  }

  /** Récupère toutes les décisions pour une activité */
  @Get(':activityId/decisions')
  getDecisions(@Param('activityId') activityId: string) {
    return this.recoService.getDecisions(activityId);
  }

  @Get(':activityId')
  findByActivity(@Param('activityId') activityId: string) {
    return this.recoService.findByActivity(activityId);
  }

  @Get(':activityId/history')
  findAllByActivity(@Param('activityId') activityId: string) {
    return this.recoService.findAllByActivity(activityId);
  }

  @Get(':activityId/top100')
  getTop100(@Param('activityId') activityId: string) {
    return this.recoService.getTop100(activityId);
  }

  @Get(':activityId/status')
  getStatus(@Param('activityId') activityId: string) {
    const state = this.recoService.getGenerationStatus(activityId);
    if (!state) return { status: 'idle', activityId };
    return { activityId, ...state };
  }

  /** Activités approuvées pour un employee (pour la page profil) */
  @Get('employee/:employeeId/approved')
  getApprovedForEmployee(@Param('employeeId') employeeId: string) {
    return this.recoService.getApprovedActivitiesForEmployee(employeeId);
  }
}
