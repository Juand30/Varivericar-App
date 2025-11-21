
export interface DamageReport {
  id: string;
  technicianName: string;
  licensePlate: string;
  notes: string;
  images: File[]; // Runtime use (upload process)
  imagePreviewUrls?: string[]; // Runtime use (local preview before upload)
  cloudImageUrls?: string[]; // Remote URLs
  aiAnalysis?: string;
  timestamp: number;
  userEmail: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  isLoading?: boolean;
}

export enum ReportStatus {
  IDLE = 'IDLE',
  ANALYZING = 'ANALYZING',
  SENDING = 'SENDING',
  SUCCESS = 'SUCCESS',
  ERROR = 'ERROR'
}

export type UserRole = 'ADMIN' | 'USER';

export interface User {
  id?: string;
  email: string;
  password?: string;
  role: UserRole;
  name?: string;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning';
  timestamp: number;
}
