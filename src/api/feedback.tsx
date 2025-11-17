/* eslint-disable @typescript-eslint/no-explicit-any */
import { authenticatedApiRequest, apiRequest } from "./client";

// Feedback interfaces and service
export interface FeedbackRequest {
  reservation_id: string;
  rating: number; // 1-5
  comment?: string;
  feedback_type: "customer_to_owner" | "owner_to_customer";
}

export interface Feedback {
  _id: string;
  from_user_id: any;
  to_user_id: string;
  room_id: string;
  room_name: string;
  reservation_id: string;
  feedback_type: "customer_to_owner" | "owner_to_customer";
  rating: number;
  comment?: string;
  createdAt: string;
  updatedAt: string;
  deleted: boolean;
  from_user_id_populated?: {
    _id: string;
    username: string;
    email: string;
  };
  to_user_id_populated?: {
    _id: string;
    username: string;
    email: string;
  };
}

export interface FeedbackEligibility {
  canGiveFeedback: boolean;
  feedbackType: string | null;
  alreadySubmitted: boolean;
  reservationStatus: string;
  mutualFeedback: {
    customerFeedbackGiven: boolean;
    ownerFeedbackGiven: boolean;
    bothCompleted: boolean;
  };
}

export const feedbackAPI = {
  // Create feedback
  createFeedback: async (
    feedbackData: FeedbackRequest
  ): Promise<{ message: string; feedback: Feedback }> => {
    try {
      const response = await authenticatedApiRequest("/feedback", {
        method: "POST",
        body: JSON.stringify(feedbackData),
      });
      return response;
    } catch (error) {
      console.error("Error creating feedback:", error);
      throw error;
    }
  },

  // Get feedback eligibility for a reservation
  getFeedbackEligibility: async (
    reservationId: string
  ): Promise<FeedbackEligibility> => {
    try {
      const response = await authenticatedApiRequest(
        `/feedback/eligibility/${reservationId}`
      );
      return response;
    } catch (error) {
      console.error("Error checking feedback eligibility:", error);
      throw error;
    }
  },

  // Get user's feedback summary
  getUserFeedbackSummary: async (userId: string): Promise<any> => {
    try {
      const response = await authenticatedApiRequest(
        `/feedback/user/${userId}`
      );
      return response;
    } catch (error) {
      console.error("Error getting user feedback summary:", error);
      throw error;
    }
  },

  // Get feedbacks for a room (public reviews)
  getRoomFeedbacks: async (
    roomId: string,
    page = 1,
    limit = 10
  ): Promise<any> => {
    try {
      const response = await apiRequest(
        `/feedback/room/${roomId}?page=${page}&limit=${limit}`
      );
      return response;
    } catch (error) {
      console.error("Error getting room feedbacks:", error);
      throw error;
    }
  },

  // Update feedback
  updateFeedback: async (
    feedbackId: string,
    updateData: { rating?: number; comment?: string }
  ): Promise<{ message: string; feedback: Feedback }> => {
    try {
      const response = await authenticatedApiRequest(
        `/feedback/${feedbackId}`,
        {
          method: "PUT",
          body: JSON.stringify(updateData),
        }
      );
      return response;
    } catch (error) {
      console.error("Error updating feedback:", error);
      throw error;
    }
  },

  // Delete feedback
  deleteFeedback: async (feedbackId: string): Promise<{ message: string }> => {
    try {
      const response = await authenticatedApiRequest(
        `/feedback/${feedbackId}`,
        {
          method: "DELETE",
        }
      );
      return response;
    } catch (error) {
      console.error("Error deleting feedback:", error);
      throw error;
    }
  },
};
