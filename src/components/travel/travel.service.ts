import { Injectable } from "@nestjs/common";
import { TravelBookingDto } from "./dto/TravelBooking.dto";
import { DriverService } from "../driver/driver.service";
import { FirebaseService } from "../firebase/firebase.service";
import { UserDto } from "../user/dto/user.dto";
import { v4 as uuidv4 } from "uuid";
import { TravelDto } from "./dto/travel.dto";
import { DriverDto } from "../driver/dto";
import { LocationDto } from "@/dto/location.dto";

@Injectable()
export class TravelService {
  constructor(
    private readonly driverService: DriverService,
    private readonly firebaseService: FirebaseService,
  ) {}

  async bookRide(travelBookingDto: TravelBookingDto): Promise<any> {
    return new Promise(async (resolve) => {
      // Set timeout 5 phút
      const bookingTimeout = setTimeout(
        async () => {
          const user: UserDto = await this.firebaseService.getData(
            `users/${travelBookingDto.userId}`,
          );

          const notification = {
            title: "Order failed",
            body: "Không tìm được tài xế! Vui lòng thử lại sau ít phút!",
          };

          await this.firebaseService.sendNotification(user.fcmToken, {
            notification: notification,
            data: { type: "booking-failed" },
          });

          resolve({
            status: "failed",
            message: "Không tìm được tài xế trong 5 phút",
          });
        },
        5 * 60 * 1000,
      );

      try {
        // Lấy danh sách tài xế có sẵn
        const drivers = await this.driverService.getAllAvailableDrivers(
          travelBookingDto.pickupLocation,
        );

        // Tính điểm cho mỗi tài xế dựa trên đánh giá và khoảng cách
        const driversWithScore = drivers.map((driver) => {
          // Tính khoảng cách từ tài xế đến điểm đón
          const distance = this.calculateDistance(
            driver.location,
            travelBookingDto.pickupLocation,
          );

          // Chuẩn hóa điểm đánh giá (0-5) thành thang điểm 0-1
          const normalizedRating = (driver.rate || 0) / 5;

          // Chuẩn hóa khoảng cách (giả sử khoảng cách max là 10km) thành thang điểm 0-1
          // Khoảng cách càng gần điểm càng cao
          const normalizedDistance = 1 - Math.min(distance, 10000) / 10000;

          // Tính điểm tổng hợp (70% đánh giá + 30% khoảng cách)
          const score = normalizedRating * 0.7 + normalizedDistance * 0.3;

          return {
            ...driver,
            score,
            distance,
          };
        });

        // Sắp xếp tài xế theo điểm từ cao xuống thấp
        const sortedDrivers = driversWithScore.sort(
          (a, b) => b.score - a.score,
        );

        // Lọc ra các tài xế trong bán kính 10km
        const nearbyDrivers = sortedDrivers.filter(
          (driver) => driver.distance <= 10000,
        );

        if (nearbyDrivers.length === 0) {
          clearTimeout(bookingTimeout);
          const user: UserDto = await this.firebaseService.getData(
            `users/${travelBookingDto.userId}`,
          );

          await this.firebaseService.sendNotification(user.fcmToken, {
            notification: {
              title: "Order failed",
              body: "Không có tài xế trong khu vực của bạn! Vui lòng thử lại sau!",
            },
            data: { type: "booking-failed" },
          });

          resolve({
            status: "failed",
            message: "Không có tài xế trong khu vực",
          });
          return;
        }

        const user: UserDto = await this.firebaseService.getData(
          `users/${travelBookingDto.userId}`,
        );

        // Tiếp tục với vòng lặp gửi thông báo cho từng tài xế
        for (const driver of nearbyDrivers) {
          const travelId = uuidv4();

          // Gửi thông báo cho tài xế
          await this.firebaseService.sendNotification(driver.fcmToken, {
            notification: {
              title: "New order",
              body: "Bạn có một đơn hàng mới",
            },
            data: {
              type: "new-order",
              driverId: driver.id.toString(),
              pickupLocation: JSON.stringify(travelBookingDto.pickupLocation),
              destinationLocation: JSON.stringify(
                travelBookingDto.destinationLocation,
              ),
              fare: travelBookingDto.fare.toString(),
              distance: travelBookingDto.distance.toString(),
              duration: travelBookingDto.duration.toString(),
              durationInTraffic: travelBookingDto.durationInTraffic.toString(),
              polyline: JSON.stringify(travelBookingDto.polyline) || "",
              userName: user.fullName || "",
              userAvatar: user.userAvatar || "",
              pickupString: travelBookingDto.pickupString || "",
              destinationString: travelBookingDto.destinationString || "",
              phoneNumber: user.phoneNumber || "",
              travelId: travelId.toString(),
              userId: travelBookingDto.userId || "",
              driverLocation: JSON.stringify(driver.location),
              userLocation: JSON.stringify(travelBookingDto.pickupLocation),
            },
          });

          // Chờ phản hồi từ tài xế trong 60 giây
          const response = await this.waitForDriverResponse(
            driver.id,
            60 * 1000,
          );

          if (response && response.response === "accepted") {
            // Tài xế chấp nhận
            clearTimeout(bookingTimeout);

            const travel = {
              id: travelId,
              driverId: driver.id,
              userId: travelBookingDto.userId,
              pickupLocation: travelBookingDto.pickupLocation,
              destinationLocation: travelBookingDto.destinationLocation,
              fare: travelBookingDto.fare,
              distance: travelBookingDto.distance,
              duration: travelBookingDto.duration,
              durationInTraffic: travelBookingDto.durationInTraffic,
              polyline: JSON.stringify(travelBookingDto.polyline) || "",
              pickupString: travelBookingDto.pickupString || "",
              destinationString: travelBookingDto.destinationString || "",
              timeStart: new Date().toISOString(),
              timeEnd: null,
              status: "on-trip",
            };

            // Cập nhật trạng thái
            await Promise.all([
              this.firebaseService.setData(
                `drivers/${response.id}/status`,
                "on-trip",
              ),
              this.firebaseService.setData(
                `drivers/${response.id}/response`,
                null,
              ),
              this.firebaseService.setData(`travels/${travelId}`, travel),
            ]);

            // Gửi thông báo cho người dùng
            await this.firebaseService.sendNotification(user.fcmToken, {
              notification: {
                title: "Order accepted",
                body: "Đơn hàng đã được chấp nhận",
              },
              data: {
                type: "driver-accepted",
                travelId: travel.id.toString(),
                driverId: driver.id.toString(),
                driverName: driver.fullName || "",
                driverAvatar: driver.avatar || "",
                phoneNumber: driver.phoneNumber || "",
                pickupString: travel.pickupString || "",
                destinationString: travel.destinationString || "",
                pickup: JSON.stringify(travel.pickupLocation),
                destination: JSON.stringify(travel.destinationLocation),
                driverLocation: JSON.stringify(driver.location),
                userLocation: JSON.stringify(travel.pickupLocation),
                driverRate: driver.avgRate ? driver.avgRate.toString() : "0",
              },
            });

            resolve({
              status: "success",
              message: "Tài xế đã chấp nhận",
              driver: driver,
            });
            return;
          }
          // Nếu tài xế từ chối hoặc không phản hồi, tiếp tục với tài xế tiếp theo
        }

        // Nếu không có tài xế nào chấp nhận
        clearTimeout(bookingTimeout);
        const notification = {
          title: "Order failed",
          body: "Không tìm được tài xế! Vui lòng thử lại sau ít phút!",
        };

        await this.firebaseService.sendNotification(user.fcmToken, {
          notification: notification,
          data: { type: "booking-failed" },
        });

        resolve({
          status: "failed",
          message: "Không tìm được tài xế",
        });
      } catch (error) {
        clearTimeout(bookingTimeout);
        resolve({
          status: "error",
          message: "Đã xảy ra lỗi khi đặt xe",
          error: error.message,
        });
      }
    });
  }

