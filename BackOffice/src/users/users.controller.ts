import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Put,
  Query,
  UseInterceptors,
  UploadedFile,
  NotFoundException,
  Res,
  BadRequestException,
  UseGuards,
  ForbiddenException,
  Request,
  Logger,
} from '@nestjs/common';
import type { Response } from 'express';
import { UsersService } from './users.service';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, resolve } from 'path';
import { createReadStream, existsSync } from 'fs';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard, Roles } from '../auth/roles.guard';

@Controller('users')
export class UsersController {
  private readonly logger = new Logger(UsersController.name);

  constructor(private readonly usersService: UsersService) {}

  /** Returns the currently authenticated user's profile */
  @Get('me')
  @UseGuards(JwtAuthGuard)
  async getMe(@Request() req: any) {
    return this.usersService.findOne(req.user.sub);
  }

  /** Returns the CV file path for a given user */
  @Get(':id/cv')
  async getCvFile(@Param('id') id: string) {
    const user = await this.usersService.findOne(id);
    if (!user?.cv) {
      throw new BadRequestException(`Aucun fichier CV pour cet utilisateur`);
    }
    return { cvPath: user.cv };
  }

  /** Streams the employee's CV file as a downloadable attachment */
  @Get(':id/cv/download')
  async downloadCv(@Param('id') id: string, @Res() res: Response) {
    try {
      const user = await this.usersService.findOne(id);
      if (!user?.cv) throw new NotFoundException('Fichier CV non trouvé');

      // Resolve to absolute path if stored as relative
      const filePath = user.cv.startsWith('/') ? user.cv : resolve(process.cwd(), user.cv);

      if (!existsSync(filePath)) {
        throw new BadRequestException(`Fichier CV introuvable sur le serveur`);
      }

      const file = createReadStream(filePath);
      res.setHeader('Content-Type', 'text/plain; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="cv_${id}.txt"`);
      file.pipe(res);

      file.on('error', (err) => {
        this.logger.error(`CV stream error for user ${id}: ${err.message}`);
        if (!res.headersSent) res.status(500).send('Erreur lors du téléchargement');
      });
    } catch (error) {
      this.logger.error(`downloadCv failed for user ${id}: ${(error as Error).message}`);
      throw error;
    }
  }

  /** Creates a new user — only SUPERADMIN and HR roles allowed */
  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPERADMIN', 'HR')
  @UseInterceptors(
    FileInterceptor('cv', {
      storage: diskStorage({
        destination: './uploads',
        filename: (_req, file, callback) => {
          const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
          callback(null, uniqueName + extname(file.originalname));
        },
      }),
      fileFilter: (_req, file, callback) => {
        const allowedMimes = ['application/pdf', 'text/plain'];
        if (!allowedMimes.includes(file.mimetype)) {
          return callback(new Error('Only PDF or TXT files are allowed'), false);
        }
        callback(null, true);
      },
    }),
  )
  create(@Body() body: any, @UploadedFile() file: Express.Multer.File, @Request() req: any) {
    // Only SUPERADMIN can create HR accounts
    if (body.role === 'HR' && req.user?.role !== 'SUPERADMIN') {
      throw new ForbiddenException('Seul le SUPERADMIN peut créer un compte HR');
    }
    return this.usersService.create(body, file);
  }

  @Get()
  findAll(
    @Query('page')  page  = '1',
    @Query('limit') limit = '50',
    @Query('role')  role?: string,
    @Query('search') search?: string,
  ) {
    return this.usersService.findAll({
      page:   Math.max(1, parseInt(page)   || 1),
      limit:  Math.min(10000, parseInt(limit) || 50),
      role,
      search,
    });
  }

  /** Aggregated stats for dashboards (no heavy population) */
  @Get('analytics-stats')
  @UseGuards(JwtAuthGuard)
  getAnalyticsStats(@Request() req: any, @Query('since') since?: string) {
    const managerId = req.user?.role === 'MANAGER' ? req.user.sub : undefined;
    const sinceDate = since ? new Date(since) : undefined;
    return this.usersService.getAnalyticsStats(managerId, sinceDate);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPERADMIN', 'HR')
  update(@Param('id') id: string, @Body() body: any) {
    return this.usersService.update(id, body);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPERADMIN', 'HR')
  remove(@Param('id') id: string) {
    return this.usersService.remove(id);
  }
}
