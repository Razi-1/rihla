export interface AdminAccount {
  account_id: string;
  account_type: 'admin';
  first_name: string;
  last_name: string;
  is_email_verified: boolean;
  is_age_restricted: boolean;
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
  account_id: string;
  account_type: string;
  first_name: string;
  last_name: string;
  is_email_verified: boolean;
  is_age_restricted: boolean;
}

export interface LoginCredentials {
  email: string;
  password: string;
}
