import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Req, Request } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { ApiTags } from '@nestjs/swagger';
import { AuthGuard } from 'src/users/guard/auth.guard';

@ApiTags('Notifications')
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) { }

  @Post()
  @UseGuards(AuthGuard)
  create(@Body() createNotificationDto: CreateNotificationDto) {
    return this.notificationsService.create(createNotificationDto);
  }

  @Get()
  findAll() {
    return this.notificationsService.findAll();
  }

  @Get('me')
  @UseGuards(AuthGuard)
  findByUser(@Request() req) {
    if (!req.user) {
      return [];  
    }
    const email = req.user.email;
    return this.notificationsService.findByEmail(email);
  }

  @Patch(':id')
  @UseGuards(AuthGuard)
  markAsRead(@Param('id') id: string) {
    return this.notificationsService.markAsRead(+id);
  }

  @Delete(':id')
  @UseGuards(AuthGuard)
  remove(@Param('id') id: string) {
    return this.notificationsService.remove(+id);
  }

  @Patch('read-by-chat/:chatId')
  @UseGuards(AuthGuard)
  async markAsReadByChat(@Param('chatId') chatId: string) {
    return this.notificationsService.markAsReadByChat(+chatId);
  }

}
