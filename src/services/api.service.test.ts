import { ApiService } from './api.service';
import { DOMParser } from '@xmldom/xmldom';
import { config } from '../config';

const VALID_ETA_XML = `<?xml version="1.0" encoding="utf-8"?>
<eta xmlns="http://www.eta.co.at/rest/v1" version="1.2">
  <value uri="/user/var/40/10021/0/0/12180" strValue="1.5" unit="bar" scaleFactor="10" decPlaces="1" advTextOffset="0">1.5</value>
</eta>`;

describe('ApiService', () => {
  let service: ApiService;

  beforeEach(() => {
    service = new ApiService();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('parseXmlToJson', () => {
    it('parses a valid ETA boiler XML response', () => {
      const result = service.parseXmlToJson(VALID_ETA_XML);

      expect(result).not.toBeNull();
      const attributes = result?.['attributes'] as Record<string, string>;
      expect(attributes['version']).toBe('1.2');
      const value = result?.['value'] as Record<string, unknown>;
      const valueAttrs = value?.['attributes'] as Record<string, string>;
      expect(valueAttrs['strValue']).toBe('1.5');
      expect(valueAttrs['unit']).toBe('bar');
    });

    it('captures text content of child elements', () => {
      const xml = '<root><child>hello world</child></root>';
      const result = service.parseXmlToJson(xml);

      expect(result).not.toBeNull();
      const child = result?.['child'] as Record<string, unknown>;
      expect(child['text']).toBe('hello world');
    });

    it('collects element attributes into an "attributes" object', () => {
      const xml = '<root id="42" name="test" />';
      const result = service.parseXmlToJson(xml);

      expect(result).not.toBeNull();
      const attributes = result?.['attributes'] as Record<string, string>;
      expect(attributes['id']).toBe('42');
      expect(attributes['name']).toBe('test');
    });

    it('converts duplicate child elements into an array', () => {
      const xml = '<root><item id="1" /><item id="2" /></root>';
      const result = service.parseXmlToJson(xml);

      expect(result).not.toBeNull();
      expect(Array.isArray(result?.['item'])).toBe(true);
      const items = result?.['item'] as Array<Record<string, unknown>>;
      expect(items).toHaveLength(2);
    });

    it('parses XML with deeply nested elements', () => {
      const xml = '<root><level1><level2 key="deep" /></level1></root>';
      const result = service.parseXmlToJson(xml);

      expect(result).not.toBeNull();
      const level1 = result?.['level1'] as Record<string, unknown>;
      const level2 = level1?.['level2'] as Record<string, unknown>;
      const attrs = level2?.['attributes'] as Record<string, string>;
      expect(attrs['key']).toBe('deep');
    });
  });

  describe('xmlNodeToJson', () => {
    it('returns an empty object for an element node without attributes or children', () => {
      const doc = new DOMParser().parseFromString(
        '<empty />',
        'application/xml',
      );
      const result = service.xmlNodeToJson(doc.documentElement);

      expect(result).toEqual({});
    });

    it('processes nested elements recursively', () => {
      const doc = new DOMParser().parseFromString(
        '<parent><child value="10" /></parent>',
        'application/xml',
      );
      const result = service.xmlNodeToJson(doc.documentElement);

      expect(result).toHaveProperty('child');
      const child = result['child'] as Record<string, unknown>;
      const attrs = child['attributes'] as Record<string, string>;
      expect(attrs['value']).toBe('10');
    });
  });

  describe('httpRequestGet', () => {
    it('returns parsed XML data on a successful 200 response', async () => {
      jest.spyOn(global, 'fetch').mockResolvedValue({
        ok: true,
        status: 200,
        text: jest.fn().mockResolvedValue(VALID_ETA_XML),
      } as unknown as Response);

      const result = await service.httpRequestGet({
        url: 'http://eta-host/user/var/40/10021/0/0/12180',
        headers: { 'Content-Type': 'application/xml' },
      });

      expect(result).not.toBeNull();
      expect(global.fetch).toHaveBeenCalledWith(
        'http://eta-host/user/var/40/10021/0/0/12180',
        expect.objectContaining({ method: 'GET' }),
      );
    });

    it('returns null when the HTTP response status is not ok', async () => {
      jest.spyOn(global, 'fetch').mockResolvedValue({
        ok: false,
        status: 503,
      } as unknown as Response);

      const result = await service.httpRequestGet({
        url: 'http://eta-host/user/var/40/10021/0/0/12180',
        headers: {},
      });

      expect(result).toBeNull();
    });

    it('returns null when fetch throws a network error', async () => {
      jest.spyOn(global, 'fetch').mockRejectedValue(new Error('Network error'));

      const result = await service.httpRequestGet({
        url: 'http://eta-host/user/var/40/10021/0/0/12180',
        headers: {},
      });

      expect(result).toBeNull();
    });

    it('uses the HTTP method specified in options', async () => {
      jest.spyOn(global, 'fetch').mockResolvedValue({
        ok: true,
        status: 200,
        text: jest.fn().mockResolvedValue('<root />'),
      } as unknown as Response);

      await service.httpRequestGet({
        url: 'http://eta-host/api',
        headers: {},
        method: 'POST',
      });

      expect(global.fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({ method: 'POST' }),
      );
    });
  });

  describe('boiler API endpoint paths', () => {
    beforeEach(() => {
      jest.spyOn(global, 'fetch').mockResolvedValue({
        ok: true,
        status: 200,
        text: jest.fn().mockResolvedValue(VALID_ETA_XML),
      } as unknown as Response);
    });

    const pathCases: Array<[string, () => Promise<unknown>, string]> = [
      [
        'getOutsideTemp',
        () => service.getOutsideTemp(),
        '/user/var/40/10241/0/0/12197',
      ],
      [
        'getBoilerStatus',
        () => service.getBoilerStatus(),
        '/user/var/40/10021/0/0/12000',
      ],
      [
        'getBoilerPressure',
        () => service.getBoilerPressure(),
        '/user/var/40/10021/0/0/12180',
      ],
      [
        'getBoilerTemperature',
        () => service.getBoilerTemperature(),
        '/user/var/40/10021/0/0/12161',
      ],
      [
        'getBoilerReturnTemperature',
        () => service.getBoilerReturnTemperature(),
        '/user/var/40/10021/0/11163/2121',
      ],
      [
        'getBoilerDemandedOutput',
        () => service.getBoilerDemandedOutput(),
        '/user/var/40/10021/0/0/12077',
      ],
      [
        'getConsumptionSinceAshBoxEmptied',
        () => service.getConsumptionSinceAshBoxEmptied(),
        '/user/var/40/10021/0/0/12013',
      ],
      [
        'getTotalConsumption',
        () => service.getTotalConsumption(),
        '/user/var/40/10021/0/0/12016',
      ],
      [
        'getBoilerExtraCharge',
        () => service.getBoilerExtraCharge(),
        '/user/var/120/10251/0/0/13025',
      ],
      [
        'getHopperContent',
        () => service.getHopperContent(),
        '/user/var/40/10021/0/0/12011',
      ],
      [
        'getWaterTemp',
        () => service.getWaterTemp(),
        '/user/var/120/10251/0/0/12271',
      ],
      [
        'getWaterExtraCharge',
        () => service.getWaterExtraCharge(),
        '/user/var/120/10251/0/0/12134',
      ],
      [
        'getBufferTop',
        () => service.getBufferTop(),
        '/user/var/120/10251/0/0/12242',
      ],
      [
        'getBufferMid',
        () => service.getBufferMid(),
        '/user/var/120/10251/0/0/12522',
      ],
      [
        'getBufferBottom',
        () => service.getBufferBottom(),
        '/user/var/120/10251/0/0/12244',
      ],
      [
        'getBufferReturnConsumersTemp',
        () => service.getBufferReturnConsumersTemp(),
        '/user/var/120/10251/0/0/12520',
      ],
      [
        'getBufferChargingStatus',
        () => service.getBufferChargingStatus(),
        '/user/var/40/10211/0/0/12790',
      ],
      [
        'getSiloStock',
        () => service.getSiloStock(),
        '/user/var/40/10211/0/0/12015',
      ],
      [
        'getSiloMaxStock',
        () => service.getSiloMaxStock(),
        '/user/var/40/10211/0/0/12790',
      ],
      [
        'getSiloMinStockWarning',
        () => service.getSiloMinStockWarning(),
        '/user/var/40/10211/0/0/12042',
      ],
    ];

    it.each(pathCases)(
      '%s calls fetch with the correct base URL and endpoint path',
      async (_, method, expectedPath) => {
        await method();
        const calledUrl = (global.fetch as jest.Mock).mock
          .calls[0][0] as string;
        expect(calledUrl).toContain(config.etaBaseUrl);
        expect(calledUrl).toContain(expectedPath);
      },
    );
  });
});
