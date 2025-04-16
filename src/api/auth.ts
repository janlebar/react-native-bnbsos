// auth.ts

import axios from "axios";
import { UserCredentials, LoginResponse } from "../../types/auth";

const API_URL = "https://yourapi.com";

export const loginApi = async (
  credentials: UserCredentials
): Promise<string> => {
  const response = await axios.post<LoginResponse>(
    `${API_URL}/login`,
    credentials
  );
  return response.data.token;
};
