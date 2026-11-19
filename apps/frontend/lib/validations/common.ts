import { z } from "zod";

export const emailSchema = z
  .email("Please enter a valid email address.")
  .trim()
  .toLowerCase();

export const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters.")
  .max(100, "Password must not exceed 100 characters.");

export const requiredStringSchema = (field: string) =>
  z
    .string()
    .trim()
    .min(1, `${field} is required.`);