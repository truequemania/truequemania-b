import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateOpinionDto } from './dto/create-opinion.dto';
import { UpdateOpinionDto } from './dto/update-opinion.dto';
import { Opinion } from './entities/opinion.entity';
import { UsersService } from 'src/users/users.service';

@Injectable()
export class OpinionService {
  constructor(
    @InjectRepository(Opinion)
    private opinionRepo: Repository<Opinion>,
    private readonly userService: UsersService
  ) { }

  async create(createOpinionDto: CreateOpinionDto, email: string): Promise<Opinion> {

    const user = await this.userService.findByEmail(email);

    if (!user) {
      throw new Error('Usuario no encontrado');  
    }

    createOpinionDto.user = user;

    const opinion = this.opinionRepo.create(createOpinionDto);
    return this.opinionRepo.save(opinion);  
  }

  async findAll() {
    const opinions = await this.opinionRepo.find({
      relations: ['user'],
      order: { created_at: 'DESC' },
    });

    return opinions.map((opinion) => ({
      id: opinion.id,
      descripcion: opinion.descripcion,
      created_at: opinion.created_at,
      user: {
        nombre: opinion.user.name,
        apellido: opinion.user.lastName,
      },
    }));
  }

  async findOne(id: number) {
    const opinion = await this.opinionRepo.findOne({ where: { id }, relations: ['user'] });
    if (!opinion) throw new NotFoundException('Opinión no encontrada');
    return opinion;
  }

  async update(id: number, updateOpinionDto: UpdateOpinionDto) {
    const opinion = await this.findOne(id);
    Object.assign(opinion, updateOpinionDto);
    return this.opinionRepo.save(opinion);
  }

  async remove(id: number) {
    const opinion = await this.findOne(id);
    return this.opinionRepo.remove(opinion);
  }

}
