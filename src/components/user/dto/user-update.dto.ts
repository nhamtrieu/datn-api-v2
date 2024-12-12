import { OmitType, PartialType } from "@nestjs/swagger";
import { UserDto } from "./user.dto";

export class UserUpdateDto extends PartialType(OmitType(UserDto, ["id"])) {}
