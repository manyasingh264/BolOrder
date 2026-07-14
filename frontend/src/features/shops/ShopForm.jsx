// features/shops/ShopForm.jsx
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useDispatch, useSelector } from 'react-redux';
import { createShop, updateShop, selectShopsLoading } from '../../redux/slices/shopsSlice';
import { addToast } from '../../redux/slices/uiSlice';
import Input from '../../components/Input/Input';
import Button from '../../components/Button/Button';
import Modal from '../../components/Modal/Modal';

const shopSchema = z.object({
  name:      z.string().min(2, 'Name is required'),
  ownerName: z.string().optional(),
  phone:     z.string().optional(),
  area:      z.string().optional(),
  address:   z.string().optional(),
});

const ShopForm = ({ isOpen, onClose, editShop }) => {
  const dispatch  = useDispatch();
  const isLoading = useSelector(selectShopsLoading);
  const isEdit    = !!editShop;

  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    resolver: zodResolver(shopSchema),
  });

  useEffect(() => {
    if (isOpen) reset(editShop ? { name: editShop.name, ownerName: editShop.ownerName, phone: editShop.phone, area: editShop.area, address: editShop.address } : {});
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
        <Input label="Shop Name" required placeholder="e.g. Sharma Kirana" error={errors.name?.message} {...register('name')} />
        <div className="grid grid-cols-2 gap-4">
          <Input label="Owner Name" placeholder="Owner's name" {...register('ownerName')} />
          <Input label="Phone" placeholder="9876543210" {...register('phone')} />
        </div>
        <Input label="Area / Locality" placeholder="e.g. Koramangala" {...register('area')} />
        <Input label="Full Address" placeholder="Street address" {...register('address')} />
        <div className="flex justify-end gap-3 pt-2">
          <Button variant="secondary" type="button" onClick={onClose}>Cancel</Button>
          <Button type="submit" isLoading={isLoading}>{isEdit ? 'Save Changes' : 'Create Shop'}</Button>
        </div>
      </form>
    </Modal>
  );
};

export default ShopForm;
