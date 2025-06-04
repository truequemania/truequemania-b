import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Req, Request } from '@nestjs/common';
import { ComplaintsService } from './complaints.service';
import { CreateComplaintDto } from './dto/create-complaint.dto';
import { UpdateComplaintDto } from './dto/update-complaint.dto';
import { ApiTags } from '@nestjs/swagger';
import { AuthGuard } from 'src/users/guard/auth.guard';

@ApiTags('Denuncias')
@Controller('complaints')
export class ComplaintsController {
  constructor(private complaintsService: ComplaintsService) { }

  @Post()
  create(@Body() dto: CreateComplaintDto) {
    return this.complaintsService.create(dto);
  }

  @Get()
  findAll() {
    return this.complaintsService.findAll();
  }

  @UseGuards(AuthGuard)
  @Get('by-user')
  async findByUser(@Request() req) {
    const email = req.user.email;
    return this.complaintsService.findByUser(email);
  }

  @Patch(':id')
  update(@Param('id') id: number, @Body() dto: UpdateComplaintDto) {
    return this.complaintsService.update(+id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: number) {
    return this.complaintsService.remove(+id);
  }
}

