// Reviews API module

import { BaseApiClient, API_BASE_URL } from "./base";
import {
  Review,
  CreateReviewRequest,
  BusinessImage,
  AddBusinessImageRequest,
  PageResponse,
} from "@/types";

class ReviewsApiClient extends BaseApiClient {
  /**
   * Get paginated reviews for a business
   */
  async getBusinessReviews(
    businessId: number,
    page: number = 0,
    size: number = 10,
  ): Promise<PageResponse<Review>> {
    return this.request<PageResponse<Review>>(
      `/api/businesses/${businessId}/reviews?page=${page}&size=${size}`,
    );
  }

  /**
   * Create a review for a completed appointment
   */
  async createReview(
    appointmentId: number,
    data: CreateReviewRequest,
  ): Promise<Review> {
    return this.request<Review>(`/api/appointments/${appointmentId}/review`, {
      method: "POST",
      body: JSON.stringify(data),
    });
  }
}

class BusinessImagesApiClient extends BaseApiClient {
  /**
   * Get all images for a business gallery
   */
  async getBusinessImages(businessId: number): Promise<BusinessImage[]> {
    return this.request<BusinessImage[]>(
      `/api/businesses/${businessId}/images`,
    );
  }

  /**
   * Add an image to the business gallery (owner only)
   */
  async addImage(
    businessId: number,
    data: AddBusinessImageRequest,
  ): Promise<BusinessImage> {
    return this.request<BusinessImage>(`/api/businesses/${businessId}/images`, {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  /**
   * Remove an image from the business gallery (owner only)
   */
  async removeImage(businessId: number, imageId: number): Promise<void> {
    return this.request<void>(
      `/api/businesses/${businessId}/images/${imageId}`,
      {
        method: "DELETE",
      },
    );
  }
}

export const reviewsApi = new ReviewsApiClient(API_BASE_URL);
export const businessImagesApi = new BusinessImagesApiClient(API_BASE_URL);
