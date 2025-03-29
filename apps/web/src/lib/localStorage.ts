export interface AuthData {
  token: string;
  user: {
    id: string;
    email: string;
  };
  message?: string;
  expiresAt: number;
}

const AUTH_KEY = "auth_data";
const DEFAULT_EXPIRATION_HOURS = 24;

/**
 * Saves authentication data to localStorage with expiration
 *
 * @param token - JWT token
 * @param user - User data object
 * @param message - Optional message
 * @param expirationHours - Optional custom expiration time in hours
 */
export const saveAuth = (
  token: string,
  user: { id: string; email: string },
  message?: string,
  expirationHours: number = DEFAULT_EXPIRATION_HOURS
): void => {
  const expiresAt = Date.now() + expirationHours * 60 * 60 * 1000;

  const authData: AuthData = {
    token,
    user,
    message,
    expiresAt,
  };

  localStorage.setItem(AUTH_KEY, JSON.stringify(authData));
};

/**
 * Retrieves authentication data from localStorage if it exists and is not expired
 *
 * @returns AuthData object or null if not found or expired
 */
export const getAuth = (): AuthData | null => {
  const authJson = localStorage.getItem(AUTH_KEY);

  if (!authJson) {
    return null;
  }

  try {
    const authData = JSON.parse(authJson) as AuthData;

    if (Date.now() > authData.expiresAt) {
      clearAuth();
      return null;
    }

    return authData;
  } catch (error) {
    console.error("Failed to parse auth data from localStorage", error);
    return null;
  }
};

/**
 * Gets just the auth token if it exists and is not expired
 *
 * @returns The token string or null if not found or expired
 */
export const getToken = (): string | null => {
  const authData = getAuth();
  return authData ? authData.token : null;
};

/**
 * Gets user information if authenticated
 *
 * @returns User object or null if not authenticated
 */
export const getUser = (): { id: string; email: string } | null => {
  const authData = getAuth();
  return authData ? authData.user : null;
};

/**
 * Checks if the user is authenticated (has a valid non-expired token)
 *
 * @returns boolean indicating if the user is authenticated
 */
export const isAuthenticated = (): boolean => {
  return getAuth() !== null;
};

/**
 * Updates the existing auth token with a new expiration time
 *
 * @param newToken Optional new token to update with
 * @param expirationHours Optional new expiration time in hours
 * @returns boolean indicating if the update was successful
 */
export const refreshAuth = (
  newToken?: string,
  expirationHours: number = DEFAULT_EXPIRATION_HOURS
): boolean => {
  const authData = getAuth();

  if (!authData) {
    return false;
  }

  const updatedAuthData: AuthData = {
    ...authData,
    token: newToken || authData.token,
    expiresAt: Date.now() + expirationHours * 60 * 60 * 1000,
  };

  localStorage.setItem(AUTH_KEY, JSON.stringify(updatedAuthData));
  return true;
};

/**
 * Clears authentication data from localStorage
 */
export const clearAuth = (): void => {
  localStorage.removeItem(AUTH_KEY);
};

/**
 * Saves auth data directly from API response format
 *
 * @param response - API response containing token, user, and message
 * @param expirationHours - Optional custom expiration time in hours
 */
export const saveAuthFromResponse = (
  response: {
    token: string;
    user: { id: string; email: string };
    message?: string;
  },
  expirationHours: number = DEFAULT_EXPIRATION_HOURS
): void => {
  saveAuth(response.token, response.user, response.message, expirationHours);
};
