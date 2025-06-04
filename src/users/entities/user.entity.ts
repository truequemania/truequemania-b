import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { UserImage } from './imageuser.entity';
import { Datauser } from 'src/datauser/entities/datauser.entity';
import { Favorite } from 'src/favorite/entities/favorite.entity';
import { Article } from 'src/article/entities/article.entity';
import { Opinion } from 'src/opinion/entities/opinion.entity';
@Entity('usertruequemania')
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column()
  lastName: string;

  @Column({ unique: true })
  email: string;

  @Column()
  password: string;

  @Column({ default: false })
  isVerified: boolean;

  @Column({
    type: 'enum',
    enum: ['superadmin', 'admin', 'client'],
    default: 'client',
  })
  role: string;

  @OneToMany(() => UserImage, (img) => img.user)
  images: UserImage[];

  @OneToMany(() => Datauser, (user) => user.user)
  datauser: Datauser[];

  @OneToMany(() => Favorite, (favorito) => favorito.user)
  favoritos: Favorite[];

  @OneToMany(() => Article, article => article.user)
  articulos: Article[];

  @OneToMany(() => Opinion, (opinion) => opinion.user)
  opinions: Opinion[];

}
