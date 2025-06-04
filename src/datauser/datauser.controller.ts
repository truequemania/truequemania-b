import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request, Res, UseInterceptors, UploadedFile } from '@nestjs/common';
import { DatauserService } from './datauser.service';
import { CreateDatauserDto } from './dto/create-datauser.dto';
import { UpdateDatauserDto } from './dto/update-datauser.dto';
import { ApiTags } from '@nestjs/swagger';
import { AuthGuard } from 'src/users/guard/auth.guard';
import { FileInterceptor } from '@nestjs/platform-express';

@ApiTags('DataUser')
@Controller('datauser')
export class DatauserController {
  constructor(private readonly datauserService: DatauserService) { }

  @Post()
  @UseGuards(AuthGuard)
  @UseInterceptors(FileInterceptor('imagen'))
  create(
    @Request() req,
    @UploadedFile() imagen: Express.Multer.File,
    @Body() createDatauserDto: CreateDatauserDto) {
    const email = req.user.email;
    return this.datauserService.create(email, createDatauserDto, imagen);
  }

  @Get('me')
  @UseGuards(AuthGuard)
  getMyData(@Request() req) {
    const email = req.user.email;
    return this.datauserService.findByEmail(email);
  }

  @UseInterceptors(FileInterceptor('imagen'))
  @Patch(':id')
  @UseGuards(AuthGuard)
  update(
    @Param('id') id: string,
    @Request() req,
    @UploadedFile() imagen: Express.Multer.File,
    @Body() updateDatauserDto: UpdateDatauserDto
  ) {
    const email = req.user.email;
    return this.datauserService.update(+id, updateDatauserDto, email, imagen);
  }

  @Get('clientes')
  async getAllClientes() {
    return this.datauserService.findAllClientes();
  }

}
