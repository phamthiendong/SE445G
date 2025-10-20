import { HttpException, HttpStatus } from '@nestjs/common';
import { IResponseData } from 'src/base/baseController';

export class InternalServerErrorException extends HttpException {
  constructor(data: IResponseData) {
    super(data, HttpStatus.INTERNAL_SERVER_ERROR);
  }
}
