// Utility to check if error is 401 Unauthorized
export const isUnauthorizedError = (error: any): boolean => {
  if (error?.response?.status === 401) return true;
  if (error?.status === 401) return true;
  if (error?.message?.includes('401')) return true;
  if (error?.message?.includes('Unauthorized')) return true;
  return false;
};

// Utility to handle logout on token expiration
export const handleTokenExpiration = () => {
  console.log('Token expired - logging out...');
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  window.location.href = '/market';
};

// Global fetch wrapper that handles 401 errors
export const authFetch = async (url: string, options: RequestInit = {}): Promise<Response> => {
  const response = await fetch(url, options);
  
  if (response.status === 401) {
    console.log('401 Unauthorized - redirecting to market...');
    handleTokenExpiration();
    throw new Error('Unauthorized');
  }
  
  return response;
};
