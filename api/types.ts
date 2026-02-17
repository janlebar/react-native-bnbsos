// api/types.ts
// Better Auth Mobile Types

/**
 * User model matching Better Auth schema
 */
export type User = {
  id: string;
  name: string | null;
  email: string;
  emailVerified: Date | null;
  image?: string | null;
  role: "USER" | "ADMIN";
  isTwoFactorEnabled: boolean;
  isContractor: boolean; // Extended field
  contractor?: ContractorProfile | null; // If user has contractor profile
};

/**
 * Contractor profile linked to user
 */
export interface ContractorProfile {
  id: number;
  uid: string;
  name: string;
  specializations: string[];
  city: string;
  rating: number;
  confirmed: boolean;
}

/**
 * Login credentials
 */
export interface UserCredentials {
  email: string;
  password: string;
  isContractor?: boolean;
}

/**
 * Login response with Better Auth tokens
 */
export interface LoginResponse {
  token: string; // Access token (JWT, 20s expiry)
  refreshToken: string; // Refresh token (JWT, 30d expiry)
  user: User;
  twoFactorRequired: boolean;
  isContractor: boolean;
}

/**
 * Registration form values
 */
export type RegisterFormValues = {
  name: string;
  email: string;
  password: string;
  address?: string;
  city?: string;
  phone?: string;
  specialization?: string;
  yearsOfExperience?: string;
};

/**
 * Session response from Better Auth
 */
export interface SessionResponse {
  user: User | null;
  session: {
    id: string;
    userId: string;
    expiresAt: Date;
    token: string;
  } | null;
}

/**
 * Password reset request
 */
export interface PasswordResetRequest {
  email: string;
  redirectTo?: string;
}

/**
 * Password reset completion
 */
export interface PasswordResetCompletion {
  token: string;
  newPassword: string;
}

/**
 * Token refresh request
 */
export interface TokenRefreshRequest {
  refreshToken: string;
}

/**
 * Token refresh response
 */
export interface TokenRefreshResponse {
  token: string;
  refreshToken?: string;
}

/**
 * Navigation stack param list
 */
export type RootStackParamList = {
  ContractorsList: { location: string; profession: string[] };
  ContractorDetails: { id: string };
  Chat: { contactId?: string; conversationId?: string };
  Home: undefined;
  Login: undefined;
  Register: undefined;
};
