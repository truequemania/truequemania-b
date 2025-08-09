import { BadRequestException, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RegisterDto } from './dto/registerDto';
import * as bcryptjs from 'bcryptjs';
import { JwtService } from '@nestjs/jwt';
import { User } from './entities/user.entity';
import { LoginDto } from './dto/loginDto';
import * as crypto from 'crypto';
import { CreateRegisterAdminDto } from './dto/createRegisterAdminDto';
import { CloudinaryService } from 'src/cloudinary/cloudinay.service';
import { Express } from 'express';
import { UserImage } from './entities/imageuser.entity';
import { UpdateRegisteruserDto } from './dto/updateRegisterAdminDto';
import { PasswordDto } from './dto/passwordDto';
import { CreateUserDto } from './dto/userDto';
import { URL_FRONTEND } from 'src/url';
import * as path from 'path';
import * as fs from 'fs';
import { MailerService } from '@nestjs-modules/mailer';
import { EmailDto } from './dto/emailDto';

@Injectable()
export class UsersService {

  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    private readonly jwtService: JwtService,
    private cloudinaryService: CloudinaryService,
    @InjectRepository(UserImage)
    private imageRepo: Repository<UserImage>,
    private readonly mailerService: MailerService,
  ) { }

  async findByEmailWithImages(email: string) {
    return this.usersRepository.findOne({
      where: { email },
      relations: ['images'],
    });
  }

  async findByEmail(email: string): Promise<User> {
    return await this.usersRepository.findOne({
      where: { email },
    });
  }

  async createGoogle(createUserDto: CreateUserDto) {
    return await this.usersRepository.save(createUserDto);
  }

  async register({ password, email, name, lastName }: RegisterDto) {

    const user = await this.usersRepository.findOneBy({ email });
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/i;

    if (user) {
      throw new BadRequestException('Credenciales inválidas');
    }

    if (!emailRegex.test(email)) {
      throw new BadRequestException('Ingrese un correo válido.');
    }

    const userCount = await this.usersRepository.count();
    const isFirstUser = userCount === 0;

    const hashedPassword = await bcryptjs.hash(password, 10);

    const newUser = this.usersRepository.create({
      name,
      lastName,
      email,
      password: hashedPassword,
      isVerified: isFirstUser ? true : false,
      role: isFirstUser ? 'superadmin' : 'client',
    });

    await this.usersRepository.save(newUser);

    if (!isFirstUser) {
      const Usuario = { email, role: 'client' };
      await this.envioEmail(Usuario, email, 'register');
    }

    return {
      message: isFirstUser
        ? 'Primer usuario creado como superadministrador.'
        : 'Registro exitoso, verifique su correo.',
    };
  }

  async login({ email, password }: LoginDto): Promise<string> {

    const user = await this.usersRepository.findOne({ where: { email } });

    if (!user) {
      throw new UnauthorizedException('Correo inválido');
    }

    const isPasswordValid = await bcryptjs.compare(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Contraseña inválida');
    }

    if (!user.isVerified) {
      throw new UnauthorizedException('Su cuenta no está verificada');
    }

    const payload = {
      email,
      user: user.role,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 3600,
    };

    return await this.encryptToken(payload);

  }

  async createAdmin(dto: CreateRegisterAdminDto, file?: Express.Multer.File) {
    const existing = await this.usersRepository.findOne({ where: { email: dto.email } });
    if (existing) throw new BadRequestException('El correo ya está registrado');

    const password = await bcryptjs.hash(dto.password, 10);

    const user = this.usersRepository.create({
      name: dto.name,
      lastName: dto.lastName,
      email: dto.email,
      password,
      role: dto.role,
      isVerified: true,
    });

    const savedUser = await this.usersRepository.save(user);

    if (file) {
      const upload = await this.cloudinaryService.uploadFile(file);
      const userImage = this.imageRepo.create({
        url: upload.secure_url,
        user: savedUser,
      });
      await this.imageRepo.save(userImage);
    }

    return { message: 'Usuario registrado correctamente' };
  }

  async findAdmins() {
    try {
      const admins = await this.usersRepository.find({
        where: { role: 'admin' },
        relations: ['images'],
      });

      return admins.map(({ password, ...rest }) => rest);
    } catch (error) {
      console.error('Error al buscar administradores:', error);
      throw new Error('Error interno al obtener administradores');
    }
  }

  async updateAdmin(id: number, data: Partial<UpdateRegisteruserDto>, image?: Express.Multer.File) {
    const user = await this.usersRepository.findOne({ where: { id }, relations: ['images'] });
    if (!user) throw new NotFoundException('Usuario no encontrado');

    if (data.password) {
      data.password = await bcryptjs.hash(data.password, 10);
    }

    const { ...dataWithoutPermissions } = data;

    const updated = Object.assign(user, dataWithoutPermissions);
    await this.usersRepository.save(updated);

    if (image) {
      if (user.images && user.images.length > 0) {
        for (const img of user.images) {
          const publicId = this.extractPublicId(img.url);
          if (publicId) {
            await this.cloudinaryService.deleteFile(publicId);
          }
        }
        await this.imageRepo.delete({ user: { id } });
      }

      const upload = await this.cloudinaryService.uploadFile(image);
      const userImage = this.imageRepo.create({
        url: upload.secure_url,
        user: updated,
      });
      await this.imageRepo.save(userImage);
    }


    return { message: 'Usuario actualizado' };
  }

  async removeAdmin(id: number) {
    const user = await this.usersRepository.findOne({
      where: { id },
      relations: ['images'],
    });

    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    for (const image of user.images) {
      const publicId = this.extractPublicId(image.url);
      if (publicId) {
        try {
          await this.cloudinaryService.deleteFile(publicId);
        } catch (error) {
          console.error(`Error al eliminar imagen de Cloudinary`, error);
        }
      }
    }

    await this.usersRepository.remove(user);

    return { message: 'Usuario e imágenes eliminados con éxito' };
  }

  async password(email: string, passDto: PasswordDto) {
    const user = await this.usersRepository.findOneBy({ email });

    if (!user) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    if (passDto.password !== passDto.verPassword) {
      throw new BadRequestException('Las contraseñas no coinciden');
    }

    const hashedNewPassword = await bcryptjs.hash(passDto.password, 10);

    await this.usersRepository.update(
      { email },
      { password: hashedNewPassword },
    );

    return;
  }

  async token(email: string) {
    const user = await this.usersRepository.findOneBy({ email });

    if (!user) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    await this.usersRepository.update({ email }, { isVerified: true });


    const payload = {
      email,
      user: user.role,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 3600,
    };

    return await this.encryptToken(payload);
  }

  async email({ email }: EmailDto) {
    const user = await this.usersRepository.findOneBy({ email });

    if (!user) {
      throw new BadRequestException(
        'Correo enviado (si existe en la base de datos).',
      );
    }

    if (user.role !== 'client') {
      throw new BadRequestException('Solo los clientes pueden realizar esta acción.');
    }

    await this.envioEmail(user, email, 'verificacion');
  }

  async encryptToken(payload: object): Promise<string> {
    const secret = process.env.JWT_SECRET;
    if (!secret) throw new Error('JWT_SECRET no definido');

    const key = crypto.createHash('sha256').update(secret).digest();

    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);

    const json = JSON.stringify(payload);
    let encrypted = cipher.update(json, 'utf8', 'base64');
    encrypted += cipher.final('base64');
    const authTag = cipher.getAuthTag();

    return [iv.toString('base64'), authTag.toString('base64'), encrypted].join(
      '.',
    );
  }

  private extractPublicId(imageUrl: string): string | null {
    const regex = /\/upload\/(?:v\d+\/)?([^\.]+)\./;
    const match = imageUrl.match(regex);
    return match ? match[1] : null;
  }

  async envioEmail(user: any, email: string, correo: string) {
    const payload = { email: user.email };

    const token = await this.encryptToken(payload);

    let url: string;
    let filePath: string;

    const baseUrl = URL_FRONTEND;

    if (correo === 'register') {
      url = `${baseUrl}/iniciar-sesion?token=${token}`;
      filePath = path.resolve(process.cwd(), 'src/users/html/plantillaRegister.html');
    }

    if (correo === 'verificacion') {
      url = `${baseUrl}/cambiar-clave?token=${token}`;
      filePath = path.resolve(process.cwd(), 'src/users/html/plantillaVerification.html');
    }

    const htmlTemplate = fs.readFileSync(filePath, 'utf8');
    const personalizedHtml = htmlTemplate
      .replace('{{name}}', user.email)
      .replace('{{token}}', url);

    await this.mailerService.sendMail({
      to: email,
      subject: 'Correo de truequemania',
      html: personalizedHtml,
    });
  }


}


