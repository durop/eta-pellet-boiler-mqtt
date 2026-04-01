export interface Wetteronline {
  current: Current;
  trend: Trend;
  hours: Hour[];
  moon: Moon[];
}

export interface Current {
  air_pressure: AirPressure;
  date: Date;
  dew_point: DewPoint;
  humidity: number;
  precipitation: Precipitation;
  smog_level: SmogLevel;
  sun: Sun;
  symbol: string;
  temperature: Temperature;
  wind: Wind;
  weather_condition_image: string;
}

export interface AirPressure {
  hpa: string;
  inhg: number;
  mmhg: string;
  tendency_category?: number;
}

export interface DewPoint {
  celsius: number;
  fahrenheit: number;
}

export interface Precipitation {
  type: SmogLevel;
  probability: number;
}

export enum SmogLevel {
  None = 'none',
  Rain = 'rain',
}

export interface Sun {
  color: string;
  kind: string;
  rise: Date;
  set: Date;
  solar_elevation: number;
}

export interface Temperature {
  air: number;
  apparent?: number;
}

export interface Wind {
  direction: number;
  speed: Speed;
}

export interface Speed {
  beaufort: Beaufort;
  kilometer_per_hour: Beaufort;
  knots: Beaufort;
  meter_per_second: Beaufort;
  miles_per_hour: Beaufort;
}

export interface Beaufort {
  intensity: Intensity;
  value: string;
}

export interface Intensity {
  description: Description;
  description_value: number;
  unit: Unit;
  value: number;
}

export enum Description {
  WindDescription1 = 'wind_description_1',
}

export enum Unit {
  Default = 'default',
  Nautic = 'nautic',
}

export interface Hour {
  air_pressure: AirPressure;
  convection: Convection;
  date: Date;
  dew_point: DewPoint;
  humidity: number;
  precipitation: Precipitation;
  smog_level: SmogLevel;
  symbol: string;
  temperature: Temperature;
  visibility: number;
  wind: Wind;
}

export interface Convection {
  probability: number;
}

export interface Moon {
  age: number;
  date: Date;
}

export interface Trend {
  items: Item[];
  description: string;
}

export interface Item {
  date: Date;
  temperature: Temperature;
  symbol: string;
  smog_level: SmogLevel;
  precipitation: Precipitation;
  weather_condition_image: string;
}
