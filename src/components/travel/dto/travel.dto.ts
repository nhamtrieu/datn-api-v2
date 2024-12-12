import { LocationDto } from "../../../dto/location.dto";
import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsNumber, IsObject, IsString } from "class-validator";

export class TravelDto {
  @IsString()
  @IsNotEmpty()
  @ApiProperty({ type: String })
  id: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty({ type: String })
  userId: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty({ type: String })
  driverId: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty({ type: String })
  status: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty({ type: String })
  timeStart: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty({ type: String })
  timeEnd: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty({ type: String })
  pickupString: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty({ type: String })
  destinationString: string;

  @IsObject()
  @ApiProperty({ type: LocationDto })
  pickup: LocationDto;

  @IsObject()
  @ApiProperty({ type: LocationDto })
  destination: LocationDto;

  @IsNumber()
  @ApiProperty({ type: Number })
  fare: number;

  @IsNumber()
  @ApiProperty({ type: Number })
  distance: number;

  @IsNumber()
  @ApiProperty({ type: Number })
  duration: number;

  @IsNumber()
  @ApiProperty({ type: Number })
  durationInTraffic: number;

  @IsString()
  @IsNotEmpty()
  @ApiProperty({ type: String })
  polyline: string;
}
