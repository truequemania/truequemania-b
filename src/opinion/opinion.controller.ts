import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request } from '@nestjs/common';
import { OpinionService } from './opinion.service';
import { CreateOpinionDto } from './dto/create-opinion.dto';
import { UpdateOpinionDto } from './dto/update-opinion.dto';
import { ApiTags } from '@nestjs/swagger';
import { AuthGuard } from 'src/users/guard/auth.guard';

@ApiTags('Opinion')
@Controller('opinion')
export class OpinionController {
  constructor(private readonly opinionService: OpinionService) { }

  @Post()
  @UseGuards(AuthGuard) 
  async create(@Request() req, @Body() createOpinionDto: CreateOpinionDto) {
    const email = req.user.email; 
    return this.opinionService.create(createOpinionDto, email); 
  }

  @Get()
  findAll() {
    return this.opinionService.findAll();
  }

  @Get(':id')
  @UseGuards(AuthGuard)
  findOne(@Param('id') id: string) {
    return this.opinionService.findOne(+id);
  }

  @Patch(':id')
  @UseGuards(AuthGuard)
  update(@Param('id') id: string, @Body() updateOpinionDto: UpdateOpinionDto) {
    return this.opinionService.update(+id, updateOpinionDto);
  }

  @Delete(':id')
  @UseGuards(AuthGuard)
  remove(@Param('id') id: string) {
    return this.opinionService.remove(+id);
  }
}
