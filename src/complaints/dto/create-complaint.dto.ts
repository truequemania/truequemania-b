import { IsNumber, IsString, MinLength } from 'class-validator';

export class CreateComplaintDto {
    @IsNumber()
    chatId: number;

    @IsString()
    motivo: string;

    @IsString()
    @MinLength(10, { message: 'La descripción debe tener al menos 10 caracteres' })
    descripcion: string;
}
