import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from 'src/users/entities/user.entity';
import { Order } from 'src/orders/entities/order.entity';
import { Returnorder } from './entities/returorder.entity';
import { ReturnorderController } from './returorder.controller';
import { ReturnorderService } from './returorder.service';

@Module({
  imports: [TypeOrmModule.forFeature([Returnorder, User, Order])],
  controllers: [ReturnorderController],
  providers: [ReturnorderService],
  exports: [ReturnorderService]
})
export class ReturorderModule { }
