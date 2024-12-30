import { IsString, IsNotEmpty, IsOptional } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";
import VehicleDto from "./vehicle.dto";
import { LocationDto } from "../../../dto/location.dto";

export class UserDto {
  @IsString()
  @IsNotEmpty()
  @ApiProperty({ type: String })
  id: string;

  @IsString()
  @ApiProperty({ type: String })
  fullName: string;

  @IsString()
  @ApiProperty({ type: String })
  phoneNumber: string;

  @IsString()
  @ApiProperty({ type: String })
  userAvatar: string;

  @IsString()
  @ApiProperty({ type: String })
  password: string;

  @IsOptional()
  @ApiProperty({ type: [VehicleDto] })
  vehicles: VehicleDto[];

  @IsOptional()
  @ApiProperty({ type: String })
  fcmToken: string;

  @IsOptional()
  @ApiProperty({ type: LocationDto })
  userLocation: LocationDto;

  @IsOptional()
  @ApiProperty({ type: String })
  email: string;
}
