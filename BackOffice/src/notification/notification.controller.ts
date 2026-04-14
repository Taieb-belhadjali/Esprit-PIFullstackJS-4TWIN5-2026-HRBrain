import { Controller, Get, Patch, Delete, Param, UseGuards, Request } from '@nestjs/common';
import { NotificationService } from './notification.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationController {
  constructor(private readonly notifService: NotificationService) {}

  @Get()
  findAll(@Request() req: any) {
    return this.notifService.findByUser(req.user.sub);
  }

  @Get('unread-count')
  unreadCount(@Request() req: any) {
    return this.notifService.countUnread(req.user.sub).then(count => ({ count }));
  }

  @Patch('read-all')
  markAllAsRead(@Request() req: any) {
    return this.notifService.markAllAsRead(req.user.sub);
  }

  @Patch(':id/read')
  markAsRead(@Param('id') id: string, @Request() req: any) {
    return this.notifService.markAsRead(id, req.user.sub);
  }

  @Delete(':id')
  delete(@Param('id') id: string, @Request() req: any) {
    return this.notifService.delete(id, req.user.sub);
  }
}
