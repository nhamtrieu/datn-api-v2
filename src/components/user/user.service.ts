import { Injectable } from "@nestjs/common";
import { v4 as uuidv4 } from "uuid";
import * as bcrypt from "bcryptjs";
import { FirebaseService } from "../firebase/firebase.service";
import { ResponseDto } from "../../dto/response.dto";
import { UserResponseDto } from "./dto/response-user.dto";
import { CreateUserDto } from "./dto/create-user.dto";
import { UserUpdateDto } from "./dto/user-update.dto";
import { UserLoginDto } from "./dto/user-login.dto";
import { JwtService } from "@nestjs/jwt";
import VehicleDto from "./dto/vehicle.dto";
import VehicleCreateDto from "./dto/vehicle-create.dto";
import { DriverDto } from "../driver/dto";
import { LocationDto } from "../../dto/location.dto";
import VehicleUpdateDto from "./dto/vehicle-update.dto";

@Injectable()
export class UserService {
  constructor(
    private readonly firebaseService: FirebaseService,
    private readonly jwtService: JwtService,
  ) {}

  async registerUser(
    user: CreateUserDto,
  ): Promise<ResponseDto<UserResponseDto>> {
    const checkUser = await this.firebaseService.getUserByPhoneNumber(
      user.phoneNumber,
    );

    if (checkUser) {
      return {
        status: "error",
        message: "User already exists",
        data: null,
        code: 409,
      };
    }

    const userId = uuidv4();
    const hashedPassword = await bcrypt.hash(user.password, 10);
    const newUser = {
      ...user,
      id: userId,
      password: hashedPassword,
      userAvatar: user.userAvatar
        ? user.userAvatar
        : "https://png.pngtree.com/element_our/20200610/ourmid/pngtree-character-default-avatar-image_2237203.jpg",
    };

    await this.firebaseService.setData(`users/${userId}`, newUser);

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, ...userNoPassword } = newUser;

