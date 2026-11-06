import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ContactRejectedError, sendContactMessage } from '../api/contact';
import { ContactForm } from './ContactForm';

vi.mock('../lib/supabase', () => ({ supabase: {} }));
vi.mock('../api/contact', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../api/contact')>()),
  sendContactMessage: vi.fn(),
}));
const send = vi.mocked(sendContactMessage);

async function fillValidForm(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByLabelText('Name'), 'Sova');
  await user.type(screen.getByLabelText('Email'), 'sova@example.com');
  await user.type(screen.getByLabelText('Subject'), 'Bulk order');
  await user.type(screen.getByLabelText('Message'), 'Two crates of Frost Rush, please.');
}

describe('ContactForm', () => {
  beforeEach(() => {
    send.mockReset();
  });

  it('shows errors and does not send when fields are empty', async () => {
    const user = userEvent.setup();
    render(<ContactForm />);

    await user.click(screen.getByRole('button', { name: 'Send message' }));

    expect(await screen.findByText('Enter your name')).toBeInTheDocument();
    expect(screen.getByLabelText('Email')).toHaveAttribute('aria-invalid', 'true');
    expect(send).not.toHaveBeenCalled();
  });

  it('links an error to its field', async () => {
    const user = userEvent.setup();
    render(<ContactForm />);

    await user.type(screen.getByLabelText('Email'), 'not-an-email');
    await user.click(screen.getByRole('button', { name: 'Send message' }));

    await screen.findByText('Enter a valid email address');
    expect(screen.getByLabelText('Email')).toHaveAccessibleDescription(
      'Enter a valid email address',
    );
  });

  it('accepts an empty phone but rejects a bad one', async () => {
    const user = userEvent.setup();
    render(<ContactForm />);
    await fillValidForm(user);

    await user.type(screen.getByLabelText('Phone (optional)'), 'abc');
    await user.click(screen.getByRole('button', { name: 'Send message' }));
    expect(await screen.findByText('Enter a valid phone number')).toBeInTheDocument();
    expect(send).not.toHaveBeenCalled();

    await user.clear(screen.getByLabelText('Phone (optional)'));
    await user.click(screen.getByRole('button', { name: 'Send message' }));
    expect(await screen.findByText(/has been sent/)).toBeInTheDocument();
  });

  it('confirms and clears the form after sending', async () => {
    const user = userEvent.setup();
    send.mockResolvedValue();
    render(<ContactForm />);
    await fillValidForm(user);

    await user.click(screen.getByRole('button', { name: 'Send message' }));

    expect(await screen.findByText(/has been sent/)).toBeInTheDocument();
    expect(screen.getByLabelText('Name')).toHaveValue('');
  });

  it('shows a server rejection on the field it belongs to', async () => {
    const user = userEvent.setup();
    send.mockRejectedValue(new ContactRejectedError('Enter a valid email address', 'email'));
    render(<ContactForm />);
    await fillValidForm(user);

    await user.click(screen.getByRole('button', { name: 'Send message' }));

    await screen.findByText('Enter a valid email address');
    expect(screen.getByLabelText('Email')).toHaveAttribute('aria-invalid', 'true');
    expect(screen.getByLabelText('Email')).toHaveFocus();
  });

  it('shows a rate limit message and keeps what was typed', async () => {
    const user = userEvent.setup();
    send.mockRejectedValue(new ContactRejectedError('Please wait a minute'));
    render(<ContactForm />);
    await fillValidForm(user);

    await user.click(screen.getByRole('button', { name: 'Send message' }));

    expect(await screen.findByText('Please wait a minute')).toBeInTheDocument();
    expect(screen.getByLabelText('Name')).toHaveValue('Sova');
  });

  it('keeps what was typed when sending fails', async () => {
    const user = userEvent.setup();
    send.mockRejectedValue(new Error('Network down'));
    render(<ContactForm />);
    await fillValidForm(user);

    await user.click(screen.getByRole('button', { name: 'Send message' }));

    expect(await screen.findByText(/could not be sent/)).toBeInTheDocument();
    expect(screen.getByLabelText('Name')).toHaveValue('Sova');
  });
});
