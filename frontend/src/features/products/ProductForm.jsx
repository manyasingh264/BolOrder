// features/products/ProductForm.jsx
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useDispatch, useSelector } from 'react-redux';
import { createProduct, updateProduct, selectProductsLoading } from '../../redux/slices/productsSlice';
import { addToast } from '../../redux/slices/uiSlice';
import Input from '../../components/Input/Input';
import Button from '../../components/Button/Button';
import Modal from '../../components/Modal/Modal';

const schema = z.object({
  name:        z.string().min(2, 'Product name is required'),
  description: z.string().optional(),
  category:    z.string().optional(),
});

const ProductForm = ({ isOpen, onClose, editProduct }) => {
  const dispatch  = useDispatch();
  const isLoading = useSelector(selectProductsLoading);
  const isEdit    = !!editProduct;

  const { register, handleSubmit, reset, formState: { errors } } = useForm({ resolver: zodResolver(schema) });

  useEffect(() => {
    if (isOpen) reset(editProduct ? { name: editProduct.name, description: editProduct.description, category: editProduct.category } : {});
  }, [isOpen, editProduct, reset]);

  const onSubmit = async (data) => {
    const action  = isEdit ? updateProduct({ id: editProduct.id, data }) : createProduct(data);
    const result  = await dispatch(action);
    const creator = isEdit ? updateProduct : createProduct;
    if (creator.fulfilled.match(result)) {
      dispatch(addToast({ message: `Product ${isEdit ? 'updated' : 'created'}`, type: 'success' }));
      onClose();
    } else {
      dispatch(addToast({ message: result.payload || 'Error', type: 'error' }));
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={isEdit ? 'Edit Product' : 'Add New Product'}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input label="Product Name" required placeholder="e.g. Aloo Bhujia" error={errors.name?.message} {...register('name')} />
        <Input label="Category" placeholder="e.g. Bhujia, Mixture, Namkeen" {...register('category')} />
        <div>
          <label className="label-base">Description</label>
          <textarea className="input-base" rows={3} placeholder="Optional product description" {...register('description')} />
        </div>
        {isEdit && (
          <p className="text-xs text-surface-400 bg-surface-50 p-3 rounded-lg">
            💡 To manage variants and aliases for this product, use the detail view after saving.
          </p>
        )}
        <div className="flex justify-end gap-3 pt-2">
          <Button variant="secondary" type="button" onClick={onClose}>Cancel</Button>
          <Button type="submit" isLoading={isLoading}>{isEdit ? 'Save Changes' : 'Create Product'}</Button>
        </div>
      </form>
    </Modal>
  );
};

export default ProductForm;
