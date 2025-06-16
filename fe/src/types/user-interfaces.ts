// src/interfaces/user-interfaces.ts

export interface User {
    _id: string;
    username: string;
    email: string;
    firstName?: string;
    lastName?: string;
    phoneNumber?: string;
    avatar?: string;
    role: 'customer' | 'staff' | 'admin';
    authProvider: 'local' | 'google' | 'facebook';
    isEmailVerified: boolean;
    isDeleted: boolean;
    lastLogin?: Date | string;
    createdAt: Date | string;
    updatedAt: Date | string;
    
    // Calculated fields for display
    fullName?: string;
    customerCode?: string;
    totalOrders?: number;
    totalSpent?: number;
    status?: 'active' | 'inactive' | 'blocked';
  }
  
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