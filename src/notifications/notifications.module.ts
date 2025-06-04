import { Module } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { NotificationsController } from './notifications.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Notification } from './entities/notification.entity';
import { User } from 'src/users/entities/user.entity';
import { Chat } from 'src/chats/entities/chat.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Notification, User, Chat])],
  controllers: [NotificationsController],
  providers: [NotificationsService],
})
export class NotificationsModule {}
