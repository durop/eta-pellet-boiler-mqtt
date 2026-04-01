import { BrightWeatherApiService } from './weather.service';
import { BrightWeather } from '../interfaces/brightweather';

const MOCK_WEATHER_RESPONSE: BrightWeather = {
  weather: {
    source_id: 1,
    timestamp: new Date('2024-01-15T12:00:00Z'),
    cloud_cover: 50,
    condition: 'dry',
    dew_point: 5.0,
    solar_10: 120.5,
    solar_30: 110.0,
    solar_60: 100.0,
    precipitation_10: 0,
    precipitation_30: 0,
    precipitation_60: 0,
    pressure_msl: 1013.25,
    relative_humidity: 65,
    visibility: 50000,
    wind_direction_10: 180,
    wind_direction_30: 180,
    wind_direction_60: 175,
    wind_speed_10: 3.5,
    wind_speed_30: 3.0,
    wind_speed_60: 2.8,
    wind_gust_direction_10: 190,
    wind_gust_direction_30: 185,
    wind_gust_direction_60: 180,
    wind_gust_speed_10: 6.0,
    wind_gust_speed_30: 5.5,
    wind_gust_speed_60: 5.0,
    sunshine_30: 25.0,
    sunshine_60: 20.0,
    temperature: 18.5,
    fallback_source_ids: {},
    icon: 'clear-day',
  },
  sources: [],
};

describe('BrightWeatherApiService', () => {
  let service: BrightWeatherApiService;

  beforeEach(() => {
    service = new BrightWeatherApiService();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('httpRequestGet', () => {
    it('returns parsed JSON data on a successful 200 response', async () => {
      jest.spyOn(global, 'fetch').mockResolvedValue({
        ok: true,
        status: 200,
        json: jest.fn().mockResolvedValue(MOCK_WEATHER_RESPONSE),
      } as unknown as Response);

      const result = await service.httpRequestGet<BrightWeather>({
        url: 'https://api.brightsky.dev/current_weather',
        headers: { Accept: 'application/json' },
      });

      expect(result).toEqual(MOCK_WEATHER_RESPONSE);
    });

    it('returns null when the HTTP response status is not ok', async () => {
      jest.spyOn(global, 'fetch').mockResolvedValue({
        ok: false,
        status: 404,
      } as unknown as Response);

      const result = await service.httpRequestGet({
        url: 'https://api.brightsky.dev/current_weather',
        headers: {},
      });

      expect(result).toBeNull();
    });

    it('returns null when fetch throws a network error', async () => {
      jest
        .spyOn(global, 'fetch')
        .mockRejectedValue(new Error('Connection refused'));

      const result = await service.httpRequestGet({
        url: 'https://api.brightsky.dev/current_weather',
        headers: {},
      });

      expect(result).toBeNull();
    });

    it('uses a minimum timeout of 1 ms', async () => {
      const setTimeoutSpy = jest.spyOn(global, 'setTimeout');
      jest.spyOn(global, 'fetch').mockResolvedValue({
        ok: true,
        status: 200,
        json: jest.fn().mockResolvedValue(MOCK_WEATHER_RESPONSE),
      } as unknown as Response);

      // readTimeout of 0 should be coerced to 1 via Math.max(..., 1)
      await service.httpRequestGet<BrightWeather>({
        url: 'https://api.brightsky.dev/current_weather',
        headers: {},
        readTimeout: 0,
      });

      // The service calls setTimeout exactly once per request; verify it used 1ms
      expect(setTimeoutSpy).toHaveBeenCalledTimes(1);
      expect(setTimeoutSpy.mock.calls[0][1]).toBe(1);
    });
  });

  describe('getWeatherConditions', () => {
    it('returns weather data on a successful response', async () => {
      jest.spyOn(global, 'fetch').mockResolvedValue({
        ok: true,
        status: 200,
        json: jest.fn().mockResolvedValue(MOCK_WEATHER_RESPONSE),
      } as unknown as Response);

      const result = await service.getWeatherConditions();

      expect(result).toEqual(MOCK_WEATHER_RESPONSE);
    });

    it('returns null when the weather API is unavailable', async () => {
      jest
        .spyOn(global, 'fetch')
        .mockRejectedValue(new Error('Network timeout'));

      const result = await service.getWeatherConditions();

      expect(result).toBeNull();
    });

    it('calls fetch with the configured lat, lon and units parameters', async () => {
      jest.spyOn(global, 'fetch').mockResolvedValue({
        ok: true,
        status: 200,
        json: jest.fn().mockResolvedValue(MOCK_WEATHER_RESPONSE),
      } as unknown as Response);

      await service.getWeatherConditions();

      expect(global.fetch).toHaveBeenCalledTimes(1);
      const calledUrl = (global.fetch as jest.Mock).mock.calls[0][0] as string;
      expect(calledUrl).toContain('lat=');
      expect(calledUrl).toContain('lon=');
      expect(calledUrl).toContain('units=dwd');
    });

    it('calls fetch with the Accept: application/json header', async () => {
      jest.spyOn(global, 'fetch').mockResolvedValue({
        ok: true,
        status: 200,
        json: jest.fn().mockResolvedValue(MOCK_WEATHER_RESPONSE),
      } as unknown as Response);

      await service.getWeatherConditions();

      const calledOptions = (global.fetch as jest.Mock).mock
        .calls[0][1] as RequestInit;
      expect(calledOptions.headers).toMatchObject({
        Accept: 'application/json',
      });
    });
  });
});
