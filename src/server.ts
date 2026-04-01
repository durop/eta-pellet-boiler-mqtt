import 'dotenv/config';
import express, { Request, Response } from 'express';
import { collectDefaultMetrics, register, Gauge } from 'prom-client';
import { ApiService } from './services/api.service';
import { BrightWeatherApiService } from './services/weather.service';
import { EtaValue } from './interfaces/buffer';
import { config } from './config';

const app = express();
const apiService = new ApiService();
const weatherService = new BrightWeatherApiService();
const activeBoilerStates = new Set<string>();

// Collect default metrics like CPU and memory usage
collectDefaultMetrics({ register });

// Define a Gauge metric (for storing a numerical value)
const boilerPressureGauge = new Gauge({
  name: 'boiler_pressure',
  help: 'Boiler pressure',
});
const boilerStatusGauge = new Gauge({
  name: 'boiler_status',
  labelNames: ['state'],
  help: 'Boiler status',
});
const bufferTopGauge = new Gauge({
  name: 'buffer_top',
  help: 'Buffer top temperature',
});
const bufferMiddleGauge = new Gauge({
  name: 'buffer_middle',
  help: 'Buffer middle temperature',
});
const bufferBottomGauge = new Gauge({
  name: 'buffer_bottom',
  help: 'Buffer bottom temperature',
});
const consumptionSinceAshBoxEmptiedGauge = new Gauge({
  name: 'ash_box_content',
  help: 'Consumption since ash box emptied',
});
const hotWaterTempGauge = new Gauge({
  name: 'hot_water_temp',
  help: 'Hot water tank temperature',
});
const pelletsConsumed = new Gauge({
  name: 'pellets_consumed',
  help: 'Total number of pellets consumed',
});
const legacyRoomTempGauge = new Gauge({
  name: 'room_temp',
  help: 'Deprecated alias for eta_outside_temp',
});
const etaOutsideTempGauge = new Gauge({
  name: 'eta_outside_temp',
  help: 'Outside temperature reported by the ETA boiler',
});
const outsideTempGauge = new Gauge({
  name: 'outside_temp',
  help: 'Outside temperature reported by the weather API',
});
const siloStockGauge = new Gauge({
  name: 'silo_stock',
  help: 'Silo current stock',
});
const solarRadiationGauge = new Gauge({
  name: 'solar_radiation',
  help: 'Solar radiation',
});
const etaScrapeUpGauge = new Gauge({
  name: 'eta_scrape_up',
  help: 'Whether the last ETA scrape returned at least one valid metric',
});
const weatherScrapeUpGauge = new Gauge({
  name: 'weather_scrape_up',
  help: 'Whether the last weather scrape returned valid weather data',
});

register.registerMetric(boilerPressureGauge);
register.registerMetric(boilerStatusGauge);
register.registerMetric(bufferBottomGauge);
register.registerMetric(bufferMiddleGauge);
register.registerMetric(bufferTopGauge);
register.registerMetric(consumptionSinceAshBoxEmptiedGauge);
register.registerMetric(etaOutsideTempGauge);
register.registerMetric(etaScrapeUpGauge);
register.registerMetric(hotWaterTempGauge);
register.registerMetric(outsideTempGauge);
register.registerMetric(pelletsConsumed);
register.registerMetric(legacyRoomTempGauge);
register.registerMetric(siloStockGauge);
register.registerMetric(solarRadiationGauge);
register.registerMetric(weatherScrapeUpGauge);

function getEtaNumericValue(metric: EtaValue | null): number | null {
  const rawValue = metric?.value?.attributes?.strValue;

  if (!rawValue) {
    return null;
  }

  const numericValue = Number(rawValue);
  return Number.isFinite(numericValue) ? numericValue : null;
}

function getEtaStringValue(metric: EtaValue | null): string | null {
  const rawValue = metric?.value?.attributes?.strValue?.trim();
  return rawValue ? rawValue : null;
}

function setGaugeIfNumber(gauge: Gauge<string>, value: number | null): boolean {
  if (value === null) {
    return false;
  }

  gauge.set(value);
  return true;
}

