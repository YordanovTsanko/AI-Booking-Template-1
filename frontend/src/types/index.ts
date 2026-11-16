// Shared domain & API types

export type Role = 'client' | 'staff' | 'admin';
export type BookingStatus = 'pending' | 'confirmed' | 'cancelled' | 'completed';
export type FeedbackType = 'success' | 'error' | 'warning' | 'info';

export interface Ref {
  _id: string;
}

export interface ServiceRef extends Ref {
  title: string;
}

export interface User extends Ref {
  name: string;
  email: string;
  phone?: string;
  role: Role;
  isActive?: boolean;
  createdAt?: string;
}

export interface StaffMember extends Ref {
  name: string;
  email?: string;
  phone?: string;
  position?: string;
  bio?: string;
  avatar?: string;
  services: ServiceRef[];
  workingDays: number[];
  workStart: string;
  workEnd: string;
  isActive: boolean;
}

export interface Service extends Ref {
  title: string;
  description: string;
  price: number;
  duration: number;
  category: string;
  image?: string;
  isActive: boolean;
  createdAt?: string;
}

export interface Booking extends Ref {
  client: (Ref & { name?: string; email?: string; phone?: string }) | string | null;
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  service: (ServiceRef & Partial<Service>) | string;
  serviceTitle: string;
  staff: (Ref & { name: string; position?: string }) | string;
  staffName: string;
  date: string;
  time: string;
  endTime: string;
  startAt: string;
  duration: number;
  price: number;
  status: BookingStatus;
  notes: string;
  createdAt?: string;
}

export interface FieldError {
  field: string;
  message: string;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  meta?: PaginationMeta;
}

export interface AuthPayload {
  user: User;
  token: string;
}

export interface Availability {
  date: string;
  isWorkingDay: boolean;
  slots: string[];
  workStart: string;
  workEnd: string;
  duration: number;
  staff: { _id: string; name: string };
}

export interface Stats {
  totalBookings: number;
  upcomingCount: number;
  pendingCount: number;
  completedCount: number;
  cancelledCount: number;
  revenue: number;
  revenueThisMonth: number;
  expectedRevenue: number;
  totalClients: number;
  totalServices: number;
  totalStaff: number;
  upcoming: Booking[];
}

export interface ChatSuggestion {
  serviceId: string;
  serviceTitle: string;
  staffId: string;
  staffName: string;
  date: string;
  time: string;
  label: string;
}

export interface ChatResponse {
  reply: string;
  suggestions: ChatSuggestion[];
  service: { _id: string; title: string; price: number; duration: number } | null;
  source: 'groq' | 'mock';
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  suggestions?: ChatSuggestion[];
}

export interface Feedback {
  type: FeedbackType;
  message: string;
  errors?: FieldError[];
  status?: number;
}

export interface NormalizedError {
  status: number;
  message: string;
  errors: FieldError[];
  offline?: boolean;
  network?: boolean;
  canceled?: boolean;
}

export type DropdownValue = string | number;

export interface DropdownOption<V extends DropdownValue = string> {
  value: V;
  label: string;
  description?: string;
  disabled?: boolean;
}

export type FieldErrors = Record<string, string>;

/** Returns the id of a populated or raw reference. */
export const refId = (value: Ref | string | null | undefined): string =>
  !value ? '' : typeof value === 'string' ? value : value._id;
