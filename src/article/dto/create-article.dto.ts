import { ApiProperty } from '@nestjs/swagger';
import { Express } from 'express';

export class CreateArticleDto {
  
  @ApiProperty({ description: 'Nombre único del artículo' })
  nombre: string;

  @ApiProperty({ description: 'Descripción corta' })
  descripcion_corta: string;

  @ApiProperty({ description: 'Descripción larga' })
  descripcion_larga: string;

  @ApiProperty({ description: 'Marca del artículo' })
  marca: string;

  @ApiProperty({ description: 'ID de la categoría del artículo' })
  categoria_id: number;

  @ApiProperty({ description: 'Estado del artículo (nuevo, usado, etc.)' })
  estado: string;
  
  @ApiProperty({ description: 'Precio con descuento', required: false })
  precio: number;

  @ApiProperty({ description: 'Precio con descuento', required: false })
  impuesto: number;

  @ApiProperty({ description: 'Precio con descuento', required: false })
  precioImpuesto: number;

  imagenes: Express.Multer.File[];
}
