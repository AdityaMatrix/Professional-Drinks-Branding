import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router';
import {
  loadShipping,
  saveShipping,
  shippingSchema,
  type ShippingValues,
} from '../../checkout/checkoutState';
import { Button } from '../../components/Button';
import { TextField } from '../../components/TextField';
import { OrderSummary } from './OrderSummary';
import styles from './checkout.module.css';

export function CheckoutDetailsPage() {
  const navigate = useNavigate();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ShippingValues>({
    resolver: zodResolver(shippingSchema),
    defaultValues: loadShipping() ?? undefined,
  });

  const onSubmit = (values: ShippingValues) => {
    saveShipping(values);
    void navigate('/checkout/payment');
  };

  return (
    <div className={styles.layout}>
      <title>Checkout | Valo Drinks</title>
      <form className={styles.form} onSubmit={handleSubmit(onSubmit)} noValidate>
        <h2 className={styles.sectionHeading}>Delivery details</h2>
        <TextField
          label="Full name"
          autoComplete="name"
          error={errors.fullName?.message}
          {...register('fullName')}
        />
        <TextField
          label="Email"
          type="email"
          autoComplete="email"
          error={errors.email?.message}
          {...register('email')}
        />
        <TextField
          label="Address"
          autoComplete="street-address"
          error={errors.address?.message}
          {...register('address')}
        />
        <div className={styles.row}>
          <TextField
            label="City"
            autoComplete="address-level2"
            error={errors.city?.message}
            {...register('city')}
          />
          <TextField
            label="Postcode"
            autoComplete="postal-code"
            error={errors.postcode?.message}
            {...register('postcode')}
          />
        </div>
        <TextField
          label="Country"
          autoComplete="country-name"
          error={errors.country?.message}
          {...register('country')}
        />
        <div className={styles.actions}>
          <Button type="submit">Continue to payment</Button>
          <Link className={styles.link} to="/cart">
            Back to cart
          </Link>
        </div>
      </form>
      <OrderSummary />
    </div>
  );
}
