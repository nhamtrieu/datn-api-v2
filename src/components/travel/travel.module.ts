import { Module } from "@nestjs/common";
import { TravelController } from "./travel.controller";
import { TravelService } from "./travel.service";
import { FirebaseModule } from "../firebase/firebase.module";
import { DriverModule } from "../driver/driver.module";
import { LocationDto } from "@/dto/location.dto";

@Module({
  imports: [FirebaseModule, DriverModule, LocationDto],
  controllers: [TravelController],
  providers: [TravelService],
  exports: [TravelService],
})
export class TravelModule {}
