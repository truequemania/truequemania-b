import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Order } from './entities/order.entity';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { Chat } from '../chats/entities/chat.entity';
import { User } from 'src/users/entities/user.entity';
import { Article } from 'src/article/entities/article.entity';
import { ContactService } from 'src/contact/contact.service';

@Injectable()
export class OrdersService {
  constructor(
    @InjectRepository(Order)
    private orderRepo: Repository<Order>,
    @InjectRepository(Chat)
    private chatRepo: Repository<Chat>,
    @InjectRepository(User)
    private userRepo: Repository<User>,
    @InjectRepository(Article)
    private articleRepo: Repository<Article>,
    private readonly contactService: ContactService
  ) { }

  async create(dto: CreateOrderDto, email: string) {
    const chat = await this.chatRepo.findOne({
      where: { id: dto.chatId },
      relations: ['user_one', 'user_two'],
    });

    if (!chat) throw new NotFoundException('Chat no encontrado');
    if (chat.cancel_status === 'accepted') {
      throw new BadRequestException('El chat ha sido cancelado. No puedes crear una orden.');
    }

    const user = await this.userRepo.findOne({ where: { email } });
    if (!user) throw new NotFoundException('Usuario no encontrado');

    const order = this.orderRepo.create({
      chat,
      requester: user,
      status: 'pending',
    });

    const savedOrder = await this.orderRepo.save(order);

    const destinatarioEmail = chat.user_two.email === email ? chat.user_one.email : chat.user_two.email;
    const subject = '¡Nueva orden creada en Truequemania!';
    const message = `🎉 Hola, se ha creado una nueva orden contigo. Ingresa a tu cuenta para gestionarla.`;

    await this.contactService.envioEmailTool(destinatarioEmail, subject, message);

    return savedOrder;
  }

  async getCompras(email: string) {
    const user = await this.userRepo.findOne({ where: { email } });

    if (!user) throw new NotFoundException('Usuario no encontrado');

    const orders = await this.orderRepo.find({
      where: [
        { requester: { id: user.id } },
      ],
      relations: [
        'chat',
        'chat.user_one',
        'chat.user_two',
        'chat.articulo',
        'chat.articulo.imagenes',
      ],
    });

    const filteredOrders = orders
      .filter(order =>
        order.chat.nameChange === 'Compra' &&
        (order.chat.user_one.id === user.id || order.chat.user_two.id === user.id) &&
        order.chat.cancel_status === 'accepted'
      )
      .map(order => {

        const { name, lastName } = order.chat.user_one;
        const userOne = { name, lastName };

        const { name: nameTwo, lastName: lastNameTwo } = order.chat.user_two;
        const userTwo = { name: nameTwo, lastName: lastNameTwo };

        const articulo = order.chat.articulo;

        const orderDate = new Date(order.created_at).toLocaleDateString();

        return {
          id: order.id,
          status: order.status,
          status_envio: order.status_envio,
          orderDate,
          chat: {
            ...order.chat,
            user_one: userOne,
            user_two: userTwo,
            articulo,
          },
        };
      });

    return filteredOrders;
  }

  async getComprasRecibidas(email: string) {
    const user = await this.userRepo.findOne({ where: { email } });
    if (!user) throw new NotFoundException('Usuario no encontrado');

    const orders = await this.orderRepo.find({
      relations: ['chat', 'chat.user_one', 'chat.user_two', 'chat.articulo', 'chat.articulo.imagenes'],
    });

    const filteredOrders = orders
      .filter(order =>
        order.chat.nameChange === 'Compra' &&
        order.chat.user_two.email === email &&
        order.chat.cancel_status === 'accepted'
      )
      .map(order => {
        const { name, lastName, email: emailOne } = order.chat.user_one;
        const userOne = { name, lastName, email: emailOne };

        const { name: nameTwo, lastName: lastNameTwo } = order.chat.user_two;
        const userTwo = { name: nameTwo, lastName: lastNameTwo };

        const articulo = order.chat.articulo;
        const orderDate = new Date(order.created_at).toLocaleDateString();

        return {
          id: order.id,
          status: order.status,
          status_envio: order.status_envio,
          orderDate,
          chat: {
            ...order.chat,
            user_one: userOne,
            user_two: userTwo,
            articulo,
          },
        };
      });

    return filteredOrders;

  }

