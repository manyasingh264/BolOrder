// features/products/ProductForm.jsx
import { useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useDispatch, useSelector } from 'react-redux';
import { createProduct, updateProduct, selectProductsLoading } from '../../redux/slices/productsSlice';
import { addToast } from '../../redux/slices/uiSlice';
import Input from '../../components/Input/Input';
import Button from '../../components/Button/Button';
import Modal from '../../components/Modal/Modal';
import { Plus, X } from 'lucide-react';

const variantSchema = z.object({
  size:  z.string().optional(),
  unit:  z.string().min(1, 'Unit is required'),
  sku:   z.string().optional(),
  price: z.string().min(1, 'Price is required'),
});

const schema = z.object({
  name:        z.string().min(2, 'Product name is required'),
  description: z.string().optional(),
  category:    z.string().optional(),
  variants:    z.array(variantSchema).optional(),
  isActive:    z.boolean().optional(),
});

const ProductForm = ({ isOpen, onClose, editProduct }) => {
  const dispatch  = useDispatch();
  const isLoading = useSelector(selectProductsLoading);
  const isEdit    = !!editProduct;

  const { register, handleSubmit, reset, control, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      name: '',
      description: '',
      category: '',
      variants: [{ size: '', unit: 'g', sku: '', price: '' }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'variants',
  });

  useEffect(() => {
    if (isOpen) {
      if (editProduct) {
        reset({
          name: editProduct.name,
          description: editProduct.description,
          category: editProduct.category,
          variants: editProduct.variants?.length > 0 ? editProduct.variants : [{ size: '', unit: 'g', sku: '', price: '' }],
          isActive: editProduct.isActive ?? true,
        });
      } else {
        reset({
          name: '',
          description: '',
          category: '',
          variants: [{ size: '', unit: 'g', sku: '', price: '' }],
          isActive: true,
        });
      }
    }
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
      <div className="max-h-[70vh] overflow-y-auto pr-2">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input label="Product Name" required placeholder="e.g. Aloo Bhujia" error={errors.name?.message} {...register('name')} />
          <Input label="Category" placeholder="e.g. Bhujia, Mixture, Namkeen" {...register('category')} />
          <div>
            <label className="label-base">Description</label>
            <textarea className="input-base" rows={3} placeholder="Optional product description" {...register('description')} />
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="label-base">Variants</label>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                leftIcon={<Plus size={14} />}
                onClick={() => append({ size: '', unit: 'g', sku: '', price: '' })}
              >
                Add Variant
              </Button>
            </div>

            {fields.map((field, index) => (
              <div key={field.id} className="p-4 border border-surface-200 rounded-lg space-y-3 relative">
                {fields.length > 1 && (
                  <button
                    type="button"
                    onClick={() => remove(index)}
                    className="absolute top-2 right-2 text-surface-400 hover:text-red-500"
                  >
                    <X size={16} />
                  </button>
                )}
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="text-xs font-medium text-surface-700 mb-1 block">Size</label>
                    <input
                      {...register(`variants.${index}.size`)}
                      placeholder="e.g. 200"
                      className="w-full px-3 py-2 border border-surface-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-surface-700 mb-1 block">Unit</label>
                    <select
                      {...register(`variants.${index}.unit`)}
                      className="w-full px-3 py-2 border border-surface-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
                    >
                      <option value="g">Grams (g)</option>
                      <option value="kg">Kilograms (kg)</option>
                      <option value="ml">Milliliters (ml)</option>
                      <option value="l">Liters (l)</option>
                      <option value="pcs">Pieces (pcs)</option>
                      <option value="packet">Packet</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-surface-700 mb-1 block">SKU (Optional)</label>
                    <input
                      {...register(`variants.${index}.sku`)}
                      placeholder="e.g. AB-200G"
                      className="w-full px-3 py-2 border border-surface-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-medium text-surface-700 mb-1 block">Price (₹)</label>
                  <input
                    {...register(`variants.${index}.price`)}
                    type="number"
                    step="0.01"
                    placeholder="e.g. 45.00"
                    className="w-full px-3 py-2 border border-surface-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
                  />
                </div>
              </div>
            ))}
          </div>

          {isEdit && (
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isActive"
                {...register('isActive')}
                className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
              />
              <label htmlFor="isActive" className="text-sm font-medium text-surface-700">
                Active Status
              </label>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" type="button" onClick={onClose}>Cancel</Button>
            <Button type="submit" isLoading={isLoading}>{isEdit ? 'Save Changes' : 'Create Product'}</Button>
          </div>
        </form>
      </div>
    </Modal>
  );
};

export default ProductForm;
