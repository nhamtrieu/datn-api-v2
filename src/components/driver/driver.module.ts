import { Module } from "@nestjs/common";
import { DriverController } from "./driver.controller";
import { DriverService } from "./driver.service";
import { FirebaseModule } from "../firebase/firebase.module";
import { AuthModule } from "../auth/auth.module";
import { LocationDto } from "@/dto/location.dto";

@Module({
  imports: [FirebaseModule, AuthModule, LocationDto],
  controllers: [DriverController],
  providers: [DriverService],
  exports: [DriverService],
})
export class DriverModule {}
