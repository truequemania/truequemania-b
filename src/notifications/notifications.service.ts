import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification } from './entities/notification.entity';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { UpdateNotificationDto } from './dto/update-notification.dto';
import { User } from 'src/users/entities/user.entity';
import { Chat } from 'src/chats/entities/chat.entity';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectRepository(Notification)
    private readonly notificationRepository: Repository<Notification>,

    @InjectRepository(User)
    private readonly userRepository: Repository<User>,

    @InjectRepository(Chat)
    private readonly chatRepository: Repository<Chat>,
  ) { }

  async create(createNotificationDto: CreateNotificationDto) {
    const { userId, chatId } = createNotificationDto;

    const user = await this.userRepository.findOne({ where: { id: userId } });
    const chat = await this.chatRepository.findOne({ where: { id: chatId } });

    if (!user || !chat) throw new Error('Usuario o chat no encontrado');

    const notification = this.notificationRepository.create({
      user,
      chat,
    });

    return this.notificationRepository.save(notification);
  }

  async findAll() {
    return this.notificationRepository.find({
      relations: ['user', 'chat'],
      order: { createdAt: 'DESC' },
    });
  }

  async findByEmail(email: string) {
    return this.notificationRepository.find({
      where: { user: { email } },
      relations: ['chat'],
      order: { createdAt: 'DESC' },
    });
  }

  async markAsRead(id: number) {
    await this.notificationRepository.update(id, { isRead: true });
    return { status: 'marked as read' };
  }

  async remove(id: number) {
    return this.notificationRepository.delete(id);
  }

  async markAsReadByChat(chatId: number) {
    return this.notificationRepository.update(
      { chat: { id: chatId }, isRead: false },
      { isRead: true }
    );
  }

}
