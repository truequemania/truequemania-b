import {
    IsEmail,
    IsNotEmpty,
    MinLength,
    IsOptional,
    IsArray,
  } from 'class-validator';
  
  export class CreateRegisterAdminDto {
    @IsNotEmpty()
    name: string;
  
    @IsNotEmpty()
    lastName: string;
  
    @IsEmail()
    email: string;
  
    @MinLength(6)
    password: string;
  
    @IsNotEmpty()
    role: string;
  }
  