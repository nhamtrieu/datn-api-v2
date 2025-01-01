import {
  MiddlewareConsumer,
  Module,
  NestModule,
  RequestMethod,
} from "@nestjs/common";
import { TravelModule } from "./components/travel/travel.module";
import { UserModule } from "./components/user/user.module";
import { FirebaseModule } from "./components/firebase/firebase.module";
import { DriverModule } from "./components/driver/driver.module";
import { AuthModule } from "./components/auth/auth.module";
import { AuthMiddleware } from "./middleware/auth.middleware";

@Module({
  imports: [TravelModule, UserModule, FirebaseModule, DriverModule, AuthModule],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(AuthMiddleware)
      .exclude(
        {
          path: "user/login",
          method: RequestMethod.POST,
        },
        {
          path: "user/register",
          method: RequestMethod.POST,
        },
        {
          path: "driver/login",
          method: RequestMethod.POST,
        },
        {
          path: "driver/register",
          method: RequestMethod.POST,
        },
        {
          path: "docs",
          method: RequestMethod.ALL,
        },
        {
          path: "docs/(.*)",
          method: RequestMethod.ALL,
        },
      )
      .forRoutes("*");
  }
}
