import { IsString, IsNotEmpty } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class DriverLoginDto {
  @IsString()
  @IsNotEmpty()
  @ApiProperty()
  phoneNumber: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty()
  password: string;
}
