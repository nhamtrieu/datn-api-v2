import {
  Body,
  Controller,
  Param,
  Post,
  Put,
  Delete,
  Get,
  Res,
  HttpStatus,
} from "@nestjs/common";
import { ApiBody, ApiTags } from "@nestjs/swagger";
import { UserService } from "./user.service";
import { CreateUserDto } from "./dto/create-user.dto";
import { UserUpdateDto } from "./dto/user-update.dto";
import { UserLoginDto } from "./dto/user-login.dto";
import VehicleCreateDto from "./dto/vehicle-create.dto";
import { Response } from "express";
import { LocationDto } from "../../dto/location.dto";
import { TravelService } from "../travel/travel.service";
import VehicleUpdateDto from "./dto/vehicle-update.dto";

@Controller("user")
@ApiTags("User")
export class UserController {
  constructor(
    private readonly userService: UserService,
    private readonly travelService: TravelService,
  ) {}

  @Post("register")
  @ApiBody({ type: CreateUserDto })
  async createUser(@Body() body: CreateUserDto, @Res() res: Response) {
    try {
      return res
        .status(HttpStatus.CREATED)
        .json(await this.userService.registerUser(body));
    } catch (error) {
      console.log(error);
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        message: "Internal server error",
        code: 500,
        data: null,
      });
    }
  }

  @Put(":id")
  async updateUser(
    @Param("id") id: string,
    @Body() body: UserUpdateDto,
    @Res() res: Response,
  ) {
    try {
      return res
        .status(HttpStatus.OK)
        .json(await this.userService.updateUser(id, body));
    } catch (error) {
      console.log(error);
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        message: "Internal server error",
        code: 500,
        data: null,
      });
    }
  }

  @Put(":id/update-password")
  async updateUserPassword(
    @Param("id") id: string,
    @Body() body: { password: string; oldPassword: string },
    @Res() res: Response,
  ) {
    return res
      .status(HttpStatus.OK)
      .json(
        await this.userService.updateUserPassword(
          id,
          body.password,
          body.oldPassword,
        ),
      );
  }

  @Delete(":id")
  async deleteUser(@Param("id") id: string, @Res() res: Response) {
    try {
      return res
        .status(HttpStatus.OK)
        .json(await this.userService.deleteUser(id));
    } catch (error) {
      console.log(error);
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        message: "Internal server error",
        code: 500,
        data: null,
      });
    }
  }

  @Get(":id")
  async getUser(@Param("id") id: string, @Res() res: Response) {
    try {
      return res.status(HttpStatus.OK).json(await this.userService.getUser(id));
    } catch (error) {
      console.log(error);
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        message: "Internal server error",
        code: 500,
        data: null,
      });
    }
  }

  @Get()
  async getUsers(@Res() res: Response) {
    try {
      return res.status(HttpStatus.OK).json(await this.userService.getUsers());
    } catch (error) {
      console.log(error);
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        message: "Internal server error",
        code: 500,
        data: null,
      });
    }
  }

  @Post("login")
  async login(@Body() body: UserLoginDto, @Res() res: Response) {
    try {
      return res.status(HttpStatus.OK).json(await this.userService.login(body));
    } catch (error) {
      console.log(error);
    }
  }

  @Post(":id/add-vehicle")
  async addVehicle(@Param("id") id: string, @Body() body: VehicleCreateDto) {
    return await this.userService.addVehicle(id, body);
  }

  @Get(":id/vehicles")
  async getVehicles(@Param("id") id: string, @Res() res: Response) {
    return res
      .status(HttpStatus.OK)
      .json(await this.userService.getVehicles(id));
  }

  @Post(":id/update-fcm-token")
  async updateUserFcmToken(
    @Param("id") id: string,
    @Body() body: { token: string },
    @Res() res: Response,
  ) {
    console.log("body", body);
    return res
      .status(HttpStatus.OK)
      .json(await this.userService.updateUserFcmToken(id, body.token));
  }

  @Post(":id/rate-driver")
  async rateDriver(
    @Param("id") id: string,
    @Body() body: { driverId: string; rating: number },
    @Res() res: Response,
  ) {
    return res
      .status(HttpStatus.OK)
      .json(await this.userService.rateDriver(id, body));
  }

  @Post(":id/update-user-location")
  async updateUserLocation(@Param("id") id: string, @Body() body: LocationDto) {
    return await this.userService.updateUserLocation(id, body);
  }

  @Get(":userId/travels-history")
  async getTravelsHistoryByUser(
    @Param("userId") userId: string,
    @Res() res: Response,
  ) {
    return res
      .status(HttpStatus.OK)
      .json(await this.travelService.getTravelsHistoryByUser(userId));
  }

  @Post(":id/choose-vehicle")
  async chooseVehicle(
    @Param("id") id: string,
    @Body() body: { vehicleId: string },
  ) {
    console.log("body", body);
    return await this.userService.chooseVehicle(id, body.vehicleId);
  }

  @Get(":id/vehicle-active")
  async getVehicle(@Param("id") id: string) {
    return await this.userService.getVehicle(id);
  }

  @Put(":id/update-vehicle/:vehicleId")
  async updateVehicle(
    @Param("id") id: string,
    @Param("vehicleId") vehicleId: string,
    @Body() body: VehicleUpdateDto,
  ) {
    console.log("body", body);
    return await this.userService.updateVehicle(id, vehicleId, body);
  }
}
