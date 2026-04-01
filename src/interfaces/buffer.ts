export interface EtaValue {
  attributes: {
    xmlns: string;
    version: string;
  };
  value: Value;
}

interface Value {
  attributes: Attributes;
  text: string;
}

interface Attributes {
  advTextOffset: string;
  unit: string;
  uri: string;
  strValue: string;
  scaleFactor: string;
  decPlaces: string;
}
