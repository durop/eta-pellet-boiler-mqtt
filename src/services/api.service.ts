import { EtaValue } from '../interfaces/buffer';
import { DOMParser } from '@xmldom/xmldom';
import { HttpOptions } from '../interfaces/http';
import { config } from '../config';

export class ApiService {
  private apiUrl = config.etaBaseUrl;
  private headers = { 'Content-Type': 'application/xml' };

  private getEtaValue(path: string): Promise<EtaValue | null> {
    return this.httpRequestGet<EtaValue>({
      url: `${this.apiUrl}${path}`,
      headers: this.headers,
      connectTimeout: config.etaRequestTimeoutMs,
      readTimeout: config.etaRequestTimeoutMs,
    });
  }

  getOutsideTemp(): Promise<EtaValue | null> {
    return this.getEtaValue('/user/var/40/10241/0/0/12197');
  }

  // Boiler requests
  getBoilerStatus(): Promise<EtaValue | null> {
    return this.getEtaValue('/user/var/40/10021/0/0/12000');
  }

  getBoilerPressure(): Promise<EtaValue | null> {
    return this.getEtaValue('/user/var/40/10021/0/0/12180');
  }

  getBoilerTemperature(): Promise<EtaValue | null> {
    return this.getEtaValue('/user/var/40/10021/0/0/12161');
  }

  getBoilerReturnTemperature(): Promise<EtaValue | null> {
    return this.getEtaValue('/user/var/40/10021/0/11163/2121');
  }

  getBoilerDemandedOutput(): Promise<EtaValue | null> {
    return this.getEtaValue('/user/var/40/10021/0/0/12077');
  }

  getConsumptionSinceAshBoxEmptied(): Promise<EtaValue | null> {
    return this.getEtaValue('/user/var/40/10021/0/0/12013');
  }

  getTotalConsumption(): Promise<EtaValue | null> {
    return this.getEtaValue('/user/var/40/10021/0/0/12016');
  }

  getBoilerExtraCharge(): Promise<EtaValue | null> {
    return this.getEtaValue('/user/var/120/10251/0/0/13025');
  }

  getHopperContent(): Promise<EtaValue | null> {
    return this.getEtaValue('/user/var/40/10021/0/0/12011');
  }

  // Buffer requests
  getWaterTemp(): Promise<EtaValue | null> {
    return this.getEtaValue('/user/var/120/10251/0/0/12271');
  }

  getWaterExtraCharge(): Promise<EtaValue | null> {
    return this.getEtaValue('/user/var/120/10251/0/0/12134');
  }

  getBufferTop(): Promise<EtaValue | null> {
    return this.getEtaValue('/user/var/120/10251/0/0/12242');
  }

  getBufferMid(): Promise<EtaValue | null> {
    return this.getEtaValue('/user/var/120/10251/0/0/12522');
  }

  getBufferBottom(): Promise<EtaValue | null> {
    return this.getEtaValue('/user/var/120/10251/0/0/12244');
  }

  getBufferReturnConsumersTemp(): Promise<EtaValue | null> {
    return this.getEtaValue('/user/var/120/10251/0/0/12520');
  }

  getBufferChargingStatus(): Promise<EtaValue | null> {
    return this.getEtaValue('/user/var/40/10211/0/0/12790');
  }

  // Silo
  getSiloStock(): Promise<EtaValue | null> {
    return this.getEtaValue('/user/var/40/10211/0/0/12015');
  }

  getSiloMaxStock(): Promise<EtaValue | null> {
    return this.getEtaValue('/user/var/40/10211/0/0/12790');
  }

  getSiloMinStockWarning(): Promise<EtaValue | null> {
    return this.getEtaValue('/user/var/40/10211/0/0/12042');
  }

  // Utils
  parseXmlToJson(xmlStr: string): Record<string, unknown> | null {
    const parser = new DOMParser();
    const xml = parser.parseFromString(xmlStr, 'application/xml');

    // Check for parsing errors in the XML
    if (xml.getElementsByTagName('parsererror').length > 0) {
      console.error('Error parsing XML:', xmlStr);
      return null;
    }

    if (!xml.documentElement) {
      return null;
    }

    return this.xmlNodeToJson(xml.documentElement);
  }

  async httpRequestGet<T>(options: HttpOptions): Promise<T | null> {
    const timeoutMs = Math.max(
      options.readTimeout ??
        options.connectTimeout ??
        config.etaRequestTimeoutMs,
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

      const data = this.parseXmlToJson(await response.text());
      return data as T | null;
    } catch (error) {
      console.error(`ETA request failed for ${options.url}`, error);
      return null;
    } finally {
      clearTimeout(timeout);
    }
  }

  xmlNodeToJson(node: any): Record<string, unknown> {
    const obj: Record<string, unknown> = {};

    // Handle element nodes
    if (node.nodeType === 1) {
      const elementNode = node;

      // If the node has attributes, process them
      if (elementNode.attributes && elementNode.attributes.length > 0) {
        const attributes: Record<string, string> = {};

        for (let i = 0; i < elementNode.attributes.length; i++) {
          const attribute = elementNode.attributes.item(i);

          if (attribute?.nodeName && attribute.nodeValue) {
            attributes[attribute.nodeName] = attribute.nodeValue.trim();
          }
        }

        obj['attributes'] = attributes;
      }

      // Process child nodes
      if ('childNodes' in node && node.childNodes.length > 0) {
        for (let j = 0; j < node.childNodes.length; j++) {
          const childNode = node.childNodes.item(j);

          // Element nodes
          if (childNode.nodeType === 1) {
            const childNodeName = childNode.nodeName;
            if (typeof obj[childNodeName] === 'undefined') {
              obj[childNodeName] = this.xmlNodeToJson(childNode);
            } else {
              // If the same node name already exists, turn it into an array
              const existingValue = obj[childNodeName];

              if (!Array.isArray(existingValue)) {
                obj[childNodeName] = [existingValue];
              }

              const childNodeValues = obj[childNodeName] as Array<unknown>;
              childNodeValues.push(this.xmlNodeToJson(childNode));
            }
          }

          // Text nodes
          if (
            childNode.nodeType === 3 &&
            childNode.nodeValue &&
            childNode.nodeValue.trim() !== ''
          ) {
            obj['text'] = childNode.nodeValue.trim();
          }
        }
      }
    }

    return obj;
  }
}
