import { IsString, IsOptional } from "class-validator";

export class UpdateUserDto {
  @IsOptional()
  @IsString()
  phoneNumber?: string;

  @IsOptional()
  @IsString()
  password?: string;

  @IsOptional()
  @IsString()
  userAvatar?: string;
}
