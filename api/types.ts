export type User = {
  id: string;
  name: string;
  email: string;
  isContractor: boolean;
};

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

export type RootStackParamList = {
  ContractorsList: { location: string; profession: string[] };
  ContractorDetails: { id: string }; // or whatever the actual ID type is
};

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
