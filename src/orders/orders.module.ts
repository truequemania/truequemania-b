import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OrdersService } from './orders.service';
import { OrdersController } from './orders.controller';
import { Order } from './entities/order.entity';
import { Chat } from 'src/chats/entities/chat.entity';
import { User } from 'src/users/entities/user.entity';
import { Article } from 'src/article/entities/article.entity';
import { ContactModule } from 'src/contact/contact.module';

@Module({
    imports: [TypeOrmModule.forFeature([Order, Chat, User, Article]), ContactModule],
    controllers: [OrdersController],
    providers: [OrdersService],
})
export class OrdersModule { }
