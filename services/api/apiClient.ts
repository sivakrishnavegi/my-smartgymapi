import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';

export class ApiClient {
    private client: AxiosInstance;

    constructor(baseURL: string, defaultHeaders: Record<string, string> = {}) {
        this.client = axios.create({
            baseURL,
            headers: defaultHeaders,
            timeout: 10000, // 10s default timeout
        });

        // Response Interceptor for detailed error logging
        this.client.interceptors.response.use(
            (response: AxiosResponse) => response,
            (error) => {
                const errorMessage = error.response
                    ? `API Error: ${error.response.status} ${error.response.statusText} - ${JSON.stringify(error.response.data)}`
                    : `Network Error: ${error.message}`;

                console.error(errorMessage);
                return Promise.reject(error);
            }
        );
    }

    public getClient(): AxiosInstance {
        return this.client;
    }

    public async get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
        const response = await this.client.get<T>(url, config);
        return response.data;
    }

    public async post<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
        const response = await this.client.post<T>(url, data, config);
        return response.data;
    }

    public async put<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
        const response = await this.client.put<T>(url, data, config);
        return response.data;
    }

    public async patch<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
        const response = await this.client.patch<T>(url, data, config);
        return response.data;
    }

    public async delete<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
        const response = await this.client.delete<T>(url, config);
        return response.data;
    }
}
