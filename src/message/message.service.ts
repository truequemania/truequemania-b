import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Message } from './entities/message.entity';
import { Chat } from '../chats/entities/chat.entity';
import { User } from '../users/entities/user.entity';
import { CreateMessageDto } from './dto/create-message.dto';
import { UpdateMessageDto } from './dto/update-message.dto';
import { Notification } from '../notifications/entities/notification.entity';
import 'dotenv/config';
const Pusher = require('pusher');

@Injectable()
export class MessageService {
  private pusher: any;

  constructor(
    @InjectRepository(Message)
    private readonly messageRepository: Repository<Message>,
    @InjectRepository(Chat)
    private readonly chatRepository: Repository<Chat>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Notification)
    private readonly notificationRepository: Repository<Notification>,
  ) {
    this.pusher = new Pusher({
      appId: process.env.PUSHER_APP_ID,
      key: process.env.PUSHER_KEY,
      secret: process.env.PUSHER_SECRET,
      cluster: process.env.PUSHER_CLUSTER,
      useTLS: true,
    });
  }

  async create(createMessageDto: CreateMessageDto) {
    
    const { chatId, senderId, receiverId, content } = createMessageDto;

    const chat = await this.chatRepository.findOne({ where: { id: chatId } });
    const sender = await this.userRepository.findOne({ where: { id: senderId } });
    const receiver = await this.userRepository.findOne({ where: { id: receiverId } });

    if (!chat || !sender || !receiver) {
      throw new Error('Chat, sender, or receiver not found');
    }

    if (chat.cancel_status === 'accepted') {
      throw new BadRequestException('Este chat está suspendido debido a la finalización de la orden o a la cancelación por ambas partes.');
    }

    const message = this.messageRepository.create({
      chat,
      sender,
      receiver,
      content,
    });

    const savedMessage = await this.messageRepository.save(message);

    const notification = this.notificationRepository.create({
      user: receiver,
      chat: chat,
    });

    await this.notificationRepository.save(notification);

    await this.pusher.trigger(`chat-${chatId}`, 'nuevo-mensaje', {
      senderId,
      receiverId,
      content,
      createdAt: savedMessage.created_at,
    });

    return savedMessage;
  }

  async findAll() {
    return this.messageRepository.find({
      relations: ['chat', 'sender', 'receiver'],
      order: { created_at: 'ASC' },
    });
  }

  async findByChat(chatId: number) {
    const messages = await this.messageRepository.find({
      where: { chat: { id: chatId } },
      relations: ['sender', 'receiver'],
      order: { created_at: 'ASC' },
    });

    return messages.map((msg) => ({
      id: msg.id,
      content: msg.content,
      created_at: msg.created_at,
      sender: {
        id: msg.sender.id,
        name: msg.sender.name,
        lastName: msg.sender.lastName,
      },
      receiver: {
        id: msg.receiver.id,
        name: msg.receiver.name,
        lastName: msg.receiver.lastName,
      },
    }));
  }


  findOne(id: number) {
    return this.messageRepository.findOne({
      where: { id },
      relations: ['chat', 'sender', 'receiver'],
    });
  }

  update(id: number, updateMessageDto: UpdateMessageDto) {
    return this.messageRepository.update(id, updateMessageDto);
  }

  remove(id: number) {
    return this.messageRepository.delete(id);
  }
}
