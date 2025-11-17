import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import CompanyLayout from '../components/layout/CompanyLayout';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import styles from './InternshipsPage.module.css';

interface Internship {
  id: string;
  title: string;
  description: string;
  duration: string;
  location: string;
  locationType: string;
  status: string;
  logoUrl?: string;
  applicationsCount: number;
  currentStudentsCount: number;
  createdAt: string;
}

const InternshipsPage: React.FC = () => {
  const navigate = useNavigate();
  const { company } = useAuth();
  const [internships, setInternships] = useState<Internship[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchInternships();
  }, []);

  const fetchInternships = async () => {
    try {
      setLoading(true);
      const response = await api.get('/internships');
      // Filter internships for this company
      const companyInternships = response.data.filter(
        (internship: Internship) => internship.id.startsWith(company?.email.replace(/[@.]/g, '_') || '')
      );
      setInternships(companyInternships);
    } catch (err) {
      console.error('Error fetching internships:', err);
      setError('Failed to load internships');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this internship?')) {
      return;
    }

    try {
      await api.delete(`/internships/${id}`);
      setInternships(internships.filter(i => i.id !== id));
    } catch (err) {
      console.error('Error deleting internship:', err);
      alert('Failed to delete internship');
    }
  };

  return (
    <CompanyLayout>
      <div className={styles.page}>
        <div className={styles.header}>
          <h1>My Internships</h1>
          <button 
            className={styles.createButton}
            onClick={() => navigate('/internships/create')}
          >
            + Create Internship
          </button>
        </div>

        {error && <div className={styles.error}>{error}</div>}

        {loading ? (
          <div className={styles.loading}>Loading internships...</div>
        ) : internships.length === 0 ? (
          <div className={styles.empty}>
            <p>📋 No internships yet</p>
            <p>Create your first internship posting to start receiving applications.</p>
            <button 
              className={styles.createButtonLarge}
              onClick={() => navigate('/internships/create')}
            >
              + Create Your First Internship
            </button>
          </div>
        ) : (
          <div className={styles.grid}>
            {internships.map((internship) => (
              <div 
                key={internship.id} 
                className={styles.card}
                onClick={() => navigate(`/internships/${internship.id}`)}
              >
                {internship.logoUrl && (
                  <div className={styles.logoContainer}>
                    <img src={internship.logoUrl} alt={internship.title} className={styles.logo} />
                  </div>
                )}

                <div className={styles.cardHeader}>
                  <h3>{internship.title}</h3>
                  <span className={`${styles.badge} ${styles[internship.status]}`}>
                    {internship.status}
                  </span>
                </div>

                <p className={styles.description}>{internship.description}</p>

                <div className={styles.details}>
                  <div className={styles.detail}>
                    <span className={styles.icon}>📍</span>
                    {internship.location} ({internship.locationType})
                  </div>
                  <div className={styles.detail}>
                    <span className={styles.icon}>⏱️</span>
                    {internship.duration}
                  </div>
                </div>

                <div className={styles.stats}>
                  <div className={styles.stat}>
                    <span className={styles.statValue}>{internship.applicationsCount || 0}</span>
                    <span className={styles.statLabel}>Applications</span>
                  </div>
                  <div className={styles.stat}>
                    <span className={styles.statValue}>{internship.currentStudentsCount || 0}</span>
                    <span className={styles.statLabel}>Enrolled</span>
                  </div>
                </div>

                <div className={styles.actions}>
                  <button 
                    className={styles.editButton}
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/internships/edit/${internship.id}`);
                    }}
                  >
                    ✏️ Edit
                  </button>
                  <button 
                    className={styles.deleteButton}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(internship.id);
                    }}
                  >
                    🗑️ Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </CompanyLayout>
  );
};

export default InternshipsPage;
