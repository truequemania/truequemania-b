import { Transform } from "class-transformer";
import { IsEmail, IsString, MinLength, IsOptional } from "class-validator";

export class CreateContactDto {
    @IsString()
    @MinLength(1)
    name: string;
    @IsEmail()
    email: string;
    @IsString()
    @MinLength(6)
    @Transform(({ value }) => value.trim())
    message: string;
    @IsString()
    @MinLength(6)
    phone: string;
    @IsOptional() 
    @IsString()
    city?: string;
    @IsString()
    @MinLength(3)
    subject: string;
}
