// src/api/auth.ts

import axios from "axios";
import { UserCredentials, LoginResponse } from "./types";

const API_URL = "https://yourapi.com"; // Keep it here for future use

export const loginApi = async (
  credentials: UserCredentials
): Promise<LoginResponse> => {
  // Simulated fake login
  if (
    credentials.email === "test@test.com" &&
    credentials.password === "password"
  ) {
    // Fake logic to trigger two-factor if email contains '2fa'
    const twoFactorRequired = credentials.email.includes("2fa");

    // Return a fake response with token, twoFactorRequired, and isContractor
    return Promise.resolve({
      token: "fake-jwt-token-123",
      twoFactorRequired,
      isContractor: credentials.isContractor,
    });
  } else {
    // Simulate a failed login
    return Promise.reject("Invalid credentials");
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
