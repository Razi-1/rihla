import { z } from 'zod';

export const emailSchema = z
  .string()
  .min(1, 'Email is required')
  .email('Enter a valid email address');

export const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[A-Z]/, 'Must contain an uppercase letter')
  .regex(/[a-z]/, 'Must contain a lowercase letter')
  .regex(/[0-9]/, 'Must contain a number')
  .regex(/[^A-Za-z0-9]/, 'Must contain a special character');

export const nameSchema = z
  .string()
  .min(1, 'This field is required')
  .max(100, 'Maximum 100 characters');

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password is required'),
  account_type: z.enum(['student', 'tutor', 'parent']),
});

export const registerSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  confirm_password: z.string(),
  account_type: z.enum(['student', 'tutor', 'parent']),
  first_name: nameSchema,
  last_name: nameSchema,
  date_of_birth: z.string().min(1, 'Date of birth is required'),
  government_id: z.string().min(1, 'Government ID is required'),
  id_country_code: z.string().min(1, 'ID country is required'),
  phone_number: z.string().optional(),
  phone_country_code: z.string().optional(),
}).refine((data) => data.password === data.confirm_password, {
  message: 'Passwords do not match',
  path: ['confirm_password'],
});

export const forgotPasswordSchema = z.object({
  email: emailSchema,
  account_type: z.enum(['student', 'tutor', 'parent']),
});

export const resetPasswordSchema = z.object({
  password: passwordSchema,
  confirm_password: z.string(),
}).refine((data) => data.password === data.confirm_password, {
  message: 'Passwords do not match',
  path: ['confirm_password'],
});

export const changePasswordSchema = z.object({
  current_password: z.string().min(1, 'Current password is required'),
  new_password: passwordSchema,
  confirm_password: z.string(),
}).refine((data) => data.new_password === data.confirm_password, {
  message: 'Passwords do not match',
  path: ['confirm_password'],
});

export const reviewSchema = z.object({
  rating: z.number().min(1, 'Rating is required').max(5),
  comment: z.string().min(10, 'Review must be at least 10 characters').max(2000),
  duration_months: z.number().optional(),
});

export type LoginFormData = z.infer<typeof loginSchema>;
export type RegisterFormData = z.infer<typeof registerSchema>;
export type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;
export type ChangePasswordFormData = z.infer<typeof changePasswordSchema>;
export type ReviewFormData = z.infer<typeof reviewSchema>;
