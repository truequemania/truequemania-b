import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { MailerModule } from '@nestjs-modules/mailer';
import { mailerConfig } from './mailer.config';
import { JwtModule } from '@nestjs/jwt';
import { jwtConstants } from './constants/jwt.constants';
import { User } from './entities/user.entity';
import { CloudinaryModule } from 'src/cloudinary/cloudinay.module';
import { UserImage } from './entities/imageuser.entity';
import { GoogleStrategy } from '../google/google.strategy';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, UserImage]), CloudinaryModule,
    MailerModule.forRoot(mailerConfig),
    JwtModule.register({
      global: true,
      secret: jwtConstants.secret,
      signOptions: { expiresIn: '1d' },
    }),
  ],
  controllers: [UsersController],
  providers: [UsersService, GoogleStrategy],
  exports: [UsersService, TypeOrmModule],
})
export class UsersModule { }