  async getIntercambios(email: string) {
    const user = await this.userRepo.findOne({ where: { email } });
    if (!user) throw new NotFoundException('Usuario no encontrado');

    const orders = await this.orderRepo.find({
      relations: [
        'chat', 'chat.user_one', 'chat.user_two',
        'chat.articulo', 'chat.articulo_dos',
        'chat.articulo.imagenes', 'chat.articulo_dos.imagenes',
      ],
    });

    const filteredOrders = orders
      .filter(order =>
        order.chat.nameChange === 'Intercambio' &&
        (order.chat.user_one.id === user.id || order.chat.user_two.id === user.id) &&
        order.chat.cancel_status === 'accepted'
      )
      .map(order => {
        const isUserOne = order.chat.user_one.id === user.id;

        const myArticle = isUserOne ? order.chat.articulo : order.chat.articulo_dos;
        const otherArticle = isUserOne ? order.chat.articulo_dos : order.chat.articulo;
        const otherUser = isUserOne ? order.chat.user_two : order.chat.user_one;

        return {
          id: order.id,
          status: order.status,
          orderDate: new Date(order.created_at).toLocaleDateString(),
          chat: {
            id: order.chat.id,
            nameChange: order.chat.nameChange,
            cancel_status: order.chat.cancel_status,
            created_at: order.chat.created_at,
            user_one: {
              id: order.chat.user_one.id,
              name: order.chat.user_one.name,
              lastName: order.chat.user_one.lastName,
            },
            user_two: {
              id: order.chat.user_two.id,
              name: order.chat.user_two.name,
              lastName: order.chat.user_two.lastName,
            },
            articulo_mio: myArticle,
            articulo_recibido: otherArticle,
            other_user: {
              id: otherUser.id,
              name: otherUser.name,
              lastName: otherUser.lastName,
            },
          },
        };
      });

    return filteredOrders;
  }

  findAll() {
    return this.orderRepo.find({
      relations: ['user_one', 'user_two', 'articulo', 'articulo_dos'],
      order: { created_at: 'DESC' },
    });
  }

  async findByChat(chatId: number) {
    const orders = await this.orderRepo.find({
      where: { chat: { id: chatId } },
      relations: ['chat', 'chat.user_one', 'chat.user_two', 'requester'],
      order: { created_at: 'DESC' },
    });

    return orders.map(order => ({
      id: order.id,
      status: order.status,
      decline_reason: order.decline_reason,
      requester: {
        id: order.requester?.id,
        name: order.requester?.name,
        lastName: order.requester?.lastName,
      },
      chat: {
        id: order.chat.id,
        nameChange: order.chat.nameChange,
        user_one: {
          id: order.chat.user_one.id,
          name: order.chat.user_one.name,
        },
        user_two: {
          id: order.chat.user_two.id,
          name: order.chat.user_two.name,
        },
      },
    }));
  }

  async findOneArticle(id: number) {
    const order = await this.orderRepo.findOne({
      where: { id },
      relations: ['chat', 'chat.articulo'],
    });

    if (!order) {
      throw new NotFoundException('Orden no encontrada');
    }

    const articulo = order.chat.articulo;

    return {
      nombre: articulo.nombre,
      descripcion_corta: articulo.descripcion_corta,
      imagen: articulo.imagenes?.[0]?.url || null,
      precioImpuesto: articulo.precioImpuesto,
    };
  }

  async updateStatus(id: number, status: 'accepted' | 'declined', reason?: string) {
    const order = await this.orderRepo.findOne({
      where: { id },
      relations: ['chat', 'chat.user_one', 'chat.user_two', 'chat.articulo', 'chat.articulo_dos', 'requester'],
    });

    if (!order) throw new NotFoundException('Orden no encontrada');
    if (!order.requester) throw new NotFoundException('Requester no encontrado en la orden');

    order.status = status;
    if (reason) order.decline_reason = reason;
    
    const requesterId = order.requester.id;
    const recipient =
      order.chat.user_one.id === requesterId ? order.chat.user_two : order.chat.user_one;
    const destinatarioEmail = recipient.email;

    if (status === 'accepted') {
      order.chat.cancel_status = 'accepted';
      await this.chatRepo.save(order.chat);

      if (
        order.chat.nameChange === 'Intercambio' &&
        order.chat.articulo &&
        order.chat.articulo_dos
      ) {
        order.chat.articulo.status_orden = 'intercambiado';
        order.chat.articulo_dos.status_orden = 'intercambiado';
        await this.articleRepo.save([order.chat.articulo, order.chat.articulo_dos]);
      }

      const subject = '¡Orden aceptada en Truequemania!';
      const message = `✅ Tu orden ha sido aceptada. Revisa los detalles en tu cuenta.`;
      await this.contactService.envioEmailTool(destinatarioEmail, subject, message);
    }

    if (status === 'declined') {
      const subject = '❌ Orden rechazada en Truequemania';
      const message = `Tu orden fue rechazada. Motivo: ${reason || 'Sin motivo especificado'}.`;
      await this.contactService.envioEmailTool(destinatarioEmail, subject, message);
    }

    return this.orderRepo.save(order);
  }

  findOne(id: number) {
    return this.orderRepo.findOne({
      where: { id },
      relations: ['user_one', 'user_two', 'articulo', 'articulo_dos'],
    });
  }

  async update(id: number, dto: UpdateOrderDto) {
    await this.orderRepo.update(id, dto);
    return this.findOne(id);
  }

  async updateStatusEnvio(id: number, status_envio: 'pendiente' | 'enviado') {
    const order = await this.orderRepo.findOne({ where: { id } });

    if (!order) throw new NotFoundException('Orden no encontrada');

    order.status_envio = status_envio;

    await this.orderRepo.save(order);

    return { message: `Estado de envío actualizado a ${status_envio}` };
  }

  remove(id: number) {
    return this.orderRepo.delete(id);
  }
}


