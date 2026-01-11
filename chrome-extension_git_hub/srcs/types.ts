// Page type enum for type safety
export enum PageType {
  PROFILE = 'profile',    // /in/ pages
  COMPANY = 'company',    // /company/ pages
  OTHER = 'other'         // non-LinkedIn or unsupported pages
}

// Button configuration interface
export interface ButtonConfig {
  id: string;                    // Unique identifier (e.g., 'fullFunnel')
  label: string;                 // Display text
  webhookUrl: string;            // Clay webhook endpoint
  pageTypes: PageType[];         // Which page types show this button
  order: number;                 // Display order (lower = first)
}

// Webhook configuration
export interface WebhookConfig {
  webhook1: string;                    // Legacy: kept for compatibility
  webhook2: string;                    // Legacy: kept for compatibility
  fullFunnel: string;                  // New: Add in full funnel
  lookalikeCompanyProfile: string;     // New: Lookalike company (Profile pages)
  lookalikeCompanyCompany: string;     // New: Lookalike company (Company pages)
  findPeople: string;                  // New: Find People + Push in CRM
  csvImport: string;                   // New: CSV import endpoint
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
