import { zodResolver } from '@hookform/resolvers/zod';
import { useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { useForm, type FieldValues, type Path, type UseFormSetError } from 'react-hook-form';
import { Link, Navigate, useNavigate, useParams, useSearchParams } from 'react-router';
import {
  createSupplier,
  SupplierRejectedError,
  transitionSupplier,
  updateSupplier,
  type SupplierPatch,
} from '../../api/suppliers';
import { Button } from '../../components/Button';
import { QueryError } from '../../components/QueryError';
import { SelectField } from '../../components/SelectField';
import stateStyles from '../../components/StoreStates.module.css';
import { TextField } from '../../components/TextField';
import { useToast } from '../../components/ToastContext';
import {
  categoryLabels,
  certificationOptions,
  companySchema,
  complianceSchema,
  contactStepSchema,
  furthestStep,
  ONBOARDING_STEPS,
  toYesNo,
  type CompanyValues,
  type ComplianceValues,
  type ContactStepValues,
  type Supplier,
} from '../../data/suppliers';
import { adminKey, useSupplier } from '../../hooks/useSuppliers';
import styles from './admin.module.css';

type Destination = 'next' | 'exit';
type StepProps = {
  supplier: Supplier | null | undefined;
  onSave: (patch: SupplierPatch, destination: Destination) => Promise<void>;
};

/** Saving happens after every step, so an abandoned form is a draft and not lost work. */
function useStepSubmit<Values extends FieldValues>(
  onSave: StepProps['onSave'],
  toPatch: (values: Values) => SupplierPatch,
  setError: UseFormSetError<Values>,
) {
  const [failure, setFailure] = useState('');

  const submit = (destination: Destination) => async (values: Values) => {
    setFailure('');
    try {
      await onSave(toPatch(values), destination);
    } catch (error) {
      if (error instanceof SupplierRejectedError && error.field) {
        setError(error.field as Path<Values>, { message: error.message }, { shouldFocus: true });
      } else {
        setFailure(
          error instanceof SupplierRejectedError
            ? error.message
            : "We couldn't save this step. Your answers are still here, so please try again.",
        );
      }
    }
  };

  return { failure, submit };
}

function StepActions({
  onNext,
  onExit,
  saving,
  failure,
  previous,
}: {
  onNext: () => void;
  onExit: () => void;
  saving: boolean;
  failure: string;
  previous?: string;
}) {
  return (
    <>
      <div className={styles.stepActions}>
        <Button onClick={onNext} disabled={saving}>
          {saving ? 'Saving…' : 'Save and continue'}
        </Button>
        <Button variant="secondary" onClick={onExit} disabled={saving}>
          Save and exit
        </Button>
        {previous && <Link to={previous}>Back</Link>}
      </div>
      <p className={styles.fieldError} role="alert">
        {failure}
      </p>
    </>
  );
}

function CompanyStep({ supplier, onSave }: StepProps) {
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<CompanyValues>({
    resolver: zodResolver(companySchema),
    defaultValues: {
      name: supplier?.name ?? '',
      category: supplier?.category,
      country: supplier?.country ?? '',
    },
  });
  const { failure, submit } = useStepSubmit<CompanyValues>(onSave, (values) => values, setError);

  return (
    <form className={styles.stepForm} noValidate onSubmit={handleSubmit(submit('next'))}>
      <TextField label="Company name" error={errors.name?.message} {...register('name')} />
      <SelectField label="Category" error={errors.category?.message} {...register('category')}>
        <option value="">Choose a category</option>
        {Object.entries(categoryLabels).map(([value, label]) => (
          <option key={value} value={value}>
            {label}
          </option>
        ))}
      </SelectField>
      <TextField label="Country" error={errors.country?.message} {...register('country')} />
      <StepActions
        saving={isSubmitting}
        failure={failure}
        onNext={() => void handleSubmit(submit('next'))()}
        onExit={() => void handleSubmit(submit('exit'))()}
      />
    </form>
  );
}

function ContactStep({ supplier, onSave }: StepProps) {
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<ContactStepValues>({
    resolver: zodResolver(contactStepSchema),
    defaultValues: {
      contactName: supplier?.contactName ?? '',
      contactEmail: supplier?.contactEmail ?? '',
    },
  });
  const { failure, submit } = useStepSubmit<ContactStepValues>(
    onSave,
    (values) => values,
    setError,
  );

  return (
    <form className={styles.stepForm} noValidate onSubmit={handleSubmit(submit('next'))}>
      <TextField
        label="Contact name"
        error={errors.contactName?.message}
        {...register('contactName')}
      />
      <TextField
        label="Contact email"
        type="email"
        error={errors.contactEmail?.message}
        {...register('contactEmail')}
      />
      <StepActions
        saving={isSubmitting}
        failure={failure}
        previous="?step=1"
        onNext={() => void handleSubmit(submit('next'))()}
        onExit={() => void handleSubmit(submit('exit'))()}
      />
    </form>
  );
}

const questions = [
  { name: 'hasInsurance', label: 'Do they hold product liability insurance?' },
  { name: 'auditedLastYear', label: 'Were they audited in the last 12 months?' },
  { name: 'handlesAllergens', label: 'Do they handle allergens on site?' },
] as const;

function ComplianceStep({ supplier, onSave }: StepProps) {
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<ComplianceValues>({
    resolver: zodResolver(complianceSchema),
    defaultValues: {
      certifications: supplier?.certifications ?? [],
      hasInsurance: toYesNo(supplier?.hasInsurance ?? null),
      auditedLastYear: toYesNo(supplier?.auditedLastYear ?? null),
      handlesAllergens: toYesNo(supplier?.handlesAllergens ?? null),
    },
  });
  const { failure, submit } = useStepSubmit<ComplianceValues>(
    onSave,
    (values) => ({
      certifications: values.certifications,
      hasInsurance: values.hasInsurance === 'yes',
      auditedLastYear: values.auditedLastYear === 'yes',
      handlesAllergens: values.handlesAllergens === 'yes',
    }),
    setError,
  );

  return (
    <form className={styles.stepForm} noValidate onSubmit={handleSubmit(submit('next'))}>
      <fieldset className={styles.fieldset}>
        <legend>Certifications held</legend>
        <div className={styles.options}>
          {certificationOptions.map((option) => (
            <label key={option} className={styles.option}>
              <input type="checkbox" value={option} {...register('certifications')} />
              {option}
            </label>
          ))}
        </div>
      </fieldset>

      {questions.map((question) => (
        <fieldset key={question.name} className={styles.fieldset}>
          <legend>{question.label}</legend>
          <div className={styles.options}>
            {(['yes', 'no'] as const).map((answer) => (
              <label key={answer} className={styles.option}>
                <input type="radio" value={answer} {...register(question.name)} />
                {answer === 'yes' ? 'Yes' : 'No'}
              </label>
            ))}
          </div>
          {errors[question.name] && (
            <p className={styles.fieldError}>{errors[question.name]?.message}</p>
          )}
        </fieldset>
      ))}

      <StepActions
        saving={isSubmitting}
        failure={failure}
        previous="?step=2"
        onNext={() => void handleSubmit(submit('next'))()}
        onExit={() => void handleSubmit(submit('exit'))()}
      />
    </form>
  );
}

function ReviewStep({ supplier }: { supplier: Supplier }) {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [saving, setSaving] = useState(false);
  const [failure, setFailure] = useState('');

  const handleSubmit = async () => {
    setSaving(true);
    setFailure('');
    try {
      await transitionSupplier({
        id: supplier.id,
        expectedStatus: 'draft',
        toStatus: 'submitted',
      });
      await queryClient.invalidateQueries({ queryKey: adminKey });
      showToast('Supplier submitted for review.');
      await navigate(`/admin/suppliers/${supplier.id}`, { replace: true });
    } catch (error) {
      setFailure(
        error instanceof SupplierRejectedError
          ? error.message
          : "We couldn't submit this supplier. Please try again.",
      );
      setSaving(false);
    }
  };

  const yesNo = (value: boolean | null) => (value ? 'Yes' : 'No');

  return (
    <div className={styles.stepForm}>
      <dl className={styles.details}>
        <dt>Company</dt>
        <dd>{supplier.name}</dd>
        <dt>Category</dt>
        <dd>{categoryLabels[supplier.category]}</dd>
        <dt>Country</dt>
        <dd>{supplier.country}</dd>
        <dt>Contact</dt>
        <dd>
          {supplier.contactName} ({supplier.contactEmail})
        </dd>
        <dt>Certifications</dt>
        <dd>{supplier.certifications.join(', ') || 'None'}</dd>
        <dt>Insured</dt>
        <dd>{yesNo(supplier.hasInsurance)}</dd>
        <dt>Audited last year</dt>
        <dd>{yesNo(supplier.auditedLastYear)}</dd>
        <dt>Handles allergens</dt>
        <dd>{yesNo(supplier.handlesAllergens)}</dd>
      </dl>
      <p>The risk score is calculated when you submit, and the supplier then waits for review.</p>
      <div className={styles.stepActions}>
        <Button onClick={() => void handleSubmit()} disabled={saving}>
          {saving ? 'Submitting…' : 'Submit for review'}
        </Button>
        <Link to="?step=3">Back</Link>
      </div>
      <p className={styles.fieldError} role="alert">
        {failure}
      </p>
    </div>
  );
}

export function SupplierOnboardingPage() {
  const { id } = useParams();
  const [params, setParams] = useSearchParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const supplier = useSupplier(id);

  if (id && supplier.isPending) {
    return (
      <div
        className={`${stateStyles.skeleton} ${styles.skeletonTable}`}
        role="status"
        aria-label="Loading supplier"
      />
    );
  }

  if (id && supplier.isError) {
    return (
      <QueryError
        message="We couldn't load this supplier."
        onRetry={() => void supplier.refetch()}
        retrying={supplier.isFetching}
      />
    );
  }

  if (id && !supplier.data) {
    return (
      <div className={stateStyles.state}>
        <h1>Supplier not found</h1>
        <Link to="/admin/suppliers">Back to suppliers</Link>
      </div>
    );
  }

  const data = supplier.data;
  // Only drafts can be edited. A submitted supplier belongs to the review workflow.
  if (data && data.status !== 'draft') return <Navigate to={`/admin/suppliers/${data.id}`} replace />;

  const furthest = furthestStep(data);
  const requested = Number(params.get('step'));
  const step = Number.isInteger(requested) && requested >= 1 ? Math.min(requested, furthest) : furthest;

  const save: StepProps['onSave'] = async (patch, destination) => {
    let savedId = id;
    if (savedId) await updateSupplier(savedId, patch);
    else savedId = await createSupplier(patch);

    await queryClient.invalidateQueries({ queryKey: adminKey });

    if (destination === 'exit') {
      showToast('Draft saved.');
      await navigate('/admin/suppliers');
    } else if (id) {
      setParams({ step: String(step + 1) });
    } else {
      // replace: Back must not return to a blank form and create a duplicate.
      await navigate(`/admin/suppliers/${savedId}/onboarding?step=2`, { replace: true });
    }
  };

  return (
    <>
      <title>{`${data?.name ?? 'New supplier'} | Valo Drinks`}</title>
      <Link to="/admin/suppliers">Back to suppliers</Link>
      <div className={styles.titleRow}>
        <h1 className={styles.heading}>{data?.name ?? 'New supplier'}</h1>
      </div>

      <ol className={styles.steps}>
        {ONBOARDING_STEPS.map((label, index) => {
          const number = index + 1;
          const state = number === step ? 'current' : number < step ? 'done' : 'todo';
          return (
            <li key={label} data-state={state} aria-current={state === 'current' ? 'step' : undefined}>
              {number}. {label}
            </li>
          );
        })}
      </ol>

      {/* Keyed so each step's form starts from the latest saved values. */}
      {step === 1 && <CompanyStep key={data?.id ?? 'new'} supplier={data} onSave={save} />}
      {step === 2 && <ContactStep key={data?.id} supplier={data} onSave={save} />}
      {step === 3 && <ComplianceStep key={data?.id} supplier={data} onSave={save} />}
      {step === 4 && data && <ReviewStep supplier={data} />}
    </>
  );
}
