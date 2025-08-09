import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, UseInterceptors, UploadedFile, UploadedFiles, HttpStatus, HttpException, Query, Request } from '@nestjs/common';
import { ArticleService } from './article.service';
import { CreateArticleDto } from './dto/create-article.dto';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { Express } from 'express';
import { ApiTags } from '@nestjs/swagger';
import { Article } from './entities/article.entity';
import { UpdateArticleDto } from './dto/update-article.dto';
import { AuthGuard } from 'src/users/guard/auth.guard';

@ApiTags("Articulos")
@Controller('articulos')
export class ArticleController {
  constructor(private readonly articleService: ArticleService) { }

  @Get()
  async getAllArticlesAdmin() {
    return this.articleService.findAllArticlesAdmin();
  }

  @Get('/aprobados')
  async getApprovedArticles() {
    return this.articleService.findApprovedArticles();
  }

  @Get('/me')
  @UseGuards(AuthGuard)
  async getMyArticles(@Request() req) {
    const email = req.user.email;
    return this.articleService.findMyArticles(email);
  }

  @Get('/categorias')
  async getCategoriasConArticulos() {
    return this.articleService.getCategoriasConArticulos();
  }

  @Get(':id')
  async findOne(@Param('id') id: number): Promise<Article> {
    return this.articleService.findOneById(id);
  }

  @Get('/autor/:id')
  @UseGuards(AuthGuard)
  async getAuthorArticle(@Param('id') id: number) {
    return this.articleService.findAuthorByArticleId(id);
  }

  @Post()
  @UseGuards(AuthGuard)
  @UseInterceptors(FilesInterceptor('imagenes', 10))
  async create(
    @Request() req,
    @UploadedFiles() imagenes: Express.Multer.File[],
    @Body() newArticle: CreateArticleDto,
  ) {
    const email = req.user.email;
    return await this.articleService.createArticle(email, {
      ...newArticle,
      imagenes,
    });
  }

  @Patch('aprobar/:id')
  @UseGuards(AuthGuard)
  async aprobarArticulo(
    @Param('id') id: number,
    @Body('aprobado') aprobado: boolean
  ) {
    return this.articleService.toggleAprobado(id, aprobado);
  }

  @Patch(':id')
  @UseGuards(AuthGuard)
  @UseInterceptors(FilesInterceptor('imagenes', 10))
  async update(
    @Param('id') id: string,
    @UploadedFiles() imagenes: Express.Multer.File[],
    @Body() updateArt: UpdateArticleDto
  ) {

    await this.articleService.updateArticle(id, updateArt);
    await this.articleService.updateImagen(id, imagenes);

    return { message: 'Artículo actualizado correctamente' };
  }

  @Delete(':id')
  @UseGuards(AuthGuard)
  async delete(@Param('id') id: string) {
    return this.articleService.deleteArticle(id);
  }

  @Delete()
  @UseGuards(AuthGuard)
  async deleteImagen(
    @Query('imageUrl') imageUrl: string
  ) {
    if (!imageUrl) {
      throw new HttpException('La URL de la imagen es requerida', HttpStatus.BAD_REQUEST);
    }

    return this.articleService.deleteArticleImage(decodeURIComponent(imageUrl));
  }

}
