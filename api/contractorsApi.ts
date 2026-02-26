// api/contractorsApi.ts
// API client for contractor listings

import { api } from "./authapi";
import {
  Contractor,
  ContractorDetail,
  ServiceCategory,
  ContractorListResponse,
  ContractorSearchResponse,
  ContractorSearchParams,
  SortOption,
} from "../types/home";

class ContractorsService {
  /**
   * Fetch paginated list of contractors with sorting
   */
  async fetchContractors(
    page: number = 0,
    pageSize: number = 16,
    sort: SortOption = "rating"
  ): Promise<ContractorListResponse> {
    try {
      const response = await api.get<ContractorListResponse>(
        `/api/mobile/contractors/list`,
        {
          params: {
            page,
            pageSize,
            sort,
          },
        }
      );
      return response.data;
    } catch (error: any) {
      console.error("Error fetching contractors:", error);
      if (error.response?.data?.error) {
        throw new Error(error.response.data.error);
      }
      throw new Error("Failed to fetch contractors");
    }
  }

  /**
   * Search contractors with full-text search and filters
   */
  async searchContractors(
    params: ContractorSearchParams
  ): Promise<ContractorSearchResponse> {
    try {
      // Build params object, only including defined values
      const queryParams: Record<string, string | number> = {
        page: params.page || 0,
        limit: params.limit || 16,
      };
      
      // Only add optional params if they have values
      if (params.q) queryParams.q = params.q;
      if (params.location) queryParams.location = params.location;
      if (params.region) queryParams.region = params.region;
      if (params.profession) queryParams.profession = params.profession;
      
      console.log(`[API] Calling /api/mobile/contractors/search with params:`, queryParams);
      console.log(
        `[API] Location param in request: "${
          (queryParams as any).location ?? "(none)"
        }"`
      );
      
      const response = await api.get<ContractorSearchResponse>(
        `/api/mobile/contractors/search`,
        {
          params: queryParams,
        }
      );
      
      console.log(`[API] Response: ${response.data.contractors.length} contractors, total: ${response.data.total}`);
      
      // Log first contractor's specializations/certifications if available for debugging
      if (response.data.contractors.length > 0) {
        const first = response.data.contractors[0];
        console.log(`[API] Sample contractor: ${first.name}, specializations: [${first.specializations.join(", ")}], certifications: [${first.certifications.join(", ")}]`);
      }
      return response.data;
    } catch (error: any) {
      console.error("Error searching contractors:", error);
      if (error.response?.data?.error) {
        throw new Error(error.response.data.error);
      }
      throw new Error("Failed to search contractors");
    }
  }

  /**
   * Fetch single contractor by ID with reviews
   */
  async fetchContractorById(id: number): Promise<ContractorDetail> {
    try {
      const response = await api.get<ContractorDetail>(
        `/api/mobile/contractors/${id}`
      );
      return response.data;
    } catch (error: any) {
      console.error("Error fetching contractor:", error);
      if (error.response?.data?.error) {
        throw new Error(error.response.data.error);
      }
      throw new Error("Failed to fetch contractor");
    }
  }

  /**
   * Fetch service categories for carousel
   */
  async fetchCategories(): Promise<ServiceCategory[]> {
    try {
      const response = await api.get<ServiceCategory[]>(
        `/api/mobile/contractors/categories`
      );
      return response.data;
    } catch (error: any) {
      console.error("Error fetching categories:", error);
      if (error.response?.data?.error) {
        throw new Error(error.response.data.error);
      }
      throw new Error("Failed to fetch categories");
    }
  }
}

export const contractorsService = new ContractorsService();
