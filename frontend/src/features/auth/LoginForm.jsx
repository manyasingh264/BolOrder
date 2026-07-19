// features/auth/LoginForm.jsx
//
// Why it exists: The form logic (validation, submission, error handling) is
//               separated from the page layout so each piece is testable alone.
// Responsibility: React Hook Form + Zod validation, dispatch loginUser/sendOtp/verifyOtp thunks,
//               show loading and error states, role-based authentication flow.
// Used by: LoginPage.jsx

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, Mic } from 'lucide-react';

import { loginUser, sendOtp, verifyOtp, clearAuthError, selectAuthLoading, selectAuthError } from '../../redux/slices/authSlice';
import { ROUTES, ROLES } from '../../constants';
import Input from '../../components/Input/Input';
import Button from '../../components/Button/Button';

// ─── Validation Schemas ────────────────────────────────────────────────────────
const passwordLoginSchema = z.object({
  email:    z.string().min(1, 'Email is required').email('Enter a valid email'),
  password: z.string().min(1, 'Password is required').min(6, 'Password must be at least 6 characters'),
});

const otpLoginSchema = z.object({
  email: z.string().min(1, 'Email is required').email('Enter a valid email'),
});

const verifyOtpSchema = z.object({
  email: z.string().min(1, 'Email is required').email('Enter a valid email'),
  otp:   z.string().min(1, 'OTP is required').length(6, 'OTP must be 6 digits'),
});

