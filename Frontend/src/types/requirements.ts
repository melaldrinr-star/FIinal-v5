/**
 * Types for Training Requirements Management System
 *
 * Defines data structures for requirement definitions and submissions
 */

/**
 * Requirement submission status enum
 */
export type RequirementSubmissionStatus = 'pending' | 'submitted' | 'verified' | 'rejected' | 'waived';

/**
 * Requirement submission record for a trainee
 * Represents a trainee's submission status for a specific requirement
 */
export interface RequirementSubmission {
  /** Unique identifier for the submission record */
  id: string;
  
  /** Reference to the enrollment */
  enrollmentId: string;
  
  /** Reference to the requirement definition */
  requirementId: string;
  
  /** Current submission status */
  status: RequirementSubmissionStatus;
  
  /** Trainee information */
  traineeId: string;
  traineeName: string;
  traineeEmail?: string;
  
  /** Document URL if submitted */
  documentUrl?: string;
  
  /** When the requirement was submitted (ISO 8601 timestamp) */
  submittedAt?: string;
  
  /** When the requirement was verified (ISO 8601 timestamp) */
  verifiedAt?: string;
  
  /** User who verified the submission */
  verifiedBy?: string;
  
  /** Reason for rejection (if status is 'rejected') */
  rejectionReason?: string;
  
  /** When the record was created (ISO 8601 timestamp) */
  createdAt: string;
  
  /** When the record was last updated (ISO 8601 timestamp) */
  updatedAt: string;
}

/**
 * Requirement definition details
 */
export interface RequirementDefinition {
  /** Unique identifier */
  id: string;
  
  /** Tenant ID for multi-tenancy */
  tenantId: string;
  
  /** Requirement type enum */
  requirementType: string;
  
  /** Display name for the requirement */
  displayName: string;
  
  /** Description/instructions for trainees */
  description: string;
  
  /** Whether this requirement is mandatory */
  isMandatory: boolean;
  
  /** Whether this requirement is active */
  isActive: boolean;
  
  /** Applicability rules (e.g., for conditional requirements) */
  applicabilityRules?: Record<string, any>;
  
  /** Display order/priority */
  displayOrder: number;
  
  /** When the record was created */
  createdAt: string;
  
  /** When the record was last updated */
  updatedAt: string;
}

/**
 * Submission statistics for a requirement
 * Used in requirement definition list views
 */
export interface SubmissionStats {
  /** Total number of trainees with this requirement */
  totalTrainees: number;
  
  /** Number of pending submissions */
  pendingCount: number;
  
  /** Number of submitted submissions */
  submittedCount: number;
  
  /** Number of verified submissions */
  verifiedCount: number;
  
  /** Number of rejected submissions */
  rejectedCount: number;
  
  /** Number of waived submissions */
  waivedCount: number;
  
  /** Completion rate as percentage (0-100) */
  completionRate: number;
}

/**
 * Pagination information
 */
export interface PaginationInfo {
  /** Current page number (1-indexed) */
  page: number;
  
  /** Records per page */
  limit: number;
  
  /** Total number of records */
  total: number;
  
  /** Whether there are more records */
  hasMore: boolean;
}

/**
 * Filters for requirement submissions
 */
export interface RequirementSubmissionFilters {
  /** Filter by status (pending, submitted, verified, rejected, waived) */
  status?: RequirementSubmissionStatus | RequirementSubmissionStatus[];
  
  /** Filter by trainee name or email (search term) */
  searchTerm?: string;
}

/**
 * Sort configuration for requirement submissions
 */
export interface RequirementSubmissionSort {
  /** Column to sort by: 'traineeName', 'status', 'submittedAt', 'verifiedAt' */
  column: 'traineeName' | 'status' | 'submittedAt' | 'verifiedAt';
  
  /** Sort direction: 'asc' or 'desc' */
  direction: 'asc' | 'desc';
}

/**
 * Analytics for a single requirement
 * Includes completion rates, rejection counts, and time-to-completion metrics
 */
export interface RequirementAnalytic {
  /** Unique identifier for the requirement */
  requirement_id: string;
  
  /** Requirement type enum */
  requirement_type: string;
  
  /** Display name for the requirement */
  display_name: string;
  
  /** Whether this requirement is mandatory */
  is_mandatory: boolean;
  
  /** Completion rate as percentage (0-100) */
  completion_rate: number;
  
  /** Total number of trainees with this requirement */
  total_trainees: number;
  
  /** Number of verified submissions */
  verified_count: number;
  
  /** Number of rejected submissions */
  rejected_count: number;
  
  /** Rejection rate as percentage (rejections / (verified + rejected)) */
  rejection_rate: number;
  
  /** Average time to completion in days (optional) */
  avg_time_to_completion_days?: number;
}

/**
 * Summary statistics for all requirements analytics
 */
export interface AnalyticsSummary {
  /** Total number of requirement types */
  total_requirements: number;
  
  /** Average completion rate across all requirements (0-100) */
  avg_completion_rate: number;
  
  /** Average rejection rate across all requirements (0-100) */
  avg_rejection_rate: number;
}

/**
 * Complete requirements analytics data
 * Contains analytics for individual requirements and summary statistics
 */
export interface RequirementsAnalytics {
  /** Analytics for each requirement type */
  by_requirement: RequirementAnalytic[];
  
  /** Summary statistics across all requirements */
  summary: AnalyticsSummary;
  
  /** Timestamp when analytics were generated (ISO 8601) */
  timestamp: string;
}
