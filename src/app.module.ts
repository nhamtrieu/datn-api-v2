import { Module } from "@nestjs/common";
import { TravelModule } from "./components/travel/travel.module";
import { UserModule } from "./components/user/user.module";
import { FirebaseModule } from "./components/firebase/firebase.module";
import { DriverModule } from "./components/driver/driver.module";
import { AuthModule } from "./components/auth/auth.module";

@Module({
  imports: [TravelModule, UserModule, FirebaseModule, DriverModule, AuthModule],
})
export class AppModule {}
