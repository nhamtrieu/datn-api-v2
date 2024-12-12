import { ApiProperty } from "@nestjs/swagger";
import { IsString } from "class-validator";

import { IsNotEmpty } from "class-validator";

export class DriverFcmTokenDto {
  @IsString()
  @IsNotEmpty()
  @ApiProperty()
  token: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty()
  driverId: string;
}
