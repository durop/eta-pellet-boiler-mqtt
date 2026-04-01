import { BrightWeather } from '../interfaces/brightweather';
import { HttpOptions } from '../interfaces/http';
import { config } from '../config';

export class BrightWeatherApiService {
  private apiUrl = config.weatherApiUrl;
  private headers = { Accept: 'application/json' };

  getWeatherConditions(): Promise<BrightWeather | null> {
    const query = new URLSearchParams({
      lat: config.weatherLatitude.toString(),
      lon: config.weatherLongitude.toString(),
      max_dist: config.weatherMaxDistance.toString(),
      tz: config.weatherTimezone,
      units: 'dwd',
    });

    return this.httpRequestGet<BrightWeather>({
      url: `${this.apiUrl}?${query.toString()}`,
      headers: this.headers,
      connectTimeout: config.weatherRequestTimeoutMs,
      readTimeout: config.weatherRequestTimeoutMs,
    });
  }

  async httpRequestGet<T>(options: HttpOptions): Promise<T | null> {
    const timeoutMs = Math.max(
      options.readTimeout ??
        options.connectTimeout ??
        config.weatherRequestTimeoutMs,
      1,
    );
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(options.url, {
        method: options.method ?? 'GET',
        headers: options.headers,
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error(`Request failed with status ${response.status}`);
      }

      return (await response.json()) as T;
    } catch (error) {
      console.error(`Weather request failed for ${options.url}`, error);
      return null;
    } finally {
      clearTimeout(timeout);
    }
  }
}
