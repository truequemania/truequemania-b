import { Module } from '@nestjs/common';
import { AdminService } from './admin.service';
import { AdminController } from './admin.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from 'src/users/entities/user.entity';
import { Article } from 'src/article/entities/article.entity';
import { Opinion } from 'src/opinion/entities/opinion.entity';
import { Datauser } from 'src/datauser/entities/datauser.entity';
import { Order } from 'src/orders/entities/order.entity';
import { Returnorder } from 'src/returorder/entities/returorder.entity';
import { Chat } from 'src/chats/entities/chat.entity';

@Module({
    imports: [TypeOrmModule.forFeature([User, Article, Opinion, Datauser, Order, Returnorder])],
  controllers: [AdminController],
  providers: [AdminService],
})
export class AdminModule {}
