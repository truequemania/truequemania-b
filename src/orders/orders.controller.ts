import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { ApiTags } from '@nestjs/swagger';
import { AuthGuard } from 'src/users/guard/auth.guard';

@ApiTags('Orden')
@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) { }

  @Post()
  @UseGuards(AuthGuard)
  async create(@Request() req, @Body() createOrderDto: CreateOrderDto) {
    const email = req.user.email;
    return this.ordersService.create(createOrderDto, email);
  }

  @Get()
  @UseGuards(AuthGuard)
  findAll() {
    return this.ordersService.findAll();
  }

  @Get('/chat/:chatId')
  @UseGuards(AuthGuard)
  findByChat(@Param('chatId') chatId: string) {
    return this.ordersService.findByChat(+chatId);
  }

  @Get('compras')
  @UseGuards(AuthGuard)
  async getCompras(@Request() req) {
    const email = req.user.email;
    return this.ordersService.getCompras(email);
  }

  @Get('compras-recibidas')
  @UseGuards(AuthGuard)
  async getComprasRecibidas(@Request() req) {
    const email = req.user.email;
    return this.ordersService.getComprasRecibidas(email);
  }

  @Get('intercambios')
  @UseGuards(AuthGuard)
  async getIntercambios(@Request() req) {
    const email = req.user.email;
    return this.ordersService.getIntercambios(email);
  }

  @Get('article/:id')
  @UseGuards(AuthGuard)
  findOneArticle(@Param('id') id: number) {
    return this.ordersService.findOneArticle(+id);
  }

  @Patch(':id/accept')
  @UseGuards(AuthGuard)
  async accept(@Param('id') id: string) {
    return this.ordersService.updateStatus(+id, 'accepted');
  }

  @Patch(':id/decline')
  @UseGuards(AuthGuard)
  async decline(@Param('id') id: string, @Body() body: { reason: string }) {
    return this.ordersService.updateStatus(+id, 'declined', body.reason);
  }

  @Patch(':id')
  @UseGuards(AuthGuard)
  update(@Param('id') id: string, @Body() updateOrderDto: UpdateOrderDto) {
    return this.ordersService.update(+id, updateOrderDto);
  }

  @Patch(':id/update-status-envio')
  @UseGuards(AuthGuard)
  async updateStatusEnvio(
    @Param('id') id: string,
    @Body() body: { status_envio: 'pendiente' | 'enviado' }
  ) {
    return this.ordersService.updateStatusEnvio(+id, body.status_envio);
  }

  @Delete(':id')
  @UseGuards(AuthGuard)
  remove(@Param('id') id: string) {
    return this.ordersService.remove(+id);
  }

}
