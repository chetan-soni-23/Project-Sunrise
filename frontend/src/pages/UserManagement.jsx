import React, { useState, useEffect } from 'react';
import api from '../services/api';
import {
  Users, Plus, Edit2, Trash2, Lock, Search, X, User, Mail,
  Briefcase, Building2, Shield, Eye, EyeOff
} from 'lucide-react';
import toast from 'react-hot-toast';

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordUserId, setPasswordUserId] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    name: '', email: '', password: '',
    role: 'employee', designation: '', salaryBand: 'B', department: '', managerId: ''
  });

  const [newPassword, setNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const designations = [
    'Junior Executive', 'Executive', 'Senior Executive',
    'Manager', 'Senior Manager', 'Director', 'VP', 'SVP'
  ];
  const salaryBands = ['A', 'B', 'C', 'D', 'E', 'F'];

  useEffect(() => { fetchUsers(); }, []);

  const fetchUsers = async () => {
    try {
      const response = await api.get('/admin/users');
      setUsers(response.data.users);
    } catch (error) {
      console.error('Failed to fetch users:', error);
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = users.filter(u =>
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase()) ||
    u.role.toLowerCase().includes(search.toLowerCase()) ||
    (u.department && u.department.toLowerCase().includes(search.toLowerCase()))
  );

  const openCreateModal = () => {
    setEditingUser(null);
    setFormData({
      name: '', email: '', password: '',
      role: 'employee', designation: '', salaryBand: 'B', department: '', managerId: ''
    });
    setShowModal(true);
  };

  const openEditModal = (user) => {
    setEditingUser(user);
    setFormData({
      name: user.name,
      email: user.email,
      password: '',
      role: user.role,
      designation: user.designation,
      salaryBand: user.salary_band,
      department: user.department || '',
      managerId: user.manager_id || ''
    });
    setShowModal(true);
  };

  const openPasswordModal = (userId) => {
    setPasswordUserId(userId);
    setNewPassword('');
    setShowPassword(false);
    setShowPasswordModal(true);
  };

  const handleFormChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name.trim() || !formData.email.trim() || !formData.designation) {
      toast.error('Name, email, and designation are required');
      return;
    }

    if (!editingUser && !formData.password) {
      toast.error('Password is required for new users');
      return;
    }

    setSubmitting(true);
    try {
      if (editingUser) {
        const { password, ...updateData } = formData;
        await api.put(`/admin/users/${editingUser.id}`, updateData);
        toast.success('User updated successfully');
      } else {
        await api.post('/admin/users', formData);
        toast.success('User created successfully');
      }
      setShowModal(false);
      fetchUsers();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Operation failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    setSubmitting(true);
    try {
      await api.put(`/admin/users/${passwordUserId}/reset-password`, { newPassword });
      toast.success('Password reset successfully');
      setShowPasswordModal(false);
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to reset password');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (userId, userName) => {
    if (!confirm(`Are you sure you want to delete '${userName}'? This cannot be undone.`)) {
      return;
    }

    try {
      await api.delete(`/admin/users/${userId}`);
      toast.success(`User '${userName}' deleted`);
      fetchUsers();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to delete user');
    }
  };

  const roleColors = {
    employee: 'bg-secondary-100 text-secondary-700',
    approver: 'bg-blue-100 text-blue-700',
    admin: 'bg-purple-100 text-purple-700'
  };

  const roleCounts = {
    all: users.length,
    employee: users.filter(u => u.role === 'employee').length,
    approver: users.filter(u => u.role === 'approver').length,
    admin: users.filter(u => u.role === 'admin').length
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Users className="h-8 w-8 text-primary-600" />
          <h1 className="text-3xl font-bold text-primary-800">User Management</h1>
          <span className="bg-primary-100 text-primary-800 px-3 py-1 rounded-full text-sm font-medium">
            {users.length} users
          </span>
        </div>
        <button
          onClick={openCreateModal}
          className="flex items-center space-x-2 bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors"
        >
          <Plus className="h-5 w-5" />
          <span>Add User</span>
        </button>
      </div>

      {/* Role summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {['all', 'employee', 'approver', 'admin'].map(role => (
          <div key={role} className="card text-center py-3">
            <p className="text-2xl font-bold text-primary-800">{roleCounts[role]}</p>
            <p className="text-xs text-secondary-500 capitalize">{role === 'all' ? 'Total' : role + 's'}</p>
          </div>
        ))}
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-secondary-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name, email, role, or department..."
          className="w-full pl-10 pr-4 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
        />
      </div>

      {/* Users Table */}
      {filteredUsers.length > 0 ? (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-secondary-50">
                  <th className="text-left px-4 py-3 text-xs font-medium text-secondary-500 uppercase">User</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-secondary-500 uppercase">Role</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-secondary-500 uppercase">Designation</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-secondary-500 uppercase">Dept</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-secondary-500 uppercase">Manager</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-secondary-500 uppercase">Band</th>
                  <th className="text-right px-4 py-3 text-xs font-medium text-secondary-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-secondary-100">
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-secondary-50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center space-x-3">
                        <div className="w-9 h-9 bg-primary-100 rounded-full flex items-center justify-center">
                          <User className="h-4 w-4 text-primary-600" />
                        </div>
                        <div>
                          <p className="font-medium text-primary-800 text-sm">{user.name}</p>
                          <p className="text-xs text-secondary-500">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${roleColors[user.role]}`}>
                        <Shield className="h-3 w-3 mr-1" />
                        {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-secondary-700">{user.designation}</td>
                    <td className="px-4 py-3 text-sm text-secondary-700">{user.department || '—'}</td>
                    <td className="px-4 py-3 text-sm text-secondary-700">{user.manager_name || '—'}</td>
                    <td className="px-4 py-3 text-sm text-secondary-700">Band {user.salary_band}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end space-x-1">
                        <button
                          onClick={() => openEditModal(user)}
                          className="p-1.5 text-primary-600 hover:text-primary-700 hover:bg-primary-50 rounded-lg transition-colors"
                          title="Edit user"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => openPasswordModal(user.id)}
                          className="p-1.5 text-orange-600 hover:text-orange-700 hover:bg-orange-50 rounded-lg transition-colors"
                          title="Reset password"
                        >
                          <Lock className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(user.id, user.name)}
                          className="p-1.5 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete user"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="card text-center py-12">
          <Users className="h-12 w-12 text-secondary-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-secondary-600">
            {search ? 'No users match your search' : 'No users found'}
          </h3>
        </div>
      )}

      {/* Create/Edit User Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-secondary-200">
              <h2 className="text-lg font-semibold text-primary-800">
                {editingUser ? 'Edit User' : 'Create New User'}
              </h2>
              <button onClick={() => setShowModal(false)} className="text-secondary-400 hover:text-secondary-600">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-1">Full Name *</label>
                <input
                  type="text" name="name" value={formData.name} onChange={handleFormChange}
                  className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-1">Email *</label>
                <input
                  type="email" name="email" value={formData.email} onChange={handleFormChange}
                  className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  required
                />
              </div>
              {!editingUser && (
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-1">Password *</label>
                  <input
                    type="password" name="password" value={formData.password} onChange={handleFormChange}
                    className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    minLength={6} required
                  />
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-1">Role *</label>
                  <select name="role" value={formData.role} onChange={handleFormChange}
                    className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500">
                    <option value="employee">Employee</option>
                    <option value="approver">Approver</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-1">Salary Band *</label>
                  <select name="salaryBand" value={formData.salaryBand} onChange={handleFormChange}
                    className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500">
                    {salaryBands.map(b => <option key={b} value={b}>Band {b}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-1">Designation *</label>
                <select name="designation" value={formData.designation} onChange={handleFormChange}
                  className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500" required>
                  <option value="">Select designation</option>
                  {designations.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-1">Department</label>
                <input
                  type="text" name="department" value={formData.department} onChange={handleFormChange}
                  placeholder="e.g., Engineering, Marketing"
                  className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-1">Manager</label>
                <select
                  name="managerId" value={formData.managerId} onChange={handleFormChange}
                  className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="">No Manager (Department Head)</option>
                  {users.filter(u => u.id !== editingUser?.id).map(u => (
                    <option key={u.id} value={u.id}>{u.name} ({u.role})</option>
                  ))}
                </select>
                <p className="mt-1 text-xs text-secondary-500">Leave empty to auto-assign to department approver</p>
              </div>
              <div className="flex items-center space-x-3 pt-2">
                <button type="submit" disabled={submitting}
                  className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50">
                  {submitting ? 'Saving...' : editingUser ? 'Update User' : 'Create User'}
                </button>
                <button type="button" onClick={() => setShowModal(false)}
                  className="bg-secondary-200 text-secondary-700 px-4 py-2 rounded-lg hover:bg-secondary-300 transition-colors">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reset Password Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-4 border-b border-secondary-200">
              <h2 className="text-lg font-semibold text-primary-800">Reset Password</h2>
              <button onClick={() => setShowPasswordModal(false)} className="text-secondary-400 hover:text-secondary-600">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleResetPassword} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-1">New Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full px-3 py-2 pr-10 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    minLength={6} required
                    placeholder="Minimum 6 characters"
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-secondary-400 hover:text-secondary-600">
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <button type="submit" disabled={submitting}
                  className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 flex items-center space-x-2">
                  <Lock className="h-4 w-4" />
                  <span>{submitting ? 'Resetting...' : 'Reset Password'}</span>
                </button>
                <button type="button" onClick={() => setShowPasswordModal(false)}
                  className="bg-secondary-200 text-secondary-700 px-4 py-2 rounded-lg hover:bg-secondary-300 transition-colors">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;
