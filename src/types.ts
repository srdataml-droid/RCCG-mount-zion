export interface ChurchInfo {
  id: string;
  name: string;
  tagline: string;
  pastorName: string;
  pastorTitle: string;
  address: string;
  city: string;
  state: string;
  phone: string;
  email: string;
  facebook_url: string;
  liveStreamEmbedId: string;
  liveStreamUrl: string | null;
  serviceTimes: {
    day: string;
    time: string;
    name: string;
  }[];
  accentColor: string; // Tailwind color class e.g., 'emerald', 'sky', 'indigo', 'amber'
  logoText: string;
  isLiveNow: boolean;
}

export type GivingCategory = 'Tithe' | 'Offering' | 'Thanksgiving' | 'Building Fund' | 'Missions' | 'Other';

export interface GivingAccount {
  id: string;
  category: GivingCategory;
  bankName: string;
  accountName: string;
  accountNumber: string;
}

export interface ChurchEvent {
  id: string;
  title: string;
  description: string;
  date: string; // YYYY-MM-DD
  endDate?: string | null; // YYYY-MM-DD; absent for a single-day event
  time: string;
  location: string;
  category: 'Special' | 'Weekly' | 'Youth' | 'Women' | 'Men' | 'Prayer';
  bannerUrl: string;
}

export interface Testimony {
  id: string;
  authorName: string;
  title: string;
  content: string;
  date: string;
  likes: number;
  isApproved: boolean;
}

export interface ConnectCardSubmission {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  isFirstTime: boolean;
  prayerRequest: string;
  interestInGroups: string[];
  submittedAt: string;
}

export interface MeetingRequest {
  id: string;
  fullName: string;
  contact: string;
  preferredDateTime: string;
  reason: string;
  submittedAt: string;
}

export interface Department {
  id: string;
  name: string;
  description: string;
  howToJoin: string;
}

export interface GivingRecord {
  id: string;
  donorName: string;
  email: string;
  amount: number;
  category: GivingCategory;
  reference: string;
  status: 'success' | 'pending' | 'failed';
  date: string;
}
