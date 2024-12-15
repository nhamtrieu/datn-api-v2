import { OmitType, PartialType } from "@nestjs/swagger";
import { DriverDto } from "./driver.dto";

export class DriverUpdateDto extends PartialType(
  OmitType(DriverDto, ["id"] as const),
) {
  @IsOptional()
  @IsString()
  password?: string;
}
