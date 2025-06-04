import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Req } from '@nestjs/common';
import { CommentarticleService } from './commentarticle.service';
import { CreateCommentarticleDto } from './dto/create-commentarticle.dto';
import { ApiTags } from '@nestjs/swagger';
import { AuthGuard } from 'src/users/guard/auth.guard';

@ApiTags('CommentarioArticulo')
@Controller('commentarticle')
export class CommentarticleController {
  constructor(private readonly commentarticleService: CommentarticleService) { }

  @Get('user')
  @UseGuards(AuthGuard)
  getCommentsByUser(@Req() req) {
    const email = req.user.email;
    return this.commentarticleService.findCommentsByUserEmail(email);
  }

  @Post()
  @UseGuards(AuthGuard)
  create(@Body() createCommentDto: CreateCommentarticleDto) {
    return this.commentarticleService.createSimpleComment(createCommentDto);
  }

  @Get(':id')
  getCommentsByArticle(@Param('id') id: number) {
    return this.commentarticleService.findByArticleId(+id);
  }

  @Delete(':id')
  @UseGuards(AuthGuard)
  delete(@Param('id') id: number) {
    return this.commentarticleService.deleteById(+id);
  }

}
