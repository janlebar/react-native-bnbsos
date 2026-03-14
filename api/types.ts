// api/types.ts
// Better Auth Mobile Types

/**
 * Login mode for mobile auth – must match Next.js backend contract.
 * See `next-auth/Expo_integration/login/contractor_user_login.md`.
 */
export type LoginAs = "user" | "contractor";

/**
 * User model matching Better Auth schema
 */
export type User = {
  id: string;
  name: string | null;
  email: string;
  emailVerified: Date | null;
  image?: string | null;
  role: "USER" | "ADMIN";
  isTwoFactorEnabled: boolean;
  isContractor: boolean; // Extended field
  contractor?: ContractorProfile | null; // If user has contractor profile
};

/**
 * Contractor profile linked to user
 */
export interface ContractorProfile {
  id: number;
  uid: string;
  name: string;
  specializations: string[];
  city: string;
  rating: number;
  confirmed: boolean;
}

/**
 * Login credentials
 */
export interface UserCredentials {
  email: string;
  password: string;
  /**
   * Optional flag kept for backward compatibility.
   * Prefer using `loginAs` so the backend can enforce contractor rules.
   */
  isContractor?: boolean;
  /**
   * Explicit login mode sent to `/api/mobile/auth/login`.
   * If omitted, the backend will default to `"user"`.
   */
  loginAs?: LoginAs;
}

/**
 * Login response with Better Auth tokens
 * Extended to include effective login mode.
 */
export interface LoginResponse {
  token: string; // Access token (JWT, 20s expiry)
  refreshToken: string; // Refresh token (JWT, 30d expiry)
  user: User;
  twoFactorRequired: boolean;
  isContractor: boolean;
  /**
   * Effective login mode as determined by the backend.
   * Falls back to `"user"` when not present (legacy responses).
   */
  loginAs?: LoginAs;
}

/**
 * Registration form values
 */
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

/**
 * Session response from Better Auth
 */
export interface SessionResponse {
  user: User | null;
  session: {
    id: string;
    userId: string;
    expiresAt: Date;
    token: string;
  } | null;
}

/**
 * Password reset request
 */
export interface PasswordResetRequest {
  email: string;
  redirectTo?: string;
}

/**
 * Password reset completion
 */
export interface PasswordResetCompletion {
  token: string;
  newPassword: string;
}

/**
 * Token refresh request
 */
export interface TokenRefreshRequest {
  refreshToken: string;
}

/**
 * Token refresh response
 */
export interface TokenRefreshResponse {
  token: string;
  refreshToken?: string;
}

/**
 * Navigation stack param list
 */
export type RootStackParamList = {
  ContractorsList: { location: string; profession: string[] };
  ContractorDetails: { id: string };
  Chat: { contactId?: string; conversationId?: string };
  Home: undefined;
  Login: undefined;
  Register: undefined;
};

// ============================================================================
// Contractor Utilities Types
// ============================================================================

/**
 * Contractor Analytics - Overview metrics
 */
export interface ContractorAnalyticsOverview {
  totalConversations: number;
  totalMessages: number;
  totalReviews: number;
  averageRating: number;
  favoritedCount: number;
  premiumPlacement: boolean;
}

/**
 * Contractor Analytics - Time series data point
 */
export interface TimeSeriesDataPoint {
  date: string;
  count: number;
}

/**
 * Contractor Analytics - Review data
 */
export interface ReviewData {
  rating: number;
  comment: string | null;
  createdAt: Date | string;
}

/**
 * Contractor Analytics - Specialization stats
 */
export interface SpecializationStat {
  name: string;
  count: number;
}

/**
 * Contractor Analytics - Response time data
 */
export interface ResponseTimeData {
  averageResponseTime: number; // in hours
  responseRatePercentage: number;
}

/**
 * Complete Contractor Analytics response
 */
export interface ContractorAnalytics {
  overview: ContractorAnalyticsOverview;
  messagesOverTime: TimeSeriesDataPoint[];
  conversationsOverTime: TimeSeriesDataPoint[];
  reviewsData: ReviewData[];
  topSpecializations: SpecializationStat[];
  responseTimeData: ResponseTimeData;
}

/**
 * Analytics API Response
 */
export interface AnalyticsResponse {
  success: boolean;
  data: ContractorAnalytics;
}

/**
 * Collaboration Participant
 */
export interface CollaborationParticipant {
  id: string;
  collaborationId: string;
  contractorId: number;
  joinedAt: Date | string;
  contractor: {
    id: number;
    name: string;
    city: string;
    imageUrl: string | null;
    imageId: string | null;
  };
}

/**
 * Collaboration Message
 */
export interface CollaborationMessage {
  id: string;
  collaborationId: string;
  senderUserId: string;
  text: string;
  date: Date | string;
  deleted: boolean;
  sender: {
    id: string;
    name: string | null;
    image: string | null;
  };
}

/**
 * Collaboration
 */
export interface Collaboration {
  id: string;
  title: string | null;
  createdAt: Date | string;
  createdById: string;
  participants: CollaborationParticipant[];
  messages?: CollaborationMessage[];
}

/**
 * Collaborations API Response
 */
export interface CollaborationsResponse {
  collaborations: Collaboration[];
}

/**
 * Single Collaboration API Response
 */
export interface CollaborationResponse {
  collaboration: Collaboration;
}

/**
 * Collaboration Messages API Response
 */
export interface CollaborationMessagesResponse {
  messages: CollaborationMessage[];
}

/**
 * Create Collaboration Request
 */
export interface CreateCollaborationRequest {
  title: string;
  participantContractorIds: number[];
}

/**
 * Send Collaboration Message Request
 */
export interface SendCollaborationMessageRequest {
  text: string;
}

/**
 * Project Estimate
 */
export interface ProjectEstimate {
  id: string;
  projectId: string;
  contractorId: number;
  amount: number;
  currency: string;
  notes: string | null;
  estimatedTimeline: string | null;
  accepted: boolean;
  createdAt: Date | string;
  contractor?: {
    id: number;
    name: string;
    imageId: string | null;
  };
}

/**
 * Project
 */
export interface Project {
  id: string;
  title: string;
  description: string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
  status: "OPEN" | "ASSIGNED" | "CLOSED";
  createdByUserId: string;
  collaborationId: string | null;
  city: string | null;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  budgetMin: number | null;
  budgetMax: number | null;
  deadline: Date | string | null;
  requiredSpecializations: string[];
  imageUrls: string[];
  estimates?: ProjectEstimate[];
  _count?: {
    estimates: number;
  };
  collaboration?: Collaboration;
  createdBy?: {
    id: string;
    name: string | null;
    email: string;
    image: string | null;
  };
}

/**
 * Projects API Response
 */
export interface ProjectsResponse {
  projects: Project[];
}

/**
 * Single Project API Response
 */
export interface ProjectResponse {
  project: Project;
}

/**
 * Submit Estimate Request
 */
export interface SubmitEstimateRequest {
  amount: number;
  notes?: string;
  estimatedTimeline?: string;
}

/**
 * Submit Estimate Response
 */
export interface SubmitEstimateResponse {
  estimate: ProjectEstimate;
}
