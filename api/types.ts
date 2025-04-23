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
