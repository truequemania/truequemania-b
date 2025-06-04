import {
    IsString,
    IsNotEmpty,
    IsDateString,
    IsIn,
    Length
} from 'class-validator';

export class CreateDatauserDto {
    @IsDateString()
    @IsNotEmpty({ message: 'La fecha de nacimiento es obligatoria' })
    fecha_nacimiento: string;

    @IsString()
    @IsNotEmpty({ message: 'El tipo de documento es obligatorio' })
    tipo_documento: string;

    @IsString()
    @IsNotEmpty({ message: 'El número de documento es obligatorio' })
    numero_documento: string;

    @IsString()
    @IsIn(['Masculino', 'Femenino', 'No identificado'], {
        message: 'El género debe ser Masculino, Femenino o No identificado',
    })
    genero: string;

    @IsString()
    @Length(7, 20, { message: 'El teléfono debe tener entre 7 y 20 caracteres' })
    telefono: string;
}
