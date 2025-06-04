import { PartialType } from '@nestjs/swagger';
import { CreateCommentarticleDto } from './create-commentarticle.dto';

export class UpdateCommentarticleDto extends PartialType(CreateCommentarticleDto) {}
