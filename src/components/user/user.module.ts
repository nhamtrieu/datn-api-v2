import { Module } from "@nestjs/common";
import { UserService } from "./user.service";
import { UserController } from "./user.controller";
import { FirebaseModule } from "../firebase/firebase.module";
import { AuthModule } from "../auth/auth.module";
import { TravelModule } from "../travel/travel.module";

@Module({
  imports: [FirebaseModule, AuthModule, TravelModule],
  controllers: [UserController],
  providers: [UserService],
  exports: [],
})
export class UserModule {}
