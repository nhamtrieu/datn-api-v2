import { IsString, IsOptional } from "class-validator";
import { StatusEnum } from "../../../enum/status.enum";

export class UserResponseDto {
  @IsString()
  id: string;

  @IsString()
  fullName: string;

  @IsString()
  phoneNumber: string;

  @IsOptional()
  @IsString()
  userAvatar?: string;

  @IsOptional()
  status?: StatusEnum;

  @IsOptional()
  @IsString()
  email?: string;
}
