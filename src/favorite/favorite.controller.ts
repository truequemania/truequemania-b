import { Controller, Get, Post, Body, Delete, UseGuards, Query, Request, Param } from '@nestjs/common';
import { FavoriteService } from './favorite.service';
import { ApiTags } from '@nestjs/swagger';
import { Favorite } from './entities/favorite.entity';
import { AuthGuard } from 'src/users/guard/auth.guard';

@ApiTags('Favoritos')
@Controller('favorito')
export class FavoriteController {
  constructor(private readonly favoriteService: FavoriteService) { }

  @Get()
  @UseGuards(AuthGuard)
  async findOne(@Request() req): Promise<Favorite[]> {
    const email = req.user.email;
    return this.favoriteService.findOne(email);
  }

  @Post()
  @UseGuards(AuthGuard)
  async create(@Request() req, @Body() body: { articulo_id: number }) {
    const email = req.user.email;
    return this.favoriteService.create({ articulo_id: body.articulo_id, email_user: email });
  }

  @Get('/count/:id')
  async countFavoritos(@Param('id') id: number): Promise<{ total: number }> {
    return this.favoriteService.countFavoritosByArticleId(id);
  }

  @Delete()
  @UseGuards(AuthGuard)
  async remove(
    @Query('articulo_id') articulo_id: number,
    @Request() req
  ): Promise<{ message: string }> {
    const email_user = req.user.email;
    return this.favoriteService.remove(articulo_id, email_user);
  }
}
