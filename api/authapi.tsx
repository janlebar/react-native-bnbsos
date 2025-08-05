// src/api/auth.ts

import axios from "axios";
import { UserCredentials, LoginResponse } from "./types";
import { RegisterFormValues } from "./types";
import { User } from "./types"; // Add this if you have a User type

const API_URL = "http://localhost:3000/en"; // Replace with your actual Next.js app URL

export const loginApi = async (
  credentials: UserCredentials
): Promise<LoginResponse> => {
  try {
    const requestData: any = {
      email: credentials.email,
      password: credentials.password,
      isContractor: credentials.isContractor,
    };

    // Add code if provided for two-factor authentication
    if (credentials.code) {
      requestData.code = credentials.code;
    }

    const response = await axios.post(
      `${API_URL}/api/mobile/auth/login`,
      requestData
    );

    return response.data;
  } catch (error: any) {
    if (error.response?.data?.error) {
      throw new Error(error.response.data.error);
    }
    throw new Error("Login failed");
  }
};

// Real register API
type RegisterResponse = {
  token: string;
  isContractor: boolean;
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
};

export const registerApi = async (
  data: RegisterFormValues & { isContractor: boolean }
): Promise<RegisterResponse> => {
  try {
    const response = await axios.post(
      `${API_URL}/api/mobile/auth/register`,
      data
    );
    return response.data;
  } catch (error: any) {
    if (error.response?.data?.error) {
      throw new Error(error.response.data.error);
    }
    throw new Error("Registration failed");
  }
};

// Real password reset API
export const resetApi = async ({ email }: { email: string }) => {
  try {
    const response = await axios.post(`${API_URL}/api/mobile/auth/reset`, {
      email,
    });
    return response.data.message;
  } catch (error: any) {
    if (error.response?.data?.error) {
      throw new Error(error.response.data.error);
    }
    throw new Error("Password reset failed");
  }
};

// src/api/auth.ts

export interface Contractor {
  id: number;
  name: string;
  rating?: number;
  specialization?: string;
  description?: string;
  certifications: string[];
  availability?: string;
  yearsOfExperience?: number;
  address?: string;
  city: string;
  contractorLatitude?: number;
  contractorLongitude?: number;
  datePosted?: string;
  confirmed?: boolean;
  imageId?: string;
  user?: {
    email?: string;
  };
  phone?: string;
}

export const getContractorsByLocationAndProfession = async (
  contractorLocation: string,
  profession: string[]
): Promise<Contractor[]> => {
  try {
    if (!contractorLocation || !profession.length) {
      return [];
    }

    const professionParam = profession.join(",");
    const response = await axios.get(
      `${API_URL}/api/mobile/contractors?location=${encodeURIComponent(
        contractorLocation
      )}&profession=${encodeURIComponent(professionParam)}`
    );

    return response.data;
  } catch (error: any) {
    console.error("Error fetching contractors:", error);
    if (error.response?.data?.error) {
      throw new Error(error.response.data.error);
    }
    throw new Error("Failed to fetch contractors");
  }
};

// Real CurrentUser API
export const getCurrentUser = async (token: string): Promise<User | null> => {
  try {
    const response = await axios.get(
      `${API_URL}/api/mobile/auth/current-user`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    return response.data.user;
  } catch (error: any) {
    if (error.response?.status === 401) {
      return null; // User not authenticated
    }
    throw new Error("Failed to get current user");
  }
};

// import axios from "axios";
// import { UserCredentials, LoginResponse } from "../../types/auth";

// const API_URL = "https://yourapi.com";

// export const loginApi = async (
//   credentials: UserCredentials
// ): Promise<string> => {
//   const response = await axios.post<LoginResponse>(
//     `${API_URL}/login`,
//     credentials
//   );
//   return response.data.token;
// };
