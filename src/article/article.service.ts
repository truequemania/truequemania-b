import { BadRequestException, HttpException, HttpStatus, Injectable, NotFoundException } from '@nestjs/common';
import { CreateArticleDto } from './dto/create-article.dto';
import { UpdateArticleDto } from './dto/update-article.dto';
import { Article } from './entities/article.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Not, Repository, MoreThan } from 'typeorm';
import { ArticleImage } from './entities/article-image.entity';
import { CloudinaryService } from 'src/cloudinary/cloudinay.service';
import { UsersService } from 'src/users/users.service';
import { DatauserService } from 'src/datauser/datauser.service';
import { Chat } from 'src/chats/entities/chat.entity';

@Injectable()
export class ArticleService {

  constructor(
    @InjectRepository(Article)
    private readonly articuloRepository: Repository<Article>,
    @InjectRepository(ArticleImage)
    private readonly articleImageRepository: Repository<ArticleImage>,
    @InjectRepository(Chat)
    private chatRepository: Repository<Chat>,
    private cloudinaryService: CloudinaryService,
    private userService: UsersService,
    private dataUserService: DatauserService,
  ) { }

  async findAllArticlesAdmin() {
    return this.articuloRepository
      .createQueryBuilder('articulo')
      .leftJoinAndSelect('articulo.categoria', 'categoria')
      .leftJoinAndSelect('articulo.imagenes', 'imagenes')
      .leftJoin('articulo.user', 'user')
      .addSelect(['user.name', 'user.email'])
      .orderBy('articulo.fecha', 'DESC')
      .getMany();
  }

  async findApprovedArticles() {
    // Genera una semilla que cambia cada minuto
    const now = Math.floor(Date.now() / 60000);
    return this.articuloRepository
      .createQueryBuilder('articulo')
      .leftJoinAndSelect('articulo.categoria', 'categoria')
      .leftJoinAndSelect('articulo.imagenes', 'imagenes')
      .leftJoin('articulo.user', 'user')
      .addSelect(['user.id', 'user.name', 'user.email'])
      .leftJoin('user.images', 'userImage')
      .addSelect(['userImage.url'])
      .where('articulo.aprobado = :aprobado', { aprobado: true })
      .andWhere('articulo.status_orden = :status', { status: 'ninguno' })
      .orderBy('RAND(:seed)', 'ASC')
      .setParameter('seed', now)
      .getMany();
  }

  async findOneById(id: number): Promise<Article> {
    const article = await this.articuloRepository.findOne({
      where: { id },
      relations: ['categoria', 'imagenes'],
    });

    if (!article) {
      throw new NotFoundException(`Artículo no encontrado`);
    }

    return article;
  }

  async findMyArticles(email: string) {
    const user = await this.userService.findByEmail(email);
    if (!user) throw new NotFoundException('Usuario no encontrado');

    const articles = await this.articuloRepository.find({
      where: { user: { id: user.id } },
      relations: ['categoria', 'imagenes'],
      order: { fecha: 'DESC' },
    });
    return articles;
  }

  async getCategoriasConArticulos() {
    const articulos = await this.articuloRepository.find({
      where: {
        aprobado: true,
        status_orden: Not('intercambiado'),
      },
      relations: ['categoria'],
    });

    return articulos.map(art => ({
      id: art.id,
      nombre: art.nombre,
      descripcion_corta: art.descripcion_corta,
      precioImpuesto: art.precioImpuesto,
      imagenes: art.imagenes,
      categoria: {
        id: art.categoria.id,
        nombre: art.categoria.nombre,
        descripcion: art.categoria.descripcion,
        imagen: art.categoria.imagen,
      },
    }));
  }

  async findAuthorByArticleId(id: number) {
    const articulo = await this.articuloRepository.findOne({
      where: { id },
      relations: ['user', 'user.datauser', 'user.images'],
    });

    if (!articulo) throw new NotFoundException("Artículo no encontrado");

    const total = await this.articuloRepository.count({
      where: {
        user: { id: articulo.user.id },
        aprobado: true,
        status_orden: Not('intercambiado'),
      },
    });

    const articulos = await this.articuloRepository.find({
      where: {
        user: { id: articulo.user.id },
        aprobado: true,
        status_orden: Not('intercambiado'),
      },
      relations: ['imagenes'],
      order: { fecha: 'DESC' },
    });

    return {
      nombre: articulo.user.name,
      apellido: articulo.user.lastName,
      totalArticulos: total,
      imagen: articulo.user.images?.[0]?.url || null,
      articulos,
    };
  }

