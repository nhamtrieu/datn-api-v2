import { Injectable, NestMiddleware } from "@nestjs/common";
import { NextFunction, Request, Response } from "express";
import { JwtService } from "@nestjs/jwt";

@Injectable()
export class AuthMiddleware implements NestMiddleware {
  constructor(private readonly jwtService: JwtService) {}

  use(req: Request, res: Response, next: NextFunction) {
    const token = req.headers["authorization"]?.split(" ")[1];

    if (!token) {
      return res.status(401).send("Unauthorized");
    }

    try {
      const decoded = this.jwtService.verify(token);
      req["user"] = decoded;
      next();
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (err) {
      return res.status(401).send("Unauthorized");
    }
  }
}
