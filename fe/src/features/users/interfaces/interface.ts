import type { User } from '../../../types/user';

export type { User };


export interface UserStats {
  totalUsers: number;
  activeUsers: number;
  newUsersThisMonth: number;
  usersByRole: {
    customer: number;
    staff: number;
    admin: number;
  };
  usersByProvider: {
    local: number;
    google: number;
    facebook: number;
  };
}

export interface UserListRequest {
  page?: number;
  limit?: number;
  search?: string;
  role?: User['role'] | '';
  authProvider?: User['authProvider'] | '';
  isEmailVerified?: boolean;
  isDeleted?: boolean;
  sortBy?: keyof User;
  sortOrder?: 'asc' | 'desc';
}

export interface UserListResponse {
  users: User[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    limit: number;
  };
  stats?: UserStats;
}

export interface UpdateUserRequest {
  firstName?: string;
  lastName?: string;
  email?: string;
  phoneNumber?: string;
  role?: User['role'];
  isEmailVerified?: boolean;
  isDeleted?: boolean;
}

export interface UserFilters {
  search: string;
  role: User['role'] | '';
  authProvider: User['authProvider'] | '';
  isEmailVerified: boolean | '';
  isDeleted: boolean | '';
}

export interface ChangeRoleRequest {
  role: User['role'];
}
