import { InjectRepository } from '@nestjs/typeorm';
import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { Complaint } from './entities/complaint.entity';
import { CreateComplaintDto } from './dto/create-complaint.dto';
import { UpdateComplaintDto } from './dto/update-complaint.dto';
import { User } from 'src/users/entities/user.entity';

@Injectable()
export class ComplaintsService {
  constructor(
    @InjectRepository(Complaint)
    private complaintRepo: Repository<Complaint>,
    @InjectRepository(User)
    private userRepo: Repository<User>,
  ) { }

  async create(dto: CreateComplaintDto) {
    const complaint = this.complaintRepo.create({
      chat: { id: dto.chatId },
      motivo: dto.motivo,
      descripcion: dto.descripcion,
    });
    return this.complaintRepo.save(complaint);
  }

  async findAll() {
    return this.complaintRepo.find({
      relations: ['chat', 'chat.user_one', 'chat.user_two'],
      select: {
        id: true, motivo: true, descripcion: true, estado: true,
        resolucionMensaje: true, createdAt: true,
        chat: {
          id: true, nameChange: true, cancel_status: true,
          created_at: true,
          user_one: { name: true },
          user_two: { name: true, },
        },
      },
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: number) {
    return this.complaintRepo.findOne({
      where: { id },
      relations: ['chat', 'chat.user_one', 'chat.user_two'],
    });
  }

  async findByUser(email: string) {
    const user = await this.userRepo.findOne({ where: { email } });
    if (!user) throw new NotFoundException('Usuario no encontrado');

    return this.complaintRepo.createQueryBuilder('complaint')
      .leftJoinAndSelect('complaint.chat', 'chat')
      .leftJoinAndSelect('chat.user_one', 'user_one')
      .leftJoinAndSelect('chat.user_two', 'user_two')
      .where('user_one.id = :id OR user_two.id = :id', { id: user.id })
      .select([
        'complaint.id', 'complaint.motivo', 'complaint.descripcion', 'complaint.estado',
        'complaint.resolucionMensaje', 'complaint.createdAt',
        'chat.id', 'chat.nameChange', 'chat.cancel_status', 'chat.created_at',
        'user_one.name', 'user_two.name',
      ])
      .orderBy('complaint.createdAt', 'DESC')
      .getMany();
  }

  async update(id: number, dto: UpdateComplaintDto) {
    if (!dto || Object.keys(dto).length === 0) {
      throw new BadRequestException('No se proporcionaron datos para actualizar');
    }
    await this.complaintRepo.update(id, dto);
    return this.findOne(id);
  }

  async remove(id: number) {
    return this.complaintRepo.delete(id);
  }
}
