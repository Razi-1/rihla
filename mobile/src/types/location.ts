export interface CountryResponse {
  id: string;
  code: string;
  name: string;
}

export interface RegionResponse {
  id: string;
  country_id: string;
  code: string;
  name: string;
}

export interface CityResponse {
  id: string;
  region_id: string;
  name: string;
  population: number | null;
  latitude: number | null;
  longitude: number | null;
}
