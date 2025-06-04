import { BadRequestException, forwardRef, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { CreateFavoriteDto } from './dto/create-favorite.dto';
import { Favorite } from './entities/favorite.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UsersService } from 'src/users/users.service';
import { Article } from 'src/article/entities/article.entity';
import { ChatsService } from 'src/chats/chats.service';
import { In } from 'typeorm';

@Injectable()
export class FavoriteService {

  constructor(
    @InjectRepository(Favorite)
    private readonly favoritoRepository: Repository<Favorite>,
    @Inject(forwardRef(() => UsersService))
    private readonly userService: UsersService,
    @InjectRepository(Article)
    private readonly articuloRepository: Repository<Article>,
    private readonly chatService: ChatsService,
  ) { }

  async findOne(email: string): Promise<any[]> {
    const user = await this.userService.findByEmail(email);
    const user_id = user.id;

    const favoritos = await this.favoritoRepository.find({
      where: { user: { id: user_id } },
      relations: ['user', 'article', 'article.imagenes'],
    });

    const formattedFavoritos = favoritos.map((fav) => ({
      article: {
        id: fav.article.id,
        nombre: fav.article.nombre,
        fecha: fav.article.fecha,
        descripcion: fav.article.descripcion_corta,
        estado: fav.article.estado,
        imagenes: fav.article.imagenes.map((img) => img.url),
      },
      userEmail: fav.user.email,
    }));

    return formattedFavoritos;
  }

  async create(
    createFavoritoDto: CreateFavoriteDto,
  ): Promise<{ message: string; articulo_id: number; match: boolean }> {
    const { articulo_id, email_user } = createFavoritoDto;

    const user = await this.userService.findByEmail(email_user);
    if (!user) throw new BadRequestException('Usuario no encontrado.');

    const user_id = user.id;

    const article = await this.articuloRepository.findOne({
      where: { id: articulo_id },
      relations: ['user'],
    });
    if (!article) throw new BadRequestException('Artículo no encontrado.');

    if (article.user.id === user_id) {
      throw new BadRequestException('No puedes agregar tu propio artículo a favoritos.');
    }

    const favoritoExistente = await this.favoritoRepository.findOne({
      where: { user: { id: user_id }, article: { id: articulo_id } },
    });
    if (favoritoExistente) {
      throw new BadRequestException('El artículo ya está en favoritos.');
    }

    const nuevoFavorito = this.favoritoRepository.create({
      user: { id: user_id },
      article: { id: articulo_id },
    });
    await this.favoritoRepository.save(nuevoFavorito);

    const misArticulos = await this.articuloRepository.find({
      where: { user: { id: user_id } },
    });
    const idsDeMisArticulos = misArticulos.map(a => a.id);

    const likeMutuo = await this.favoritoRepository.findOne({
      where: {
        user: { id: article.user.id },
        article: In(idsDeMisArticulos),
      },
      relations: ['article'],
    });

    let chat = null;

    if (likeMutuo?.article?.id) {
      chat = await this.chatService.createChat({
        user_one_id: user_id,
        user_two_id: article.user.id,
        articulo_id: article.id,
        articulo_dos_id: likeMutuo.article.id,
        nameChange: 'Intercambio',
      });
    }

    return {
      message: 'El artículo se ha agregado a favoritos.',
      articulo_id,
      match: !!chat,
    };
  }

  async remove(
    articulo_id: number,
    email_user: string,
  ): Promise<{ message: string }> {

    const user = await this.userService.findByEmail(email_user);

    if (!user) {
      throw new BadRequestException('Usuario no encontrado.');
    }

    const user_id = user.id;
    const result = await this.favoritoRepository.delete({
      article: { id: articulo_id },
      user: { id: user_id },
    });

    if (result.affected === 0) {
      throw new NotFoundException(`El favorito no fue encontrado.`);
    }

    return {
      message: 'Favorito eliminado.',
    };
  }

  async countFavoritosByArticleId(articulo_id: number): Promise<{ total: number }> {
    const total = await this.favoritoRepository.count({
      where: { article: { id: articulo_id } },
    });

    return { total };
  }

}
