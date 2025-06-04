import { Article } from "src/article/entities/article.entity";
import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";

@Entity('commentarticletruequemania')
export class Commentarticle {
    @PrimaryGeneratedColumn()
    id: number;

    @ManyToOne(() => Article, (coment) => coment.commentarticle, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'articulo_id' })
    article: Article;

    @Column({ type: 'text' })
    comentario: string;

    @CreateDateColumn()
    fecha: Date;
}
