import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsNumber, IsString } from "class-validator";

class VehicleDto {
  @IsString()
  @IsNotEmpty()
  @ApiProperty({ type: String })
  id: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty()
  plateNumber: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty()
  name: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty()
  model: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty()
  color: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty()
  image: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty()
  status: string;

  @IsNumber()
  @IsNotEmpty()
  @ApiProperty()
  seat: number;
}

export default VehicleDto;
