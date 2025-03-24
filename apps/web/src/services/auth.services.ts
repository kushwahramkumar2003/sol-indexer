import { z } from "zod";
import { api } from ".";
import { loginSchema, signUpSchema } from "types";
import { asyncHandler } from "@/lib/asyncHandler";

export const login = asyncHandler(async (data: z.infer<typeof loginSchema>) => {
  return (await api.post("/auth/login", { ...data })).data;
});
export const signup = asyncHandler(
  async (data: z.infer<typeof signUpSchema>) => {
    return (await api.post("/auth/signup", { ...data })).data;
  }
);
