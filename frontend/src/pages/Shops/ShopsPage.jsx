// pages/Shops/ShopsPage.jsx — FULL IMPLEMENTATION
import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { PlusCircle, Store } from 'lucide-react';

import DashboardLayout from '../../components/Layout/DashboardLayout';
import Card from '../../components/Card/Card';
import Button from '../../components/Button/Button';
import SearchBar from '../../components/SearchBar/SearchBar';
import Pagination from '../../components/Pagination/Pagination';
import ShopTable from '../../features/shops/ShopTable';
import ShopForm from '../../features/shops/ShopForm';

import { fetchShops, selectAllShops, selectShopsLoading } from '../../redux/slices/shopsSlice';
import useDebounce from '../../hooks/useDebounce';
import usePagination from '../../hooks/usePagination';
import usePermissions from '../../hooks/usePermissions';

const ShopsPage = () => {
  const dispatch    = useDispatch();
  const shops       = useSelector(selectAllShops);
  const isLoading   = useSelector(selectShopsLoading);
  const { canCreateShop } = usePermissions();

  const [search, setSearch]     = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [editShop, setEditShop] = useState(null);

  const debouncedSearch = useDebounce(search, 300);

  useEffect(() => { dispatch(fetchShops()); }, [dispatch]);

  const filtered = shops.filter((s) => {
    const q = debouncedSearch.toLowerCase();
    return s.name?.toLowerCase().includes(q) || s.area?.toLowerCase().includes(q) || s.ownerName?.toLowerCase().includes(q);
  });

  const pagination = usePagination(filtered, 10);

  const handleEdit = (shop) => { setEditShop(shop); setFormOpen(true); };
  const handleClose = () => { setFormOpen(false); setEditShop(null); };

  return (
    <DashboardLayout title="Shops">
      <div className="space-y-6">
        <div className="page-header">
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <Store size={20} className="text-primary-500" />
              <h1 className="page-title">Shops</h1>
            </div>
            <p className="page-subtitle">{shops.length} shops registered</p>
          </div>
          {canCreateShop && (
            <Button variant="primary" leftIcon={<PlusCircle size={16} />} onClick={() => { setEditShop(null); setFormOpen(true); }} id="create-shop-btn">
              Add Shop
            </Button>
          )}
        </div>

        <Card>
          <Card.Header>
            <SearchBar value={search} onChange={(v) => { setSearch(v); pagination.reset(); }}
              placeholder="Search by name, area, owner…" className="w-full max-w-xs" />
            <span className="text-sm text-surface-400">{filtered.length} result{filtered.length !== 1 ? 's' : ''}</span>
          </Card.Header>
          <ShopTable shops={pagination.paginatedItems} isLoading={isLoading} onEdit={handleEdit} />
          <div className="px-4 border-t border-surface-100">
            <Pagination {...pagination} />
          </div>
        </Card>
      </div>
      <ShopForm isOpen={formOpen} onClose={handleClose} editShop={editShop} />
    </DashboardLayout>
  );
};

export default ShopsPage;
