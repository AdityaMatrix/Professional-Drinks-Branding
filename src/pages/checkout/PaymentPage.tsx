import { zodResolver } from '@hookform/resolvers/zod';
import { useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, Navigate, useNavigate } from 'react-router';
import { quoteOrder, QuoteRejectedError } from '../../api/orders';
import { useCart } from '../../cart/CartContext';
import { toOrderItems } from '../../cart/cartState';
import {
  CardDeclinedError,
  formatCardNumber,
  formatExpiry,
  loadShipping,
  paymentSchema,
  placeOrder,
  processMockPayment,
  testCards,
  type PaymentValues,
} from '../../checkout/checkoutState';
import { Button } from '../../components/Button';
import { TextField } from '../../components/TextField';
import { formatPrice } from '../../data/products';
import { useQuote } from '../../hooks/useQuote';
import { OrderSummary } from './OrderSummary';
import styles from './checkout.module.css';

export function PaymentPage() {
  const { items } = useCart();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const quote = useQuote();
  const [shipping] = useState(loadShipping);
  const [failure, setFailure] = useState('');
  const {
    register,
    handleSubmit,
    setValue,
    clearErrors,
    formState: { errors, isSubmitting },
  } = useForm<PaymentValues>({ resolver: zodResolver(paymentSchema) });

  if (!shipping) return <Navigate to="/checkout" replace />;

  const fillTestCard = (number: string) => {
    setValue('cardName', shipping.fullName);
    setValue('cardNumber', number);
    setValue('expiry', '12/34');
    setValue('cvc', '123');
    clearErrors();
    setFailure('');
  };

  const onSubmit = async (values: PaymentValues) => {
    setFailure('');
    try {
      // Priced again at the last moment, so nobody pays a total that's gone out of date.
      const latest = await quoteOrder(toOrderItems(items));
      if (quote.data && latest.totalCents !== quote.data.totalCents) {
        await queryClient.invalidateQueries({ queryKey: ['quote'] });
        setFailure(
          `Your total has changed to ${formatPrice(latest.totalCents)}. Check it and pay again.`,
        );
        return;
      }

      await processMockPayment(values.cardNumber);
      placeOrder(latest, shipping);
      await navigate('/checkout/confirmation', { replace: true });
    } catch (error) {
      const known = error instanceof CardDeclinedError || error instanceof QuoteRejectedError;
      setFailure(known ? error.message : "We couldn't complete your order. Please try again.");
    }
  };

  return (
    <div className={styles.layout}>
      <title>Payment | Valo Drinks</title>
      <form className={styles.form} onSubmit={handleSubmit(onSubmit)} noValidate autoComplete="off">
        <h2 className={styles.sectionHeading}>Mock payment</h2>
        <div className={styles.warning}>
          <p>
            <strong>Don&apos;t enter a real card.</strong> This form only accepts the test cards
            below, and nothing you type here leaves your browser.
          </p>
          <div className={styles.testCards}>
            {testCards.map((card) => (
              <Button key={card.number} variant="secondary" onClick={() => fillTestCard(card.number)}>
                Use {card.label.toLowerCase()} card
              </Button>
            ))}
          </div>
        </div>

        <TextField
          label="Name on card"
          autoComplete="off"
          error={errors.cardName?.message}
          {...register('cardName')}
        />
        <TextField
          label="Card number"
          inputMode="numeric"
          autoComplete="off"
          error={errors.cardNumber?.message}
          {...register('cardNumber', {
            onChange: (event) => setValue('cardNumber', formatCardNumber(event.target.value)),
          })}
        />
        <div className={styles.row}>
          <TextField
            label="Expiry (MM/YY)"
            inputMode="numeric"
            autoComplete="off"
            error={errors.expiry?.message}
            {...register('expiry', {
              onChange: (event) => setValue('expiry', formatExpiry(event.target.value)),
            })}
          />
          <TextField
            label="CVC"
            inputMode="numeric"
            maxLength={3}
            autoComplete="off"
            error={errors.cvc?.message}
            {...register('cvc')}
          />
        </div>

        <p className={styles.failure} role="alert">
          {failure}
        </p>
        <div className={styles.actions}>
          <Button type="submit" disabled={isSubmitting || !quote.data}>
            {isSubmitting
              ? 'Processing…'
              : quote.data
                ? `Pay ${formatPrice(quote.data.totalCents)}`
                : 'Pay'}
          </Button>
          <Link className={styles.link} to="/checkout">
            Back to details
          </Link>
        </div>
      </form>
      <OrderSummary />
    </div>
  );
}
