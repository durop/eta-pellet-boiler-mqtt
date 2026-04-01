# ETA Node Exporter & Homeassistant integration

Prometheus exporter for an ETA boiler and external weather data. The exporter exposes metrics from the ETA HTTP API together with current outdoor conditions from Bright Sky on a single `/metrics` endpoint.

The project can also be configured to publish ETA and weather values via MQTT for Home Assistant autodiscovery.

This exporter was developed and tested with an ETA Pelletkessel PelletsCompact 20 model.

<a href="https://buymeacoffee.com/durop" target="_blank" rel="noopener noreferrer">Buy Me A Coffee</a>

Tip: If you open the Buy Me a Coffee page on your phone, you can pay with Google Pay or Apple Pay.

## What It Exposes

- ETA boiler pressure and status
- Buffer temperatures
- Hot water temperature
- Pellet consumption and ash box usage
- Silo stock
- ETA-reported outside temperature
- Weather API outside temperature and solar radiation
- Default Node.js process metrics from `prom-client`
- Scrape health metrics for the ETA and weather upstreams
- Optional MQTT Home Assistant discovery and retained sensor state topics

## Requirements

- Node.js 18 or newer
- Network access to the ETA boiler HTTP interface
- Network access to `https://api.brightsky.dev`
- Optional: network access to an MQTT broker

## Installation

```bash
npm ci
npm run build
```

## Configuration

The exporter now supports runtime configuration through environment variables instead of hardcoded values.

| Variable                     | Default                                     | Description                                |
| ---------------------------- | ------------------------------------------- | ------------------------------------------ |
| `PORT`                       | `3000`                                      | Port used by the exporter HTTP server      |
| `ETA_BASE_URL`               | `http://192.168.30.30:8080`                 | Base URL of the ETA boiler API             |
| `ETA_REQUEST_TIMEOUT_MS`     | `30000`                                     | Timeout for ETA HTTP requests              |
| `ETA_SCRAPE_INTERVAL_MS`     | `120000`                                    | ETA metric refresh interval                |
| `WEATHER_API_URL`            | `https://api.brightsky.dev/current_weather` | Weather API endpoint                       |
| `WEATHER_LATITUDE`           | `47.665368`                                 | Latitude sent to Bright Sky                |
| `WEATHER_LONGITUDE`          | `9.705342`                                 | Longitude sent to Bright Sky               |
| `WEATHER_MAX_DIST`           | `50000`                                     | Maximum weather station distance in meters |
| `WEATHER_TIMEZONE`           | `Europe/Berlin`                             | Time zone sent to Bright Sky               |
| `WEATHER_REQUEST_TIMEOUT_MS` | `30000`                                     | Timeout for weather API requests           |
| `WEATHER_SCRAPE_INTERVAL_MS` | `300000`                                    | Weather metric refresh interval            |
| `MQTT_ENABLED`               | `false`                                     | Enable MQTT publishing                     |
| `MQTT_BROKER_URL`            | `mqtt://localhost:1883`                     | MQTT broker URL                            |
| `MQTT_USERNAME`              | empty                                       | MQTT username                              |
| `MQTT_PASSWORD`              | empty                                       | MQTT password                              |
| `MQTT_CLIENT_ID`             | `eta-node-exporter`                         | MQTT client ID                             |
| `MQTT_TLS_ENABLED`           | `false`                                     | Enable TLS mode for MQTT connection        |
| `MQTT_DISCOVERY_PREFIX`      | `homeassistant`                             | Home Assistant discovery topic prefix      |
| `MQTT_STATE_TOPIC_PREFIX`    | `eta/boiler`                                | Topic prefix for retained sensor states    |
| `MQTT_DEVICE_ID`             | `eta_boiler`                                | Device identifier used in discovery IDs    |
| `MQTT_DEVICE_NAME`           | `ETA Boiler`                                | Device name shown in Home Assistant        |

Example:

