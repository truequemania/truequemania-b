import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  Request,
  Res,
  UnauthorizedException,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { RegisterDto } from './dto/registerDto';
import { UsersService } from './users.service';
import { ApiTags } from '@nestjs/swagger';
import { LoginDto } from './dto/loginDto';
import { EmailDto } from './dto/emailDto';
import { AuthGuard } from './guard/auth.guard';
import { PasswordDto } from './dto/passwordDto';
import { isProduction } from 'src/url';
import { Response as ExpressResponse } from 'express';
import { FileInterceptor } from '@nestjs/platform-express';
import { CreateRegisterAdminDto } from './dto/createRegisterAdminDto';
import { UpdateRegisteruserDto } from './dto/updateRegisterAdminDto';
import * as crypto from 'crypto';

@ApiTags('Users')
@Controller('users')
export class UsersController {

  constructor(private readonly userService: UsersService) { }

  @Get('me')
  @UseGuards(AuthGuard)
  async getUser(@Request() req) {
    if (!req.user) {
      return null;
    }
    const user = await this.userService.findByEmailWithImages(req.user.email);
    return {
      email: req.user.email,
      user: req.user.user,
      image: user?.images?.[0]?.url || null,
    };
  }

  @Get('get/admins')
  @UseGuards(AuthGuard)
  findAdmins() {
    return this.userService.findAdmins();
  }

  @Get('validate-token')
  async validateToken(@Query('token') token: string, @Res() res: ExpressResponse) {
    try {
      if (!token) {
        throw new UnauthorizedException("Token no proporcionado");
      }

      const rawToken = decodeURIComponent(token.replace(/\s/g, '+'));

      const secret = process.env.JWT_SECRET;
      if (!secret) throw new Error('JWT_SECRET no está definido');

      const key = crypto
        .createHash('sha256')
        .update(secret)
        .digest();

      const [ivB64, authTagB64, encryptedB64] = rawToken.split('.');
      const iv = Buffer.from(ivB64, 'base64');
      const authTag = Buffer.from(authTagB64, 'base64');
      const encrypted = Buffer.from(encryptedB64, 'base64');

      const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
      decipher.setAuthTag(authTag);

      let decrypted = decipher.update(encrypted, undefined, 'utf8');
      decrypted += decipher.final('utf8');

      const payload = JSON.parse(decrypted);

      const user = await this.userService.findByEmail(payload.email);
      if (!user) {
        throw new UnauthorizedException("Usuario no encontrado");
      }

      const sessionToken = await this.userService.token(user.email);

      res.cookie('ACCESS_TOKEN', sessionToken, {
        httpOnly: true,
        secure: isProduction,
        sameSite: isProduction ? "none" : "lax",
        maxAge: 60 * 60 * 1000,
      });

      return res.json({ message: "Sesión iniciada con éxito" });

    } catch (error) {
      console.error("Error en la validación del token:", error);
      throw new UnauthorizedException("Token inválido o expirado");
    }
  }

  @Post('register')
  register(@Body() registerDto: RegisterDto) {
    return this.userService.register(registerDto);
  }

  @HttpCode(HttpStatus.OK)
  @Post('login')
  async login(@Body() loginDto: LoginDto, @Res() res: ExpressResponse) {
    const token = await this.userService.login(loginDto);
    res.cookie('ACCESS_TOKEN', token, {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? "none" : "lax",
      maxAge: 60 * 60 * 1000,
    });

    return res.json({ message: 'Login exitoso' });
  }

  @HttpCode(HttpStatus.OK)
  @Post('logout')
  async logout(@Res() res: ExpressResponse) {
    res.clearCookie('ACCESS_TOKEN', {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? "none" : "lax",
    });

    return res.json({ message: "Sesión cerrada correctamente" });
  }

  @Post('register/admin')
  @UseGuards(AuthGuard)
  @UseInterceptors(FileInterceptor('image'))
  create(
    @UploadedFile() image: Express.Multer.File,
    @Body() dto: CreateRegisterAdminDto,
  ) {
    return this.userService.createAdmin(dto, image);
  }

  @Post('email')
  email(@Body() email: EmailDto) {
    return this.userService.email(email);
  }

  @Patch('register/admin/:id')
  @UseGuards(AuthGuard)
  @UseInterceptors(FileInterceptor('image'))
  update(
    @Param('id') id: string,
    @UploadedFile() image: Express.Multer.File,
    @Body() dto: UpdateRegisteruserDto,
  ) {
    return this.userService.updateAdmin(+id, dto, image);
  }

  @Patch('password')
  @UseGuards(AuthGuard)
  async password(@Request() req, @Body() passDto: PasswordDto, @Res() res: ExpressResponse) {
    await this.userService.password(req.user.email, passDto);
    return res.json({ message: 'Actualizado' });
  }

  @Patch('tokens')
  async token(@Body() body: { token: string }, @Res() res: ExpressResponse) {
    try {

      const rawToken = decodeURIComponent(body.token);

      if (!rawToken) {
        throw new UnauthorizedException("Token no proporcionado");
      }

      const secret = process.env.JWT_SECRET;
      if (!secret) throw new Error('JWT_SECRET no está definido');

      const key = crypto
        .createHash('sha256')
        .update(secret)
        .digest();

      const [ivB64, authTagB64, encryptedB64] = rawToken.split('.');
      const iv = Buffer.from(ivB64, 'base64');
      const authTag = Buffer.from(authTagB64, 'base64');
      const encrypted = Buffer.from(encryptedB64, 'base64');

      const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
      decipher.setAuthTag(authTag);

      let decrypted = decipher.update(encrypted, undefined, 'utf8');
      decrypted += decipher.final('utf8');

      const payload = JSON.parse(decrypted);

      const token = await this.userService.token(payload.email);

      res.cookie('ACCESS_TOKEN', token, {
        httpOnly: true,
        secure: isProduction,
        sameSite: isProduction ? 'none' : 'lax',
        maxAge: 60 * 60 * 1000,
      });

      return res.json({ message: 'Token verificado y almacenado en cookie' });

    } catch (error) {
      console.error("Error en la verificación del token:", error);
      throw new UnauthorizedException("Token inválido o expirado");
    }
  }

  @Delete('delete/admins/:id')
  @UseGuards(AuthGuard)
  remove(@Param('id') id: string) {
    return this.userService.removeAdmin(+id);
  }
  
}
