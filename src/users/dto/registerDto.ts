import { Transform } from "class-transformer";
import { IsArray, IsEmail, IsNotEmpty, IsOptional, IsString, MinLength } from "class-validator";

export class RegisterDto {
  @IsString()
  @MinLength(1)
  name: string;
  @IsString()
  lastName: string;
  @IsEmail()
  email: string;
  @IsString()
  @MinLength(6)
  @Transform(({ value }) => value.trim())
  password: string;
  @IsNotEmpty()
  role: string;
}

