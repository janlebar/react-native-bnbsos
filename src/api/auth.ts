// src/api/auth.ts

import axios from "axios";
import { UserCredentials, LoginResponse } from "../../types/auth";

const API_URL = "https://yourapi.com"; // Keep it here for future use

export const loginApi = async (
  credentials: UserCredentials
): Promise<string> => {
  // Simulated fake login
  if (
    credentials.email === "test@test.com" &&
    credentials.password === "password"
  ) {
    // Return a fake token
    return Promise.resolve("fake-jwt-token-123");
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
