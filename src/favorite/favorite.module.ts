import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FavoriteService } from './favorite.service';
import { FavoriteController } from './favorite.controller';
import { ArticleModule } from 'src/article/article.module';
import { Favorite } from './entities/favorite.entity';
import { Article } from 'src/article/entities/article.entity';
import { UsersModule } from 'src/users/users.module';
import { ChatsModule } from 'src/chats/chats.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Favorite, Article]),
    ChatsModule,
    forwardRef(() => UsersModule),
    forwardRef(() => ArticleModule),
  ],
  controllers: [FavoriteController],
  providers: [FavoriteService],
  exports: [FavoriteService],
})
export class FavoriteModule {}
