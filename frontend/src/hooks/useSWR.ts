import useSWR, { SWRConfiguration } from "swr";
import { api } from "@/lib/api";
import type { Review, PageResponse, BusinessCategory } from "@/types";

// Default SWR config with sensible cache settings
const defaultConfig: SWRConfiguration = {
  revalidateOnFocus: false,
  revalidateIfStale: true,
  dedupingInterval: 5000,
  errorRetryCount: 2,
};

// ========================
// Business Hooks
// ========================

export function useBusinesses(query?: string, category?: string) {
  return useSWR(
    ["businesses", query, category],
    () =>
      api.searchBusinesses({ query, category: category as BusinessCategory }),
    { ...defaultConfig, revalidateOnFocus: true },
  );
}

export function useBusiness(id: string | number | null) {
  return useSWR(
    id ? ["business", id] : null,
    () => api.getBusinessById(Number(id)),
    defaultConfig,
  );
}

export function useMyBusinesses() {
  return useSWR("my-businesses", () => api.getMyBusinesses(), defaultConfig);
}

export function useCategories() {
  return useSWR("categories", () => api.getCategories(), {
    ...defaultConfig,
    revalidateOnMount: true,
    dedupingInterval: 60000,
  });
}

// ========================
// Appointment Hooks
// ========================

export function useMyAppointments() {
  return useSWR("my-appointments", () => api.getMyAppointments(), {
    ...defaultConfig,
    revalidateOnFocus: true,
  });
}

export function useMyUpcomingAppointments() {
  return useSWR(
    "my-upcoming-appointments",
    () => api.getMyUpcomingAppointments(),
    { ...defaultConfig, revalidateOnFocus: true },
  );
}

export function useWorkerAppointments(workerId: number | null, date?: string) {
  return useSWR(
    workerId ? ["worker-appointments", workerId, date] : null,
    () => api.getWorkerAppointments(workerId!),
    { ...defaultConfig, revalidateOnFocus: true, refreshInterval: 30000 },
  );
}

// ========================
// Service & Worker Hooks
// ========================

export function useServices(businessId: number | null) {
  return useSWR(
    businessId ? ["services", businessId] : null,
    () => api.getServices(businessId!),
    defaultConfig,
  );
}

export function useWorkers(businessId: number | null) {
  return useSWR(
    businessId ? ["workers", businessId] : null,
    () => api.getWorkers(businessId!),
    defaultConfig,
  );
}

// ========================
// Favorites Hooks
// ========================

export function useMyFavorites() {
  return useSWR("my-favorites", () => api.getAllMyFavorites(), {
    ...defaultConfig,
    revalidateOnFocus: true,
  });
}

export function useMyFavoriteIds() {
  return useSWR("my-favorite-ids", () => api.getMyFavoriteIds(), {
    ...defaultConfig,
    revalidateOnFocus: true,
  });
}

// ========================
// Review Hooks
// ========================

export function useBusinessReviews(
  businessId: number | null,
  page = 0,
  size = 10,
) {
  return useSWR<PageResponse<Review>>(
    businessId ? ["business-reviews", businessId, page, size] : null,
    () => api.getBusinessReviews(businessId!, page, size),
    defaultConfig,
  );
}

// ========================
// Business Images Hooks
// ========================

export function useBusinessImages(businessId: number | null) {
  return useSWR(
    businessId ? ["business-images", businessId] : null,
    () => api.getBusinessImages(businessId!),
    defaultConfig,
  );
}

// ========================
// Worker Availability Hook
// ========================

export function useWorkerAvailability(
  workerId: number | null,
  date: string | null,
) {
  return useSWR(
    workerId && date ? ["worker-availability", workerId, date] : null,
    () => api.getWorkerAvailability(workerId!, date!),
    { ...defaultConfig, dedupingInterval: 10000 },
  );
}
