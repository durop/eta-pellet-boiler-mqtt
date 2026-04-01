describe('config', () => {
  const ORIGINAL_ENV = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...ORIGINAL_ENV };
  });

  afterAll(() => {
    process.env = ORIGINAL_ENV;
  });

  function loadConfig() {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    return (require('./config') as typeof import('./config')).config;
  }

  describe('serverPort (integer env)', () => {
    it('uses the default value when PORT is not set', () => {
      delete process.env['PORT'];
      expect(loadConfig().serverPort).toBe(3000);
    });

    it('reads PORT as an integer', () => {
      process.env['PORT'] = '8080';
      expect(loadConfig().serverPort).toBe(8080);
    });

    it('falls back to the default when PORT is not a valid integer', () => {
      process.env['PORT'] = 'not-a-number';
      expect(loadConfig().serverPort).toBe(3000);
    });

    it('trims whitespace before parsing PORT', () => {
      process.env['PORT'] = '  4000  ';
      expect(loadConfig().serverPort).toBe(4000);
    });
  });

  describe('etaBaseUrl (string env with trailing-slash trimming)', () => {
    it('uses the default URL when ETA_BASE_URL is not set', () => {
      delete process.env['ETA_BASE_URL'];
      expect(loadConfig().etaBaseUrl).toBe('http://192.168.30.30:8080');
    });

    it('reads ETA_BASE_URL and trims a single trailing slash', () => {
      process.env['ETA_BASE_URL'] = 'http://my-eta:8080/';
      expect(loadConfig().etaBaseUrl).toBe('http://my-eta:8080');
    });

    it('reads ETA_BASE_URL and trims multiple trailing slashes', () => {
      process.env['ETA_BASE_URL'] = 'http://my-eta:8080///';
      expect(loadConfig().etaBaseUrl).toBe('http://my-eta:8080');
    });

    it('leaves a URL without a trailing slash unchanged', () => {
      process.env['ETA_BASE_URL'] = 'http://my-eta:8080';
      expect(loadConfig().etaBaseUrl).toBe('http://my-eta:8080');
    });
  });

  describe('weatherLatitude (float env)', () => {
    it('uses the default value when WEATHER_LATITUDE is not set', () => {
      delete process.env['WEATHER_LATITUDE'];
      expect(loadConfig().weatherLatitude).toBe(48.092685);
    });

    it('reads WEATHER_LATITUDE as a float', () => {
      process.env['WEATHER_LATITUDE'] = '51.5074';
      expect(loadConfig().weatherLatitude).toBeCloseTo(51.5074);
    });

    it('falls back to the default when WEATHER_LATITUDE is not a valid float', () => {
      process.env['WEATHER_LATITUDE'] = 'invalid';
      expect(loadConfig().weatherLatitude).toBe(48.092685);
    });
  });

  describe('etaScrapeIntervalMs (integer env)', () => {
    it('uses the default value when ETA_SCRAPE_INTERVAL_MS is not set', () => {
      delete process.env['ETA_SCRAPE_INTERVAL_MS'];
      expect(loadConfig().etaScrapeIntervalMs).toBe(120000);
    });

    it('reads ETA_SCRAPE_INTERVAL_MS as an integer', () => {
      process.env['ETA_SCRAPE_INTERVAL_MS'] = '60000';
      expect(loadConfig().etaScrapeIntervalMs).toBe(60000);
    });
  });

  describe('weatherScrapeIntervalMs (integer env)', () => {
    it('uses the default value when WEATHER_SCRAPE_INTERVAL_MS is not set', () => {
      delete process.env['WEATHER_SCRAPE_INTERVAL_MS'];
      expect(loadConfig().weatherScrapeIntervalMs).toBe(300000);
    });

    it('reads WEATHER_SCRAPE_INTERVAL_MS as an integer', () => {
      process.env['WEATHER_SCRAPE_INTERVAL_MS'] = '60000';
      expect(loadConfig().weatherScrapeIntervalMs).toBe(60000);
    });
  });
});
