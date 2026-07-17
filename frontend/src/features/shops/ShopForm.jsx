// features/shops/ShopForm.jsx
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useDispatch, useSelector } from 'react-redux';
import { createShop, updateShop, selectShopsLoading } from '../../redux/slices/shopsSlice';
import { addToast } from '../../redux/slices/uiSlice';
import { getAllUsers } from '../../services/users.api';
import Input from '../../components/Input/Input';
import Button from '../../components/Button/Button';
import Modal from '../../components/Modal/Modal';

const shopSchema = z.object({
  shopName:  z.string().min(2, 'Name is required'),
  ownerName: z.string().optional(),
  phone:     z.string().optional(),
  address:   z.string().optional(),
  salesmanId: z.string().optional().nullable(),
  isVerified: z.boolean().optional(),
});

const ShopForm = ({ isOpen, onClose, editShop }) => {
  const dispatch  = useDispatch();
  const isLoading = useSelector(selectShopsLoading);
  const isEdit    = !!editShop;
  const [salesmen, setSalesmen] = useState([]);

  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    resolver: zodResolver(shopSchema),
  });

  useEffect(() => {
    const fetchSalesmen = async () => {
      try {
        const res = await getAllUsers();
        const salesmenList = res.data.data.filter(user => user.role === 'SALESMAN');
        setSalesmen(salesmenList);
      } catch (err) {
        console.error('Failed to fetch salesmen:', err);
      }
    };
    if (isOpen) {
      fetchSalesmen();
      reset(editShop ? { shopName: editShop.shopName, ownerName: editShop.ownerName, phone: editShop.phone, address: editShop.address, salesmanId: editShop.salesmanId, isVerified: editShop.isVerified } : {});
    }
  }, [isOpen, editShop, reset]);

  const onSubmit = async (data) => {
    const action  = isEdit ? updateShop({ id: editShop.id, data }) : createShop(data);
    const result  = await dispatch(action);
    const creator = isEdit ? updateShop : createShop;
    if (creator.fulfilled.match(result)) {
      dispatch(addToast({ message: `Shop ${isEdit ? 'updated' : 'created'}`, type: 'success' }));
      onClose();
    } else {
      dispatch(addToast({ message: result.payload || 'Error', type: 'error' }));
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={isEdit ? 'Edit Shop' : 'Add New Shop'}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input label="Shop Name" required placeholder="e.g. Sharma Kirana" error={errors.shopName?.message} {...register('shopName')} />
        <div className="grid grid-cols-2 gap-4">
          <Input label="Owner Name" placeholder="Owner's name" {...register('ownerName')} />
          <Input label="Phone" placeholder="9876543210" {...register('phone')} />
        </div>
        <div>
          <label className="block text-sm font-medium text-surface-700 mb-1">Assign Salesman</label>
          <select
            {...register('salesmanId')}
            className="w-full px-3 py-2 border border-surface-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          >
            <option value="">-- No Salesman Assigned --</option>
            {salesmen.map(salesman => (
              <option key={salesman.id} value={salesman.id}>
                {salesman.name} ({salesman.email})
              </option>
            ))}
          </select>
          {errors.salesmanId && <p className="text-xs text-red-500 mt-1">{errors.salesmanId.message}</p>}
        </div>
        <Input label="Full Address" placeholder="Street address" {...register('address')} />
        {isEdit && (
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="isVerified"
              {...register('isVerified')}
              className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
            />
            <label htmlFor="isVerified" className="text-sm font-medium text-surface-700">
              Active Status (Verified)
            </label>
          </div>
        )}
        <div className="flex justify-end gap-3 pt-2">
          <Button variant="secondary" type="button" onClick={onClose}>Cancel</Button>
          <Button type="submit" isLoading={isLoading}>{isEdit ? 'Save Changes' : 'Create Shop'}</Button>
        </div>
      </form>
    </Modal>
  );
};

export default ShopForm;
