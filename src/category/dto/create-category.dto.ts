import { ApiProperty } from '@nestjs/swagger';
import { Express } from 'express';

export class CreateCategoryDto {
  @ApiProperty()
  nombre: string;
  @ApiProperty()
  descripcion: string;
  @ApiProperty()
  imagen: Express.Multer.File;
}
