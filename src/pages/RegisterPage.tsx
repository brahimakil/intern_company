import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../firebase/config';
import styles from './RegisterPage.module.css';

const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    industry: '',
    location: '',
    description: '',
    logoUrl: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        alert('Image size should be less than 2MB');
        return;
      }
      
      if (!file.type.startsWith('image/')) {
        alert('Please select an image file');
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

  const uploadLogo = async (companyId: string): Promise<string> => {
    if (!logoFile) return '';

    setUploading(true);
    try {
      const fileExtension = logoFile.name.split('.').pop();
      const fileName = `companies/${companyId}/logo.${fileExtension}`;
      const storageRef = ref(storage, fileName);

      await uploadBytes(storageRef, logoFile);
      const downloadURL = await getDownloadURL(storageRef);
      
      return downloadURL;
    } catch (err) {
      console.error('Error uploading logo:', err);
      throw new Error('Failed to upload logo');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(false);

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);

    try {
      // Step 1: Register company first (without logo)
      console.log('Registering company...');
      await register({
        name: formData.name,
        email: formData.email,
        password: formData.password,
        industry: formData.industry,
        location: formData.location,
        description: formData.description,
        logoUrl: '',
      });
      console.log('Company registered successfully');

      // Step 2: If logo selected, authenticate and upload it
      if (logoFile) {
        console.log('Uploading logo with authentication...');
        try {
          // Sign in to get authentication for upload
          const { signInWithEmailAndPassword } = await import('firebase/auth');
          const { auth } = await import('../firebase/config');
          await signInWithEmailAndPassword(auth, formData.email, formData.password);
          
          const companyId = formData.email.replace(/[@.]/g, '_');
          const logoUrl = await uploadLogo(companyId);
          console.log('Logo uploaded successfully:', logoUrl);
          
          // Update company with logoUrl via API
          const { updateCompanyLogo } = await import('../services/api');
          await updateCompanyLogo(companyId, logoUrl);
          console.log('Company logo updated in database');
          
          // Sign out after upload
          const { signOut } = await import('firebase/auth');
          await signOut(auth);
        } catch (uploadErr) {
          console.error('Logo upload failed:', uploadErr);
          // Registration succeeded, just logo upload failed
          setError('Company registered but logo upload failed. You can update it later.');
        }
      }
      setSuccess(true);
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    } catch (err: any) {
      setError(err.message || 'Registration failed');
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.registerBox}>
        <div className={styles.header}>
          <h1 className={styles.title}>🏢 Company Registration</h1>
          <p className={styles.subtitle}>Create your company account</p>
        </div>

        {error && <div className={styles.error}>{error}</div>}
        {success && (
          <div className={styles.success}>
            <h3>✓ Registration Successful!</h3>
            <p>Your account has been created with <strong>inactive</strong> status.</p>
            <p>Please wait for admin approval before logging in.</p>
            <p>Redirecting to login...</p>
          </div>
        )}

        {!success && (
          <form onSubmit={handleSubmit} className={styles.form}>
            <div className={styles.formGroup}>
              <label htmlFor="name">Company Name *</label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                placeholder="Enter company name"
                disabled={loading}
              />
            </div>

            <div className={styles.formGroup}>
              <label>Company Logo</label>
              <div className={styles.logoUpload}>
                {logoPreview ? (
                  <div className={styles.logoPreviewContainer}>
                    <img src={logoPreview} alt="Logo preview" className={styles.logoPreview} />
                    <button
                      type="button"
                      onClick={() => {
                        setLogoPreview(null);
                        setLogoFile(null);
                      }}
                      className={styles.removeButton}
                      disabled={loading || uploading}
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <label className={styles.uploadLabel}>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleLogoChange}
                      disabled={loading || uploading}
                      className={styles.fileInput}
                    />
                    <span className={styles.uploadText}>
                      📷 Choose Logo (Max 2MB)
                    </span>
                  </label>
                )}
              </div>
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="email">Email *</label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                placeholder="company@example.com"
                disabled={loading}
              />
            </div>

            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label htmlFor="password">Password *</label>
                <input
                  type="password"
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  placeholder="Min. 6 characters"
                  disabled={loading}
                />
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="confirmPassword">Confirm Password *</label>
                <input
                  type="password"
                  id="confirmPassword"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  required
                  placeholder="Re-enter password"
                  disabled={loading}
                />
              </div>
            </div>

            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label htmlFor="industry">Industry</label>
                <input
                  type="text"
                  id="industry"
                  name="industry"
                  value={formData.industry}
                  onChange={handleChange}
                  placeholder="e.g. Technology, Finance"
                  disabled={loading}
                />
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="location">Location</label>
                <input
                  type="text"
                  id="location"
                  name="location"
                  value={formData.location}
                  onChange={handleChange}
                  placeholder="e.g. New York, USA"
                  disabled={loading}
                />
              </div>
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="description">Description</label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Brief description of your company..."
                rows={3}
                disabled={loading}
              />
            </div>

            <button type="submit" className={styles.submitButton} disabled={loading}>
              {loading ? 'Registering...' : 'Register Company'}
            </button>

            <div className={styles.footer}>
              Already have an account? <Link to="/login">Login here</Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default RegisterPage;
