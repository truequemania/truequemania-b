import { Controller, Get, Post, Body, UseGuards, Request, Patch, Param } from '@nestjs/common';
import { ChatsService } from './chats.service';
import { ApiTags } from '@nestjs/swagger';
import { AuthGuard } from 'src/users/guard/auth.guard';

@ApiTags('Chats')
@Controller('chats')
export class ChatsController {
  constructor(private readonly chatsService: ChatsService) { }

  @Get('/me')
  @UseGuards(AuthGuard)
  async getChatsByUser(@Request() req) {
    const email = req.user.email;
    return this.chatsService.findChatsByUser(email);
  }

  @Post()
  @UseGuards(AuthGuard)
  async create(@Request() req, @Body() body: { articulo_id: number; tipo_accion: string }) {
    const email = req.user.email;
    const { articulo_id, tipo_accion } = body;
    return this.chatsService.createChatFromArticulo(email, articulo_id, tipo_accion);
  }

  @Patch(':id/cancel')
  @UseGuards(AuthGuard)
  async requestCancelChat(
    @Param('id') id: number,
    @Request() req
  ) {
    return this.chatsService.requestCancelChat(id, req.user.email); 
  }

  @Patch(':id/cancel/accept')
  @UseGuards(AuthGuard)
  async acceptCancelChat(
    @Param('id') id: number,
    @Request() req
  ) {
    return this.chatsService.acceptCancelChat(id, req.user.email);
  }

  @Patch(':id/cancel/reject')
  @UseGuards(AuthGuard)
  async rejectCancelChat(
    @Param('id') id: number,
    @Request() req,
    @Body() body: { reason: string }
  ) {
    return this.chatsService.rejectCancelChat(id, req.user.email, body.reason);
  }

}
