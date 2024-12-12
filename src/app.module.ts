import { Module } from "@nestjs/common";
import { TravelModule } from "./components/travel/travel.module";
import { UserModule } from "./components/user/user.module";
import { FirebaseModule } from "./components/firebase/firebase.module";
import { DriverModule } from "./components/driver/driver.module";
import { AuthModule } from "./components/auth/auth.module";
import { LocationDto } from "./dto/location.dto";

@Module({
  imports: [
    TravelModule,
    UserModule,
    FirebaseModule,
    DriverModule,
    AuthModule,
    LocationDto,
  ],
})
export class AppModule {}
