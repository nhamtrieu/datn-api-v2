import { ApiProperty } from "@nestjs/swagger";
import {
  IsLatitude,
  IsLongitude,
  IsNotEmpty,
  IsObject,
  IsString,
} from "class-validator";

class LocationDto {
  @IsLatitude()
  @ApiProperty({ type: Number })
  latitude: number;

  @IsLongitude()
  @ApiProperty({ type: Number })
  longitude: number;
}

export class TravelFareDto {
  @IsObject()
  @IsNotEmpty()
  @ApiProperty({ type: LocationDto })
  pickup: LocationDto;

  @IsObject()
  @IsNotEmpty()
  @ApiProperty({ type: LocationDto })
  destination: LocationDto;

  @IsString()
  @IsNotEmpty()
  @ApiProperty({ type: String })
  pickupString: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty({ type: String })
  destinationString: string;
}
