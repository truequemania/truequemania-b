import { Module } from '@nestjs/common';
import { CommentarticleService } from './commentarticle.service';
import { CommentarticleController } from './commentarticle.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Commentarticle } from './entities/commentarticle.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Commentarticle])],
  controllers: [CommentarticleController],
  providers: [CommentarticleService],
  exports: [CommentarticleService]
})
export class CommentarticleModule { }
