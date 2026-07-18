// pages/Products/ProductsPage.jsx — FULL IMPLEMENTATION
import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { PlusCircle, Package } from 'lucide-react';

import DashboardLayout from '../../components/Layout/DashboardLayout';
import Card from '../../components/Card/Card';
import Button from '../../components/Button/Button';
import SearchBar from '../../components/SearchBar/SearchBar';
import Pagination from '../../components/Pagination/Pagination';
import ProductTable from '../../features/products/ProductTable';
import ProductForm from '../../features/products/ProductForm';
import ConfirmDialog from '../../components/Modal/ConfirmDialog';

import { fetchProducts, deleteProduct, selectAllProducts, selectProductsLoading } from '../../redux/slices/productsSlice';
import { addToast } from '../../redux/slices/uiSlice';
import useDebounce from '../../hooks/useDebounce';
import usePagination from '../../hooks/usePagination';
import usePermissions from '../../hooks/usePermissions';

const ProductsPage = () => {
  const dispatch   = useDispatch();
  const products   = useSelector(selectAllProducts);
  const isLoading  = useSelector(selectProductsLoading);
  const { canCreateProduct } = usePermissions();

  const [search, setSearch]         = useState('');
  const [formOpen, setFormOpen]     = useState(false);
  const [editProduct, setEditProduct] = useState(null);
  const [deleteDialog, setDeleteDialog] = useState({ isOpen: false, product: null });
  const debouncedSearch = useDebounce(search, 300);

  useEffect(() => { dispatch(fetchProducts()); }, [dispatch]);

  const filtered = products.filter((p) => {
    const q = debouncedSearch.toLowerCase();
    return p.name?.toLowerCase().includes(q) || p.category?.toLowerCase().includes(q);
  });

  const pagination = usePagination(filtered, 10);

  const handleEdit  = (p) => { setEditProduct(p); setFormOpen(true); };
  const handleClose = ()  => { setFormOpen(false); setEditProduct(null); };

  const handleDelete = (product) => {
    setDeleteDialog({ isOpen: true, product });
  };

  const confirmDelete = () => {
    dispatch(deleteProduct(deleteDialog.product.id)).then((result) => {
      if (deleteProduct.fulfilled.match(result)) {
        dispatch(addToast({ message: 'Product deleted successfully', type: 'success' }));
      } else {
        dispatch(addToast({ message: result.payload || 'Failed to delete product', type: 'error' }));
      }
      setDeleteDialog({ isOpen: false, product: null });
    });
  };

  return (
    <DashboardLayout title="Products">
      <div className="space-y-6">
        <div className="page-header">
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <Package size={20} className="text-primary-500" />
              <h1 className="page-title">Products</h1>
            </div>
            <p className="page-subtitle">{products.length} products in catalog</p>
          </div>
          {canCreateProduct && (
            <Button variant="primary" leftIcon={<PlusCircle size={16} />}
              onClick={() => { setEditProduct(null); setFormOpen(true); }} id="create-product-btn">
              Add Product
            </Button>
          )}
        </div>

        <Card>
          <Card.Header>
            <SearchBar value={search} onChange={(v) => { setSearch(v); pagination.reset(); }}
              placeholder="Search by name or category…" className="w-full max-w-xs" />
            <span className="text-sm text-surface-400">{filtered.length} result{filtered.length !== 1 ? 's' : ''}</span>
          </Card.Header>
          <ProductTable products={pagination.paginatedItems} isLoading={isLoading} onEdit={handleEdit} onDelete={handleDelete} />
          <div className="px-4 border-t border-surface-100"><Pagination {...pagination} /></div>
        </Card>
      </div>
      <ProductForm isOpen={formOpen} onClose={handleClose} editProduct={editProduct} />
      <ConfirmDialog
        isOpen={deleteDialog.isOpen}
        onClose={() => setDeleteDialog({ isOpen: false, product: null })}
        onConfirm={confirmDelete}
        title="Delete Product?"
        description={`Are you sure you want to delete "${deleteDialog.product?.name}"? This will deactivate the product.`}
        confirmLabel="Delete"
        variant="danger"
      />
    </DashboardLayout>
  );
};

export default ProductsPage;
