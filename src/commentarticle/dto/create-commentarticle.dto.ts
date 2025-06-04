import { ApiProperty } from "@nestjs/swagger";

export class CreateCommentarticleDto {
    @ApiProperty()
    articulo_id: number;
    @ApiProperty()
    comentario: string;
}
