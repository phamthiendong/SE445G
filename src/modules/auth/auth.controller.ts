import { Body, Controller, Post, Res, HttpCode, HttpStatus } from '@nestjs/common';
import { Response } from 'express';
import { AuthService } from './auth.service';
import { BaseController } from 'src/base/baseController';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refreshToken.dto';
import { LogoutDto } from './dto/logout.dto';
import { RegisterDto } from './dto/register.dto';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ERROR_MESSAGES } from 'src/common/constants/errorMessage.constant';
import { Public } from './decorators/public.decorator';

@Controller('auth')
@ApiTags('Authentication')
export class AuthController extends BaseController {
  constructor(private readonly authService: AuthService) {
    super();
  }

  @Post('register')
  @Public()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Register a new user account' })
  @ApiResponse({ status: 201, description: 'Account registered successfully' })
  @ApiResponse({ status: 400, description: 'Bad request - validation error or email already exists' })
  async register(@Res() res: Response, @Body() registerDto: RegisterDto): Promise<Response> {
    try {
      const response = await this.authService.register(registerDto);
      return this.responseCreated(res, response);
    } catch (error) {
      console.log(error);
      if (error.status === HttpStatus.BAD_REQUEST) {
        return this.responseBadRequest(res, { message: error.response.message });
      }
      return this.responseInternalServerError(res, { message: ERROR_MESSAGES.common.INTERNAL_SERVER_ERROR });
    }
  }

  @Post('login')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'User login' })
  @ApiResponse({ status: 200, description: 'Login successful' })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  async login(@Res() res: Response, @Body() loginDto: LoginDto): Promise<Response> {
    try {
      const response = await this.authService.login(loginDto);
      return this.responseSuccess(res, response);
    } catch (error) {
      console.log(error);
      if (error.status === HttpStatus.UNAUTHORIZED) {
        return this.responseBadRequest(res, { message: error.response.message });
      }
      return this.responseInternalServerError(res, { message: ERROR_MESSAGES.common.INTERNAL_SERVER_ERROR });
    }
  }

  @Post('refresh')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Refresh access token' })
  @ApiResponse({ status: 200, description: 'Token refreshed successfully' })
  @ApiResponse({ status: 401, description: 'Invalid refresh token' })
  async refreshToken(@Res() res: Response, @Body() refreshTokenDto: RefreshTokenDto): Promise<Response> {
    try {
      const response = await this.authService.refreshToken(refreshTokenDto);
      return this.responseSuccess(res, response);
    } catch (error) {
      console.log(error);
      if (error.status === HttpStatus.UNAUTHORIZED) {
        return this.responseBadRequest(res, { message: error.response.message });
      }
      return this.responseInternalServerError(res, { message: ERROR_MESSAGES.common.INTERNAL_SERVER_ERROR });
    }
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'User logout' })
  @ApiResponse({ status: 200, description: 'Logout successful' })
  async logout(@Res() res: Response, @Body() logoutDto: LogoutDto): Promise<Response> {
    try {
      const response = await this.authService.logout(logoutDto);
      return this.responseSuccess(res, response);
    } catch (error) {
      console.log(error);
      return this.responseInternalServerError(res, { message: ERROR_MESSAGES.common.INTERNAL_SERVER_ERROR });
    }
  }
}