    return {
      status: "success",
      message: "User registered successfully",
      data: userNoPassword as UserResponseDto,
      code: 201,
    };
  }

  async validateUser(
    password: string,
    hashedPassword: string,
  ): Promise<boolean> {
    return await bcrypt.compare(password, hashedPassword);
  }

  async updateUser(
    id: string,
    body: UserUpdateDto,
  ): Promise<ResponseDto<UserResponseDto>> {
    const checkUser = await this.firebaseService.getData(`users/${id}`);

    if (!checkUser) {
      return {
        status: "error",
        message: "User not found",
        data: null,
        code: 404,
      };
    }

    const cleanBody = Object.fromEntries(
      Object.entries(body).filter(
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        ([_, value]) => value,
      ),
    );
    console.log("cleanBody", cleanBody);
    const { password: cleanPassword } = cleanBody;
    if (cleanPassword) {
      if (await bcrypt.compare(cleanPassword, checkUser.password)) {
      } else {
        const newPassword = await bcrypt.hash(cleanPassword, 10);
        cleanBody.password = newPassword;
      }
    }
    const updatedUser = {
      ...checkUser,
      ...cleanBody,
    };

    await this.firebaseService.setData(`users/${id}`, updatedUser);

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, ...userWithoutPassword } = updatedUser;

    return {
      status: "success",
      message: "User updated successfully",
      data: userWithoutPassword,
      code: 200,
    };
  }

  // async updateUserPassword(id: string, password: string, oldPassword: string) {
  //   const checkUser = await this.firebaseService.getData(`users/${id}`);

  //   if (!checkUser) {
  //     return {
  //       status: "error",
  //       message: "User not found",
  //       data: null,
  //       code: 404,
  //     };
  //   }

  //   const isPasswordValid = await this.validateUser(
  //     oldPassword,
  //     checkUser.password,
  //   );

  //   if (!isPasswordValid) {
  //     return {
  //       status: "error",
  //       message: "Invalid old password",
  //       data: null,
  //       code: 401,
  //     };
  //   }

  //   const hashedPassword = await bcrypt.hash(password, 10);
  //   await this.firebaseService.setData(`users/${id}/password`, hashedPassword);

  //   return {
  //     status: "success",
  //     message: "Password updated successfully",
  //     data: null,
  //     code: 200,
  //   };
  // }

  async deleteUser(id: string): Promise<ResponseDto<null>> {
    const checkUser = await this.firebaseService.getData(`users/${id}`);

    if (!checkUser) {
      return {
        status: "error",
        message: "User not found",
        data: null,
        code: 404,
      };
    }

    await this.firebaseService.deleteData(`users/${id}`);

    return {
      status: "success",
      message: "User deleted successfully",
      data: null,
      code: 200,
    };
  }

  async getUser(id: string): Promise<ResponseDto<UserResponseDto>> {
    const checkUser = await this.firebaseService.getData(`users/${id}`);

    if (!checkUser) {
      return {
        status: "error",
        message: "User not found",
        data: null,
        code: 404,
      };
    }

    return {
      status: "success",
      message: "User found",
      data: checkUser as UserResponseDto,
      code: 200,
    };
  }

  // async getUsers(): Promise<ResponseDto<UserResponseDto[]>> {
  //   const users = await this.firebaseService.getData("users");
  //   return {
  //     status: "success",
  //     message: "Users fetched successfully",
  //     data: users,
  //     code: 200,
  //   };
  // }

  async login(
    body: UserLoginDto,
  ): Promise<ResponseDto<UserResponseDto & { token: string }>> {
    const checkUser = await this.firebaseService.getUserByPhoneNumber(
      body.phoneNumber,
    );

    if (!checkUser) {
      return {
        status: "error",
        message: "User not found",
        data: null,
        code: 404,
      };
    }

    const isPasswordValid = await this.validateUser(
      body.password,
      checkUser.password,
    );

    console.log(isPasswordValid);

    if (!isPasswordValid) {
      return {
        status: "error",
        message: "Invalid password",
        data: null,
        code: 401,
      };
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, ...userNoPassword } = checkUser;
    const payload = {
      fullname: userNoPassword.fullname,
      sub: userNoPassword.id,
    };

    const token = await this.jwtService.signAsync(payload);

    return {
      status: "success",
      message: "User logged in successfully",
      data: { ...userNoPassword, token },
      code: 200,
    };
  }

  async addVehicle(id: string, body: VehicleCreateDto) {
    const checkUser = await this.firebaseService.getData(`users/${id}`);

    if (!checkUser) {
      return {
        status: "error",
        message: "User not found",
        data: null,
        code: 404,
      };
    }

    if (!body.image) {
      body.image =
        "https://media.istockphoto.com/id/1289304722/photo/generic-green-car-isolated-on-white.jpg?s=612x612&w=0&k=20&c=FIMe6C5hxbAieI-IglZQkYjBchYrABOYzbRVNUJqCeA=";
    }

    const vehicleId = uuidv4();
    const newVehicle = {
      ...body,
      id: vehicleId,
    };

    await this.firebaseService.setData(
      `users/${id}/vehicles/${vehicleId}`,
      newVehicle,
    );

    return {
      status: "success",
      message: "Vehicle added successfully",
      data: null,
      code: 200,
    };
  }

  async updateUserFcmToken(id: string, token: string) {
    try {
      const checkUser = await this.firebaseService.getData(`users/${id}`);

      if (!checkUser) {
        return {
          status: "error",
          message: "User not found",
          data: null,
          code: 404,
        };
      }

      await this.firebaseService.setData(`users/${id}/fcmToken`, token);

      return {
        status: "success",
        message: "User fcm token updated successfully",
        data: null,
        code: 200,
      };
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      return {
        status: "error",
        message: "Internal server error",
        data: null,
        code: 500,
      };
    }
  }

  async rateDriver(id: string, body: { driverId: string; rating: number }) {
    const driver: DriverDto = await this.firebaseService.getData(
      `drivers/${body.driverId}`,
    );
    let rateDriver = driver.rateDriver;
    if (!rateDriver) {
      rateDriver = [body.rating];
    } else {
      rateDriver.push(body.rating);
    }
    const avgRate =
      rateDriver.reduce((acc, curr) => acc + curr, 0) / rateDriver.length;
    await this.firebaseService.setData(
      `drivers/${body.driverId}/rateDriver`,
      rateDriver,
    );

    await this.firebaseService.setData(
      `drivers/${body.driverId}/avgRate`,
      avgRate,
    );

    return {
      status: "success",
      message: "Driver rated successfully",
      data: null,
      code: 200,
    };
  }

  async updateUserLocation(id: string, body: LocationDto) {
    await this.firebaseService.setData(`users/${id}/userLocation`, body);

    return {
      status: "success",
      message: "User location updated successfully",
      data: null,
      code: 200,
    };
  }

  async getVehicles(id: string) {
    const vehicles: VehicleDto[] = await this.firebaseService.getData(
      `users/${id}/vehicles`,
    );
    if (!vehicles) {
      return {
        status: "success",
        message: "Vehicles fetched successfully",
        data: null,
        code: 200,
      };
    }
    const listVehicles = Object.keys(vehicles).map((key) => vehicles[key]);

    return {
      status: "success",
      message: "Vehicles fetched successfully",
      data: listVehicles,
      code: 200,
    };
  }

  async chooseVehicle(id: string, vehicleId: string) {
    const vehicles = await this.firebaseService.getData(`users/${id}/vehicles`);
    if (!vehicles) {
      return {
        status: "error",
        message: "Vehicle not found",
        data: null,
        code: 404,
      };
    }

    const vehiclesDto = Object.keys(vehicles).map((key) => vehicles[key]);

    const vehicle = vehiclesDto.find((vehicle) => vehicle.id === vehicleId);
    const vehicleActive = vehiclesDto.find(
      (vehicle) => vehicle.status === "on",
    );

    if (!vehicle) {
      return {
        status: "error",
        message: "Vehicle not found",
        data: null,
        code: 404,
      };
    }

    if (vehicle.id !== vehicleActive.id) {
      await Promise.all([
        this.firebaseService.setData(
          `users/${id}/vehicles/${vehicleActive.id}/status`,
          "off",
        ),
        this.firebaseService.setData(
          `users/${id}/vehicles/${vehicleId}/status`,
          "on",
        ),
      ]);
      return {
        status: "success",
        message: "Vehicle chosen successfully",
        data: null,
        code: 200,
      };
    }
  }

  async getVehicle(id: string) {
    const vehicles = await this.firebaseService.getData(`users/${id}/vehicles`);
    const vehiclesDto = Object.keys(vehicles).map((key) => vehicles[key]);
    if (!vehiclesDto) {
      return {
        status: "success",
        message: "Vehicle fetched successfully",
        data: null,
        code: 404,
      };
    }
    const vehicleActive = vehiclesDto.find(
      (vehicle) => vehicle.status === "on",
    );

    return {
      status: "success",
      message: "Vehicle fetched successfully",
      data: vehicleActive,
      code: 200,
    };
  }

  async updateVehicle(id: string, vehicleId: string, body: VehicleUpdateDto) {
    try {
      const checkUser = await this.firebaseService.getData(`users/${id}`);
      if (!checkUser) {
        return {
          status: "error",
          message: "User not found",
          data: null,
          code: 404,
        };
      }

      const vehicles = checkUser.vehicles;
      const listVehicles = Object.keys(vehicles).map((key) => vehicles[key]);
      const vehicle = listVehicles.find((vehicle) => vehicle.id === vehicleId);
      if (!vehicle) {
        return {
          status: "error",
          message: "Vehicle not found",
          data: null,
          code: 404,
        };
      }

      await this.firebaseService.setData(
        `users/${id}/vehicles/${vehicleId}`,
        body,
      );

      return {
        status: "success",
        message: "Vehicle updated successfully",
        data: null,
        code: 200,
      };
    } catch (error) {
      console.log("error", error);
      return {
        status: "error",
        message: "Internal server error",
        error: error,
        data: null,
        code: 500,
      };
    }
  }
}
