import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Datauser } from './entities/datauser.entity';
import { CreateDatauserDto } from './dto/create-datauser.dto';
import { UpdateDatauserDto } from './dto/update-datauser.dto';
import { UsersService } from 'src/users/users.service';
import { CloudinaryService } from 'src/cloudinary/cloudinay.service';
import { UserImage } from 'src/users/entities/imageuser.entity';
import { UserPlanTruequemania } from 'src/paypal/entities/userplantruequemania.entity';

@Injectable()
export class DatauserService {
  constructor(
    @InjectRepository(Datauser)
    private readonly datauserRepo: Repository<Datauser>,
    private readonly userService: UsersService,
    private cloudinaryService: CloudinaryService,
    @InjectRepository(UserImage)
    private imageRepo: Repository<UserImage>,
    @InjectRepository(UserPlanTruequemania)
    private userPlanRepo: Repository<UserPlanTruequemania>,
  ) { }

  async create(email: string, dto: CreateDatauserDto, file?: Express.Multer.File): Promise<Datauser> {

    const user = await this.userService.findByEmail(email);

    if (!user) {
      throw new BadRequestException('Usuario no encontrado.');
    }

    const nuevo = this.datauserRepo.create({
      ...dto,
      user: user,
    });

    const savedUser = await this.datauserRepo.save(nuevo);

    if (file) {
      const upload = await this.cloudinaryService.uploadFile(file);
      const userImage = this.imageRepo.create({
        url: upload.secure_url,
        user: savedUser.user,
      });
      await this.imageRepo.save(userImage);
    }

    return
  }

  async findByEmail(email: string): Promise<any> {
    const user = await this.userService.findByEmail(email);
    if (!user) throw new NotFoundException('Usuario no encontrado');

    const datauser = await this.datauserRepo.createQueryBuilder('datauser')
      .leftJoinAndSelect('datauser.user', 'user')
      .leftJoinAndSelect('user.images', 'images')
      .where('datauser.user = :userId', { userId: user.id })
      .select([
        'datauser',
        'user.name',
        'user.lastName',
        'images.url',
      ])
      .getOne();

    if (!datauser) throw new NotFoundException('Datos personales no encontrados');

    // Buscar el plan activo del usuario
    const userPlan = await this.userPlanRepo.findOne({
      where: { user: { id: user.id }, es_activo: true },
      relations: ['plan'],
      order: { fecha_inicio: 'DESC' },
    });

    // Devolver los datos personales y el tipo de plan (si existe)
    return {
      ...datauser,
      plan: userPlan ? userPlan.plan.nombre : null,
    };
  }

  async findOne(id: number): Promise<Datauser> {
    return this.datauserRepo.findOne({
      where: { user: { id: id } },
    });
  }

  async update(
    id: number,
    dto: UpdateDatauserDto,
    email: string,
    file?: Express.Multer.File,
  ): Promise<Datauser> {
    const user = await this.userService.findByEmail(email);

    const datauser = await this.datauserRepo.findOne({
      where: { id },
      relations: ['user', 'user.images'],
    });

    if (!datauser || datauser.user.id !== user.id) {
      throw new NotFoundException('Datos no encontrados o no autorizados');
    }

    Object.assign(datauser, dto);

    if (file) {

      for (const image of datauser.user.images) {
        const publicId = this.extractPublicId(image.url);
        if (publicId) {
          try {
            await this.cloudinaryService.deleteFile(publicId);
          } catch (error) {
            console.error('Error al eliminar imagen anterior:', error);
          }
          await this.imageRepo.remove(image);
        }
      }

      const upload = await this.cloudinaryService.uploadFile(file);
      const newImage = this.imageRepo.create({
        url: upload.secure_url,
        user: datauser.user,
      });
      await this.imageRepo.save(newImage);
    }

    return this.datauserRepo.save(datauser);
  }

  private extractPublicId(imageUrl: string): string | null {
    const regex = /\/upload\/(?:v\d+\/)?([^\.]+)\./;
    const match = imageUrl.match(regex);
    return match ? match[1] : null;
  }

  async findAllClientes() {

    const datausers = await this.datauserRepo.createQueryBuilder('datauser')
      .leftJoinAndSelect('datauser.user', 'user')
      .leftJoinAndSelect('user.images', 'images')
      .leftJoinAndSelect('user.articulos', 'articulos')
      .leftJoinAndSelect('articulos.imagenes', 'articuloImagenes')
      .leftJoinAndSelect('user.favoritos', 'favoritos')
      .leftJoinAndSelect('favoritos.article', 'favoritoArticulo')
      .leftJoinAndSelect('user.opinions', 'opiniones')
      .leftJoinAndSelect('user.datauser', 'otrosDatos')
      .where('user.role = :role', { role: 'client' })
      .getMany();

    for (const du of datausers) {
      const userPlan = await this.userPlanRepo.findOne({
        where: { user: { id: du.user.id }, es_activo: true },
        relations: ['plan'],
        order: { fecha_inicio: 'DESC' },
      });
      du['plan'] = userPlan ? userPlan.plan.nombre : null;
      // Eliminar rol y password del usuario antes de devolver
      if (du.user) {
        delete du.user.role;
        delete du.user.password;
      }
    }

    return datausers;
  }

}
