import { Category } from 'src/category/entities/category.entity';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  OneToMany
} from 'typeorm';
import { ArticleImage } from './article-image.entity';
import { User } from 'src/users/entities/user.entity';
import { Favorite } from 'src/favorite/entities/favorite.entity';
import { Commentarticle } from 'src/commentarticle/entities/commentarticle.entity';

@Entity('articletruequemania')
export class Article {

  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  nombre: string;

  @Column({ type: 'text', nullable: true })
  descripcion_corta: string;

  @Column({ type: 'text', nullable: true })
  descripcion_larga: string;

  @Column({ nullable: true })
  marca: string;

  @ManyToOne(() => User, (user) => user.articulos, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => Category, (categoria) => categoria.articulos, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'categoria_id' })
  categoria: Category;

  @Column()
  estado: string;  

  @Column({
    type: 'enum',
    enum: ['ninguno', 'intercambiado', 'comprado'],
    default: 'ninguno',
  })
  status_orden: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  precio: number;

  @Column({ type: 'int', default: 0 })
  impuesto: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  precioImpuesto: number;

  @Column({ type: 'boolean', nullable: false })
  aprobado: boolean;

  @CreateDateColumn()
  fecha: Date;

  @OneToMany(() => ArticleImage, (image) => image.article, { cascade: true, eager: true })
  imagenes: ArticleImage[];

  @OneToMany(() => Favorite, (favorito) => favorito.article)
  favoritos: Favorite[];

  @OneToMany(() => Commentarticle, (coment) => coment.article)
  commentarticle: Commentarticle[];
}
