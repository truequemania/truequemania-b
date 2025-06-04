import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from 'src/users/entities/user.entity';
import { Article } from 'src/article/entities/article.entity';
import { Datauser } from 'src/datauser/entities/datauser.entity';
import { Opinion } from 'src/opinion/entities/opinion.entity';
import { MoreThan, Repository } from 'typeorm';
import { Order } from 'src/orders/entities/order.entity';
import { Returnorder } from 'src/returorder/entities/returorder.entity';
import { Chat } from 'src/chats/entities/chat.entity';

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(User)
    private userRepo: Repository<User>,
    @InjectRepository(Article)
    private articleRepo: Repository<Article>,
    @InjectRepository(Opinion)
    private opinionRepo: Repository<Opinion>,
    @InjectRepository(Datauser)
    private dataUserRepo: Repository<Datauser>,
    @InjectRepository(Order)
    private orderRepo: Repository<Order>,
    @InjectRepository(Returnorder)
    private returnRepo: Repository<Returnorder>,
  ) { }

  async getDashboardStats(filtro: string) {
    const today = new Date();
    let startDate = new Date();

    if (filtro === 'ultimos 7 dias') {
      startDate.setDate(today.getDate() - 7);
    } else if (filtro === 'trimestre') {
      startDate.setMonth(today.getMonth() - 3);
    } else if (filtro === 'anual') {
      startDate.setFullYear(today.getFullYear() - 1);
    }

    const usuariosNuevos = await this.userRepo.count({
      where: { isVerified: true },
    });

    const articulosRegistrados = await this.articleRepo.count({
      where: { aprobado: true, fecha: MoreThan(startDate) },
    });

    const comentarios = await this.opinionRepo.count({
      where: { created_at: MoreThan(startDate) },
    });

    const generoCounts = await this.dataUserRepo
      .createQueryBuilder('datauser')
      .select('datauser.genero', 'genero')
      .addSelect('COUNT(*)', 'count')
      .where('datauser.fecha_creacion >= :startDate', { startDate })
      .groupBy('datauser.genero')
      .getRawMany();

    const genero = generoCounts.map(g => ({
      name: g.genero,
      value: parseInt(g.count),
    }));

    const edadCounts = await this.dataUserRepo.query(`
      SELECT 
        CASE 
          WHEN TIMESTAMPDIFF(YEAR, fecha_nacimiento, CURDATE()) BETWEEN 18 AND 25 THEN '18-25'
          WHEN TIMESTAMPDIFF(YEAR, fecha_nacimiento, CURDATE()) BETWEEN 26 AND 35 THEN '26-35'
          WHEN TIMESTAMPDIFF(YEAR, fecha_nacimiento, CURDATE()) BETWEEN 36 AND 45 THEN '36-45'
          ELSE '46+'
        END AS rango_edad,
        COUNT(*) as count
      FROM datausertruequemania
      WHERE fecha_creacion >= ?
      GROUP BY rango_edad
    `, [startDate]);

    const edad = edadCounts.map(e => ({
      name: e.rango_edad,
      value: parseInt(e.count),
    }));

    return {
      usuariosNuevos,
      articulosRegistrados,
      comentarios,
      genero,
      edad,
    };
  }

  async getClientDashboardStats(email: string, filtro: string) {
    const today = new Date();
    let startDate = new Date();

    if (filtro === 'ultimos 7 dias') {
      startDate.setDate(today.getDate() - 7);
    } else if (filtro === 'trimestre') {
      startDate.setMonth(today.getMonth() - 3);
    } else if (filtro === 'anual') {
      startDate.setFullYear(today.getFullYear() - 1);
    }

    const user = await this.articleRepo.manager.findOne(User, { where: { email } });
    if (!user) throw new NotFoundException('Usuario no encontrado');

    const articulos = await this.articleRepo.count({
      where: { user: { id: user.id }, fecha: MoreThan(startDate) },
    });

    const ordenesVendedor = await this.orderRepo
      .createQueryBuilder('order')
      .leftJoin('order.chat', 'chat')
      .leftJoin('order.requester', 'requester')
      .where('(chat.user_one_id = :userId OR chat.user_two_id = :userId)', { userId: user.id })
      .andWhere('requester.id != :userId', { userId: user.id })
      .andWhere('chat.nameChange = :nameChange', { nameChange: 'Compra' })
      .andWhere('order.created_at >= :startDate', { startDate })
      .getCount();

    const devolucionesVendedor = await this.returnRepo
      .createQueryBuilder('ret')
      .leftJoin('ret.order', 'order')
      .leftJoin('order.chat', 'chat')
      .leftJoin('order.requester', 'requester')
      .where('(chat.user_one_id = :userId OR chat.user_two_id = :userId)', { userId: user.id })
      .andWhere('requester.id != :userId', { userId: user.id })
      .andWhere('chat.nameChange = :nameChange', { nameChange: 'Compra' })
      .andWhere('ret.created_at >= :startDate', { startDate })
      .getCount();

    return {
      resumen: [
        { name: 'Artículos', value: articulos },
        { name: 'Órdenes', value: ordenesVendedor },
        { name: 'Devoluciones', value: devolucionesVendedor },
      ],
    };
  }

  async getClientProfileStats(userId: number) {
    const ventas = await this.orderRepo
      .createQueryBuilder('order')
      .leftJoin('order.chat', 'chat')
      .where('chat.user_two_id = :userId', { userId })
      .andWhere('order.status = :status', { status: 'accepted' })
      .getCount();

    const intercambios = await this.orderRepo
      .createQueryBuilder('order')
      .leftJoin('order.chat', 'chat')
      .leftJoin('chat.articulo', 'articulo')
      .where('(chat.user_one_id = :userId OR chat.user_two_id = :userId)', { userId })
      .andWhere('articulo.status_orden = :status', { status: 'intercambiado' })
      .getCount();

    const estrellas = Math.min(5, Math.round((ventas + intercambios) / 5));

    return {
      estrellas,
      ventas,
      intercambios,
    };
  }

  async getGeneralStats() {
    const marcas = await this.articleRepo
      .createQueryBuilder('article')
      .select('DISTINCT article.marca')
      .getCount();

    const productos = await this.articleRepo.count();

    const clientes = await this.userRepo.count({
      where: { role: 'client' },
    });

    return {
      marcas,
      productos,
      clientes,
    };
  }

}


