import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';

/**
 * Factory to create a pre-configured Axios instance.
 */
export const createApiClient = (baseURL: string, defaultHeaders: Record<string, string> = {}): AxiosInstance => {
    const client = axios.create({
        baseURL,
        headers: defaultHeaders,
        timeout: 10000,
    });

    client.interceptors.response.use(
        (response: AxiosResponse) => response,
        (error) => {
            const errorMessage = error.response
                ? `API Error: ${error.response.status} ${error.response.statusText} - ${JSON.stringify(error.response.data)}`
                : `Network Error: ${error.message}`;

            console.error(errorMessage);
            return Promise.reject(error);
        }
    );

    return client;
};

/**
 * Helper to wrap axios calls and return data directly.
 */
export const apiRequest = async <T>(client: AxiosInstance, config: AxiosRequestConfig, requestId?: string): Promise<T> => {
    const finalConfig = { ...config };
    if (requestId) {
        finalConfig.headers = {
            ...finalConfig.headers,
            'X-Request-Id': requestId
        };
    }
    const response = await client.request<T>(finalConfig);
    return response.data;
};

// Common methods for a cleaner API surface
export const apiGet = <T>(client: AxiosInstance, url: string, config?: AxiosRequestConfig, requestId?: string) =>
    apiRequest<T>(client, { ...config, method: 'GET', url }, requestId);

export const apiPost = <T>(client: AxiosInstance, url: string, data?: any, config?: AxiosRequestConfig, requestId?: string) =>
    apiRequest<T>(client, { ...config, method: 'POST', url, data }, requestId);

export const apiPut = <T>(client: AxiosInstance, url: string, data?: any, config?: AxiosRequestConfig, requestId?: string) =>
    apiRequest<T>(client, { ...config, method: 'PUT', url, data }, requestId);

export const apiPatch = <T>(client: AxiosInstance, url: string, data?: any, config?: AxiosRequestConfig, requestId?: string) =>
    apiRequest<T>(client, { ...config, method: 'PATCH', url, data }, requestId);

export const apiDelete = <T>(client: AxiosInstance, url: string, config?: AxiosRequestConfig, requestId?: string) =>
    apiRequest<T>(client, { ...config, method: 'DELETE', url }, requestId);
