import { IsNotEmpty, IsString } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";
import { LocationDto } from "@/dto/location.dto";

export class TravelBookingDto {
  @IsString()
  @IsNotEmpty()
  @ApiProperty()
  userId: string;

  @IsNotEmpty()
  @ApiProperty()
  pickupLocation: LocationDto;

  @IsNotEmpty()
  @ApiProperty()
  destinationLocation: LocationDto;

  @IsNotEmpty()
  @ApiProperty()
  fare: number;

  @IsNotEmpty()
  @ApiProperty()
  polyline: string;

  @IsNotEmpty()
  @ApiProperty()
  distance: number;

  @IsNotEmpty()
  @ApiProperty()
  duration: number;

  @IsNotEmpty()
  @ApiProperty()
  durationInTraffic: number;

  @IsNotEmpty()
  @ApiProperty()
  pickupString: string;

  @IsNotEmpty()
  @ApiProperty()
  destinationString: string;
}
