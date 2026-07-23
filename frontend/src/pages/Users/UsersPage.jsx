// pages/Users/UsersPage.jsx — Salesman management (ADMIN only)
//
// Shows SALESMAN role users only — admins/supervisors are not visible here.
// Clicking any row navigates to SalesmanDetailPage (/admin/salesmen/:id).

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { UserPlus, Users, TrendingUp } from 'lucide-react';

import DashboardLayout from '../../components/Layout/DashboardLayout';
import Card from '../../components/Card/Card';
import Button from '../../components/Button/Button';
import SearchBar from '../../components/SearchBar/SearchBar';
import Pagination from '../../components/Pagination/Pagination';
import UserTable from '../../features/users/UserTable';
import UserForm from '../../features/users/UserForm';
import ConfirmDialog from '../../components/Modal/ConfirmDialog';

import {
  fetchUsers, deleteUser,
  selectAllUsers, selectUsersLoading, setSelectedUser,
} from '../../redux/slices/usersSlice';
import { addToast } from '../../redux/slices/uiSlice';
import useDebounce from '../../hooks/useDebounce';
import usePagination from '../../hooks/usePagination';

const UsersPage = () => {
  const dispatch  = useDispatch();
  const navigate  = useNavigate();
  const allUsers  = useSelector(selectAllUsers);
  const isLoading = useSelector(selectUsersLoading);

  const [search, setSearch]     = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [editUser, setEditUser] = useState(null);
  const [deleteDialog, setDeleteDialog] = useState({ isOpen: false, user: null });

  const debouncedSearch = useDebounce(search, 300);

  useEffect(() => { dispatch(fetchUsers()); }, [dispatch]);

  // ── Show SALESMAN role only ───────────────────────────────────────────────
  const salesmen = allUsers.filter((u) => u.role === 'SALESMAN');

  // Client-side search over salesmen only
  const filtered = salesmen.filter((u) => {
    const q = debouncedSearch.toLowerCase();
    return (
      u.name?.toLowerCase().includes(q) ||
      u.email?.toLowerCase().includes(q) ||
      u.phone?.toLowerCase().includes(q)
    );
  });

  const pagination = usePagination(filtered, 10);

  const handleEdit = (user) => {
    setEditUser(user);
    dispatch(setSelectedUser(user));
    setFormOpen(true);
  };

  const handleCreate = () => {
    setEditUser(null);
    setFormOpen(true);
  };

  const handleClose = () => {
    setFormOpen(false);
    setEditUser(null);
  };

  const handleDelete = (user) => {
    setDeleteDialog({ isOpen: true, user });
  };

  const confirmDelete = () => {
    dispatch(deleteUser(deleteDialog.user.id)).then((result) => {
      if (deleteUser.fulfilled.match(result)) {
        dispatch(addToast({ message: 'Salesman deleted successfully', type: 'success' }));
      } else {
        dispatch(addToast({ message: result.payload || 'Failed to delete salesman', type: 'error' }));
      }
      setDeleteDialog({ isOpen: false, user: null });
    });
  };

  const activeCount   = salesmen.filter((u) => u.isActive).length;
  const inactiveCount = salesmen.length - activeCount;

  return (
    <DashboardLayout title="Salesmen">
      <div className="space-y-6">

        {/* ── Page Header ──────────────────────────────────────────────────── */}
        <div className="page-header">
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <Users size={20} className="text-primary-500" />
              <h1 className="page-title">Salesmen</h1>
            </div>
            <p className="page-subtitle">
              {salesmen.length} salesmen total · {activeCount} active · {inactiveCount} inactive
            </p>
          </div>
          <Button
            variant="primary"
            leftIcon={<UserPlus size={16} />}
            onClick={handleCreate}
            id="create-user-btn"
          >
            Add Salesman
          </Button>
        </div>

        {/* ── Info tip ─────────────────────────────────────────────────────── */}
        <div className="flex items-center gap-2 px-4 py-2.5 bg-primary-50 border border-primary-100 rounded-xl text-xs text-primary-700">
          <TrendingUp size={13} className="shrink-0" />
          Click on any salesman to view their full performance report
        </div>

        {/* ── Table Card ───────────────────────────────────────────────────── */}
        <Card>
          <Card.Header>
            <SearchBar
              value={search}
              onChange={(v) => { setSearch(v); pagination.reset(); }}
              placeholder="Search by name, email or phone…"
              className="w-full max-w-xs"
            />
            <span className="text-sm text-surface-400">
              {filtered.length} result{filtered.length !== 1 ? 's' : ''}
            </span>
          </Card.Header>

          <UserTable
            users={pagination.paginatedItems}
            isLoading={isLoading}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />

          <div className="px-4 border-t border-surface-100">
            <Pagination {...pagination} />
          </div>
        </Card>
      </div>

      <UserForm isOpen={formOpen} onClose={handleClose} editUser={editUser} />

      <ConfirmDialog
        isOpen={deleteDialog.isOpen}
        onClose={() => setDeleteDialog({ isOpen: false, user: null })}
        onConfirm={confirmDelete}
        title="Delete Salesman?"
        description={`Are you sure you want to delete "${deleteDialog.user?.name}"? This will deactivate their account.`}
        confirmLabel="Delete"
        variant="danger"
      />
    </DashboardLayout>
  );
};

export default UsersPage;
