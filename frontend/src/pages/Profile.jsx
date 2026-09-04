import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { User, Mail, Briefcase, Building2, Shield, Calendar, Lock, Save, X, Edit2 } from 'lucide-react';
import toast from 'react-hot-toast';

const Profile = () => {
  const { user, setUser } = useAuth();
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    designation: user?.designation || '',
    department: user?.department || ''
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [changingPassword, setChangingPassword] = useState(false);

  const designations = [
    'Junior Executive', 'Executive', 'Senior Executive',
    'Manager', 'Senior Manager', 'Director', 'VP', 'SVP',
    'CEO/Founder'
  ];

  const handleProfileChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSaveProfile = async () => {
    if (!formData.name.trim()) {
      toast.error('Name is required');
      return;
    }
    if (!formData.email.trim()) {
      toast.error('Email is required');
      return;
    }

    setSaving(true);
    try {
      const response = await api.put('/auth/profile', formData);
      setUser(response.data.user);
      setEditing(false);
      toast.success('Profile updated successfully');
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleCancelEdit = () => {
    setFormData({
      name: user?.name || '',
      email: user?.email || '',
      designation: user?.designation || '',
      department: user?.department || ''
    });
    setEditing(false);
  };

  const handlePasswordChange = (e) => {
    setPasswordData({ ...passwordData, [e.target.name]: e.target.value });
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();

    if (!passwordData.currentPassword || !passwordData.newPassword) {
      toast.error('All fields are required');
      return;
    }
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }
    if (passwordData.newPassword.length < 6) {
      toast.error('New password must be at least 6 characters');
      return;
    }

    setChangingPassword(true);
    try {
      await api.put('/auth/profile/password', {
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      });
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      toast.success('Password changed successfully');
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to change password');
    } finally {
      setChangingPassword(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: 'numeric', month: 'long', year: 'numeric'
    });
  };

  const roleColors = {
    employee: 'bg-secondary-100 text-secondary-700',
    approver: 'bg-blue-100 text-blue-700',
    admin: 'bg-purple-100 text-purple-700'
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-3">
        <User className="h-8 w-8 text-primary-600" />
        <h1 className="text-3xl font-bold text-primary-800">My Profile</h1>
      </div>

      {/* Profile Details Card */}
      <div className="card">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-primary-800">Profile Details</h2>
          {!editing ? (
            <button
              onClick={() => setEditing(true)}
              className="flex items-center space-x-1 text-primary-600 hover:text-primary-700 transition-colors"
            >
              <Edit2 className="h-4 w-4" />
              <span>Edit</span>
            </button>
          ) : (
            <div className="flex items-center space-x-2">
              <button
                onClick={handleSaveProfile}
                disabled={saving}
                className="flex items-center space-x-1 bg-primary-600 text-white px-3 py-1.5 rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 text-sm"
              >
                <Save className="h-4 w-4" />
                <span>{saving ? 'Saving...' : 'Save'}</span>
              </button>
              <button
                onClick={handleCancelEdit}
                className="flex items-center space-x-1 bg-secondary-200 text-secondary-700 px-3 py-1.5 rounded-lg hover:bg-secondary-300 transition-colors text-sm"
              >
                <X className="h-4 w-4" />
                <span>Cancel</span>
              </button>
            </div>
          )}
        </div>

        <div className="space-y-4">
          {/* Avatar + Name + Role */}
          <div className="flex items-center space-x-4 pb-4 border-b border-secondary-200">
            <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center">
              <User className="h-8 w-8 text-primary-600" />
            </div>
            <div>
              {editing ? (
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleProfileChange}
                  className="text-xl font-bold text-primary-800 bg-secondary-50 border border-secondary-300 rounded-lg px-3 py-1 focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              ) : (
                <h3 className="text-xl font-bold text-primary-800">{user?.name}</h3>
              )}
              <div className="flex items-center space-x-2 mt-1">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${roleColors[user?.role] || roleColors.employee}`}>
                  <Shield className="h-3 w-3 mr-1" />
                  {user?.role?.charAt(0).toUpperCase() + user?.role?.slice(1)}
                </span>
              </div>
            </div>
          </div>

          {/* Email */}
          <div className="flex items-center space-x-3">
            <Mail className="h-5 w-5 text-secondary-400" />
            <div className="flex-1">
              <p className="text-xs text-secondary-500">Email</p>
              {editing ? (
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleProfileChange}
                  className="w-full text-sm text-primary-800 bg-secondary-50 border border-secondary-300 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              ) : (
                <p className="text-sm font-medium text-primary-800">{user?.email}</p>
              )}
            </div>
          </div>

          {/* Designation */}
          <div className="flex items-center space-x-3">
            <Briefcase className="h-5 w-5 text-secondary-400" />
            <div className="flex-1">
              <p className="text-xs text-secondary-500">Designation</p>
              {editing ? (
                <select
                  name="designation"
                  value={formData.designation}
                  onChange={handleProfileChange}
                  className="w-full text-sm text-primary-800 bg-secondary-50 border border-secondary-300 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  {designations.map((d) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              ) : (
                <p className="text-sm font-medium text-primary-800">{user?.designation}</p>
              )}
            </div>
          </div>

          {/* Department */}
          <div className="flex items-center space-x-3">
            <Building2 className="h-5 w-5 text-secondary-400" />
            <div className="flex-1">
              <p className="text-xs text-secondary-500">Department</p>
              {editing ? (
                <input
                  type="text"
                  name="department"
                  value={formData.department}
                  onChange={handleProfileChange}
                  placeholder="e.g., Engineering, Marketing"
                  className="w-full text-sm text-primary-800 bg-secondary-50 border border-secondary-300 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              ) : (
                <p className="text-sm font-medium text-primary-800">{user?.department || '—'}</p>
              )}
            </div>
          </div>

          {/* Salary Band (read-only) */}
          <div className="flex items-center space-x-3">
            <Shield className="h-5 w-5 text-secondary-400" />
            <div className="flex-1">
              <p className="text-xs text-secondary-500">Salary Band</p>
              <p className="text-sm font-medium text-primary-800">Band {user?.salary_band}</p>
            </div>
          </div>

          {/* Member Since */}
          <div className="flex items-center space-x-3">
            <Calendar className="h-5 w-5 text-secondary-400" />
            <div className="flex-1">
              <p className="text-xs text-secondary-500">Member Since</p>
              <p className="text-sm font-medium text-primary-800">{formatDate(user?.created_at)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Change Password Card */}
      <div className="card">
        <h2 className="text-lg font-semibold text-primary-800 mb-4 flex items-center space-x-2">
          <Lock className="h-5 w-5" />
          <span>Change Password</span>
        </h2>

        <form onSubmit={handleChangePassword} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-secondary-700 mb-1">Current Password</label>
            <input
              type="password"
              name="currentPassword"
              value={passwordData.currentPassword}
              onChange={handlePasswordChange}
              className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-secondary-700 mb-1">New Password</label>
            <input
              type="password"
              name="newPassword"
              value={passwordData.newPassword}
              onChange={handlePasswordChange}
              className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              minLength={6}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-secondary-700 mb-1">Confirm New Password</label>
            <input
              type="password"
              name="confirmPassword"
              value={passwordData.confirmPassword}
              onChange={handlePasswordChange}
              className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              minLength={6}
              required
            />
          </div>

          <button
            type="submit"
            disabled={changingPassword}
            className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 flex items-center space-x-2"
          >
            <Lock className="h-4 w-4" />
            <span>{changingPassword ? 'Changing...' : 'Change Password'}</span>
          </button>
        </form>
      </div>
    </div>
  );
};

export default Profile;