  async cancelBooking(bookingId: string, userId?: string, driverId?: string) {
    const travel: TravelDto = await this.firebaseService.getData(
      `travels/${bookingId}`,
    );

    if (userId) {
      // const user: UserDto = await this.firebaseService.getData(
      //   `users/${userId}`,
      // );

      const { driverId } = travel;

      const driver: DriverDto = await this.firebaseService.getData(
        `drivers/${driverId}`,
      );

      await this.firebaseService.sendNotification(driver.fcmToken, {
        notification: {
          title: "Order canceled",
          body: "Đơn hàng đã hủy",
        },
      });
    }
    if (driverId) {
      const { userId } = travel;

      const user: UserDto = await this.firebaseService.getData(
        `users/${userId}`,
      );

      await this.firebaseService.sendNotification(user.fcmToken, {
        notification: {
          title: "Order canceled",
          body: "Đơn hàng đã hủy",
        },
        data: {
          type: "canceled-travel",
          travelId: bookingId,
          userId: userId,
          driverId: driverId,
        },
      });
    }
    travel.status = "canceled";
    travel.timeEnd = new Date().toISOString();
    await this.firebaseService.setData(`travels/${bookingId}`, travel);
  }

  async completedBooking(bookingId: string, userId: string) {
    const user: UserDto = await this.firebaseService.getData(`users/${userId}`);

    await this.firebaseService.setData(
      `travels/${bookingId}/status`,
      "completed",
    );

    const travel: TravelDto = await this.firebaseService.getData(
      `travels/${bookingId}`,
    );

    travel.timeEnd = new Date().toISOString();

    await this.firebaseService.setData(`travels/${bookingId}`, travel);

    const driver: DriverDto = await this.firebaseService.getData(
      `drivers/${travel.driverId}`,
    );

    await this.firebaseService.sendNotification(user.fcmToken, {
      notification: {
        title: "Order completed",
        body: "Đơn hàng đã hoàn thành",
      },
      data: {
        type: "completed-travel",
        travelId: bookingId,
        userId: userId,
        driverId: travel.driverId,
        driverName: driver.fullName || "",
        driverAvatar: driver.avatar || "",
        phoneNumber: driver.phoneNumber || "",
      },
    });
  }

