import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Lock, User, CreditCard, Phone, ArrowLeft, ArrowRight } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { registerSchema, type RegisterFormData } from '@/utils/validators';
import Input from '@/components/common/Input';
import Select from '@/components/common/Select';
import Button from '@/components/common/Button';
import AccountTypeSelector from './AccountTypeSelector';
import type { AccountType } from '@/types/common';
import styles from './RegisterForm.module.css';

const STEPS = ['Account Type', 'Personal Info', 'Security'];

export default function RegisterForm() {
  const { register: registerUser } = useAuth();
  const [step, setStep] = useState(0);
  const [error, setError] = useState('');

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    trigger,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: { account_type: '' as AccountType, id_country_code: 'LK' },
  });

  const accountType = watch('account_type');

  const nextStep = async () => {
    let fieldsToValidate: (keyof RegisterFormData)[] = [];
    if (step === 0) fieldsToValidate = ['account_type'];
    else if (step === 1) fieldsToValidate = ['first_name', 'last_name', 'date_of_birth', 'government_id', 'id_country_code'];
    const valid = await trigger(fieldsToValidate);
    if (valid) setStep(step + 1);
  };

  const onSubmit = async (data: RegisterFormData) => {
    try {
      setError('');
      const { confirm_password: _, ...payload } = data;
      await registerUser(payload);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
      setError(msg ?? 'Registration failed. Please try again.');
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className={styles.form}>
      <div className={styles.steps}>
        {STEPS.map((label, i) => (
          <div key={label} className={`${styles.step} ${i <= step ? styles.active : ''}`}>
            <div className={styles.stepDot}>{i + 1}</div>
            <span>{label}</span>
          </div>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {step === 0 && (
          <motion.div key="step0" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className={styles.stepContent}>
            <AccountTypeSelector
              value={accountType}
              onChange={(type: AccountType) => setValue('account_type', type)}
            />
            {errors.account_type && <p className={styles.fieldError}>{errors.account_type.message}</p>}
          </motion.div>
        )}

        {step === 1 && (
          <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className={styles.stepContent}>
            <div className={styles.row}>
              <Input label="First Name" placeholder="First name" icon={<User size={16} strokeWidth={1.5} />} error={errors.first_name?.message} {...register('first_name')} />
              <Input label="Last Name" placeholder="Last name" error={errors.last_name?.message} {...register('last_name')} />
            </div>
            <Input label="Date of Birth" type="date" error={errors.date_of_birth?.message} {...register('date_of_birth')} />
            <div className={styles.row}>
              <Select
                label="ID Country"
                options={[
                  { value: 'LK', label: 'Sri Lanka' },
                  { value: 'PK', label: 'Pakistan' },
                  { value: 'IN', label: 'India' },
                  { value: 'US', label: 'United States' },
                  { value: 'GB', label: 'United Kingdom' },
                  { value: 'AE', label: 'UAE' },
                ]}
                error={errors.id_country_code?.message}
                {...register('id_country_code')}
              />
              <Input label="Government ID" placeholder="NIC / Passport" icon={<CreditCard size={16} strokeWidth={1.5} />} error={errors.government_id?.message} {...register('government_id')} />
            </div>
            <Input label="Phone (optional)" placeholder="+94 7X XXX XXXX" icon={<Phone size={16} strokeWidth={1.5} />} {...register('phone_number')} />
          </motion.div>
        )}

        {step === 2 && (
          <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className={styles.stepContent}>
            <Input label="Email" type="email" placeholder="you@example.com" icon={<Mail size={16} strokeWidth={1.5} />} error={errors.email?.message} {...register('email')} />
            <Input label="Password" type="password" placeholder="Create a strong password" icon={<Lock size={16} strokeWidth={1.5} />} error={errors.password?.message} {...register('password')} />
            <Input label="Confirm Password" type="password" placeholder="Confirm password" icon={<Lock size={16} strokeWidth={1.5} />} error={errors.confirm_password?.message} {...register('confirm_password')} />
          </motion.div>
        )}
      </AnimatePresence>

      {error && <p className={styles.error}>{error}</p>}

      <div className={styles.actions}>
        {step > 0 && (
          <Button type="button" variant="secondary" onClick={() => setStep(step - 1)} icon={<ArrowLeft size={16} strokeWidth={1.5} />}>
            Back
          </Button>
        )}
        {step < 2 ? (
          <Button type="button" onClick={nextStep} icon={<ArrowRight size={16} strokeWidth={1.5} />}>
            Continue
          </Button>
        ) : (
          <Button type="submit" loading={isSubmitting} size="lg">
            Create Account
          </Button>
        )}
      </div>
    </form>
  );
}
