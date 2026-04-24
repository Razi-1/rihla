import { z } from 'zod';

export const emailSchema = z
  .string()
  .min(1, 'Email is required')
  .email('Invalid email address');

export const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .max(128, 'Password must be at most 128 characters')
  .regex(/[a-z]/, 'Must contain a lowercase letter')
  .regex(/[A-Z]/, 'Must contain an uppercase letter')
  .regex(/[0-9]/, 'Must contain a number');

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
  first_name: z.string().min(1, 'First name is required').max(100),
  last_name: z.string().min(1, 'Last name is required').max(100),
  date_of_birth: z.string().min(1, 'Date of birth is required'),
  government_id: z.string().min(5, 'Government ID is required').max(50),
  id_country_code: z.string().min(2).max(3),
  phone_number: z.string().optional(),
  phone_country_code: z.string().optional(),
  gender: z.string().optional(),
}).refine((data) => data.password === data.confirm_password, {
  message: 'Passwords do not match',
  path: ['confirm_password'],
});

export const forgotPasswordSchema = z.object({
  email: emailSchema,
  account_type: z.enum(['student', 'tutor', 'parent']),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Token is required'),
  new_password: passwordSchema,
  confirm_password: z.string(),
}).refine((data) => data.new_password === data.confirm_password, {
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
  rating: z.number().min(1).max(5),
  text: z.string().min(10, 'Review must be at least 10 characters').max(5000),
  sessions_attended: z.number().min(1),
  approximate_duration_weeks: z.number().min(1),
});

export const linkChildSchema = z.object({
  student_email: emailSchema,
});

export type LoginFormData = z.infer<typeof loginSchema>;
export type RegisterFormData = z.infer<typeof registerSchema>;
export type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;
export type ChangePasswordFormData = z.infer<typeof changePasswordSchema>;
export type ReviewFormData = z.infer<typeof reviewSchema>;
export type LinkChildFormData = z.infer<typeof linkChildSchema>;