  async driverCome(travelId: string) {
    const travel: TravelDto = await this.firebaseService.getData(
      `travels/${travelId}`,
    );

    const { driverId, userId } = travel;

    const driver: DriverDto = await this.firebaseService.getData(
      `drivers/${driverId}`,
    );

    console.log("driver", driver);

    const user: UserDto = await this.firebaseService.getData(`users/${userId}`);

    await this.firebaseService.sendNotification(user.fcmToken, {
      notification: {
        title: "Driver is coming",
        body: "Tài xế đã đến vui lòng ra điểm đón",
      },
      data: {
        type: "driver-come",
        travelId: travelId,
        driverId: driverId,
      },
    });
  }

  async getTravelsHistory(
    driverId: string,
    startDate: string,
    endDate: string,
  ) {
    const travels: any[] = await this.firebaseService.getData(`travels`);
    const listTravels = Object.keys(travels)
      .map((key) => travels[key])
      .filter(
        (travel) =>
          new Date(travel.timeStart).toDateString() >= startDate &&
          new Date(travel.timeStart).toDateString() <= endDate,
      );
    const driverTravels = listTravels.filter(
      (travel) => travel.driverId === driverId,
    );

    const cancelTravels = driverTravels.filter(
      (travel) => travel.status === "canceled",
    );

    const completedTravels = driverTravels.filter(
      (travel) => travel.status === "completed",
    );

    return {
      status: "success",
      message: "Get travels history successfully",
      data: { cancelTravels, completedTravels, driverTravels },
      code: 200,
    };
  }

  async getIncome(driverId: string) {
    const travels: any[] = await this.firebaseService.getData(`travels`);
    const listTravels: TravelDto[] = Object.keys(travels).map(
      (key) => travels[key],
    );
    const driverTravels = listTravels.filter(
      (travel) => travel.driverId === driverId,
    );

    const completedTravels = driverTravels.filter(
      (travel) =>
        travel.status === "completed" &&
        new Date(travel.timeStart).toDateString() === new Date().toDateString(),
    );

    const imcome = completedTravels.reduce((acc, travel) => {
      return acc + travel.fare;
    }, 0);

    return {
      status: "success",
      message: "Get income successfully",
      data: (imcome * 2) / 3,
      code: 200,
    };
  }

  async getTravelsHistoryByUser(userId: string) {
    const travels: any[] = await this.firebaseService.getData(`travels`);
    const listTravels = Object.keys(travels).map((key) => travels[key]);
    const userTravels = listTravels
      .filter((travel) => travel.userId === userId)
      .sort(
        (a, b) =>
          new Date(b.timeStart).getTime() - new Date(a.timeStart).getTime(),
      );

    return {
      status: "success",
      message: "Get travels history successfully",
      data: userTravels,
      code: 200,
    };
  }

