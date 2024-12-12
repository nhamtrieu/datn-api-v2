import { Module } from "@nestjs/common";
import { UserService } from "./user.service";
import { UserController } from "./user.controller";
import { FirebaseModule } from "../firebase/firebase.module";
import { AuthModule } from "../auth/auth.module";
import { TravelModule } from "../travel/travel.module";
import { LocationDto } from "@/dto/location.dto";

@Module({
  imports: [FirebaseModule, AuthModule, TravelModule, LocationDto],
  controllers: [UserController],
  providers: [UserService],
  exports: [],
})
export class UserModule {}
