import { Injectable, UnauthorizedException } from '@nestjs/common';
import { BadRequestException } from 'src/common/exceptions/badRequest.exception';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import { UserService } from '../users/user.service';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refreshToken.dto';
import { LogoutDto } from './dto/logout.dto';
import { RegisterDto } from './dto/register.dto';
import { IJwtPayload, IAuthResponse } from './interfaces/auth.interface';
import { IResponseData } from 'src/base/baseController';
import { UserStatus } from '../users/interfaces/user.interface';
import { CreateUserDto } from '../users/dto/createUser.dto';
import { ERROR_MESSAGES } from 'src/common/constants/errorMessage.constant';

@Injectable()
export class AuthService {
  private refreshTokens: Set<string> = new Set();

  constructor(private userService: UserService, private jwtService: JwtService, private configService: ConfigService) {}

  async register(registerDto: RegisterDto): Promise<IResponseData> {
    // Validate password confirmation
    if (registerDto.password !== registerDto.confirmPassword) {
      throw new BadRequestException({ message: ERROR_MESSAGES.auth.PASSWORD_MISMATCH });
    }

    // Check if email already exists
    const existingUser = await this.userService.getUserByEmailForAuth(registerDto.email);
    if (existingUser) {
      throw new BadRequestException({ message: ERROR_MESSAGES.auth.EMAIL_ALREADY_EXISTS });
    }

    // Create user DTO
    const createUserDto: CreateUserDto = {
      firstName: registerDto.firstName,
      lastName: registerDto.lastName,
      email: registerDto.email,
      password: registerDto.password,
      status: UserStatus.ACTIVE // Set user as active by default
    };

    // Create user
    const userResponse = await this.userService.createUser(createUserDto);

    if (!userResponse.data) {
      throw new BadRequestException({ message: ERROR_MESSAGES.auth.REGISTRATION_FAILED });
    }

    // Generate tokens for auto-login
    const tokens = await this.generateTokens(userResponse.data.id, userResponse.data.email);

    // Store refresh token
    this.refreshTokens.add(tokens.refreshToken);

    const authResponse: IAuthResponse = {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      user: {
        id: userResponse.data.id,
        email: userResponse.data.email,
        firstName: userResponse.data.firstName,
        lastName: userResponse.data.lastName,
        status: userResponse.data.status
      }
    };

    return {
      message: ERROR_MESSAGES.common.CREATED,
      data: authResponse
    };
  }

  async login(loginDto: LoginDto): Promise<IResponseData> {
    const user = await this.userService.getUserByEmailForAuth(loginDto.email);

    if (!user) {
      throw new UnauthorizedException(ERROR_MESSAGES.auth.INVALID_CREDENTIALS);
    }

    if (user.status !== UserStatus.ACTIVE) {
      throw new UnauthorizedException(ERROR_MESSAGES.auth.USER_NOT_ACTIVE);
    }

    const isPasswordValid = await bcrypt.compare(loginDto.password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException(ERROR_MESSAGES.auth.INVALID_CREDENTIALS);
    }

    const tokens = await this.generateTokens(user.id, user.email);

    // Store refresh token
    this.refreshTokens.add(tokens.refreshToken);

    const authResponse: IAuthResponse = {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        status: user.status
      }
    };

    return {
      message: ERROR_MESSAGES.common.SUCCESSFUL,
      data: authResponse
    };
  }

  async refreshToken(refreshTokenDto: RefreshTokenDto): Promise<IResponseData> {
    try {
      const payload = await this.jwtService.verifyAsync(refreshTokenDto.refreshToken, {
        secret: this.configService.get<string>('REFRESH_TOKEN_SECRET')
      });

      if (payload.type !== 'refresh') {
        throw new UnauthorizedException(ERROR_MESSAGES.auth.INVALID_TOKEN_TYPE);
      }

      if (!this.refreshTokens.has(refreshTokenDto.refreshToken)) {
        throw new UnauthorizedException(ERROR_MESSAGES.auth.TOKEN_REVOKED);
      }

      const user = await this.userService.getUserById(payload.id);
      if (!user || user.data.status !== UserStatus.ACTIVE) {
        throw new UnauthorizedException(ERROR_MESSAGES.auth.USER_NOT_ACTIVE);
      }

      // Remove old refresh token
      this.refreshTokens.delete(refreshTokenDto.refreshToken);

      // Generate new tokens
      const tokens = await this.generateTokens(payload.id, payload.email);

      // Store new refresh token
      this.refreshTokens.add(tokens.refreshToken);

      const authResponse: IAuthResponse = {
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        user: {
          id: user.data.id,
          email: user.data.email,
          firstName: user.data.firstName,
          lastName: user.data.lastName,
          status: user.data.status
        }
      };

      return {
        message: ERROR_MESSAGES.common.SUCCESSFUL,
        data: authResponse
      };
    } catch (error) {
      throw new UnauthorizedException(ERROR_MESSAGES.auth.INVALID_REFRESH_TOKEN);
    }
  }

  async logout(logoutDto: LogoutDto): Promise<IResponseData> {
    if (this.refreshTokens.has(logoutDto.refreshToken)) {
      this.refreshTokens.delete(logoutDto.refreshToken);
    }

    return {
      message: ERROR_MESSAGES.common.SUCCESSFUL,
      data: null
    };
  }

  async validateToken(token: string): Promise<any> {
    try {
      const payload = await this.jwtService.verifyAsync(token, {
        secret: this.configService.get<string>('ACCESS_TOKEN_SECRET')
      });

      if (payload.type !== 'access') {
        throw new UnauthorizedException(ERROR_MESSAGES.auth.INVALID_TOKEN_TYPE);
      }

      return payload;
    } catch (error) {
      throw new UnauthorizedException(ERROR_MESSAGES.auth.INVALID_TOKEN);
    }
  }

  private async generateTokens(id: number, email: string) {
    const accessTokenPayload: IJwtPayload = {
      id,
      email,
      type: 'access'
    };

    const refreshTokenPayload: IJwtPayload = {
      id,
      email,
      type: 'refresh'
    };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(accessTokenPayload, {
        secret: this.configService.get<string>('ACCESS_TOKEN_SECRET'),
        expiresIn: this.configService.get<string>('ACCESS_TOKEN_EXPIRATION') || '1h'
      }),
      this.jwtService.signAsync(refreshTokenPayload, {
        secret: this.configService.get<string>('REFRESH_TOKEN_SECRET'),
        expiresIn: this.configService.get<string>('REFRESH_TOKEN_EXPIRATION') || '7d'
      })
    ]);

    return { accessToken, refreshToken };
  }
}
