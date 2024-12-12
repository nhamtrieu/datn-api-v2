import { OmitType } from "@nestjs/mapped-types";
import { DriverDto } from "./driver.dto";

export class DriverResponseDto extends OmitType(DriverDto, [
  "password",
] as const) {}
