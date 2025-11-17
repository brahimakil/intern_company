import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import CompanyLayout from '../components/layout/CompanyLayout';
import { companyApi } from '../services/api';
import styles from './DashboardPage.module.css';

interface CompanyStats {
  totalInternships: number;
  totalApplications: number;
  acceptedApplications: number;
  totalEnrollments: number;
  acceptedEnrollments: number;
}

const DashboardPage: React.FC = () => {
  const { company } = useAuth();
  const [stats, setStats] = useState<CompanyStats>({
    totalInternships: 0,
    totalApplications: 0,
    acceptedApplications: 0,
    totalEnrollments: 0,
    acceptedEnrollments: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const data = await companyApi.getDashboardStats();
      setStats(data);
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <CompanyLayout>
      <div className={styles.dashboard}>
        <h1 className={styles.welcomeTitle}>
          Welcome, {company?.name}! 🎉
        </h1>
        <p className={styles.welcomeText}>
          Your account is <strong className={styles.statusActive}>active</strong>. 
          You can now manage your internships and view applications.
        </p>

        {loading ? (
          <div className={styles.loading}>Loading statistics...</div>
        ) : (
          <div className={styles.statsGrid}>
            <div className={styles.statCard}>
              <div className={styles.statIcon}>📋</div>
              <div className={styles.statInfo}>
                <h3>{stats.totalInternships}</h3>
                <p>Internships</p>
              </div>
            </div>

            <div className={styles.statCard}>
              <div className={styles.statIcon}>👥</div>
              <div className={styles.statInfo}>
                <h3>{stats.totalApplications}</h3>
                <p>Applications</p>
              </div>
            </div>

            <div className={styles.statCard}>
              <div className={styles.statIcon}>✅</div>
              <div className={styles.statInfo}>
                <h3>{stats.acceptedApplications}</h3>
                <p>Accepted Applications</p>
              </div>
            </div>

            <div className={styles.statCard}>
              <div className={styles.statIcon}>📊</div>
              <div className={styles.statInfo}>
                <h3>{stats.acceptedEnrollments}</h3>
                <p>Enrolled Students</p>
              </div>
            </div>
          </div>
        )}

        <div className={styles.companyInfo}>
          <h3>Company Profile</h3>
          <div className={styles.infoGrid}>
            <div className={styles.infoItem}>
              <span className={styles.label}>Company Name:</span>
              <span className={styles.value}>{company?.name}</span>
            </div>
            <div className={styles.infoItem}>
              <span className={styles.label}>Email:</span>
              <span className={styles.value}>{company?.email}</span>
            </div>
            {company?.industry && (
              <div className={styles.infoItem}>
                <span className={styles.label}>Industry:</span>
                <span className={styles.value}>{company.industry}</span>
              </div>
            )}
            {company?.location && (
              <div className={styles.infoItem}>
                <span className={styles.label}>Location:</span>
                <span className={styles.value}>{company.location}</span>
              </div>
            )}
            {company?.description && (
              <div className={styles.infoItem}>
                <span className={styles.label}>Description:</span>
                <span className={styles.value}>{company.description}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </CompanyLayout>
  );
};

export default DashboardPage;
