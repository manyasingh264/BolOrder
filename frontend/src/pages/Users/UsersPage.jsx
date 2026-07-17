// pages/Users/UsersPage.jsx — FULL IMPLEMENTATION
import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { UserPlus, Users } from 'lucide-react';

import DashboardLayout from '../../components/Layout/DashboardLayout';
import Card from '../../components/Card/Card';
import Button from '../../components/Button/Button';
import SearchBar from '../../components/SearchBar/SearchBar';
import Pagination from '../../components/Pagination/Pagination';
import UserTable from '../../features/users/UserTable';
import UserForm from '../../features/users/UserForm';

import { fetchUsers, deleteUser, selectAllUsers, selectUsersLoading, setSelectedUser } from '../../redux/slices/usersSlice';
import { addToast } from '../../redux/slices/uiSlice';
import useDebounce from '../../hooks/useDebounce';
import usePagination from '../../hooks/usePagination';

const UsersPage = () => {
  const dispatch   = useDispatch();
  const users      = useSelector(selectAllUsers);
  const isLoading  = useSelector(selectUsersLoading);

  const [search, setSearch]     = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [editUser, setEditUser] = useState(null);

  const debouncedSearch = useDebounce(search, 300);

  useEffect(() => { dispatch(fetchUsers()); }, [dispatch]);

  // Client-side filter
  const filtered = users.filter((u) => {
    const q = debouncedSearch.toLowerCase();
    return u.name?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q) || u.role?.toLowerCase().includes(q);
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
    if (window.confirm(`Are you sure you want to delete ${user.name}? This will deactivate their account.`)) {
      dispatch(deleteUser(user.id)).then((result) => {
        if (deleteUser.fulfilled.match(result)) {
          dispatch(addToast({ message: 'User deleted successfully', type: 'success' }));
        } else {
          dispatch(addToast({ message: result.payload || 'Failed to delete user', type: 'error' }));
        }
      });
    }
  };

  return (
    <DashboardLayout title="Users">
      <div className="space-y-6">
        {/* Page Header */}
        <div className="page-header">
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <Users size={20} className="text-primary-500" />
              <h1 className="page-title">Users</h1>
            </div>
            <p className="page-subtitle">{users.length} team members total</p>
          </div>
          <Button variant="primary" leftIcon={<UserPlus size={16} />} onClick={handleCreate} id="create-user-btn">
            Add User
          </Button>
        </div>

        {/* Table Card */}
        <Card>
          <Card.Header>
            <SearchBar
              value={search}
              onChange={(v) => { setSearch(v); pagination.reset(); }}
              placeholder="Search by name, email or role…"
              className="w-full max-w-xs"
            />
            <span className="text-sm text-surface-400">{filtered.length} result{filtered.length !== 1 ? 's' : ''}</span>
          </Card.Header>

          <UserTable users={pagination.paginatedItems} isLoading={isLoading} onEdit={handleEdit} onDelete={handleDelete} />

          <div className="px-4 border-t border-surface-100">
            <Pagination {...pagination} />
          </div>
        </Card>
      </div>

      <UserForm isOpen={formOpen} onClose={handleClose} editUser={editUser} />
    </DashboardLayout>
  );
};

export default UsersPage;
