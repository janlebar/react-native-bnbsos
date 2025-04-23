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

// Fake password reset API
export const resetApi = async ({ email }: { email: string }) => {
  if (email === "test@test.com") {
    return Promise.resolve("Reset email sent");
  } else {
    return Promise.reject("Email not found");
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
  return new Promise((resolve) => {
    setTimeout(() => {
      if (!contractorLocation || !profession.length) {
        resolve([]);
        return;
      }

      // Fake data
      const mockData: Contractor[] = [
        {
          id: 1,
          name: "Alice Builder",
          rating: 8.7,
          specialization: "Plumber",
          description: "Experienced and reliable plumber.",
          certifications: ["Plumber", "Pipe Fitter"],
          availability: "Weekdays",
          yearsOfExperience: 10,
          address: "123 Main St",
          city: contractorLocation,
          imageId: "https://randomuser.me/api/portraits/women/1.jpg",
          user: { email: "alice@example.com" },
          phone: "555-1234",
        },
        {
          id: 2,
          name: "Bob Electrician",
          rating: 9.2,
          specialization: "Electrician",
          description: "Certified electrician with over a decade of work.",
          certifications: ["Electrician"],
          availability: "Weekends",
          yearsOfExperience: 12,
          address: "456 Oak Ave",
          city: contractorLocation,
          imageId: "https://randomuser.me/api/portraits/men/2.jpg",
          user: { email: "bob@example.com" },
          phone: "555-5678",
        },
      ];

      // Filter by certifications
      const filtered = mockData.filter((contractor) =>
        contractor.certifications.some((cert) => profession.includes(cert))
      );

      resolve(filtered);
    }, 1000); // simulate 1s network delay
  });
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
