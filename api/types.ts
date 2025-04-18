export interface UserCredentials {
  email: string;
  password: string;
  isContractor: boolean;
}

export interface LoginResponse {
  token: string;
  twoFactorRequired: boolean;
  isContractor: boolean;
}
