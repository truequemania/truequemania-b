import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Article } from './entities/article.entity';
import { ArticleController } from './article.controller';
import { ArticleService } from './article.service';
import { CategoryModule } from 'src/category/category.module';
import { ArticleImage } from './entities/article-image.entity';
import { CloudinaryModule } from 'src/cloudinary/cloudinay.module';
import { UsersModule } from 'src/users/users.module';
import { DatauserModule } from 'src/datauser/datauser.module';
import { Chat } from 'src/chats/entities/chat.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Article, ArticleImage, Chat]),
    UsersModule,
    DatauserModule,
    CloudinaryModule,
    CategoryModule,
  ],
  controllers: [ArticleController],
  providers: [ArticleService],
  exports: [ArticleService],
})
export class ArticleModule { }
