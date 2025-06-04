import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Chat } from './entities/chat.entity';
import { CreateChatDto } from './dto/create-chat.dto';
import { Article } from 'src/article/entities/article.entity';
import { User } from 'src/users/entities/user.entity';
import { ContactService } from 'src/contact/contact.service';

@Injectable()
export class ChatsService {
  constructor(
    @InjectRepository(Chat)
    private readonly chatRepository: Repository<Chat>,

    @InjectRepository(Article)
    private readonly articuloRepository: Repository<Article>,

    @InjectRepository(User)
    private readonly userRepository: Repository<User>,

    private readonly contactService: ContactService
  ) { }

  async findChatsByUser(email: string) {
    const chats = await this.chatRepository.find({
      where: [
        { user_one: { email } },
        { user_two: { email } },
      ],
      relations: [
        'user_one', 'user_two',
        'user_one.images', 'user_two.images',
        'articulo', 'articulo.user', 'articulo.imagenes',
        'articulo_dos', 'articulo_dos.user', 'articulo_dos.imagenes',
        'cancel_requester',
      ],
      select: {
        id: true, nameChange: true, created_at: true,
        user_one: {
          id: true, name: true, lastName: true, email: true,
          images: { url: true },
        },
        user_two: {
          id: true, name: true, lastName: true, email: true,
          images: { url: true },
        },
        articulo: {
          id: true, nombre: true, imagenes: { url: true },
          user: { id: true, name: true, },
        },
        articulo_dos: {
          id: true, nombre: true, imagenes: { url: true },
          user: { id: true, name: true, },
        },
        cancel_status: true,
        cancel_requester: { id: true },
      },
    });

    const formattedChats = chats.map(chat => {
      let me, contact;
      if (chat.user_one.email === email) {
        me = chat.user_one;
        contact = chat.user_two;
      } else {
        me = chat.user_two;
        contact = chat.user_one;
      }

      return {
        id: chat.id,
        nameChange: chat.nameChange,
        created_at: chat.created_at,
        me,
        contact,
        articulo: chat.articulo || null,
        articulo_dos: chat.articulo_dos || null,
        cancel_status: chat.cancel_status,
        cancel_requester_id: chat.cancel_requester?.id || null,
      };
    });

    return formattedChats;
  }

  async createChat(createChatDto: CreateChatDto): Promise<Chat> {
    const { user_one_id, user_two_id, nameChange, articulo_id, articulo_dos_id } = createChatDto;

    if (user_one_id === user_two_id) {
      throw new BadRequestException('No puedes crear un chat contigo mismo.');
    }

    const existingChat = await this.chatRepository.findOne({
      where: [
        {
          user_one: { id: user_one_id },
          user_two: { id: user_two_id },
          articulo: { id: articulo_id },
        },
        {
          user_one: { id: user_two_id },
          user_two: { id: user_one_id },
          articulo: { id: articulo_id },
        },
      ],
      relations: ['articulo'],
    });

    if (existingChat && existingChat.cancel_status !== 'accepted') {
      throw new BadRequestException('El chat existente no está en estado aceptado. No puedes crear un nuevo chat.');
    }

    const chat = this.chatRepository.create({
      user_one: { id: user_one_id },
      user_two: { id: user_two_id },
      articulo: { id: articulo_id },
      articulo_dos: articulo_dos_id ? { id: articulo_dos_id } : undefined,
      nameChange,
    });

    const userOne = await this.userRepository.findOne({ where: { id: user_one_id } });
    const userTwo = await this.userRepository.findOne({ where: { id: user_two_id } });

    if (!userOne || !userTwo) {
      throw new NotFoundException('Usuario no encontrado.');
    }

    const destinatarioEmail = userTwo.email;
    const subject = '¡Nuevo chat en Truequemania!';
    const message = `🎉 ¡Hola se ha iniciado un chat contigo! Ingresa a tu cuenta para conversar.`;

    await this.contactService.envioEmailTool(destinatarioEmail, subject, message);

    return await this.chatRepository.save(chat);
  }


