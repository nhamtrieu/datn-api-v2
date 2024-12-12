import {
  IsNotEmpty,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
} from "class-validator";
import { ApiProperty } from "@nestjs/swagger";
import { LocationDto } from "../../../dto/location.dto";
export class DriverDto {
  @IsString()
  @IsNotEmpty()
  @ApiProperty()
  id: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty()
  password: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty()
  fullName: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty()
  phoneNumber: string;

  @IsString()
  @IsOptional()
  @ApiProperty()
  drivingLicense?: string;

  @IsString()
  @IsOptional()
  @ApiProperty()
  judicialRecords?: string;

  @IsString()
  @IsOptional()
  @ApiProperty()
  avatar?: string;

  @IsString()
  @IsOptional()
  @ApiProperty()
  licensePlate?: string;

  @IsString()
  @IsOptional()
  @ApiProperty()
  citizenIdentificationFront?: string;

  @IsString()
  @IsOptional()
  @ApiProperty()
  citizenIdentificationBack?: string;

  @IsString()
  @IsOptional()
  @ApiProperty()
  fcmToken?: string;

  @IsObject()
  @IsOptional()
  @ApiProperty()
  location?: LocationDto;

  @IsString()
  @IsOptional()
  @ApiProperty()
  status?: string;

  @IsNumber()
  @IsOptional()
  @ApiProperty()
  rate?: number;

  @IsObject()
  @IsOptional()
  @ApiProperty()
  rateDriver?: number[];

  @IsOptional()
  @IsNumber()
  @ApiProperty()
  avgRate?: number;

  @IsString()
  @IsOptional()
  @ApiProperty()
  response?: string;
}
