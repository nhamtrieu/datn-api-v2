import { Injectable } from "@nestjs/common";
import { TravelBookingDto } from "./dto/TravelBooking.dto";
import { DriverService } from "../driver/driver.service";
import { FirebaseService } from "../firebase/firebase.service";
import { UserDto } from "../user/dto/user.dto";
import { v4 as uuidv4 } from "uuid";
import { TravelDto } from "./dto/travel.dto";
import { DriverDto } from "../driver/dto";

@Injectable()
export class TravelService {
  constructor(
    private readonly driverService: DriverService,
    private readonly firebaseService: FirebaseService,
  ) {}

  async bookRide(travelBookingDto: TravelBookingDto): Promise<any> {
    const bookingTimeout = setTimeout(
      () => {
        return {
          message: "Không tìm được tài xế trong 5 phút",
          status: "failed",
        };
      },
      5 * 60 * 1000,
    );
    const drivers = await this.driverService.getAllAvailableDrivers(
      travelBookingDto.pickupLocation,
    );

    // Xếp hạng tài xế theo điểm
    const sortedDrivers = drivers.sort((a, b) => b.rate - a.rate); // Giả sử có thuộc tính 'rating'

    let driverAccepted = null;

    const user: UserDto = await this.firebaseService.getData(
      `users/${travelBookingDto.userId}`,
    );

    for (const driver of sortedDrivers) {
      const travelId = uuidv4();
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

      // Lắng nghe phản hồi từ tài xế
      const response = await this.waitForDriverResponse(driver.id, 60 * 1000);
      if (response) {
        if (response.response === "accepted") {
          driverAccepted = driver;
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
          const notification = {
            title: "Order accepted",
            body: "Đơn hàng đã được chấp nhận",
          };
          await this.firebaseService.sendNotification(user.fcmToken, {
            notification: notification,
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
          break;
        } else if (response.response === "declined") {
          continue;
        }
      }
    }

    if (driverAccepted) {
      return { message: "Tài xế đã chấp nhận", driver: driverAccepted };
    } else {
      clearTimeout(bookingTimeout);
      const notification = {
        title: "Order failed",
        body: "Không tìm được tài xế trong! Vui lòng thử lại sau ít phút!",
      };
      const data = {
        type: "booking-failed",
      };
      await this.firebaseService.sendNotification(user.fcmToken, {
        notification: notification,
        data: data,
      });
      return { message: "Không tìm được tài xế trong 5 phút" };
    }
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
}
