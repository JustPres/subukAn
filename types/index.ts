export type EscrowState = 'funding' | 'active' | 'completed' | 'cancelled' | 'disputed'

export interface Project {
  id: string;
  title: string;
  description: string;
  budget: number;
  slots: number;
  status: EscrowState;
}

export interface User {
  id: string;
  role: 'poster' | 'tester';
  name: string;
}

export interface DemographicTarget {
  age_group?: string | string[];
  gender?: string | string[];
  employment_status?: string | string[];
  tech_literacy?: string | string[];
  ageGroup?: string | string[];
  employmentStatus?: string | string[];
  techLiteracy?: string | string[];
}

export interface QuickImpressionTask {
  id: string;
  listing_id?: string;
  title?: string;
  description?: string;
  imageUrl?: string;
  image_url?: string;
  websiteUrl?: string;
  website_url?: string;
  previewUrl?: string;
  durationSeconds?: number;
  impression_duration_seconds?: number;
  recallQuestion?: string;
  question_text?: string;
}
