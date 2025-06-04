import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request, Query, Res, HttpException, HttpStatus } from '@nestjs/common';
import { PaypalService } from './paypal.service';
import { CreatePaypalDto } from './dto/create-paypal.dto';
import { UpdatePaypalDto } from './dto/update-paypal.dto';
import { AuthGuard } from 'src/users/guard/auth.guard';
import { URL_FRONTEND } from 'src/url';

@Controller('paypal')
export class PaypalController {
  constructor(private readonly paypalService: PaypalService) { }

  @Post('create')
  @UseGuards(AuthGuard)
  async createPaypalPayment(@Request() req, @Body() body) {
    const email = req.user.email;
    const { plan } = body;
    try {
      const tokenInfo = await this.paypalService.createPayment(email, plan);
      return tokenInfo;
    } catch (error) {
      // Mejorar: enviar mensaje específico al frontend
      const msg = error?.message || 'Error interno al crear el pago';
      throw new HttpException({ message: msg }, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Get('capture')
  async capturePayment(
    @Query('token') token: string,
    @Query('email') email: string,
    @Query('plan') plan: string, // <-- Añadido para recibir el nombre del plan
    @Res() res
  ) {
    try {
      await this.paypalService.capturePayment(token, { email, plan }); // <-- Pasar el plan
      return res.redirect(`${URL_FRONTEND}/gracias`);
    } catch (error) {
      // Mejorar: enviar mensaje específico al frontend
      const msg = error?.message || 'Error capturando pago';
      return res.status(500).send(`<script>alert('${msg.replace(/'/g, "\'")}');window.location='${URL_FRONTEND}/planes';</script>`);
    }
  }
  
}