  async createArticle(email: string, article: CreateArticleDto & { imagenes: Express.Multer.File[] }) {
    const user = await this.userService.findByEmail(email);

    if (!user) {
      throw new HttpException('Usuario no encontrado.', HttpStatus.NOT_FOUND);
    }

    const datauser = await this.dataUserService.findOne(user.id);

    if (!datauser) {
      throw new HttpException('Debes completar tus datos personales antes de publicar un artículo.', HttpStatus.BAD_REQUEST);
    }

    const articleFound = await this.articuloRepository.findOne({
      where: { nombre: article.nombre },
    });

    if (articleFound) {
      throw new HttpException('El artículo ya existe.', HttpStatus.CONFLICT);
    }

    if (!article.imagenes || article.imagenes.length === 0) {
      throw new HttpException('No se recibieron imágenes para subir.', HttpStatus.BAD_REQUEST);
    }

    const precio = Number(article.precio);
    const impuesto = Number(article.impuesto);
    const precioImpuesto = precio + (precio * impuesto / 100);

    const newArticle = this.articuloRepository.create({
      nombre: article.nombre,
      descripcion_corta: article.descripcion_corta,
      descripcion_larga: article.descripcion_larga,
      marca: article.marca,
      estado: article.estado,
      precio: article.precio,
      impuesto: article.impuesto,
      precioImpuesto,
      categoria: { id: article.categoria_id },
      aprobado: false,
      user,
    });

    // VALIDACIÓN DE PLAN Y LÍMITES DE PUBLICACIÓN
    // 1. Buscar el plan activo del usuario
    const userPlan = await this.articuloRepository.manager.query(`
      SELECT up.*, p.nombre as plan_nombre, p.limite_publicaciones
      FROM userplantruequemania up
      JOIN plantruequemania p ON up.plan_id = p.id
      WHERE up.user_id = ? AND up.es_activo = 1 AND (up.fecha_fin IS NULL OR up.fecha_fin > NOW())
      ORDER BY up.fecha_inicio DESC LIMIT 1
    `, [user.id]);

    // 2. Contar artículos publicados por el usuario
    const totalArticulos = await this.articuloRepository.count({ where: { user: { id: user.id } } });

    if (!userPlan.length) {
      // Usuario sin plan activo: máximo 4 artículos en total
      if (totalArticulos >= 4) {
        throw new HttpException('Límite alcanzado. Solo puedes publicar hasta 4 artículos sin un plan activo.', HttpStatus.FORBIDDEN);
      }
    } else {
      // Usuario con plan activo
      const plan = userPlan[0];
      const limiteMensual = plan.limite_publicaciones;
      // Contar artículos publicados este mes
      const now = new Date();
      const primerDiaMes = new Date(now.getFullYear(), now.getMonth(), 1);
      const articulosEsteMes = await this.articuloRepository.count({
        where: {
          user: { id: user.id },
          fecha: MoreThan(primerDiaMes),
        },
      });
      if (articulosEsteMes >= limiteMensual) {
        throw new HttpException(
          plan.plan_nombre === 'Pro'
            ? 'Has alcanzado el límite de 5 publicaciones este mes.'
            : 'Has alcanzado el límite de 15 publicaciones este mes.',
          HttpStatus.FORBIDDEN
        );
      }
    }

    await this.articuloRepository.save(newArticle);

    const uploadedImages = [];

    for (const imagen of article.imagenes) {
      const uploadResult = await this.cloudinaryService.uploadFile(imagen);
      if (!uploadResult) {
        throw new HttpException('Error al subir la imagen.', HttpStatus.INTERNAL_SERVER_ERROR);
      }

      const newImage = this.articleImageRepository.create({
        url: uploadResult.secure_url,
        article: newArticle,
      });

      const savedImage = await this.articleImageRepository.save(newImage);
      uploadedImages.push(savedImage);
    }

    return {
      message: 'Artículo creado con éxito',
      article: {
        ...newArticle,
        imagenes: uploadedImages,
      },
    };
  }