  private async waitForDriverResponse(
    driverId: string,
    timeOut: number,
  ): Promise<any> {
    return new Promise((resolve) => {
      const timer = setTimeout(() => {
        driverRef.off();
        resolve(false);
      }, timeOut);

      const driverRef = this.firebaseService
        .getDatabase()
        .ref(`drivers/${driverId}/response`);

      // Lắng nghe sự thay đổi của tài xế
      driverRef.on("value", (snapshot) => {
        const response = snapshot.val();
        // Kiểm tra phản hồi từ tài xế
        if (response) {
          clearTimeout(timer); // Ngừng hẹn giờ nếu nhận được phản hồi
          driverRef.off(); // Ngắt lắng nghe sau khi nhận phản hồi
          resolve({ response, id: driverId }); // Trả về phản hồi
        }
        // Thêm điều kiện để lắng nghe các trạng thái khác nếu cần
      });
    });
  }

  async getWeeklyStats(driverId: string, dateString: string) {
    const currentDate = new Date(dateString);

    // Lấy ngày đầu tuần (Thứ 2)
    const startWeek = new Date(currentDate);
    startWeek.setDate(currentDate.getDate() - currentDate.getDay());
    startWeek.setHours(7, 0, 0, 0);

    // Lấy ngày cuối tuần (Chủ nhật)
    const endWeek = new Date(startWeek);
    endWeek.setDate(endWeek.getDate() + 6);
    endWeek.setHours(23, 59, 59, 999);

    // Lấy tất cả chuyến đi từ Firebase
    const travels: any[] = await this.firebaseService.getData(`travels`);
    const listTravels = Object.keys(travels).map((key) => travels[key]);
    const driverTravels = listTravels.filter(
      (travel) => travel.driverId === driverId,
    );

    const weeklyStats = Array.from({ length: 7 }, (_, index) => {
      const date = new Date(startWeek);
      date.setDate(startWeek.getDate() + index);

      // Lọc chuyến đi trong ngày
      const dayTravels = driverTravels.filter((travel) => {
        const travelDate = new Date(travel.timeStart);
        return travelDate.toDateString() === date.toDateString();
      });

      // Tính tổng thu nhập trong ngày (đã trừ 1/3 phí cho hệ thống)
      const totalIncome = dayTravels.reduce((sum, travel) => {
        const income =
          travel.status === "completed" ? (travel.fare * 2) / 3 : 0;
        return sum + income;
      }, 0);

      return {
        date: date.toISOString().split("T")[0],
        dayOfWeek: [
          "Chủ nhật",
          "Thứ 2",
          "Thứ 3",
          "Thứ 4",
          "Thứ 5",
          "Thứ 6",
          "Thứ 7",
        ][index],
        totalTrips: dayTravels.length,
        completedTrips: dayTravels.filter((t) => t.status === "completed")
          .length,
        canceledTrips: dayTravels.filter((t) => t.status === "canceled").length,
        totalIncome: totalIncome,
        trips: dayTravels.map((travel) => ({
          id: travel.id,
          status: travel.status,
          fare: travel.fare,
          income: travel.status === "completed" ? (travel.fare * 2) / 3 : 0,
          pickupString: travel.pickupString,
          destinationString: travel.destinationString,
          timeStart: travel.timeStart,
          timeEnd: travel.timeEnd,
        })),
      };
    });

    return {
      status: "success",
      message: "Get weekly stats successfully",
      data: {
        startDate: startWeek.toISOString().split("T")[0],
        endDate: endWeek.toISOString().split("T")[0],
        totalTrips: driverTravels.length,
        totalCompletedTrips: driverTravels.filter(
          (t) => t.status === "completed",
        ).length,
        totalCanceledTrips: driverTravels.filter((t) => t.status === "canceled")
          .length,
        totalIncome: driverTravels.reduce((sum, travel) => {
          const income =
            travel.status === "completed" ? (travel.fare * 2) / 3 : 0;
          return sum + income;
        }, 0),
        weeklyStats,
      },
      code: 200,
    };
  }

  // Hàm tính khoảng cách giữa hai điểm (theo mét)
  private calculateDistance(point1: LocationDto, point2: LocationDto): number {
    const R = 6371000; // Bán kính Trái Đất tính bằng mét
    const φ1 = (point1.latitude * Math.PI) / 180;
    const φ2 = (point2.latitude * Math.PI) / 180;
    const Δφ = ((point2.latitude - point1.latitude) * Math.PI) / 180;
    const Δλ = ((point2.longitude - point1.longitude) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // khoảng cách tính bằng mét
  }
}
