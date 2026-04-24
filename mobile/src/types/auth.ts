import { AccountType } from './common';

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
  gender?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
  account_type: AccountType;
}

export interface TokenResponse {
  access_token: string;
  refresh_token?: string;
  token_type: string;
  account_id: string;
  account_type: AccountType;
  first_name: string;
  last_name: string;
  is_email_verified: boolean;
  is_age_restricted: boolean;
}

export interface RefreshRequest {
  refresh_token: string;
}

export interface ForgotPasswordRequest {
  email: string;
  account_type: AccountType;
}

export interface ResetPasswordRequest {
  token: string;
  new_password: string;
}

export interface VerifyEmailRequest {
  token: string;
}

export interface RecoverEmailRequest {
  government_id: string;
  password: string;
  account_type: AccountType;
  id_country_code: string;
}
