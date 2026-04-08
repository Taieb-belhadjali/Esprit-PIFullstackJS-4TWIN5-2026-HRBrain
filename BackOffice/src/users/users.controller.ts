import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Put,
  UseInterceptors,
  UploadedFile,
  NotFoundException,
  Res,
  BadRequestException,
  UseGuards,
  ForbiddenException,
  Request,
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
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  @UseGuards(JwtAuthGuard)
  async getMe(@Request() req: any) {
    const user = await this.usersService.findOne(req.user.sub);
    return user;
  }

  @Get(':id/cv')
  async getCvFile(@Param('id') id: string) {
    const user = await this.usersService.findOne(id);
    if (!user) {
      throw new NotFoundException('Utilisateur non trouvé');
    }
    if (!user.cv) {
      throw new BadRequestException(`Aucun fichier CV pour cet utilisateur. CV actuel: ${user.cv}`);
    }
    return { cvPath: user.cv };
  }
//Download CV
  @Get(':id/cv/download')
  async downloadCv(@Param('id') id: string, @Res() res: Response) {
    try {
      const user = await this.usersService.findOne(id);
      if (!user?.cv) {
        throw new NotFoundException('Fichier CV non trouvé');
      }
      
      // Construire le chemin absolu du fichier
      let filePath = user.cv;
      if (!filePath.startsWith('/')) {
        filePath = resolve(process.cwd(), filePath);
      }
      
      // Vérifier que le fichier existe
      if (!existsSync(filePath)) {
        console.error(`Fichier non trouvé: ${filePath}`);
        throw new BadRequestException(`Fichier CV n'existe pas: ${filePath}`);
      }
      
      const file = createReadStream(filePath);
      
      res.setHeader('Content-Type', 'text/plain; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="cv_${id}.txt"`);
      
      file.pipe(res);
      
      file.on('error', (err) => {
        console.error('Stream error:', err);
        if (!res.headersSent) {
          res.status(500).send('Erreur lors du téléchargement du fichier');
        }
      });
    } catch (error) {
      console.error('Download CV error:', error);
      throw error;
    }
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPERADMIN', 'HR')
  @UseInterceptors(
    FileInterceptor('cv', {
      storage: diskStorage({
        destination: './uploads',
        filename: (req, file, callback) => {
          const uniqueName = Date.now() + '-' + Math.round(Math.random() * 1e9);
          callback(null, uniqueName + extname(file.originalname));
        },
      }),
      fileFilter: (req, file, callback) => {
        const allowedMimes = ['application/pdf', 'text/plain'];
        if (!allowedMimes.includes(file.mimetype)) {
          return callback(new Error('Only PDF or TXT files are allowed'), false);
        }
        callback(null, true);
      },
    }),
  )
  create(@Body() body: any, @UploadedFile() file: Express.Multer.File, @Request() req: any) {
    // Seul SUPERADMIN peut créer un compte HR
    if (body.role === 'HR' && req.user?.role !== 'SUPERADMIN') {
      throw new ForbiddenException('Seul le SUPERADMIN peut créer un compte HR');
    }
    return this.usersService.create(body, file);
  }

  @Get()
  findAll() {
    return this.usersService.findAll();
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
