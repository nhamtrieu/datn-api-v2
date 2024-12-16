import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Put,
  Res,
} from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { DriverCreateDto } from "./dto";
import { DriverService } from "./driver.service";
import { DriverLoginDto } from "./dto/driver-login.dto";
import { DriverUpdateDto } from "./dto/driver-update.dto";
import { DriverFcmTokenDto } from "./dto/driver-fcm-token.dto";
import { LocationDto } from "../../dto/location.dto";
import { Response } from "express";

@Controller("driver")
@ApiTags("Driver")
export class DriverController {
  constructor(private readonly driverService: DriverService) {}

  @Post("register")
  async register(@Body() body: DriverCreateDto, @Res() res: Response) {
    return res
      .status(HttpStatus.CREATED)
      .json(await this.driverService.register(body));
  }

  @Post("login")
  @HttpCode(200)
  async login(@Body() body: DriverLoginDto, @Res() res: Response) {
    return res.status(HttpStatus.OK).json(await this.driverService.login(body));
  }

  @Get(":id")
  async get(@Param("id") id: string) {
    return await this.driverService.get(id);
  }

  @Put(":id")
  async update(@Param("id") id: string, @Body() body: DriverUpdateDto) {
    console.log("in controller: ", id, body);
    return await this.driverService.update(id, body);
  }

  @Delete(":id")
  async delete(@Param("id") id: string) {
    return await this.driverService.delete(id);
  }

  @Get()
  async getDrivers() {
    return await this.driverService.getDrivers();
  }

  @Post("update-driver-fcm-token")
  async updateDriverFcmToken(@Body() body: DriverFcmTokenDto) {
    console.log(body);
    return await this.driverService.updateDriverToken(
      body.driverId,
      body.token,
    );
  }
  @Post(":driverId/update-driver-response")
  async updateDriverResponse(
    @Param("driverId") driverId: string,
    @Body() body: { response: string | null; userId: string },
  ) {
    return await this.driverService.updateDriverResponse(
      driverId,
      body.response,
      body.userId,
    );
  }

  @Post(":driverId/update-driver-location")
  async updateDriverLocation(
    @Param("driverId") driverId: string,
    @Body() body: LocationDto,
  ) {
    return await this.driverService.updateDriverLocation(driverId, body);
  }

  @Post(":driverId/update-driver-status")
  async updateDriverStatus(
    @Param("driverId") driverId: string,
    @Body() body: { status: string },
    @Res() res: Response,
  ) {
    return res
      .status(200)
      .json(await this.driverService.updateDriverStatus(driverId, body.status));
  }
}
