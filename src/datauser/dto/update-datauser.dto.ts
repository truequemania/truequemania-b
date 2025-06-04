import { PartialType } from '@nestjs/swagger';
import { CreateDatauserDto } from './create-datauser.dto';

export class UpdateDatauserDto extends PartialType(CreateDatauserDto) {}
