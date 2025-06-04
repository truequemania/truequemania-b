
import { Controller, Get, Req, Res, UseGuards } from '@nestjs/common';
import { GoogleService } from './google.service';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags } from '@nestjs/swagger';
import { URL_FRONTEND } from '../url'; 

@ApiTags('Google')
@Controller('google')
export class GoogleController {
  constructor(private readonly GoogleService: GoogleService) { }

  @Get()
  @UseGuards(AuthGuard('google'))
  async googleAuth(@Req() req) { }

  @Get('redirect')
  @UseGuards(AuthGuard('google'))
  async googleAuthRedirect(@Req() req, @Res() res) {
    const userData = await this.GoogleService.googleLogin(req);
    res.redirect(`${URL_FRONTEND}/iniciar-sesion/?token=${userData.token}`);
  }
}

 

