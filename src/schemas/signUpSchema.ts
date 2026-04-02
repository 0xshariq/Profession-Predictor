import { z } from 'zod';
export const usernameValidation = z
    .string()
    .min(3, "Username must be at least 3 characters long")
    .max(20, "Username must be at most 20 characters long")
    .regex(/^[a-zA-Z][a-zA-Z0-9_-]{2,19}$/, "Username must start with a letter and contain only letters, numbers, hyphens, or underscores");

export const signupSchema = z.object({
    username: usernameValidation,
    email: z.string().email({ message: "Invalid email address" }),
    password: z.string().min(8, { message: "Password must be at least 8 characters long" }).regex(/^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])/, "Password must contain at least one uppercase letter, one lowercase letter, and one number"),
})