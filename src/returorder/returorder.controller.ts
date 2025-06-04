import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, UseInterceptors, Request, UploadedFiles } from '@nestjs/common';
import { ReturnorderService } from './returorder.service';
import { CreateReturnorderDto } from './dto/create-returorder.dto';
import { UpdateReturnorderDto } from './dto/update-returorder.dto';
import { AuthGuard } from 'src/users/guard/auth.guard';

@Controller('returnorder')
export class ReturnorderController {
  constructor(private readonly service: ReturnorderService) { }

  @Post()
  @UseGuards(AuthGuard)
  async create(
    @Request() req,
    @Body() newReturn: CreateReturnorderDto,
  ) {
    const email = req.user.email;
    return await this.service.create(email, newReturn);
  }

  @Get()
  @UseGuards(AuthGuard)
  findAll() {
    return this.service.findAll();
  }

  @Get('buyer/me')
  @UseGuards(AuthGuard)
  async findMyBuyerReturns(@Request() req) {
    const email = req.user.email;
    return this.service.findBuyerReturns(email);
  }

  @Get('seller/me')
  @UseGuards(AuthGuard)
  async findMySellerReturns(@Request() req) {
    const email = req.user.email;
    return this.service.findSellerReturns(email);
  }

  @Get(':id')
  @UseGuards(AuthGuard)
  findOne(@Param('id') id: string) {
    return this.service.findOne(+id);
  }

  @Patch(':id')
  @UseGuards(AuthGuard)
  update(@Param('id') id: string, @Body() dto: UpdateReturnorderDto) {
    return this.service.update(+id, dto);
  }

  @Delete(':id')
  @UseGuards(AuthGuard)
  remove(@Param('id') id: string) {
    return this.service.remove(+id);
  }
}
