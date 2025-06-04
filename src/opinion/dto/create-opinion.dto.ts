import { IsString } from 'class-validator';
import { User } from 'src/users/entities/user.entity';

export class CreateOpinionDto {
  @IsString()
  descripcion: string;
  user: User;
}
