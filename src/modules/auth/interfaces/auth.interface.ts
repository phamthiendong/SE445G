export interface IJwtPayload {
  id: number;
  email: string;
  type: 'access' | 'refresh';
}

export interface IAuthResponse {
  accessToken: string;
  refreshToken: string;
  user: {
    id: number;
    email: string;
    firstName: string;
    lastName: string;
    status: string;
  };
}

export interface ILoginDto {
  email: string;
  password: string;
}

export interface IRefreshTokenDto {
  refreshToken: string;
}

export interface ILogoutDto {
  refreshToken: string;
}