```bash
PORT=3000 \
ETA_BASE_URL=http://192.168.30.30:8080 \
WEATHER_LATITUDE=47.665368 \
WEATHER_LONGITUDE=9.705342 \
npm start
```

## MQTT Setup (Optional)

To enable MQTT publishing, set `MQTT_ENABLED=true` and provide broker credentials.

Example:

```bash
MQTT_ENABLED=true \
MQTT_BROKER_URL=mqtt://broker.local:1883 \
MQTT_USERNAME=homeassistant \
MQTT_PASSWORD=change-me \
MQTT_CLIENT_ID=eta-node-exporter \
MQTT_DISCOVERY_PREFIX=homeassistant \
MQTT_STATE_TOPIC_PREFIX=eta/boiler \
MQTT_DEVICE_ID=eta_boiler \
MQTT_DEVICE_NAME="ETA Boiler" \
npm start
```

Discovery topics are published as:

```text
<MQTT_DISCOVERY_PREFIX>/sensor/<MQTT_DEVICE_ID>_<sensor_suffix>/config
```

Sensor states are published (retained) as:

```text
<MQTT_STATE_TOPIC_PREFIX>/<sensor_suffix>
```

With default values, examples are:

```text
homeassistant/sensor/eta_boiler_boiler_pressure/config
eta/boiler/boiler_pressure
```

## Running

Build the project and start the exporter:

```bash
npm run build
npm start
```

The metrics endpoint will be available at:

```text
http://localhost:3000/metrics
```

## Development Checks

Lint the codebase:

```bash
npm run lint
```

Auto-fix lint issues where possible:

```bash
npm run lint:fix
```

Format the repository with Prettier:

```bash
npm run format
```

Check formatting without changing files:

```bash
npm run format:check
```

## Important Metrics

| Metric                       | Description                                                     |
| ---------------------------- | --------------------------------------------------------------- |
| `boiler_pressure`            | Boiler pressure from ETA                                        |
| `boiler_status{state="..."}` | Active ETA boiler state                                         |
| `buffer_top`                 | Top buffer temperature                                          |
| `buffer_middle`              | Middle buffer temperature                                       |
| `buffer_bottom`              | Bottom buffer temperature                                       |
| `ash_box_content`            | Consumption since ash box was emptied                           |
| `hot_water_temp`             | Hot water tank temperature                                      |
| `pellets_consumed`           | Total pellet consumption                                        |
| `silo_stock`                 | Current silo stock                                              |
| `eta_outside_temp`           | Outside temperature reported by ETA                             |
| `room_temp`                  | Deprecated alias for `eta_outside_temp` kept for compatibility  |
| `outside_temp`               | Outside temperature from Bright Sky                             |
| `solar_radiation`            | Solar radiation from Bright Sky                                 |
| `eta_scrape_up`              | `1` when the last ETA scrape produced at least one valid metric |
| `weather_scrape_up`          | `1` when the last weather scrape produced valid weather values  |

## Prometheus Configuration

An example scrape config is included in `prometheus.yml`.

```yaml
scrape_configs:
  - job_name: eta-node-exporter
    metrics_path: /metrics
    static_configs:
      - targets:
          - localhost:3000
```

## Deployment Notes

If you deploy this on a small Linux host or Raspberry Pi, a simple flow is:

```bash
npm ci
npm run build
tar -czf eta-node-exporter.tar.gz dist package.json package-lock.json README.md
```

If you install Node.js manually on the target host, verify the architecture first:

```bash
uname -m
```

Then install a compatible Node.js release and add it to `PATH`.

## Review Summary

The main improvements made in this pass are:

- Removed hardcoded runtime configuration from the source code
- Added request timeouts and HTTP status validation for both upstream APIs
- Prevented failed upstream calls from producing fake metric payloads
- Added `eta_scrape_up` and `weather_scrape_up` to detect upstream scrape failures in Prometheus
- Added a proper `start` script and operational documentation
