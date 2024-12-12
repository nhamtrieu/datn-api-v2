import { OmitType } from "@nestjs/mapped-types";
import { DriverDto } from "./driver.dto";

export class DriverCreateDto extends OmitType(DriverDto, ["id"] as const) {}
