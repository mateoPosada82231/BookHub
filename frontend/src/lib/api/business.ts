// Business API module

import { BaseApiClient, API_BASE_URL } from "./base";
import {
  BusinessSummary,
  Business,
  PageResponse,
  CategoryOption,
  CreateBusinessRequest,
  UpdateBusinessRequest,
  BusinessCategory,
} from "@/types";

class BusinessApiClient extends BaseApiClient {
  async searchBusinesses(params: {
    query?: string;
    category?: BusinessCategory;
    city?: string;
    sortBy?: string;
    minRating?: number;
    page?: number;
    size?: number;
  }): Promise<PageResponse<BusinessSummary>> {
    const searchParams = new URLSearchParams();
    if (params.query) searchParams.append("query", params.query);
    if (params.category) searchParams.append("category", params.category);
    if (params.city) searchParams.append("city", params.city);
    if (params.sortBy) searchParams.append("sortBy", params.sortBy);
    if (params.minRating)
      searchParams.append("minRating", String(params.minRating));
    searchParams.append("page", String(params.page ?? 0));
    searchParams.append("size", String(params.size ?? 10));

    return this.request<PageResponse<BusinessSummary>>(
      `/api/businesses/search?${searchParams.toString()}`,
    );
  }

  async getById(id: number): Promise<Business> {
    return this.request<Business>(`/api/businesses/${id}`);
  }

  async getMyBusinesses(): Promise<BusinessSummary[]> {
    return this.request<BusinessSummary[]>("/api/businesses/my");
  }

  async create(data: CreateBusinessRequest): Promise<Business> {
    return this.request<Business>("/api/businesses", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async update(id: number, data: UpdateBusinessRequest): Promise<Business> {
    return this.request<Business>(`/api/businesses/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  }

  async delete(id: number): Promise<void> {
    return this.request<void>(`/api/businesses/${id}`, {
      method: "DELETE",
    });
  }

  async getCategories(): Promise<CategoryOption[]> {
    return this.request<CategoryOption[]>("/api/businesses/categories");
  }
}

export const businessApi = new BusinessApiClient(API_BASE_URL);
