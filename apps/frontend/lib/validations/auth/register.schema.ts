import { z } from "zod";

export const registerSchema = z
  .object({
    accountType: z.enum(["MANAGER", "STAFF"]),
    organizationName: z
      .string()
      .min(2, "Care Home / Facility Name must be at least 2 characters")
      .trim(),
    firstName: z
      .string()
      .min(2, "First name must be at least 2 characters")
      .trim(),
    lastName: z
      .string()
      .min(2, "Last name must be at least 2 characters")
      .trim(),
    email: z
      .string()
      .email("Please enter a valid work email address")
      .trim(),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters long"),
    confirmPassword: z
      .string()
      .min(1, "Please confirm your password"),
    phone: z
      .string()
      .optional(),
    address: z
      .string()
      .optional(),
    postcode: z
      .string()
      .optional(),
    bedCapacity: z
      .number()
      .optional(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export type RegisterSchema = z.infer<typeof registerSchema>;
