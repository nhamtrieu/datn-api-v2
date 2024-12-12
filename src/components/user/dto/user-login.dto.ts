import { ApiProperty } from "@nestjs/swagger";
import { IsString, IsNotEmpty } from "class-validator";

export class UserLoginDto {
  @IsString()
  @IsNotEmpty()
  @ApiProperty()
  phoneNumber: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty()
  password: string;
}
