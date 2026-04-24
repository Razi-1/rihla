import type { AccountType, Gender } from './common';

export interface Account {
  id: string;
  email: string;
  account_type: AccountType;
  first_name: string;
  last_name: string;
  date_of_birth: string;
  gender: Gender;
  phone_number: string | null;
  phone_country_code: string | null;
  profile_picture_url: string | null;
  is_active: boolean;
  is_restricted: boolean;
  is_email_verified: boolean;
  is_age_restricted: boolean;
  deletion_requested_at: string | null;
  deletion_scheduled_for: string | null;
  last_login_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface LoginRequest {
  email: string;
  password: string;
  account_type: AccountType;
}

export interface RegisterRequest {
  email: string;
  password: string;
  account_type: AccountType;
  first_name: string;
  last_name: string;
  date_of_birth: string;
  government_id: string;
  id_country_code: string;
  phone_number?: string;
  phone_country_code?: string;
  parent_invite_token?: string;
}

export interface LoginResponse {
  data: {
    account: Account;
    access_token: string;
  };
  message: string;
}

export interface RegisterResponse {
  data: {
    account: Account;
  };
  message: string;
}

export interface PasswordResetRequest {
  email: string;
  account_type: AccountType;
}

export interface ResetPasswordRequest {
  token: string;
  password: string;
}

export interface ChangePasswordRequest {
  current_password: string;
  new_password: string;
}

export interface AccountSettings {
  notification_email: boolean;
  notification_push: boolean;
  notification_chat: boolean;
  timezone: string;
}
