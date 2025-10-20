export enum UserStatus {
  INACTIVE = 'inactive',
  ACTIVE = 'active',
  BLOCKED = 'blocked',
  SUSPENDED = 'suspended'
}

export interface IUser {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  status: UserStatus;
  isDeleted: boolean;
  deletedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}
