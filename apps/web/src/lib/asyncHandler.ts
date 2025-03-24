import { ZodError } from "zod";
import axios, { AxiosError } from "axios";

type AsyncFunction<T = any, Args extends any[] = any[]> = (
  ...args: Args
) => Promise<T>;

interface ErrorResponse {
  message: string;
  code?: string | number;
  details?: unknown;
}

export const asyncHandler = <T, Args extends any[] = any[]>(
  fn: AsyncFunction<T, Args>
) => {
  return async (
    ...args: Args
  ): Promise<{ data: T | null; error: ErrorResponse | null }> => {
    try {
      const data = await fn(...args);
      return { data, error: null };
    } catch (error) {
      console.error("Async operation failed:", error);

      const errorResponse: ErrorResponse = {
        message: "An unexpected error occurred",
      };

      if (error instanceof ZodError) {
        errorResponse.message = "Validation error";
        errorResponse.code = "VALIDATION_ERROR";
        errorResponse.details = error.errors;
      } else if (axios.isAxiosError(error)) {
        const axiosError = error as AxiosError;
        errorResponse.code = axiosError.response?.status || "NETWORK_ERROR";

        if (axiosError.response?.status === 401) {
          errorResponse.message = "Authentication failed";
        } else if (axiosError.response?.status === 403) {
          errorResponse.message = "Permission denied";
        } else if (axiosError.response?.status === 404) {
          errorResponse.message = "Resource not found";
        } else if (axiosError.response?.status === 422) {
          errorResponse.message = "Invalid data submitted";
          errorResponse.details = axiosError.response.data;
        } else if (axiosError.response && axiosError.response.status >= 500) {
          errorResponse.message = "Server error";
        } else if (axiosError.code === "ECONNABORTED") {
          errorResponse.message = "Request timed out";
        } else if (!axiosError.response) {
          errorResponse.message = "Network error";
        } else {
          errorResponse.message = axiosError.message || "API request failed";
        }

        errorResponse.details = axiosError.response?.data;
      } else if (error instanceof Error) {
        errorResponse.message = error.message;
        errorResponse.code = error.name;
      }

      return { data: null, error: errorResponse };
    }
  };
};
