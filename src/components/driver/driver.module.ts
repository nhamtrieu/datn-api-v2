import { Module } from "@nestjs/common";
import { DriverController } from "./driver.controller";
import { DriverService } from "./driver.service";
import { FirebaseModule } from "../firebase/firebase.module";
import { AuthModule } from "../auth/auth.module";

@Module({
  imports: [FirebaseModule, AuthModule],
  controllers: [DriverController],
  providers: [DriverService],
  exports: [DriverService],
})
export class DriverModule {}
