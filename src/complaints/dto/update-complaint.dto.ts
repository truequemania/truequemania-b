import { PartialType } from '@nestjs/swagger';
import { CreateComplaintDto } from './create-complaint.dto';

export class UpdateComplaintDto extends PartialType(CreateComplaintDto) {
    estado?: 'pendiente' | 'resuelto' | 'rechazado';
    resolucionMensaje?: string;
}
