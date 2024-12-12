import { Module } from "@nestjs/common";
import { FirebaseService } from "./firebase.service"; // Đảm bảo đường dẫn đúng

@Module({
  providers: [FirebaseService],
  exports: [FirebaseService], // Xuất FirebaseService để sử dụng ở mô-đun khác
})
export class FirebaseModule {}
