import { z } from 'zod';

// These limits mirror the check constraints in supabase/migrations. The database has the final say.
export const contactSchema = z.object({
  name: z.string().trim().min(2, 'Enter your name').max(100, 'Keep your name under 100 characters'),
  phone: z
    .string()
    .trim()
    .regex(/^$|^\+?[0-9 ()-]{7,20}$/, 'Enter a valid phone number')
    .optional(),
  email: z.string().trim().pipe(z.email('Enter a valid email address')),
  subject: z
    .string()
    .trim()
    .min(3, 'Enter a subject')
    .max(150, 'Keep your subject under 150 characters'),
  message: z
    .string()
    .trim()
    .min(10, 'Your message needs at least 10 characters')
    .max(1000, 'Keep your message under 1000 characters'),
});

export type ContactValues = z.infer<typeof contactSchema>;
