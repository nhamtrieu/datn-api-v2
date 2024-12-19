import { Injectable } from "@nestjs/common";
import { FirebaseService } from "../firebase/firebase.service";
import { DriverCreateDto, DriverDto } from "./dto";
import { ResponseDto } from "@/dto/response.dto";
import { DriverResponseDto } from "./dto/driver-response.dto";
import * as bcryptjs from "bcryptjs";
import { v4 as uuidv4 } from "uuid";
import { DriverLoginDto } from "./dto/driver-login.dto";
import { DriverUpdateDto } from "./dto/driver-update.dto";
import { JwtService } from "@nestjs/jwt";
import { LocationDto } from "../../dto/location.dto";
import { UserDto } from "../user/dto/user.dto";

@Injectable()
export class DriverService {
  constructor(
    private readonly firebaseService: FirebaseService,
    private readonly jwtService: JwtService,
  ) {}

  async register(
    body: DriverCreateDto,
  ): Promise<ResponseDto<DriverResponseDto>> {
    console.log(body);
    const checkDriver = await this.firebaseService.getDriverByPhoneNumber(
      body.phoneNumber,
    );
    if (checkDriver) {
      return {
        status: "error",
        message: "Số điện thoại đã được đăng ký",
        data: null,
        code: 409,
      };
    }

    const hashedPassword = await bcryptjs.hash(body.password, 10);
    const id = uuidv4();

    const newDriver: DriverDto = {
      ...body,
      password: hashedPassword,
      id,
      response: "new",
      avatar: body.avatar
        ? body.avatar
        : "https://as1.ftcdn.net/v2/jpg/07/95/95/14/1000_F_795951406_h17eywwIo36DU2L8jXtsUcEXqPeScBUq.jpg",
    };

    await this.firebaseService.setData(`drivers/${newDriver.id}`, newDriver);

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, ...driver } = newDriver;

    return {
      status: "success",
      message: "Đăng ký người dùng thành công",
      data: driver,
      code: 201,
    };
  }

  async login(
    body: DriverLoginDto,
  ): Promise<
    ResponseDto<DriverResponseDto & { token: string; refreshToken: string }>
  > {
    const driver = await this.firebaseService.getDriverByPhoneNumber(
      body.phoneNumber,
    );

    if (!driver) {
      return {
        status: "error",
        message: "Tên đăng nhập hoặc mật khẩu không đúng",
        data: null,
        code: 404,
      };
    }

    const isPasswordValid = await bcryptjs.compare(
      body.password,
      driver.password,
    );

    if (!isPasswordValid) {
      return {
        status: "error",
        message: "Tên đăng nhập hoặc mật khẩu không đúng",
        data: null,
        code: 401,
      };
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, ...driverData } = driver;
    const payload = {
      fullname: driverData.fullname,
      sub: driverData.id,
    };

    const token = await this.jwtService.signAsync(payload);
    const refreshToken = await this.jwtService.signAsync(payload, {
      expiresIn: "1h",
    });

    return {
      status: "success",
      message: "Đăng nhập thành công",
      data: { ...driverData, token, refreshToken },
      code: 200,
    };
  }

  async delete(id: string): Promise<ResponseDto<string>> {
    await this.firebaseService.deleteData(`drivers/${id}`);

    return {
      status: "success",
      message: "Driver deleted successfully",
      data: null,
      code: 200,
    };
  }

  async get(id: string): Promise<ResponseDto<DriverResponseDto>> {
    const driver = await this.firebaseService.getData(`drivers/${id}`);
    return {
      status: "success",
      message: "Driver fetched successfully",
      data: driver,
      code: 200,
    };
  }

  async update(
    id: string,
    body: DriverUpdateDto,
  ): Promise<ResponseDto<DriverResponseDto>> {
    const driver = await this.firebaseService.getData(`drivers/${id}`);
    if (!driver) {
      return {
        status: "error",
        message: "Tài xế không tồn tại",
        data: null,
        code: 404,
      };
    }

    if (body.password) {
      const hashedPassword = await bcryptjs.hash(body.password, 10);
      body.password = hashedPassword;
    }

    const driverUpdate: DriverDto = {
      ...driver,
      ...body,
    };

    await this.firebaseService.setData(`drivers/${id}`, driverUpdate);

    return {
      status: "success",
      message: "Driver updated successfully",
      data: null,
      code: 200,
    };
  }

  async getDrivers(): Promise<ResponseDto<DriverResponseDto[]>> {
    const drivers = await this.firebaseService.getData("drivers");
    return {
      status: "success",
      message: "Drivers fetched successfully",
      data: drivers,
      code: 200,
    };
  }

  async getAllAvailableDrivers(
    pickup: LocationDto,
  ): Promise<DriverResponseDto[]> {
    const drivers: DriverDto[] =
      await this.firebaseService.getDataByPath("drivers");
    const availableDrivers = [];
    drivers.forEach((driver) => {
      const distance = this.calculateDistance(
        pickup.latitude,
        pickup.longitude,
        driver.location.latitude,
        driver.location.longitude,
      );
      console.log("distance in driverservice: ", distance);
      if (distance <= 3 && driver.status === "available") {
        availableDrivers.push(driver);
      }
    });

    return availableDrivers;
  }

  async updateDriverToken(driverId: string, token: string) {
    await this.firebaseService.setData(`drivers/${driverId}/fcmToken`, token);
  }

  async getDriverToken(driverId: string) {
    const driver = await this.firebaseService.getData(`drivers/${driverId}`);
    return driver.fcmToken;
  }

  async updateDriverResponse(
    driverId: string,
    response: string,
    userId: string,
  ) {
    const driver: DriverDto = await this.firebaseService.getData(
      `drivers/${driverId}`,
    );
    if (!driver) {
      return;
    }
    const user: UserDto = await this.firebaseService.getData(`users/${userId}`);
    if (!user) {
      return;
    }

    await this.firebaseService.setData(
      `drivers/${driverId}/response`,
      response,
    );
  }

  async updateDriverLocation(driverId: string, location: LocationDto) {
    await this.firebaseService.setData(
      `drivers/${driverId}/location`,
      location,
    );
  }

  async updateDriverStatus(driverId: string, status: string) {
    const driver = await this.firebaseService.getData(`drivers/${driverId}`);

    if (!driver) {
      return;
    }

    if (driver.status === status) {
      return;
    }

    await this.firebaseService.setData(`drivers/${driverId}/status`, status);
  }

  private calculateDistance(
    lat1: number,
    lng1: number,
    lat2: number,
    lng2: number,
  ): number {
    const R = 6371; // Radius of the Earth in km
    const dLat = this.deg2rad(lat2 - lat1);
    const dLon = this.deg2rad(lng2 - lng1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.deg2rad(lat1)) *
        Math.cos(this.deg2rad(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // Trả về khoảng cách
  }

  private deg2rad(deg: number): number {
    return deg * (Math.PI / 180);
  }
}
