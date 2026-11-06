import { z } from 'zod';

export const contactSchema = z.object({
  name: z.string().trim().min(2, 'Enter your name'),
  phone: z
    .string()
    .trim()
    .regex(/^$|^\+?[\d\s()-]{7,20}$/, 'Enter a valid phone number')
    .optional(),
  email: z.string().trim().pipe(z.email('Enter a valid email address')),
  subject: z.string().trim().min(3, 'Enter a subject'),
  message: z
    .string()
    .trim()
    .min(10, 'Your message needs at least 10 characters')
    .max(1000, 'Keep your message under 1000 characters'),
});

export type ContactValues = z.infer<typeof contactSchema>;