const LoginForm = () => {
  const dispatch  = useDispatch();
  const navigate  = useNavigate();
  const isLoading = useSelector(selectAuthLoading);
  const authError = useSelector(selectAuthError);

  // Role state
  const [role, setRole] = useState('salesman');
  const [otpSent, setOtpSent] = useState(false);
  const [email, setEmail] = useState('');
  const [otpSuccessMessage, setOtpSuccessMessage] = useState('');

  // Form setup for password login (Salesman)
  const passwordForm = useForm({
    resolver: zodResolver(passwordLoginSchema),
    defaultValues: { email: '', password: '' },
  });

  // Form setup for OTP login (Admin - send OTP)
  const otpSendForm = useForm({
    resolver: zodResolver(otpLoginSchema),
    defaultValues: { email: '' },
  });

  // Form setup for OTP login (Admin - verify OTP)
  const otpVerifyForm = useForm({
    resolver: zodResolver(verifyOtpSchema),
    defaultValues: { email: '', otp: '' },
  });

  // Clear stale error on mount and when role changes
  useEffect(() => {
    dispatch(clearAuthError());
    setOtpSent(false);
    setOtpSuccessMessage('');
    setEmail('');
    passwordForm.reset({ email: '', password: '' });
    otpSendForm.reset({ email: '' });
    otpVerifyForm.reset({ email: '', otp: '' });
  }, [dispatch, role, passwordForm, otpSendForm, otpVerifyForm]);

  // Handle password login (Salesman)
  const onPasswordSubmit = async (data) => {
    const result = await dispatch(loginUser(data));
    if (loginUser.fulfilled.match(result)) {
      const user = result.payload.user;
      const redirectRoute = user?.role === ROLES.SALESMAN ? ROUTES.VOICE_ORDER : ROUTES.DASHBOARD;
      navigate(redirectRoute, { replace: true });
    }
  };

  // Handle send OTP (Admin)
  const onSendOtp = async (data) => {
    setEmail(data.email);
    const result = await dispatch(sendOtp(data.email));
    if (sendOtp.fulfilled.match(result)) {
      setOtpSent(true);
      setOtpSuccessMessage('OTP has been sent to your registered email.');
      otpVerifyForm.setValue('email', data.email);
    }
  };

  // Handle verify OTP (Admin)
  const onVerifyOtp = async (data) => {
    const result = await dispatch(verifyOtp({ email: data.email, otp: data.otp }));
    if (verifyOtp.fulfilled.match(result)) {
      const user = result.payload.user;
      navigate(ROUTES.DASHBOARD, { replace: true });
    }
  };

  // Handle role change
  const handleRoleChange = (newRole) => {
    setRole(newRole);
  };

  return (
    <div className="card overflow-hidden">
      {/* Orange top accent bar */}
      <div className="h-1.5 bg-gradient-to-r from-primary-400 to-primary-600" />

      <div className="p-6 sm:p-8">
        {/* Logo + heading */}
        <div className="text-center mb-6 sm:mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-primary-500 shadow-card-md mb-4">
            <Mic size={22} sm:size={26} className="text-white" />
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-surface-900">
            Bol<span className="text-primary-500">Order</span>
          </h1>
          <p className="text-surface-500 text-xs sm:text-sm mt-1.5">
            AI-Powered Voice Order Management
          </p>
        </div>

        {/* Role selector tabs */}
        <div className="flex mb-6 bg-surface-100 rounded-lg p-1">
          <button
            type="button"
            onClick={() => handleRoleChange('admin')}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all ${
              role === 'admin'
                ? 'bg-white text-surface-900 shadow-sm'
                : 'text-surface-500 hover:text-surface-700'
            }`}
          >
            Admin
          </button>
          <button
            type="button"
            onClick={() => handleRoleChange('salesman')}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all ${
              role === 'salesman'
                ? 'bg-white text-surface-900 shadow-sm'
                : 'text-surface-500 hover:text-surface-700'
            }`}
          >
            Salesman
          </button>
        </div>

        {/* API error banner */}
        {authError && (
          <div className="mb-5 p-3.5 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2.5 animate-slide-in">
            <span className="text-red-500 text-base leading-none mt-0.5">⚠</span>
            <p className="text-sm text-red-700">{authError}</p>
          </div>
        )}

        {/* OTP success message */}
        {otpSuccessMessage && (
          <div className="mb-5 p-3.5 bg-green-50 border border-green-200 rounded-lg flex items-start gap-2.5 animate-slide-in">
            <span className="text-green-500 text-base leading-none mt-0.5">✓</span>
            <p className="text-sm text-green-700">{otpSuccessMessage}</p>
          </div>
        )}

        {/* Admin - OTP Login Flow */}
        {role === 'admin' && (
          <>
            {!otpSent ? (
              // Step 1: Send OTP
              <form onSubmit={otpSendForm.handleSubmit(onSendOtp)} noValidate className="space-y-5">
                <Input
                  label="Email Address"
                  type="email"
                  id="admin-email"
                  placeholder="you@company.com"
                  required
                  leftIcon={<Mail size={16} />}
                  error={otpSendForm.formState.errors.email?.message}
                  {...otpSendForm.register('email')}
                />

                <Button
                  type="submit"
                  variant="primary"
                  isLoading={isLoading}
                  className="w-full justify-center mt-2"
                  id="send-otp-btn"
                >
                  {isLoading ? 'Sending OTP…' : 'Send OTP'}
                </Button>
              </form>
            ) : (
              // Step 2: Verify OTP
              <form onSubmit={otpVerifyForm.handleSubmit(onVerifyOtp)} noValidate className="space-y-5">
                <Input
                  label="Email Address"
                  type="email"
                  id="admin-email-verify"
                  placeholder="you@company.com"
                  required
                  leftIcon={<Mail size={16} />}
                  disabled
                  value={email}
                  error={otpVerifyForm.formState.errors.email?.message}
                  {...otpVerifyForm.register('email')}
                />

                <Input
                  label="OTP"
                  type="text"
                  id="admin-otp"
                  placeholder="Enter 6-digit OTP"
                  required
                  maxLength={6}
                  error={otpVerifyForm.formState.errors.otp?.message}
                  {...otpVerifyForm.register('otp')}
                />

                <Button
                  type="submit"
                  variant="primary"
                  isLoading={isLoading}
                  className="w-full justify-center mt-2"
                  id="verify-otp-btn"
                >
                  {isLoading ? 'Verifying…' : 'Verify & Login'}
                </Button>

                <button
                  type="button"
                  onClick={() => {
                    setOtpSent(false);
                    setOtpSuccessMessage('');
                  }}
                  className="w-full text-sm text-primary-600 hover:text-primary-700 mt-2"
                >
                  Back to Send OTP
                </button>
              </form>
            )}
          </>
        )}

        {/* Salesman - Password Login Flow */}
        {role === 'salesman' && (
          <form key="salesman-form" onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} noValidate className="space-y-5" autoComplete="off">
            <Input
              label="Email Address"
              type="email"
              id="salesman-email-input"
              name="salesman-email"
              placeholder="you@company.com"
              required
              leftIcon={<Mail size={16} />}
              error={passwordForm.formState.errors.email?.message}
              autoComplete="off"
              {...passwordForm.register('email')}
            />

            <Input
              label="Password"
              type="password"
              id="salesman-password-input"
              name="salesman-password"
              placeholder="Enter your password"
              required
              leftIcon={<Lock size={16} />}
              error={passwordForm.formState.errors.password?.message}
              autoComplete="new-password"
              {...passwordForm.register('password')}
            />

            <Button
              type="submit"
              variant="primary"
              isLoading={isLoading}
              className="w-full justify-center mt-2"
              id="login-submit-btn"
            >
              {isLoading ? 'Signing in…' : 'Sign In'}
            </Button>
          </form>
        )}

        {/* Footer note */}
        <p className="text-center text-xs text-surface-400 mt-6">
          BolOrder — Namkeen Co. Internal System
        </p>
      </div>
    </div>
  );
};

export default LoginForm;
