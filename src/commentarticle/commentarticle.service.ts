import { Injectable } from '@nestjs/common';
import { CreateCommentarticleDto } from './dto/create-commentarticle.dto';
import { Commentarticle } from './entities/commentarticle.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

@Injectable()
export class CommentarticleService {

  constructor(
    @InjectRepository(Commentarticle)
    private readonly commentRepository: Repository<Commentarticle>,
  ) { }

  async findCommentsByUserEmail(email: string) {
    const allComments = await this.commentRepository.find({
      relations: {
        article: {
          user: true,
        },
      },
      order: { fecha: 'DESC' },
    });

    return allComments
      .filter(comment => comment.article?.user?.email === email)
      .map(comment => ({
        id: comment.id,
        comentario: comment.comentario,
        fecha: comment.fecha,
        articulo: {
          id: comment.article.id,
          nombre: comment.article.nombre,
        },
      }));
  }

  async createSimpleComment(createCommentDto: CreateCommentarticleDto) {
    const { articulo_id, comentario } = createCommentDto;

    const newComment = this.commentRepository.create({
      article: { id: articulo_id },
      comentario,
    });

    return await this.commentRepository.save(newComment);
  }

  async findByArticleId(articulo_id: number) {
    return await this.commentRepository.find({
      where: { article: { id: articulo_id } },
    });
  }

  async deleteById(id: number) {
    const result = await this.commentRepository.delete(id);
    return {
      message: result.affected ? 'Comentario eliminado correctamente' : 'Comentario no encontrado',
    };
  }

}
