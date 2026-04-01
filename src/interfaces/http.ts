export interface HttpOptions {
  /**
   * The URL to send the request to.
   */
  url: string;
  /**
   * The Http Request method to run. (Default is GET)
   */
  method?: string;
  /**
   * URL parameters to append to the request.
   */
  params?: HttpParams;
  /**
   * Note: On Android and iOS, data can only be a string or a JSON.
   * FormData, Blob, ArrayBuffer, and other complex types are only directly supported on web
   * or through enabling `CapacitorHttp` in the config and using the patched `window.fetch` or `XMLHttpRequest`.
   *
   * If you need to send a complex type, you should serialize the data to base64
   * and set the `headers["Content-Type"]` and `dataType` attributes accordingly.
   */
  data?: any;
  /**
   * Http Request headers to send with the request.
   */
  headers?: HttpHeaders;
  /**
   * How long to wait to read additional data in milliseconds.
   * Resets each time new data is received.
   */
  readTimeout?: number;
  /**
   * How long to wait for the initial connection in milliseconds.
   */
  connectTimeout?: number;
  /**
   * Sets whether automatic HTTP redirects should be disabled
   */
  disableRedirects?: boolean;
  /**
   * Extra arguments for fetch when running on the web
   */
  webFetchExtra?: RequestInit;
  /**
   * Use this option if you need to keep the URL unencoded in certain cases
   * (already encoded, azure/firebase testing, etc.). The default is _true_.
   */
  shouldEncodeUrlParams?: boolean;
  /**
   * This is used if we've had to convert the data from a JS type that needs
   * special handling in the native layer
   */
  dataType?: 'file' | 'formData';
}
export interface HttpParams {
  /**
   * A key/value dictionary of URL parameters to set.
   */
  [key: string]: string | string[];
}
export interface HttpHeaders {
  /**
   * A key/value dictionary of Http headers.
   */
  [key: string]: string;
}
export interface HttpResponse {
  /**
   * Additional data received with the Http response.
   */
  data: any;
  /**
   * The status code received from the Http response.
   */
  status: number;
  /**
   * The headers received from the Http response.
   */
  headers: HttpHeaders;
  /**
   * The response URL recieved from the Http response.
   */
  url: string;

  text: Promise<string>;
}
