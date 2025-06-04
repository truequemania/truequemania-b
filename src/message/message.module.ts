import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Message } from './entities/message.entity';
import { MessageService } from './message.service';
import { MessageController } from './message.controller';
import { Chat } from '../chats/entities/chat.entity';
import { User } from '../users/entities/user.entity';
import { Notification } from 'src/notifications/entities/notification.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Notification,Message, Chat, User])],
  controllers: [MessageController],
  providers: [MessageService],
})
export class MessageModule { }
