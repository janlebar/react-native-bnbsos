// api/contractorApi.ts
// Contractor Utilities API Client
// All endpoints require authentication and confirmed contractor profile

import { api } from "./authapi";
import {
  AnalyticsResponse,
  CollaborationsResponse,
  CollaborationResponse,
  CollaborationMessagesResponse,
  CreateCollaborationRequest,
  SendCollaborationMessageRequest,
  ProjectsResponse,
  ProjectResponse,
  SubmitEstimateRequest,
  SubmitEstimateResponse,
} from "./types";

/**
 * Contractor API Error with status code
 */
export class ContractorApiError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public code?: string
  ) {
    super(message);
    this.name = "ContractorApiError";
  }
}

/**
 * Handle contractor API errors with appropriate messages
 */
function handleContractorApiError(error: any, defaultMessage: string): never {
  if (error.response) {
    const status = error.response.status;
    const errorData = error.response.data;
    const errorMessage = errorData?.error || defaultMessage;

    // Map status codes to specific error messages
    switch (status) {
      case 401:
        throw new ContractorApiError(
          "Authentication required. Please log in again.",
          401,
          "UNAUTHORIZED"
        );
      case 403:
        if (errorMessage.includes("not confirmed")) {
          throw new ContractorApiError(
            "Your contractor profile is not yet confirmed. Please complete onboarding or check your email.",
            403,
            "CONTRACTOR_NOT_CONFIRMED"
          );
        } else if (errorMessage.includes("contractor profile")) {
          throw new ContractorApiError(
            "You must have a confirmed contractor profile to access this feature.",
            403,
            "NO_CONTRACTOR_PROFILE"
          );
        }
        throw new ContractorApiError(
          errorMessage || "Access denied. You don't have permission to perform this action.",
          403,
          "FORBIDDEN"
        );
      case 404:
        throw new ContractorApiError(
          errorMessage || "Resource not found.",
          404,
          "NOT_FOUND"
        );
      case 500:
        throw new ContractorApiError(
          "Server error. Please try again later.",
          500,
          "SERVER_ERROR"
        );
      default:
        throw new ContractorApiError(
          errorMessage || defaultMessage,
          status,
          errorData?.code
        );
    }
  }

  // Network or other error
  throw new ContractorApiError(
    error.message || defaultMessage,
    undefined,
    "NETWORK_ERROR"
  );
}

/**
 * Get contractor analytics
 * GET /api/mobile/contractor/analytics
 */
export async function getContractorAnalytics(): Promise<AnalyticsResponse> {
  try {
    const response = await api.get("/api/mobile/contractor/analytics");
    return response.data;
  } catch (error: any) {
    console.error("Error fetching contractor analytics:", error);
    handleContractorApiError(error, "Failed to fetch analytics");
  }
}

/**
 * Get all collaborations for the current contractor
 * GET /api/mobile/contractor/collaborations
 */
export async function getCollaborations(): Promise<CollaborationsResponse> {
  try {
    const response = await api.get("/api/mobile/contractor/collaborations");
    return response.data;
  } catch (error: any) {
    console.error("Error fetching collaborations:", error);
    handleContractorApiError(error, "Failed to fetch collaborations");
  }
}

/**
 * Create a new collaboration
 * POST /api/mobile/contractor/collaborations
 */
export async function createCollaboration(
  data: CreateCollaborationRequest
): Promise<CollaborationResponse> {
  try {
    const response = await api.post(
      "/api/mobile/contractor/collaborations",
      data
    );
    return response.data;
  } catch (error: any) {
    console.error("Error creating collaboration:", error);
    handleContractorApiError(error, "Failed to create collaboration");
  }
}

/**
 * Get collaboration details
 * GET /api/mobile/contractor/collaborations/[id]
 */
export async function getCollaboration(
  collaborationId: string
): Promise<CollaborationResponse> {
  try {
    const response = await api.get(
      `/api/mobile/contractor/collaborations/${collaborationId}`
    );
    return response.data;
  } catch (error: any) {
    console.error("Error fetching collaboration:", error);
    handleContractorApiError(error, "Failed to fetch collaboration");
  }
}

/**
 * Get collaboration messages
 * GET /api/mobile/contractor/collaborations/[id]/messages
 */
export async function getCollaborationMessages(
  collaborationId: string
): Promise<CollaborationMessagesResponse> {
  try {
    const response = await api.get(
      `/api/mobile/contractor/collaborations/${collaborationId}/messages`
    );
    return response.data;
  } catch (error: any) {
    console.error("Error fetching collaboration messages:", error);
    handleContractorApiError(error, "Failed to fetch collaboration messages");
  }
}

/**
 * Send a message to a collaboration
 * POST /api/mobile/contractor/collaborations/[id]
 */
export async function sendCollaborationMessage(
  collaborationId: string,
  data: SendCollaborationMessageRequest
): Promise<CollaborationMessagesResponse & { message: any }> {
  try {
    const response = await api.post(
      `/api/mobile/contractor/collaborations/${collaborationId}`,
      data
    );
    return response.data;
  } catch (error: any) {
    console.error("Error sending collaboration message:", error);
    handleContractorApiError(error, "Failed to send message");
  }
}

/**
 * Delete a collaboration (only creator can delete)
 * DELETE /api/mobile/contractor/collaborations/[id]
 */
export async function deleteCollaboration(
  collaborationId: string
): Promise<{ success: boolean }> {
  try {
    const response = await api.delete(
      `/api/mobile/contractor/collaborations/${collaborationId}`
    );
    return response.data;
  } catch (error: any) {
    console.error("Error deleting collaboration:", error);
    handleContractorApiError(error, "Failed to delete collaboration");
  }
}

/**
 * Get open projects (OPEN and ASSIGNED where contractor has accepted bid)
 * GET /api/mobile/contractor/projects/open
 */
export async function getOpenProjects(): Promise<ProjectsResponse> {
  try {
    const response = await api.get("/api/mobile/contractor/projects/open");
    return response.data;
  } catch (error: any) {
    console.error("Error fetching open projects:", error);
    handleContractorApiError(error, "Failed to fetch projects");
  }
}

/**
 * Get project details
 * GET /api/mobile/contractor/projects/[id]
 */
export async function getProject(projectId: string): Promise<ProjectResponse> {
  try {
    const response = await api.get(
      `/api/mobile/contractor/projects/${projectId}`
    );
    return response.data;
  } catch (error: any) {
    console.error("Error fetching project:", error);
    handleContractorApiError(error, "Failed to fetch project");
  }
}

/**
 * Submit or update an estimate/bid for a project
 * POST /api/mobile/contractor/projects/[id]
 */
export async function submitEstimate(
  projectId: string,
  data: SubmitEstimateRequest
): Promise<SubmitEstimateResponse> {
  try {
    const response = await api.post(
      `/api/mobile/contractor/projects/${projectId}`,
      data
    );
    return response.data;
  } catch (error: any) {
    console.error("Error submitting estimate:", error);
    handleContractorApiError(error, "Failed to submit estimate");
  }
}
