import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../firebase/config';
import CompanyLayout from '../components/layout/CompanyLayout';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import styles from './InternshipFormPage.module.css';

const InternshipFormPage: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { company } = useAuth();
  const isEdit = !!id;

  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [skillInput, setSkillInput] = useState('');
  const [logoPreview, setLogoPreview] = useState<string>('');
  const [logoFile, setLogoFile] = useState<File | null>(null);
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    requiredSkills: [] as string[],
    duration: '',
    location: '',
    locationType: 'remote' as 'remote' | 'onsite' | 'hybrid',
    status: 'open' as 'open' | 'closed',
    logoUrl: '',
  });

  useEffect(() => {
    if (isEdit && id) {
      fetchInternship(id);
    }
  }, [id, isEdit]);

  const fetchInternship = async (internshipId: string) => {
    try {
      const response = await api.get(`/internships/${internshipId}`);
      const data = response.data;
      
      setFormData({
        title: data.title || '',
        description: data.description || '',
        requiredSkills: data.requiredSkills || [],
        duration: data.duration || '',
        location: data.location || '',
        locationType: data.locationType || 'remote',
        status: data.status || 'open',
        logoUrl: data.logoUrl || '',
      });
      if (data.logoUrl) {
        setLogoPreview(data.logoUrl);
      }
    } catch (err) {
      console.error('Error fetching internship:', err);
      setError('Failed to load internship data');
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleAddSkill = () => {
    if (skillInput.trim() && !formData.requiredSkills.includes(skillInput.trim())) {
      setFormData({
        ...formData,
        requiredSkills: [...formData.requiredSkills, skillInput.trim()],
      });
      setSkillInput('');
    }
  };

  const handleRemoveSkill = (skillToRemove: string) => {
    setFormData({
      ...formData,
      requiredSkills: formData.requiredSkills.filter(skill => skill !== skillToRemove),
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

  const handleRemoveLogo = () => {
    setLogoFile(null);
    setLogoPreview('');
    setFormData({ ...formData, logoUrl: '' });
  };

  const uploadLogo = async (internshipId: string): Promise<string> => {
    if (!logoFile) return formData.logoUrl;

    setUploading(true);
    try {
      const fileExtension = logoFile.name.split('.').pop();
      const fileName = `internships/${internshipId}/logo.${fileExtension}`;
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

    if (!formData.title || !formData.description || !formData.duration || !formData.location) {
      setError('Please fill in all required fields');
      return;
    }

    setLoading(true);

    try {
      const companyId = company?.email.replace(/[@.]/g, '_');
      const internshipId = isEdit && id ? id : `${companyId}_${Date.now()}`;
      
      // Upload logo if new file selected
      let logoUrl = formData.logoUrl;
      if (logoFile) {
        logoUrl = await uploadLogo(internshipId);
      }

      const dataToSend = {
        ...formData,
        companyId,
        logoUrl,
      };

      if (isEdit && id) {
        await api.put(`/internships/${id}`, dataToSend);
      } else {
        await api.post('/internships', dataToSend);
      }

      navigate('/internships');
    } catch (err: any) {
      console.error('Error saving internship:', err);
      setError(err.response?.data?.message || 'Failed to save internship');
      setLoading(false);
    }
  };

  return (
    <CompanyLayout>
      <div className={styles.page}>
        <div className={styles.header}>
          <button onClick={() => navigate('/internships')} className={styles.backButton}>
            ← Back
          </button>
          <h1>{isEdit ? 'Edit Internship' : 'Create New Internship'}</h1>
        </div>

        {error && <div className={styles.error}>{error}</div>}

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.card}>
            <h3>Logo (Optional)</h3>
            
            <div className={styles.logoSection}>
              {logoPreview ? (
                <div className={styles.logoPreviewContainer}>
                  <img src={logoPreview} alt="Internship logo" className={styles.logoPreview} />
                  <button
                    type="button"
                    onClick={handleRemoveLogo}
                    className={styles.removeLogoButton}
                    disabled={loading || uploading}
                  >
                    × Remove
                  </button>
                </div>
              ) : (
                <label htmlFor="logo" className={styles.uploadBox}>
                  <div className={styles.uploadIcon}>📷</div>
                  <span>Click to upload internship logo</span>
                  <span className={styles.uploadHint}>PNG, JPG up to 2MB</span>
                </label>
              )}
              <input
                type="file"
                id="logo"
                accept="image/*"
                onChange={handleLogoChange}
                className={styles.fileInput}
                disabled={loading || uploading}
              />
            </div>
          </div>

          <div className={styles.card}>
            <h3>Basic Information</h3>

            <div className={styles.formGroup}>
              <label htmlFor="title">Internship Title *</label>
              <input
                type="text"
                id="title"
                name="title"
                value={formData.title}
                onChange={handleChange}
                required
                placeholder="e.g. Software Developer Intern"
                disabled={loading}
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="description">Description *</label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                required
                rows={6}
                placeholder="Describe the internship role, responsibilities, and requirements..."
                disabled={loading}
              />
            </div>

            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label htmlFor="duration">Duration *</label>
                <select
                  id="duration"
                  name="duration"
                  value={formData.duration}
                  onChange={handleChange}
                  required
                  disabled={loading}
                >
                  <option value="">Select duration</option>
                  <option value="2">2 Months</option>
                  <option value="3">3 Months</option>
                  <option value="4">4 Months</option>
                  <option value="5">5 Months</option>
                  <option value="6">6 Months</option>
                </select>
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="status">Status *</label>
                <select
                  id="status"
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  disabled={loading}
                >
                  <option value="open">Open</option>
                  <option value="closed">Closed</option>
                </select>
              </div>
            </div>
          </div>

          <div className={styles.card}>
            <h3>Location</h3>

            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label htmlFor="location">Location *</label>
                <input
                  type="text"
                  id="location"
                  name="location"
                  value={formData.location}
                  onChange={handleChange}
                  required
                  placeholder="e.g. New York, USA"
                  disabled={loading}
                />
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="locationType">Type *</label>
                <select
                  id="locationType"
                  name="locationType"
                  value={formData.locationType}
                  onChange={handleChange}
                  disabled={loading}
                >
                  <option value="remote">Remote</option>
                  <option value="onsite">Onsite</option>
                  <option value="hybrid">Hybrid</option>
                </select>
              </div>
            </div>
          </div>

          <div className={styles.card}>
            <h3>Required Skills</h3>

            <div className={styles.skillsInput}>
              <input
                type="text"
                value={skillInput}
                onChange={(e) => setSkillInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddSkill())}
                placeholder="Add a skill and press Enter"
                disabled={loading}
              />
              <button
                type="button"
                onClick={handleAddSkill}
                className={styles.addButton}
                disabled={loading}
              >
                + Add
              </button>
            </div>

            <div className={styles.skillsList}>
              {formData.requiredSkills.map((skill, index) => (
                <span key={index} className={styles.skillTag}>
                  {skill}
                  <button
                    type="button"
                    onClick={() => handleRemoveSkill(skill)}
                    className={styles.removeSkill}
                    disabled={loading}
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          </div>

          <div className={styles.actions}>
            <button
              type="button"
              onClick={() => navigate('/internships')}
              className={styles.cancelButton}
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className={styles.submitButton}
              disabled={loading}
            >
              {loading ? 'Saving...' : (isEdit ? 'Update Internship' : 'Create Internship')}
            </button>
          </div>
        </form>
      </div>
    </CompanyLayout>
  );
};

export default InternshipFormPage;
