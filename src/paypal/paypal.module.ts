import { Module } from '@nestjs/common';
import { PaypalService } from './paypal.service';
import { PaypalController } from './paypal.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserPlanTruequemania } from './entities/userplantruequemania.entity';
import { PlanTruequemania } from './entities/plantruequemania.entity';
import { User } from 'src/users/entities/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([UserPlanTruequemania, PlanTruequemania, User])],
  controllers: [PaypalController],
  providers: [PaypalService],
})
export class PaypalModule { }
