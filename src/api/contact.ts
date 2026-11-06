import type { ContactValues } from '../data/contactSchema';
import { getSupabase } from '../lib/supabase';

/** The server refused the message for a reason the visitor can act on. */
export class ContactRejectedError extends Error {
  readonly field?: keyof ContactValues;

  constructor(message: string, field?: keyof ContactValues) {
    super(message);
    this.name = 'ContactRejectedError';
    this.field = field;
  }
}

const CHECK_VIOLATION = '23514';

const constraintErrors: Record<string, { field: keyof ContactValues; message: string }> = {
  contact_name_length: { field: 'name', message: 'Enter your name' },
  contact_phone_format: { field: 'phone', message: 'Enter a valid phone number' },
  contact_email_format: { field: 'email', message: 'Enter a valid email address' },
  contact_subject_length: { field: 'subject', message: 'Enter a subject' },
  contact_message_length: { field: 'message', message: 'Check the length of your message' },
};

export async function sendContactMessage(values: ContactValues): Promise<void> {
  const supabase = await getSupabase();
  // No .select() afterwards: visitors can insert but have no permission to read rows back.
  const { error } = await supabase
    .from('contact_messages')
    .insert({ ...values, phone: values.phone || null });

  if (!error) return;

  if (error.hint === 'rate_limited') {
    throw new ContactRejectedError(
      "You've just sent us a message. Please wait a minute before sending another.",
    );
  }
  if (error.code === CHECK_VIOLATION) {
    const match = Object.entries(constraintErrors).find(([name]) => error.message.includes(name));
    if (match) throw new ContactRejectedError(match[1].message, match[1].field);
  }
  throw new Error(error.message);
}
