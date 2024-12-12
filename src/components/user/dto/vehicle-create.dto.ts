import { OmitType, PartialType } from "@nestjs/swagger";
import VehicleDto from "./vehicle.dto";

class VehicleCreateDto extends PartialType(OmitType(VehicleDto, ["id"])) {}

export default VehicleCreateDto;
