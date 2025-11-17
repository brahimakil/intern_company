import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import styles from './CompanyLayout.module.css';

interface CompanyLayoutProps {
  children: React.ReactNode;
}

const CompanyLayout: React.FC<CompanyLayoutProps> = ({ children }) => {
  const { company, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  // If company is inactive, show warning
  if (company?.status === 'inactive') {
    return (
      <div className={styles.inactiveContainer}>
        <div className={styles.inactiveCard}>
          <div className={styles.warningIcon}>⚠️</div>
          <h1>Account Pending Approval</h1>
          <p>Your company account is currently <strong>inactive</strong>.</p>
          <p>Please wait for an administrator to approve your account.</p>
          <p>You will be able to access all features once your account is activated.</p>
          
          <div className={styles.companyInfo}>
            <h3>Company Details</h3>
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
            </div>
          </div>
          
          <button onClick={handleLogout} className={styles.logoutBtn}>
            Logout
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.layout}>
      <aside className={styles.sidebar}>
        <div className={styles.logo}>
          {company?.logoUrl ? (
            <img src={company.logoUrl} alt={company.name} className={styles.companyLogo} />
          ) : (
            <div className={styles.logoPlaceholder}>🏢</div>
          )}
          <h2>{company?.name}</h2>
        </div>

        <nav className={styles.nav}>
          <NavLink 
            to="/dashboard" 
            className={({ isActive }) => isActive ? `${styles.navLink} ${styles.active}` : styles.navLink}
          >
            <span className={styles.icon}>📊</span>
            Dashboard
          </NavLink>

          <NavLink 
            to="/internships" 
            className={({ isActive }) => isActive ? `${styles.navLink} ${styles.active}` : styles.navLink}
          >
            <span className={styles.icon}>📋</span>
            My Internships
          </NavLink>

          <NavLink 
            to="/applications" 
            className={({ isActive }) => isActive ? `${styles.navLink} ${styles.active}` : styles.navLink}
          >
            <span className={styles.icon}>📥</span>
            Applications
          </NavLink>

          <NavLink 
            to="/profile" 
            className={({ isActive }) => isActive ? `${styles.navLink} ${styles.active}` : styles.navLink}
          >
            <span className={styles.icon}>⚙️</span>
            Profile
          </NavLink>
        </nav>

        <div className={styles.sidebarFooter}>
          <button onClick={handleLogout} className={styles.logoutButton}>
            <span className={styles.icon}>🚪</span>
            Logout
          </button>
        </div>
      </aside>

      <main className={styles.main}>
        <div className={styles.content}>
          {children}
        </div>
      </main>
    </div>
  );
};

export default CompanyLayout;
