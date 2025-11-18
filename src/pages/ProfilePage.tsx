import React, { useState, useEffect } from 'react';
import CompanyLayout from '../components/layout/CompanyLayout';
import styles from './ProfilePage.module.css';
import { useAuth } from '../context/AuthContext';
import { auth } from '../firebase/config';
import { Building2, MapPin, Briefcase, FileText, Image, Lock, Save, Upload } from 'lucide-react';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

interface Company {
  id: string;
  name: string;
  email: string;
  industry: string;
  location: string;
  description: string;
  logoUrl: string;
  status: string;
}

const ProfilePage: React.FC = () => {
  const { company: authCompany } = useAuth();
  const [company, setCompany] = useState<Company | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [activeTab, setActiveTab] = useState<'profile' | 'password'>('profile');
  
  // Profile form state
  const [formData, setFormData] = useState({
    name: '',
    industry: '',
    location: '',
    description: '',
  });

  // Password form state
  const [passwordData, setPasswordData] = useState({
    newPassword: '',
    confirmPassword: '',
  });

  // Logo upload state
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string>('');
  const [uploadingLogo, setUploadingLogo] = useState(false);

  useEffect(() => {
    if (authCompany) {
      fetchCompany();
    }
  }, [authCompany]);

  const fetchCompany = async () => {
    try {
      setLoading(true);
      const user = auth.currentUser;
      if (!user) {
        throw new Error('Not authenticated');
      }
      
      const token = await user.getIdToken();
      const companyId = user.email?.replace(/[@.]/g, '_');
      
      const response = await fetch(`${API_BASE_URL}/companies/${companyId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch company');
      }

      const data = await response.json();
      setCompany(data);
      setFormData({
        name: data.name || '',
        industry: data.industry || '',
        location: data.location || '',
        description: data.description || '',
      });
      setLogoPreview(data.logoUrl || '');
    } catch (err) {
      console.error('Error fetching company:', err);
      setError('Failed to load company profile');
    } finally {
      setLoading(false);
    }
  };

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setSaving(true);

    try {
      const user = auth.currentUser;
      if (!user) {
        throw new Error('Not authenticated');
      }
      
      const token = await user.getIdToken();
      const companyId = user.email?.replace(/[@.]/g, '_');

      const response = await fetch(`${API_BASE_URL}/companies/${companyId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error('Failed to update profile');
      }

      const data = await response.json();
      setCompany(data);
      setSuccess('Profile updated successfully!');
      
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Error updating profile:', err);
      setError('Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (passwordData.newPassword.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setSaving(true);

    try {
      const user = auth.currentUser;
      if (!user) {
        throw new Error('Not authenticated');
      }
      
      const token = await user.getIdToken();
      const companyId = user.email?.replace(/[@.]/g, '_');

      const response = await fetch(`${API_BASE_URL}/companies/${companyId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ password: passwordData.newPassword }),
      });

      if (!response.ok) {
        throw new Error('Failed to update password');
      }

      setSuccess('Password updated successfully!');
      setPasswordData({ newPassword: '', confirmPassword: '' });
      
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Error updating password:', err);
      setError('Failed to update password');
    } finally {
      setSaving(false);
    }
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError('Logo must be less than 5MB');
        return;
      }

      setLogoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleLogoUpload = async () => {
    if (!logoFile) return;

    setUploadingLogo(true);
    setError('');
    setSuccess('');

    try {
      const user = auth.currentUser;
      if (!user) {
        throw new Error('Not authenticated');
      }
      
      const token = await user.getIdToken();
      const companyId = user.email?.replace(/[@.]/g, '_');

      const formDataUpload = new FormData();
      formDataUpload.append('logo', logoFile);

      const response = await fetch(`${API_BASE_URL}/companies/${companyId}/logo`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formDataUpload,
      });

      if (!response.ok) {
        throw new Error('Failed to upload logo');
      }

      const data = await response.json();
      setCompany(data);
      setLogoPreview(data.logoUrl);
      setLogoFile(null);
      setSuccess('Logo updated successfully!');
      
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Error uploading logo:', err);
      setError('Failed to upload logo');
    } finally {
      setUploadingLogo(false);
    }
  };

  if (loading) {
    return (
      <CompanyLayout>
        <div className={styles.page}>
          <div className={styles.loading}>Loading profile...</div>
        </div>
      </CompanyLayout>
    );
  }

  return (
    <CompanyLayout>
      <div className={styles.page}>
        <div className={styles.header}>
          <h1>Company Profile & Settings</h1>
          <p className={styles.subtitle}>Manage your company information and account settings</p>
        </div>

        {error && (
          <div className={styles.alert} data-type="error">
            {error}
          </div>
        )}

        {success && (
          <div className={styles.alert} data-type="success">
            {success}
          </div>
        )}

        <div className={styles.tabs}>
          <button
            className={`${styles.tab} ${activeTab === 'profile' ? styles.activeTab : ''}`}
            onClick={() => setActiveTab('profile')}
          >
            <Building2 size={20} />
            Company Profile
          </button>
          <button
            className={`${styles.tab} ${activeTab === 'password' ? styles.activeTab : ''}`}
            onClick={() => setActiveTab('password')}
          >
            <Lock size={20} />
            Change Password
          </button>
        </div>

        {activeTab === 'profile' ? (
          <div className={styles.content}>
            {/* Logo Section */}
            <div className={styles.section}>
              <h2 className={styles.sectionTitle}>
                <Image size={20} />
                Company Logo
              </h2>
              <div className={styles.logoContainer}>
                <div className={styles.logoPreview}>
                  {logoPreview ? (
                    <img src={logoPreview} alt="Company Logo" className={styles.logo} />
                  ) : (
                    <div className={styles.logoPlaceholder}>
                      <Building2 size={48} />
                    </div>
                  )}
                </div>
                <div className={styles.logoActions}>
                  <input
                    type="file"
                    id="logoInput"
                    accept="image/*"
                    onChange={handleLogoChange}
                    className={styles.fileInput}
                  />
                  <label htmlFor="logoInput" className={styles.uploadButton}>
                    <Upload size={18} />
                    Choose Logo
                  </label>
                  {logoFile && (
                    <button
                      onClick={handleLogoUpload}
                      disabled={uploadingLogo}
                      className={styles.saveLogoButton}
                    >
                      {uploadingLogo ? 'Uploading...' : 'Upload Logo'}
                    </button>
                  )}
                  <p className={styles.logoHint}>Max file size: 5MB. Recommended: 500x500px</p>
                </div>
              </div>
            </div>

            {/* Profile Form */}
            <form onSubmit={handleProfileSubmit} className={styles.section}>
              <h2 className={styles.sectionTitle}>
                <FileText size={20} />
                Company Information
              </h2>

              <div className={styles.formGrid}>
                <div className={styles.formGroup}>
                  <label className={styles.label}>
                    <Building2 size={18} />
                    Company Name *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                    className={styles.input}
                    placeholder="Enter company name"
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.label}>
                    <Briefcase size={18} />
                    Industry *
                  </label>
                  <input
                    type="text"
                    value={formData.industry}
                    onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                    required
                    className={styles.input}
                    placeholder="e.g., Technology, Finance"
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.label}>
                    <MapPin size={18} />
                    Location *
                  </label>
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    required
                    className={styles.input}
                    placeholder="e.g., New York, USA"
                  />
                </div>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>
                  <FileText size={18} />
                  Company Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className={styles.textarea}
                  rows={6}
                  placeholder="Describe your company, mission, and values..."
                />
              </div>

              <div className={styles.formActions}>
                <button
                  type="submit"
                  disabled={saving}
                  className={styles.saveButton}
                >
                  <Save size={18} />
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>

            {/* Account Info */}
            <div className={styles.section}>
              <h2 className={styles.sectionTitle}>Account Information</h2>
              <div className={styles.infoGrid}>
                <div className={styles.infoItem}>
                  <span className={styles.infoLabel}>Email:</span>
                  <span className={styles.infoValue}>{company?.email}</span>
                </div>
                <div className={styles.infoItem}>
                  <span className={styles.infoLabel}>Status:</span>
                  <span className={`${styles.statusBadge} ${styles[company?.status || 'active']}`}>
                    {company?.status || 'Active'}
                  </span>
                </div>
                <div className={styles.infoItem}>
                  <span className={styles.infoLabel}>Company ID:</span>
                  <span className={styles.infoValue}>{company?.id}</span>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className={styles.content}>
            <form onSubmit={handlePasswordSubmit} className={styles.section}>
              <h2 className={styles.sectionTitle}>
                <Lock size={20} />
                Change Password
              </h2>
              <p className={styles.passwordHint}>
                Update your password to keep your account secure. Password must be at least 6 characters.
              </p>

              <div className={styles.formGroup}>
                <label className={styles.label}>New Password *</label>
                <input
                  type="password"
                  value={passwordData.newPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                  required
                  minLength={6}
                  className={styles.input}
                  placeholder="Enter new password"
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>Confirm Password *</label>
                <input
                  type="password"
                  value={passwordData.confirmPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                  required
                  minLength={6}
                  className={styles.input}
                  placeholder="Confirm new password"
                />
              </div>

              <div className={styles.formActions}>
                <button
                  type="submit"
                  disabled={saving}
                  className={styles.saveButton}
                >
                  <Lock size={18} />
                  {saving ? 'Updating...' : 'Update Password'}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </CompanyLayout>
  );
};

export default ProfilePage;