  async createChatFromArticulo(email: string, articulo_id: number, tipo_accion: string): Promise<Chat> {

    const articulo = await this.articuloRepository.findOne({
      where: { id: articulo_id },
      relations: ['user'],
    });

    if (!articulo) {
      throw new Error('Artículo no encontrado');
    }

    const userTwoId = articulo.user.id;

    const userLogged = await this.userRepository.findOne({
      where: { email },
      select: { id: true },
    });

    if (!userLogged) {
      throw new Error('Usuario logueado no encontrado');
    }

    const nameChange = tipo_accion === 'Compra' ? 'Compra' : 'Intercambio';

    return this.createChat({
      user_one_id: userLogged.id,
      user_two_id: userTwoId,
      articulo_id: articulo.id,
      nameChange,
    });

  }

  async requestCancelChat(chatId: number, userEmail: string) {

    const user = await this.userRepository.findOne({ where: { email: userEmail } });
    if (!user) throw new BadRequestException('Usuario no encontrado');
    const userId = user.id;

    const chat = await this.chatRepository.findOne({
      where: { id: chatId },
      relations: ['user_one', 'user_two'],
    });

    if (!chat) {
      throw new BadRequestException('Chat no encontrado');
    }

    if (chat.user_one.id !== userId && chat.user_two.id !== userId) {
      throw new BadRequestException('No tienes permiso para cancelar este chat');
    }

    if (chat.cancel_status === 'pending') {
      throw new BadRequestException('Ya hay una solicitud de cancelación pendiente');
    }

    chat.cancel_status = 'pending';
    chat.cancel_requester = user;

    return await this.chatRepository.save(chat);
  }

  async acceptCancelChat(chatId: number, userEmail: string) {
    const user = await this.userRepository.findOne({ where: { email: userEmail } });
    if (!user) throw new BadRequestException('Usuario no encontrado');
    const userId = user.id;

    const chat = await this.chatRepository.findOne({
      where: { id: chatId },
      relations: ['user_one', 'user_two', 'cancel_requester'],
    });

    if (!chat) throw new BadRequestException('Chat no encontrado');
    if (chat.cancel_status !== 'pending') throw new BadRequestException('No hay solicitud pendiente');
    if (!chat.cancel_requester || chat.cancel_requester.id === userId) {
      throw new BadRequestException('No puedes aceptar tu propia solicitud');
    }

    chat.cancel_status = 'accepted';
    await this.chatRepository.save(chat);

    const destinatario = chat.cancel_requester.id === chat.user_one.id ? chat.user_two : chat.user_one;
    const subject = 'Cancelación aceptada en Truequemania';
    const message = `✅ ¡Tu solicitud de cancelación fue aceptada por ${user.name}!`;

    await this.contactService.envioEmailTool(destinatario.email, subject, message);

    return { message: 'Cancelación aceptada y chat actualizado' };
  }

  async rejectCancelChat(chatId: number, userEmail: string, reason: string) {
    const user = await this.userRepository.findOne({ where: { email: userEmail } });
    if (!user) throw new BadRequestException('Usuario no encontrado');
    const userId = user.id;

    const chat = await this.chatRepository.findOne({
      where: { id: chatId },
      relations: ['cancel_requester', 'user_one', 'user_two'],
    });

    if (!chat) throw new BadRequestException('Chat no encontrado');
    if (chat.cancel_status !== 'pending') throw new BadRequestException('No hay solicitud pendiente');
    if (!chat.cancel_requester || chat.cancel_requester.id === userId) {
      throw new BadRequestException('No puedes rechazar tu propia solicitud');
    }

    chat.cancel_status = 'rejected';
    chat.cancel_reason = reason;
    await this.chatRepository.save(chat);

    const destinatario = chat.cancel_requester.id === chat.user_one.id ? chat.user_two : chat.user_one;
    const subject = 'Cancelación rechazada en Truequemania';
    const message = `❌ Tu solicitud de cancelación fue rechazada por ${user.name}. Motivo: ${reason}`;

    await this.contactService.envioEmailTool(destinatario.email, subject, message);

    return chat;
  }

}
