// Webhook configuration
export interface WebhookConfig {
  webhook1: string;
  webhook2: string;
}

// LinkedIn profile data extracted from page
export interface LinkedInProfileData {
  linkedinUrl: string;
  fullName: string;
  companyName: string;
  linkedinCompanyPage: string;
}

// LinkedIn company data extracted from page
export interface LinkedInCompanyData {
  linkedinUrl: string;
  companyName: string;
}

// Union type for extracted LinkedIn data
export type LinkedInData = LinkedInProfileData | LinkedInCompanyData;

// Webhook payload for contact enrichment
export interface ContactWebhookPayload {
  "LinkedIn Url": string;
  "Full Name": string;
  "Company Name"?: string;
  "LinkedIn Company Page"?: string;
  "creator": string;
}

// Webhook payload for right-click context menu
export interface LinkWebhookPayload {
  linkUrl: string;
}

// CSV contact row structure
export interface CSVContact {
  fullName: string;
  linkedinUrl: string;
}

// Chrome storage data structure
export interface StorageData {
  email?: string;
}

// Notification types
export type NotificationType = 'success' | 'error';

// Type guard for profile data
export function isProfileData(data: LinkedInData): data is LinkedInProfileData {
  return 'fullName' in data && 'linkedinCompanyPage' in data;
}

// Type guard for company data
export function isCompanyData(data: LinkedInData): data is LinkedInCompanyData {
  return 'companyName' in data;
}
