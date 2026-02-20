// types/home.ts
// Type definitions for home/contractor listings

export interface ServiceCategory {
  key: string;
  name: string;
}

export interface Contractor {
  id: number;
  uid: string;
  name: string;
  specializations: string[];
  city: string;
  rating: number;
  description?: string | null;
  certifications: string[];
  yearsOfExperience?: number | null;
  availability?: string;
  address: string;
  phone?: string;
  imageId?: string | null;
  backgroundImageUrl?: string | null;
  contractorLatitude?: number | null;
  contractorLongitude?: number | null;
  premiumPlacement?: boolean;
  placementTier?: "CITY_FIRST" | "PROFESSION_FIRST" | "TOP_FIVE";
  placementExpiresAt?: string | null;
  selectedPosition?: number | null;
  user?: {
    email?: string | null;
  };
}

export interface ContractorDetail extends Contractor {
  reviews: Review[];
}

export interface Review {
  id: string;
  comment: string;
  rating: number;
  createdAt: string;
  updatedAt: string;
  user: {
    name: string;
    image?: string | null;
  };
}

export type SortOption =
  | "rating"
  | "experience"
  | "availability"
  | "certifications"
  | "description";

export type SortDirection = "asc" | "desc";

export interface ContractorListResponse {
  contractors: Contractor[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

export interface ContractorSearchResponse {
  contractors: Contractor[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

export interface ContractorSearchParams {
  q?: string;
  location?: string;
  region?: string;
  profession?: string;
  page?: number;
  limit?: number;
}
