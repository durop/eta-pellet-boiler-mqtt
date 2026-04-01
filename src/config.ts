function getStringEnv(name: string, defaultValue: string): string {
  const value = process.env[name]?.trim();

  return value ? value : defaultValue;
}

function getIntegerEnv(name: string, defaultValue: number): number {
  const value = process.env[name]?.trim();

  if (!value) {
    return defaultValue;
  }

  const parsedValue = Number.parseInt(value, 10);
  return Number.isFinite(parsedValue) ? parsedValue : defaultValue;
}

function getFloatEnv(name: string, defaultValue: number): number {
  const value = process.env[name]?.trim();

  if (!value) {
    return defaultValue;
  }

  const parsedValue = Number.parseFloat(value);
  return Number.isFinite(parsedValue) ? parsedValue : defaultValue;
}

function trimTrailingSlash(value: string): string {
  return value.replace(/\/+$/, '');
}

export const config = {
  serverPort: getIntegerEnv('PORT', 3000),
  etaBaseUrl: trimTrailingSlash(
    getStringEnv('ETA_BASE_URL', 'http://192.168.30.30:8080'),
  ),
  etaRequestTimeoutMs: getIntegerEnv('ETA_REQUEST_TIMEOUT_MS', 30000),
  etaScrapeIntervalMs: getIntegerEnv('ETA_SCRAPE_INTERVAL_MS', 120000),
  weatherApiUrl: getStringEnv(
    'WEATHER_API_URL',
    'https://api.brightsky.dev/current_weather',
  ),
  weatherLatitude: getFloatEnv('WEATHER_LATITUDE', 48.092685),
  weatherLongitude: getFloatEnv('WEATHER_LONGITUDE', 10.422519),
  weatherMaxDistance: getIntegerEnv('WEATHER_MAX_DIST', 50000),
  weatherTimezone: getStringEnv('WEATHER_TIMEZONE', 'Europe/Berlin'),
  weatherRequestTimeoutMs: getIntegerEnv('WEATHER_REQUEST_TIMEOUT_MS', 30000),
  weatherScrapeIntervalMs: getIntegerEnv('WEATHER_SCRAPE_INTERVAL_MS', 300000),
};
