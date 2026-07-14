// features/users/UserForm.jsx
// Create + Edit user form. Uses React Hook Form + Zod.
// ADMIN only.

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useDispatch, useSelector } from 'react-redux';
import { createUser, updateUser, selectUsersLoading } from '../../redux/slices/usersSlice';
import { addToast } from '../../redux/slices/uiSlice';
import { ROLES, ROLE_LABELS } from '../../constants';
import Input from '../../components/Input/Input';
import Button from '../../components/Button/Button';
import Modal from '../../components/Modal/Modal';

const createSchema = z.object({
  name:     z.string().min(2, 'Name must be at least 2 characters'),
  email:    z.string().email('Enter a valid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  role:     z.enum([ROLES.ADMIN, ROLES.SUPERVISOR, ROLES.SALESMAN]),
});

const editSchema = createSchema.extend({
  password: z.string().optional().or(z.literal('')),
});

const UserForm = ({ isOpen, onClose, editUser }) => {
  const dispatch  = useDispatch();
  const isLoading = useSelector(selectUsersLoading);
  const isEdit    = !!editUser;

  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    resolver: zodResolver(isEdit ? editSchema : createSchema),
    defaultValues: editUser ? {
      name:  editUser.name,
      email: editUser.email,
      role:  editUser.role,
    } : {},
  });

  useEffect(() => {
    if (isOpen) reset(editUser ? { name: editUser.name, email: editUser.email, role: editUser.role, password: '' } : {});
  }, [isOpen, editUser, reset]);

  const onSubmit = async (data) => {
    const payload = isEdit
      ? { name: data.name, role: data.role, ...(data.password ? { password: data.password } : {}) }
      : data;

    const action = isEdit
      ? updateUser({ id: editUser.id, data: payload })
      : createUser(payload);

    const result = await dispatch(action);
    if ((isEdit ? updateUser : createUser).fulfilled.match(result)) {
      dispatch(addToast({ message: `User ${isEdit ? 'updated' : 'created'} successfully`, type: 'success' }));
      onClose();
    } else {
      dispatch(addToast({ message: result.payload || 'Something went wrong', type: 'error' }));
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={isEdit ? 'Edit User' : 'Create New User'}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input label="Full Name" required placeholder="e.g. Priya Sharma" error={errors.name?.message} {...register('name')} />
        <Input label="Email" type="email" required placeholder="user@company.com" error={errors.email?.message} {...register('email')} />
        <Input
          label={isEdit ? 'New Password (leave blank to keep current)' : 'Password'}
          type="password"
          required={!isEdit}
          placeholder={isEdit ? 'Leave blank to keep current' : 'Min 6 characters'}
          error={errors.password?.message}
          {...register('password')}
        />
        <div>
          <label className="label-base">Role <span className="text-red-500">*</span></label>
          <select className="input-base" {...register('role')}>
            <option value="">Select role</option>
            {Object.keys(ROLES).map((r) => (
              <option key={r} value={r}>{ROLE_LABELS[r]}</option>
            ))}
          </select>
          {errors.role && <p className="error-msg">⚠ {errors.role.message}</p>}
        </div>
        <div className="flex justify-end gap-3 pt-2">
          <Button variant="secondary" type="button" onClick={onClose}>Cancel</Button>
          <Button type="submit" isLoading={isLoading}>{isEdit ? 'Save Changes' : 'Create User'}</Button>
        </div>
      </form>
    </Modal>
  );
};

export default UserForm;
