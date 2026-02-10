// Types for the BookHub application

export type UserRole = "OWNER" | "WORKER" | "CLIENT";

export interface User {
  id: number;
  email: string;
  fullName: string;
  role: UserRole;
  enabled: boolean;
  createdAt: string;
  avatarUrl?: string;
  phone?: string;
}

export type BusinessCategory =
  | "BARBERSHOP"
  | "HAIR_SALON"
  | "NAIL_SALON"
  | "SPA"
  | "CAR_WASH"
  | "PET_GROOMING"
  | "TATTOO_STUDIO"
  | "OTHER";

export const CATEGORY_LABELS: Record<BusinessCategory, string> = {
  BARBERSHOP: "Barbería",
  HAIR_SALON: "Salón de Belleza",
  NAIL_SALON: "Manicura/Pedicura",
  SPA: "Spa",
  CAR_WASH: "Autolavado",
  PET_GROOMING: "Peluquería de Mascotas",
  TATTOO_STUDIO: "Estudio de Tatuajes",
  OTHER: "Otro",
};

// Business Summary (for lists/search)
export interface BusinessSummary {
  id: number;
  name: string;
  category: BusinessCategory;
  category_display: string;
  address: string;
  city: string;
  cover_image_url?: string;
  average_rating?: number;
  total_reviews: number;
  services_count: number;
}

// Full Business (for detail view)
export interface Business {
  id: number;
  name: string;
  category: BusinessCategory;
  category_display: string;
  description?: string;
  address: string;
  city: string;
  phone?: string;
  cover_image_url?: string;
  active: boolean;
  average_rating?: number;
  total_reviews: number;
  owner_id: number;
  owner_name: string;
  services_count: number;
  workers_count: number;
  created_at: string;
  services?: Service[];
  workers?: Worker[];
  gallery_images?: string[];
}

export interface Service {
  id: number;
  name: string;
  description?: string;
  duration_minutes: number;
  price: number;
  image_url?: string;
  active: boolean;
}

export interface Worker {
  id: number;
  user_id: number;
  full_name: string;
  email?: string;
  avatar_url?: string;
  position?: string;
  active: boolean;
  business_id?: number;
  business_name?: string;
  created_at?: string;
  schedules?: WorkerSchedule[];
}

export interface WorkerSchedule {
  day_of_week: number;
  start_time: string;
  end_time: string;
  is_available: boolean;
}

export type AppointmentStatus =
  | "PENDING"
  | "CONFIRMED"
  | "COMPLETED"
  | "CANCELLED"
  | "NO_SHOW";

export interface Appointment {
  id: number;
  client_id: number;
  client_name: string;
  client_phone?: string;
  worker_id: number;
  worker_name: string;
  service_id: number;
  service_name: string;
  service_price?: number;
  service_duration?: number;
  business_id: number;
  business_name: string;
  business_address?: string;
  start_time: string; // ISO datetime string
  end_time: string; // ISO datetime string
  status: AppointmentStatus;
  client_notes?: string;
  notes?: string; // alias for client_notes
  cancellation_reason?: string;
  total_price?: number;
  created_at: string;
  has_review?: boolean;
}

// API Pagination Response
export interface PageResponse<T> {
  content: T[];
  total_elements: number;
  total_pages: number;
  page: number;
  size: number;
}

// Category from API
export interface CategoryOption {
  value: string;
  label: string;
}

// Request types
export interface CreateBusinessRequest {
  name: string;
  category: BusinessCategory;
  description?: string;
  address: string;
  city: string;
  phone?: string;
  cover_image_url?: string;
}

export interface UpdateBusinessRequest {
  name?: string;
  description?: string;
  address?: string;
  city?: string;
  phone?: string;
  cover_image_url?: string;
  active?: boolean;
}

export interface CreateServiceRequest {
  name: string;
  description?: string;
  duration_minutes: number;
  price: number;
  image_url?: string;
}

export interface UpdateServiceRequest {
  name?: string;
  description?: string;
  duration_minutes?: number;
  price?: number;
  image_url?: string;
  active?: boolean;
}

export interface CreateWorkerRequest {
  email: string;
  full_name: string;
  position?: string;
}

export interface WorkerScheduleRequest {
  day_of_week: number;
  start_time: string;
  end_time: string;
  is_available: boolean;
}

export interface UpdateProfileRequest {
  full_name?: string;
  phone?: string;
  avatar_url?: string;
}

export interface ChangePasswordRequest {
  current_password: string;
  new_password: string;
}

export interface CreateAppointmentRequest {
  business_id: number;
  worker_id: number;
  service_id: number;
  start_time: string;
  client_notes?: string;
}

export interface UpdateAppointmentRequest {
  status?: AppointmentStatus;
}

// Availability Response
export interface AvailabilityResponse {
  worker_id: number;
  worker_name: string;
  date: string;
  available_slots: TimeSlot[];
}

export interface TimeSlot {
  start_time: string;
  end_time: string;
  available: boolean;
}

// Review types
export interface Review {
  id: number;
  rating: number;
  comment?: string;
  appointment_id: number;
  client_name: string;
  client_avatar_url?: string;
  service_name: string;
  created_at: string;
}

export interface CreateReviewRequest {
  rating: number;
  comment?: string;
}

// Business Image types (Gallery)
export interface BusinessImage {
  id: number;
  image_url: string;
  caption?: string;
  display_order: number;
}

export interface AddBusinessImageRequest {
  image_url: string;
  caption?: string;
}
