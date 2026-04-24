import * as SecureStore from 'expo-secure-store';

const KEYS = {
  ACCESS_TOKEN: 'rihla_access_token',
  REFRESH_TOKEN: 'rihla_refresh_token',
  ACCOUNT_ID: 'rihla_account_id',
  ACCOUNT_TYPE: 'rihla_account_type',
} as const;

export async function getAccessToken(): Promise<string | null> {
  return SecureStore.getItemAsync(KEYS.ACCESS_TOKEN);
}

export async function setAccessToken(token: string): Promise<void> {
  await SecureStore.setItemAsync(KEYS.ACCESS_TOKEN, token);
}

export async function getRefreshToken(): Promise<string | null> {
  return SecureStore.getItemAsync(KEYS.REFRESH_TOKEN);
}

export async function setRefreshToken(token: string): Promise<void> {
  await SecureStore.setItemAsync(KEYS.REFRESH_TOKEN, token);
}

export async function getAccountId(): Promise<string | null> {
  return SecureStore.getItemAsync(KEYS.ACCOUNT_ID);
}

export async function setAccountId(id: string): Promise<void> {
  await SecureStore.setItemAsync(KEYS.ACCOUNT_ID, id);
}

export async function getAccountType(): Promise<string | null> {
  return SecureStore.getItemAsync(KEYS.ACCOUNT_TYPE);
}

export async function setAccountType(type: string): Promise<void> {
  await SecureStore.setItemAsync(KEYS.ACCOUNT_TYPE, type);
}

export async function clearAll(): Promise<void> {
  await Promise.all(
    Object.values(KEYS).map((key) => SecureStore.deleteItemAsync(key)),
  );
}
