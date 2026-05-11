/**
 * API Client
 * Centralized fetch wrapper for API calls
 */

import { buildUrl, getAuthToken } from './config';

export interface ApiError {
  message: string;
  status?: number;
  errors?: Record<string, string[]>;
}

/**
 * Custom error class for API errors
 */
export class ApiException extends Error {
  status?: number;
  errors?: Record<string, string[]>;

  constructor(message: string, status?: number, errors?: Record<string, string[]>) {
    super(message);
    this.name = 'ApiException';
    this.status = status;
    this.errors = errors;
  }
}

/**
 * Make API request with error handling
 */
async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = buildUrl(endpoint);
  const token = await getAuthToken();

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  // Add auth token if available
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const response = await fetch(url, {
      ...options,
      headers,
    });

    // Handle non-JSON responses
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      if (!response.ok) {
        throw new ApiException(
          `Request failed: ${response.statusText}`,
          response.status
        );
      }
      return {} as T; // Empty object for non-JSON responses
    }

    const data = await response.json();

    if (!response.ok) {
      // Handle error response
      const message = data.message || data.error || response.statusText;
      throw new ApiException(message, response.status, data.errors);
    }

    return data as T;
  } catch (error) {
    if (error instanceof ApiException) {
      throw error;
    }

    // Network or other errors
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new ApiException(
        'Network error: Unable to connect to server. Please check your connection and API URL.',
        0
      );
    }

    throw new ApiException(
      error instanceof Error ? error.message : 'Unknown error occurred',
      0
    );
  }
}

/**
 * GET request
 */
export async function get<T>(endpoint: string, params?: Record<string, string>): Promise<T> {
  let url = endpoint;
  
  // Add query parameters if provided
  if (params) {
    const queryString = new URLSearchParams(params).toString();
    url = `${endpoint}?${queryString}`;
  }

  return apiRequest<T>(url, {
    method: 'GET',
  });
}

/**
 * POST request
 */
export async function post<T>(endpoint: string, body?: Record<string, unknown>): Promise<T> {
  return apiRequest<T>(endpoint, {
    method: 'POST',
    body: body ? JSON.stringify(body) : undefined,
  });
}

/**
 * PUT request
 */
export async function put<T>(endpoint: string, body?: Record<string, unknown>): Promise<T> {
  return apiRequest<T>(endpoint, {
    method: 'PUT',
    body: body ? JSON.stringify(body) : undefined,
  });
}

/**
 * DELETE request
 */
export async function del<T>(endpoint: string): Promise<T> {
  return apiRequest<T>(endpoint, {
    method: 'DELETE',
  });
}

/**
 * Upload file (multipart/form-data)
 */
export async function uploadFile<T>(
  endpoint: string,
  file: { uri: string; type: string; name: string },
  additionalData?: Record<string, string>
): Promise<T> {
  const url = buildUrl(endpoint);
  const token = await getAuthToken();

  // Create form data
  const formData = new FormData();

  // Add file
  const fileUri = file.uri;
  const filename = file.name || 'image.jpg';
  const match = /\.(\w+)$/.exec(filename);
  const type = match ? `image/${match[1]}` : `image`;

  // @ts-ignore - FormData.append works with file objects in React Native
  formData.append('file', {
    uri: fileUri,
    type: type,
    name: filename,
  } as any);

  // Add additional data
  if (additionalData) {
    Object.keys(additionalData).forEach((key) => {
      formData.append(key, String(additionalData[key]));
    });
  }

  const headers: HeadersInit = {};
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: formData,
    });

    const data = await response.json();

    if (!response.ok) {
      const message = data.message || data.error || response.statusText;
      throw new ApiException(message, response.status, data.errors);
    }

    return data as T;
  } catch (error) {
    if (error instanceof ApiException) {
      throw error;
    }

    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new ApiException(
        'Network error: Unable to connect to server. Please check your connection and API URL.',
        0
      );
    }

    throw new ApiException(
      error instanceof Error ? error.message : 'Unknown error occurred',
      0
    );
  }
}
