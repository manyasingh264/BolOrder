// features/auth/LoginForm.jsx
//
// Why it exists: The form logic (validation, submission, error handling) is
//               separated from the page layout so each piece is testable alone.
// Responsibility: React Hook Form + Zod validation, dispatch loginUser thunk,
//               show loading and error states.
// Used by: LoginPage.jsx

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, Mic } from 'lucide-react';

import { loginUser, clearAuthError, selectAuthLoading, selectAuthError } from '../../redux/slices/authSlice';
import { ROUTES, ROLES } from '../../constants';
import Input from '../../components/Input/Input';
import Button from '../../components/Button/Button';

// ─── Validation Schema ────────────────────────────────────────────────────────
const loginSchema = z.object({
  email:    z.string().min(1, 'Email is required').email('Enter a valid email'),
  password: z.string().min(1, 'Password is required').min(6, 'Password must be at least 6 characters'),
});

const LoginForm = () => {
  const dispatch  = useDispatch();
  const navigate  = useNavigate();
  const isLoading = useSelector(selectAuthLoading);
  const authError = useSelector(selectAuthError);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({ resolver: zodResolver(loginSchema) });

  // Clear stale error on mount
  useEffect(() => { dispatch(clearAuthError()); }, [dispatch]);

  const onSubmit = async (data) => {
    const result = await dispatch(loginUser(data));
    if (loginUser.fulfilled.match(result)) {
      // Redirect based on role from the login response
      const user = result.payload.user;
      const redirectRoute = user?.role === ROLES.SALESMAN ? ROUTES.VOICE_ORDER : ROUTES.DASHBOARD;
      navigate(redirectRoute, { replace: true });
    }
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

        {/* API error banner */}
        {authError && (
          <div className="mb-5 p-3.5 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2.5 animate-slide-in">
            <span className="text-red-500 text-base leading-none mt-0.5">⚠</span>
            <p className="text-sm text-red-700">{authError}</p>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
          <Input
            label="Email Address"
            type="email"
            id="login-email"
            placeholder="you@company.com"
            required
            leftIcon={<Mail size={16} />}
            error={errors.email?.message}
            {...register('email')}
          />

          <Input
            label="Password"
            type="password"
            id="login-password"
            placeholder="Enter your password"
            required
            leftIcon={<Lock size={16} />}
            error={errors.password?.message}
            {...register('password')}
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

        {/* Footer note */}
        <p className="text-center text-xs text-surface-400 mt-6">
          BolOrder — Namkeen Co. Internal System
        </p>
      </div>
    </div>
  );
};

export default LoginForm;
