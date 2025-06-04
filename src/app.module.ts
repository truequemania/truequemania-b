import { Module } from '@nestjs/common';
import { join } from 'path';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { UsersModule } from './users/users.module';
import 'dotenv/config';
import { CloudinaryModule } from './cloudinary/cloudinay.module';
import { SettingsModule } from './settings/settings.module';
import { CategoryModule } from './category/category.module';
import { GoogleModule } from './google/google.module';
import { DatauserModule } from './datauser/datauser.module';
import { ArticleModule } from './article/article.module';
import { FavoriteModule } from './favorite/favorite.module';
import { CommentarticleModule } from './commentarticle/commentarticle.module';
import { ChatsModule } from './chats/chats.module';
import { MessageModule } from './message/message.module';
import { NotificationsModule } from './notifications/notifications.module';
import { ComplaintsModule } from './complaints/complaints.module';
import { OrdersModule } from './orders/orders.module';
import { OpinionModule } from './opinion/opinion.module';
import { ReturorderModule } from './returorder/returorder.module';
import { AdminModule } from './admin/admin.module';
import { ContactModule } from './contact/contact.module';
import { PaypalModule } from './paypal/paypal.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRoot({
      type: 'mysql',
      host: process.env.DB_HOST,
      port: parseInt(process.env.DB_PORT),
      username: process.env.DB_USERNAME,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_DATABASE,
      connectTimeout: 60000,
      entities: [join(__dirname + '/**/*.entity{.ts,.js}')],
      synchronize: false,
      ssl: { rejectUnauthorized: false },
    }),
    UsersModule,
    CloudinaryModule,
    SettingsModule,
    CategoryModule,
    GoogleModule,
    DatauserModule,
    ArticleModule,
    FavoriteModule,
    CommentarticleModule,
    ChatsModule,
    MessageModule,
    NotificationsModule,
    ComplaintsModule,
    OrdersModule,
    OpinionModule,
    ReturorderModule,
    AdminModule,
    ContactModule,
    PaypalModule
  ],
})
export class AppModule { }
