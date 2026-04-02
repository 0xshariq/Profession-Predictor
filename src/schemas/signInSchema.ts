import { z } from 'zod';

export const signinSchema = z.object({
    email: z.string().min(3, { message: "Email or username must be at least 3 characters long" }),
    password: z.string().min(6, { message: "Password must be at least 6 characters long" }),
})