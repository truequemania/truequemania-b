import { ApiProperty } from "@nestjs/swagger";

export class UpdateCategoryDto {
  @ApiProperty()
  nombre?: string;
  @ApiProperty()
  descripcion?: string;
}