  async toggleAprobado(id: number, aprobado: boolean) {
    const articulo = await this.articuloRepository.findOne({ where: { id } });
    if (!articulo) {
      throw new NotFoundException('Artículo no encontrado');
    }

    articulo.aprobado = aprobado;
    await this.articuloRepository.save(articulo);

    return { message: `Artículo ${aprobado ? 'aprobado' : 'no aprobado'} correctamente.` };
  }

  async updateArticle(
    id: any,
    updateArticulo: UpdateArticleDto,
  ): Promise<{ message: string; articulo: Article }> {

    try {
      const articulo = await this.articuloRepository.findOne({ where: { id } });

      if (!articulo) {
        throw new NotFoundException(`Artículo no encontrado`);
      }
      const updatedArticulo = Object.assign(articulo, updateArticulo);
      await this.articuloRepository.save(updatedArticulo);

      return {
        message: 'Artículo actualizado correctamente',
        articulo: updatedArticulo,
      };
    } catch (error) {
      console.error('Error al actualizar el artículo:', error);
      throw new Error('No se pudo actualizar el artículo');
    }
  }

  async updateImagen(id: any, imagen: Express.Multer.File[]) {
    try {
      const articulo = await this.articuloRepository.findOne({
        where: { id },
        relations: ['imagenes'],
      });

      if (!articulo) {
        throw new NotFoundException(`Artículo no encontrado`);
      }

      if (imagen && imagen.length > 0) {
        for (const imagenFile of imagen) {
          const uploadResult = await this.cloudinaryService.uploadFile(imagenFile);

          const nuevaImagen = this.articleImageRepository.create({
            url: uploadResult.secure_url,
            article: articulo,
          });

          await this.articleImageRepository.save(nuevaImagen);
        }
      }
      return;
    } catch (error) {
      console.error('Error al actualizar la imagen:', error);
      throw new Error('No se pudo actualizar la imagen');
    }
  }

  async deleteArticle(id: any): Promise<{ message: string }> {
    const articulo = await this.articuloRepository.findOne({
      where: { id },
      relations: ['imagenes'],
    });

    if (!articulo) {
      throw new NotFoundException(`Artículo no encontrado`);
    }

    const chatAsArticulo = await this.chatRepository.findOne({
      where: { articulo: { id } },
    });

    const chatAsArticuloDos = await this.chatRepository.findOne({
      where: { articulo_dos: { id } },
    });

    if (chatAsArticulo || chatAsArticuloDos) {
      throw new BadRequestException(`No puedes eliminar el artículo porque está asociado a un chat`);
    }

    for (const imagen of articulo.imagenes) {
      const publicId = this.extractPublicId(imagen.url);
      if (publicId) {
        try {
          await this.cloudinaryService.deleteFile(publicId);
        } catch (error) {
          console.error(`Error al eliminar la imagen`, error);
        }
      }
    }

    await this.articuloRepository.remove(articulo);

    return { message: 'Artículo e imágenes eliminados con éxito' };
  }

  async deleteArticleImage(imageUrl: string) {

    const image = await this.articleImageRepository.findOne({
      where: { url: imageUrl },
    });

    if (!image) {
      throw new NotFoundException('La imagen no existe en la base de datos');
    }

    const publicId = this.extractPublicId(image.url);

    if (publicId) {
      try {
        await this.cloudinaryService.deleteFile(publicId);
      } catch (error) {
        console.error(`Error al eliminar la imagen en Cloudinary`, error);
        throw new HttpException(
          'Error al eliminar la imagen en Cloudinary',
          HttpStatus.INTERNAL_SERVER_ERROR
        );
      }
    }

    await this.articleImageRepository.delete(image.id);

  }

   private extractPublicId(imageUrl: string): string | null {
    const regex = /\/upload\/(?:v\d+\/)?([^\.]+)\./;
    const match = imageUrl.match(regex);
    return match ? match[1] : null;
  }
  
}





