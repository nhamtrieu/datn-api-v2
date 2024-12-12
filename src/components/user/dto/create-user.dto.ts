import { IsNotEmpty, IsString, IsOptional, IsEnum } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";
import { StatusEnum } from "@/enum/status.enum";

export class CreateUserDto {
  @IsNotEmpty()
  @IsString()
  @ApiProperty({ type: String })
  phoneNumber: string;

  @IsNotEmpty()
  @IsString()
  @ApiProperty({ type: String })
  password: string;

  @IsOptional()
  @IsString()
  @ApiProperty({ type: String })
  userAvatar?: string;

  @IsOptional()
  @IsEnum(StatusEnum)
  @ApiProperty({ enum: StatusEnum })
  status?: StatusEnum;
}
