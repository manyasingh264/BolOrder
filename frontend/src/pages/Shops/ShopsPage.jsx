// pages/Shops/ShopsPage.jsx — FULL IMPLEMENTATION
//
// Display rules (enforced by the backend):
//   SALESMAN      → sees shops that have at least one order (any salesman)
//   ADMIN/SUPERVISOR → sees all registered shops
//
// No frontend filtering needed — the backend GET /shops returns the right
// set per role. This keeps the component clean and simple.

import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { PlusCircle, Store, Info } from 'lucide-react';

import DashboardLayout from '../../components/Layout/DashboardLayout';
import Card from '../../components/Card/Card';
import Button from '../../components/Button/Button';
import SearchBar from '../../components/SearchBar/SearchBar';
import Pagination from '../../components/Pagination/Pagination';
import ShopTable from '../../features/shops/ShopTable';
import ShopForm from '../../features/shops/ShopForm';
import ConfirmDialog from '../../components/Modal/ConfirmDialog';

import { fetchShops, deleteShop, selectAllShops, selectShopsLoading } from '../../redux/slices/shopsSlice';
import { selectUserRole } from '../../redux/slices/authSlice';
import { addToast } from '../../redux/slices/uiSlice';
import useDebounce from '../../hooks/useDebounce';
import usePagination from '../../hooks/usePagination';
import usePermissions from '../../hooks/usePermissions';

const ShopsPage = () => {
  const dispatch  = useDispatch();
  const shops     = useSelector(selectAllShops);
  const isLoading = useSelector(selectShopsLoading);
  const userRole  = useSelector(selectUserRole);
  const { canCreateShop } = usePermissions();

  const [search, setSearch]     = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [editShop, setEditShop] = useState(null);
  const [deleteDialog, setDeleteDialog] = useState({ isOpen: false, shop: null });

  const debouncedSearch = useDebounce(search, 300);
  const isSalesman = userRole === 'SALESMAN';

  useEffect(() => { dispatch(fetchShops()); }, [dispatch]);

  const filtered = shops.filter((s) => {
    const q = debouncedSearch.toLowerCase();
    return (
      s.shopName?.toLowerCase().includes(q) ||
      s.ownerName?.toLowerCase().includes(q) ||
      s.address?.toLowerCase().includes(q)
    );
  });

  const pagination = usePagination(filtered, 10);

  const handleEdit  = (shop) => { setEditShop(shop); setFormOpen(true); };
  const handleClose = () => { setFormOpen(false); setEditShop(null); };
  const handleDelete = (shop) => setDeleteDialog({ isOpen: true, shop });

  const confirmDelete = () => {
    dispatch(deleteShop(deleteDialog.shop.id)).then((result) => {
      if (deleteShop.fulfilled.match(result)) {
        dispatch(addToast({ message: 'Shop deleted successfully', type: 'success' }));
      } else {
        dispatch(addToast({ message: result.payload || 'Failed to delete shop', type: 'error' }));
      }
      setDeleteDialog({ isOpen: false, shop: null });
    });
  };

  // Subtitle is context-aware per role
  const subtitle = isSalesman
    ? shops.length === 0
      ? 'No orders placed yet — shops will appear here once orders are recorded'
      : `${shops.length} shop${shops.length !== 1 ? 's' : ''} with order history`
    : `${shops.length} shops registered`;

  return (
    <DashboardLayout title="Shops">
      <div className="space-y-6">
        <div className="page-header">
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <Store size={20} className="text-primary-500" />
              <h1 className="page-title">Shops</h1>
            </div>
            <p className="page-subtitle">{subtitle}</p>
          </div>
          {canCreateShop && (
            <Button
              variant="primary"
              leftIcon={<PlusCircle size={16} />}
              onClick={() => { setEditShop(null); setFormOpen(true); }}
              id="create-shop-btn"
            >
              Add Shop
            </Button>
          )}
        </div>

        {/* Empty state banner — only for salesmen with no order history yet */}
        {isSalesman && shops.length === 0 && !isLoading && (
          <div className="flex items-start gap-3 p-4 bg-blue-50 border border-blue-100 rounded-xl text-sm text-blue-700">
            <Info size={18} className="mt-0.5 shrink-0 text-blue-400" />
            <span>
              No shops with orders yet. Once an order is placed for any shop — by voice or manual entry — it will appear here.
            </span>
          </div>
        )}

        <Card>
          <Card.Header>
            <SearchBar
              value={search}
              onChange={(v) => { setSearch(v); pagination.reset(); }}
              placeholder="Search by name, area, owner…"
              className="w-full max-w-xs"
            />
            <span className="text-sm text-surface-400">
              {filtered.length} result{filtered.length !== 1 ? 's' : ''}
            </span>
          </Card.Header>
          <ShopTable
            shops={pagination.paginatedItems}
            isLoading={isLoading}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
          <div className="px-4 border-t border-surface-100">
            <Pagination {...pagination} />
          </div>
        </Card>
      </div>

      <ShopForm isOpen={formOpen} onClose={handleClose} editShop={editShop} />

      <ConfirmDialog
        isOpen={deleteDialog.isOpen}
        onClose={() => setDeleteDialog({ isOpen: false, shop: null })}
        onConfirm={confirmDelete}
        title="Delete Shop?"
        description={`Are you sure you want to delete "${deleteDialog.shop?.shopName}"? This action cannot be undone.`}
        confirmLabel="Delete"
        variant="danger"
      />
    </DashboardLayout>
  );
};

export default ShopsPage;
