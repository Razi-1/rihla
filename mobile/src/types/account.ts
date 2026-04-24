import { AccountType } from './common';

export interface AccountResponse {
  id: string;
  email: string;
  account_type: AccountType;
  first_name: string;
  last_name: string;
  date_of_birth: string;
  gender: string | null;
  phone_number: string | null;
  phone_country_code: string | null;
  profile_picture_url: string | null;
  is_email_verified: boolean;
  is_age_restricted: boolean;
  is_restricted: boolean;
  last_login_at: string | null;
  created_at: string;
}

export interface AccountUpdateRequest {
  first_name?: string;
  last_name?: string;
  phone_number?: string;
  phone_country_code?: string;
  profile_picture_url?: string;
}

export interface ChangePasswordRequest {
  current_password: string;
  new_password: string;
}

export interface SettingsResponse {
  email_notifications: boolean;
  push_notifications: boolean;
  timezone: string;
}

export interface SettingsUpdateRequest {
  email_notifications?: boolean;
  push_notifications?: boolean;
  timezone?: string;
}
