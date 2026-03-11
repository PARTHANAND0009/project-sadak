import { Timestamp } from 'firebase/firestore';

export type Severity = 'low' | 'medium' | 'high';
export type Status = 'open' | 'fixed';

export interface Pothole {
  id: string;
  lat: number;
  lng: number;
  severity: Severity;
  description?: string;
  imageUrl?: string;
  status: Status;
  createdAt: Timestamp;
  reportedBy: string;
}

export interface PotholeIndexItem {
  id: string;
  lat: number;
  lng: number;
  sev: Severity;
  stat: Status;
  ts: number;
}

export interface User {
  uid: string;
  role: 'user' | 'admin';
}
