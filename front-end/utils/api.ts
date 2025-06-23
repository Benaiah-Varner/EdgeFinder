/**
 * Authenticated fetch utility that automatically includes the auth token
 * from localStorage as an Authorization header
 */
export const authenticatedFetch = async (url: string, options: RequestInit = {}) => {
  // Get the token from localStorage
  const token = localStorage.getItem('auth-token');

  // Add the Authorization header if we have a token
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  return fetch(url, {
    ...options,
    headers,
    credentials: 'include',
  });
};

// Utility function for FormData requests with authentication
export const authenticatedFormDataFetch = async (url: string, formData: FormData, options: RequestInit = {}) => {
  // Get the token from localStorage
  const token = localStorage.getItem('auth-token');

  // Add the Authorization header if we have a token
  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  return fetch(url, {
    ...options,
    headers,
    body: formData,
    credentials: 'include',
  });
};

