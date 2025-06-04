import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from 'src/users/entities/user.entity';
import { Order } from 'src/orders/entities/order.entity';
import { Returnorder } from './entities/returorder.entity';
import { CreateReturnorderDto } from './dto/create-returorder.dto';
import { UpdateReturnorderDto } from './dto/update-returorder.dto';

@Injectable()
export class ReturnorderService {
  constructor(
    @InjectRepository(Returnorder)
    private returnorderRepo: Repository<Returnorder>,
    @InjectRepository(User)
    private userRepo: Repository<User>,
    @InjectRepository(Order)
    private orderRepo: Repository<Order>,
  ) { }

  async create(email: string, dto: CreateReturnorderDto) {
    const user = await this.userRepo.findOne({ where: { email } });
    if (!user) throw new NotFoundException('Usuario no encontrado');

    const order = await this.orderRepo.findOne({ where: { id: dto.orderId } });
    if (!order) throw new NotFoundException('Orden no encontrada');

    const orderDate = new Date(order.created_at);
    const now = new Date();
    const diffInDays = Math.floor(
      (now.getTime() - orderDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (diffInDays > 15) {
      throw new BadRequestException('La orden tiene más de 15 días y no puede ser devuelta.');
    }

    const returnorder = this.returnorderRepo.create({
      user,
      order,
      motivo: dto.motivo,
      estado_producto: dto.estado_producto,
      numero_contacto: dto.numero_contacto,
      estado: 'pendiente',
    });

    return this.returnorderRepo.save(returnorder);
  }

  findAll() {
    return this.returnorderRepo.find({ relations: ['user', 'order'] });
  }

  findOne(id: number) {
    return this.returnorderRepo.findOne({ where: { id }, relations: ['user', 'order'] });
  }

  async findBuyerReturns(email: string) {
    const user = await this.userRepo.findOne({ where: { email } });
    if (!user) throw new NotFoundException('Usuario no encontrado');

    const returns = await this.returnorderRepo.find({
      where: { user: { id: user.id } },
      relations: ['user', 'order', 'order.chat', 'order.chat.user_one', 'order.chat.user_two', 'order.chat.articulo'],
    });

    return returns.map((ret) => ({
      id: ret.id,
      motivo: ret.motivo,
      estado_producto: ret.estado_producto,
      estado: ret.estado,
      created_at: ret.created_at,
      articulo: ret.order.chat.articulo,
      comprador: `${ret.user.name} ${ret.user.lastName}`,
      vendedor: ret.order.chat.user_one.id === ret.user.id
        ? `${ret.order.chat.user_two.name} ${ret.order.chat.user_two.lastName}`
        : `${ret.order.chat.user_one.name} ${ret.order.chat.user_one.lastName}`,
    }));
  }

  async findSellerReturns(email: string) {
    const user = await this.userRepo.findOne({ where: { email } });
    if (!user) throw new NotFoundException('Usuario no encontrado');

    const returns = await this.returnorderRepo.find({
      relations: ['user', 'order', 'order.chat', 'order.chat.user_one', 'order.chat.user_two', 'order.chat.articulo'],
    });

    const filtered = returns.filter((ret) =>
      (ret.order.chat.user_one.id === user.id || ret.order.chat.user_two.id === user.id) &&
      ret.user.id !== user.id
    );

    return filtered.map((ret) => ({
      id: ret.id,
      motivo: ret.motivo,
      estado_producto: ret.estado_producto,
      estado: ret.estado,
      created_at: ret.created_at,
      numero_contacto: ret.numero_contacto, 
      articulo: ret.order.chat.articulo,
      comprador: `${ret.user.name} ${ret.user.lastName}`,
      vendedor:
        ret.order.chat.user_one.id === ret.user.id
          ? `${ret.order.chat.user_two.name} ${ret.order.chat.user_two.lastName}`
          : `${ret.order.chat.user_one.name} ${ret.order.chat.user_one.lastName}`,
    }));
  }

  async update(id: number, dto: UpdateReturnorderDto) {
    const returnOrder = await this.returnorderRepo.findOne({ where: { id } });
    if (!returnOrder) throw new NotFoundException('Devolución no encontrada');
    returnOrder.estado = dto.estado;
    await this.returnorderRepo.save(returnOrder);

    return this.findOne(id);
  }

  remove(id: number) {
    return this.returnorderRepo.delete(id);
  }
}
