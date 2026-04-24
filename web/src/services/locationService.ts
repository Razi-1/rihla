import api from '@/lib/axios';
import type { ApiResponse } from '@/types/common';
import type { Country, Region, City } from '@/types/common';

export const locationService = {
  getCountries: () =>
    api.get<ApiResponse<Country[]>>('/locations/countries'),

  getRegions: (countryId: string) =>
    api.get<ApiResponse<Region[]>>(`/locations/regions/${countryId}`),

  getCities: (regionId: string) =>
    api.get<ApiResponse<City[]>>(`/locations/cities/${regionId}`),
};
