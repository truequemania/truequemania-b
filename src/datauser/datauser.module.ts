import { Module } from '@nestjs/common';
import { DatauserService } from './datauser.service';
import { DatauserController } from './datauser.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Datauser } from './entities/datauser.entity';
import { UsersModule } from 'src/users/users.module';
import { UserImage } from 'src/users/entities/imageuser.entity';
import { CloudinaryModule } from 'src/cloudinary/cloudinay.module';
import { ArticleModule } from 'src/article/article.module';
import { UserPlanTruequemania } from 'src/paypal/entities/userplantruequemania.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Datauser, UserImage, UserPlanTruequemania]), UsersModule, CloudinaryModule],
  controllers: [DatauserController],
  providers: [DatauserService],
  exports: [DatauserService]
})
export class DatauserModule { }
