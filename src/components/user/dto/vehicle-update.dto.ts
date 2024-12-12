import { OmitType, PartialType } from "@nestjs/swagger";
import VehicleDto from "./vehicle.dto";

class VehicleUpdateDto extends PartialType(OmitType(VehicleDto, ["id"])) {}

export default VehicleUpdateDto;
