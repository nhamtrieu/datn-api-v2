import { Injectable, NestMiddleware } from "@nestjs/common";
import { NextFunction, Request, Response } from "express";
import { JwtService } from "@nestjs/jwt";

@Injectable()
export class AuthMiddleware implements NestMiddleware {
  constructor(private readonly jwtService: JwtService) {}

  use(req: Request, res: Response, next: NextFunction) {
    const authHeader = req.headers["authorization"];
    if (!authHeader) {
      return res.status(401).json({
        message: "Không tìm thấy token xác thực",
      });
    }

    if (!authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        message: "Token không đúng định dạng",
      });
    }

    const token = authHeader.split(" ")[1];

    try {
      const decoded = this.jwtService.verify(token);
      req["user"] = decoded;
      next();
    } catch (err) {
      console.log(err);
      return res.status(401).json({
        message: "Token không hợp lệ hoặc đã hết hạn",
      });
    }
  }
}
