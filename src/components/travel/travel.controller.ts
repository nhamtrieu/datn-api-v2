import {
  Body,
  Controller,
  Post,
  BadRequestException,
  Param,
  Res,
  HttpStatus,
  Get,
} from "@nestjs/common";
import { Response } from "express";
import { ApiTags } from "@nestjs/swagger";
import { TravelFareDto } from "./dto";
import axios from "axios";
import * as polyline from "@mapbox/polyline";
import { TravelBookingDto } from "./dto/TravelBooking.dto";
import { TravelService } from "./travel.service";
import { ResponseDto } from "../../dto/response.dto";

@Controller("travel")
@ApiTags("Travel")
export class TravelController {
  constructor(private readonly travelService: TravelService) {}
  @Post("calculate-fare")
  async calculateFare(@Body() body: TravelFareDto) {
    const { pickup, destination } = body;
    const baseFare = 20000;
    const pricePerKm = 5000;
    const congestionSurchargePerMin = 1000;
    const nightTimeSurcharge = 20000;

    try {
      const directionsResponse = await axios.get(
        "https://maps.googleapis.com/maps/api/directions/json",
        {
          params: {
            origin: `${pickup.latitude},${pickup.longitude}`,
            destination: `${destination.latitude},${destination.longitude}`,
            departure_time: "now", // Thời gian hiện tại
            traffic_model: "best_guess", // Dự đoán giao thông tốt nhất
            key: process.env.GOOGLE_MAP_API_KEY,
            mode: "driving",
          },
        },
      );

      const pickupString = body.pickupString;
      const destinationString = body.destinationString;
      const route = directionsResponse.data.routes[0];
      const distance = route.legs[0].distance.value; // Khoảng cách tính bằng mét
      const duration = route.legs[0].duration.value; // Thời gian di chuyển không tính kẹt xe (giây)
      const durationInTraffic = route.legs[0].duration_in_traffic?.value; // Thời gian di chuyển có tính kẹt xe (giây)
      const encodedPolyline = route.overview_polyline.points; // Polyline mã hóa
      // Giải mã polyline
      const decodedPolyline = polyline.decode(encodedPolyline);

      const distanceInKm = distance / 1000;
      let fare = baseFare + distanceInKm * pricePerKm;

      const currentHour = new Date().getHours();
      if (currentHour >= 23 || currentHour < 5) {
        fare += nightTimeSurcharge;
      }

      if (durationInTraffic && durationInTraffic / duration >= 1.5) {
        const extraTime = durationInTraffic - duration;
        const extraCharge = (extraTime / 60) * congestionSurchargePerMin;
        fare += extraCharge; // Tính thêm phí kẹt xe
      }

      return {
        fare, // Giá chuyến đi
        distance: distanceInKm, // Khoảng cách
        duration, // Thời gian không có kẹt xe
        durationInTraffic, // Thời gian có kẹt xe
        polyline: decodedPolyline, // Chuỗi polyline đã giải mã
        pickupString,
        destinationString,
      };
    } catch (error) {
      console.error(error);
      throw new BadRequestException("Error fetching directions");
    }
  }

  @Post("book-ride")
  async bookRide(@Body() travelBookingDto: TravelBookingDto) {
    return await this.travelService.bookRide(travelBookingDto);
  }

  @Post(":bookingId/cancel")
  async cancelBooking(
    @Param("bookingId") bookingId: string,
    @Body() body: { userId?: string; driverId?: string },
    @Res() res: Response,
  ) {
    try {
      await this.travelService.cancelBooking(
        bookingId,
        body.userId,
        body.driverId,
      );
      const response: ResponseDto<null> = {
        status: "success",
        message: "Chuyến đi đã hủy thành công",
        data: null,
        code: HttpStatus.OK,
      };
      return res.status(HttpStatus.OK).json(response);
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      const response: ResponseDto<null> = {
        status: "error",
        message: "Chuyến đi không thể hủy",
        data: null,
        code: HttpStatus.INTERNAL_SERVER_ERROR,
      };
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json(response);
    }
  }

  @Post(":bookingId/completed")
  async completedBooking(
    @Param("bookingId") bookingId: string,
    @Body() body: { userId: string },
  ) {
    return this.travelService.completedBooking(bookingId, body.userId);
  }

  @Post(":travelId/driver-come")
  async driverCome(@Param("travelId") travelId: string) {
    return await this.travelService.driverCome(travelId);
  }

  @Post(":driverId/travels-history")
  async getTravelsHistory(
    @Param("driverId") driverId: string,
    @Res() res: Response,
    @Body() body: { startDate: string; endDate: string },
  ) {
    return res
      .status(200)
      .json(
        await this.travelService.getTravelsHistory(
          driverId,
          body.startDate,
          body.endDate,
        ),
      );
  }

  @Get(":driverId/income")
  async getIncome(@Param("driverId") driverId: string) {
    return await this.travelService.getIncome(driverId);
  }

  @Post(":driverId/weekly-stats")
  async getWeeklyStats(
    @Param("driverId") driverId: string,
    @Body() body: { date: string },
    @Res() res: Response,
  ) {
    console.log(body);
    return res
      .status(200)
      .json(await this.travelService.getWeeklyStats(driverId, body.date));
  }
}
