import api from '../lib/axios';
import { CountryResponse, RegionResponse, CityResponse } from '../types/location';
import { SuccessResponse } from '../types/common';

export const locationService = {
  getCountries() {
    return api.get<SuccessResponse<CountryResponse[]>>('/locations/countries');
  },

  getRegions(countryId: string) {
    return api.get<SuccessResponse<RegionResponse[]>>(`/locations/regions/${countryId}`);
  },

  getCities(regionId: string) {
    return api.get<SuccessResponse<CityResponse[]>>(`/locations/cities/${regionId}`);
  },
};
