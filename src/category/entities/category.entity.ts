import { Article } from 'src/article/entities/article.entity';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
} from 'typeorm';

@Entity('categorytruequemania')
export class Category {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  nombre: string;

  @Column({ type: 'text' })
  descripcion: string;

  @Column({ nullable: true })
  imagen: string;

  @OneToMany(() => Article, (articulo) => articulo.categoria)
  articulos: Article[];

}