async function getETAMetrics(): Promise<void> {
  console.log('Getting ETA metrics');

  try {
    const [
      boilerPressure,
      boilerStatus,
      bufferBottom,
      bufferMid,
      bufferTop,
      consumptionSinceAshBoxEmptied,
      hotWaterTemp,
      pelletTotalConsumption,
      etaOutsideTemp,
      siloStock,
    ] = await Promise.all([
      apiService.getBoilerPressure(),
      apiService.getBoilerStatus(),
      apiService.getBufferBottom(),
      apiService.getBufferMid(),
      apiService.getBufferTop(),
      apiService.getConsumptionSinceAshBoxEmptied(),
      apiService.getWaterTemp(),
      apiService.getTotalConsumption(),
      apiService.getOutsideTemp(),
      apiService.getSiloStock(),
    ]);

    const updatedMetricFlags = [
      setGaugeIfNumber(boilerPressureGauge, getEtaNumericValue(boilerPressure)),
      setGaugeIfNumber(bufferBottomGauge, getEtaNumericValue(bufferBottom)),
      setGaugeIfNumber(bufferMiddleGauge, getEtaNumericValue(bufferMid)),
      setGaugeIfNumber(bufferTopGauge, getEtaNumericValue(bufferTop)),
      setGaugeIfNumber(
        consumptionSinceAshBoxEmptiedGauge,
        getEtaNumericValue(consumptionSinceAshBoxEmptied),
      ),
      setGaugeIfNumber(hotWaterTempGauge, getEtaNumericValue(hotWaterTemp)),
      setGaugeIfNumber(
        pelletsConsumed,
        getEtaNumericValue(pelletTotalConsumption),
      ),
      setGaugeIfNumber(etaOutsideTempGauge, getEtaNumericValue(etaOutsideTemp)),
      setGaugeIfNumber(legacyRoomTempGauge, getEtaNumericValue(etaOutsideTemp)),
      setGaugeIfNumber(siloStockGauge, getEtaNumericValue(siloStock)),
    ];

    const boilerState = getEtaStringValue(boilerStatus);
    if (boilerState) {
      for (const state of activeBoilerStates) {
        boilerStatusGauge.set({ state }, 0);
      }

      activeBoilerStates.clear();
      activeBoilerStates.add(boilerState);
      boilerStatusGauge.set({ state: boilerState }, 1);
      updatedMetricFlags.push(true);
    }

    const updatedAnyMetric = updatedMetricFlags.some(Boolean);
    etaScrapeUpGauge.set(updatedAnyMetric ? 1 : 0);

    if (!updatedAnyMetric) {
      console.error('ETA scrape completed without any valid metric values');
    }
  } catch (error) {
    etaScrapeUpGauge.set(0);
    console.error('ETA scrape failed', error);
  }
}

async function getWeatherConditions(): Promise<void> {
  console.log('Getting weather information');

  try {
    const weather = await weatherService.getWeatherConditions();
    const temperature = weather?.weather?.temperature;
    const solarRadiation = weather?.weather?.solar_10;
    const hasTemperature =
      typeof temperature === 'number' && Number.isFinite(temperature);
    const hasSolarRadiation =
      typeof solarRadiation === 'number' && Number.isFinite(solarRadiation);

    if (hasTemperature) {
      outsideTempGauge.set(temperature);
    }

    if (hasSolarRadiation) {
      solarRadiationGauge.set(solarRadiation);
    }

    const updatedAnyMetric = hasTemperature || hasSolarRadiation;
    weatherScrapeUpGauge.set(updatedAnyMetric ? 1 : 0);

    if (!updatedAnyMetric) {
      console.error('Weather scrape completed without valid metric values');
    }
  } catch (error) {
    weatherScrapeUpGauge.set(0);
    console.error('Weather scrape failed', error);
  }
}

void getWeatherConditions();
void getETAMetrics();

setInterval(() => {
  void getETAMetrics();
}, config.etaScrapeIntervalMs);

setInterval(() => {
  void getWeatherConditions();
}, config.weatherScrapeIntervalMs);

// Expose the /metrics endpoint
app.get('/metrics', async (_req: Request, res: Response) => {
  res.set('Content-Type', register.contentType);
  res.end(await register.metrics());
});

// Start the server
app.listen(config.serverPort, () => {
  console.log(`Server running on http://localhost:${config.serverPort}`);
});
