// response.dto.ts
export class ResponseDto<T> {
  status: string;
  message: string;
  data: T;
  code: number;
}
