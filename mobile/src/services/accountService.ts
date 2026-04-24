import api from '../lib/axios';
import {
  AccountResponse,
  AccountUpdateRequest,
  ChangePasswordRequest,
  SettingsResponse,
  SettingsUpdateRequest,
} from '../types/account';
import { SuccessResponse } from '../types/common';

export const accountService = {
  getMe() {
    return api.get<SuccessResponse<AccountResponse>>('/accounts/me');
  },

  updateMe(data: AccountUpdateRequest) {
    return api.put<SuccessResponse<AccountResponse>>('/accounts/me', data);
  },

  changePassword(data: ChangePasswordRequest) {
    return api.put<SuccessResponse>('/accounts/me/password', data);
  },

  requestDeletion() {
    return api.delete<SuccessResponse>('/accounts/me');
  },

  cancelDeletion() {
    return api.post<SuccessResponse>('/accounts/me/cancel-deletion');
  },

  getSettings() {
    return api.get<SuccessResponse<SettingsResponse>>('/accounts/me/settings');
  },

  updateSettings(data: SettingsUpdateRequest) {
    return api.put<SuccessResponse<SettingsResponse>>('/accounts/me/settings', data);
  },
};
