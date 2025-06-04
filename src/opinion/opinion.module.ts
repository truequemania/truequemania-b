import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OpinionService } from './opinion.service';
import { OpinionController } from './opinion.controller';
import { Opinion } from './entities/opinion.entity';
import { UsersModule } from 'src/users/users.module';

@Module({
  imports: [TypeOrmModule.forFeature([Opinion]), UsersModule],
  controllers: [OpinionController],
  providers: [OpinionService],
})
export class OpinionModule {}
