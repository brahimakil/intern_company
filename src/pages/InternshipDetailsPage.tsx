import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import CompanyLayout from '../components/layout/CompanyLayout';
import { api } from '../services/api';
import styles from './InternshipDetailsPage.module.css';

interface InternshipDetails {
  id: string;
  title: string;
  description: string;
  duration: string;
  location: string;
  locationType: string;
  status: string;
  logoUrl?: string;
  requiredSkills: string[];
  applicationsCount: number;
  currentStudentsCount: number;
  createdAt: string;
}

interface Application {
  id: string;
  studentName: string;
  studentEmail: string;
  status: string;
  coverLetter: string;
  createdAt: string;
}

interface Enrollment {
  id: string;
  studentName: string;
  studentEmail: string;
  enrolledAt: string;
}

const InternshipDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [internship, setInternship] = useState<InternshipDetails | null>(null);
  const [applications, setApplications] = useState<Application[]>([]);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (id) {
      fetchInternshipDetails(id);
      fetchApplications(id);
      fetchEnrollments(id);
    }
  }, [id]);

  const fetchInternshipDetails = async (internshipId: string) => {
    try {
      setLoading(true);
      const response = await api.get(`/internships/${internshipId}`);
      setInternship(response.data);
    } catch (err) {
      console.error('Error fetching internship details:', err);
      setError('Failed to load internship details');
    } finally {
      setLoading(false);
    }
  };

  const fetchApplications = async (internshipId: string) => {
    try {
      const response = await api.get('/applications');
      const internshipApplications = response.data
        .filter((app: any) => app.internshipId === internshipId)
        .map((app: any) => ({
          id: app.id,
          studentName: app.student?.fullName || 'Unknown Student',
          studentEmail: app.student?.email || 'Unknown Email',
          status: app.status,
          coverLetter: app.coverLetter || '',
          createdAt: app.createdAt,
        }));
      setApplications(internshipApplications);
    } catch (err) {
      console.error('Error fetching applications:', err);
    }
  };

  const fetchEnrollments = async (internshipId: string) => {
    try {
      const response = await api.get('/enrollments');
      const internshipEnrollments = response.data
        .filter((enrollment: any) => enrollment.internshipId === internshipId)
        .map((enrollment: any) => ({
          id: enrollment.id,
          studentName: enrollment.studentName || 'Unknown Student',
          studentEmail: enrollment.studentEmail || 'N/A',
          enrolledAt: enrollment.enrolledDate || enrollment.createdAt,
        }));
      setEnrollments(internshipEnrollments);
    } catch (err) {
      console.error('Error fetching enrollments:', err);
    }
  };

  if (loading) {
    return (
      <CompanyLayout>
        <div className={styles.container}>
          <div className={styles.loading}>Loading...</div>
        </div>
      </CompanyLayout>
    );
  }

  if (error || !internship) {
    return (
      <CompanyLayout>
        <div className={styles.container}>
          <div className={styles.error}>{error || 'Internship not found'}</div>
          <button className={styles.backButton} onClick={() => navigate('/internships')}>
            ← Back to Internships
          </button>
        </div>
      </CompanyLayout>
    );
  }

  return (
    <CompanyLayout>
      <div className={styles.container}>
        <button className={styles.backButton} onClick={() => navigate('/internships')}>
          ← Back to Internships
        </button>

        <div className={styles.detailsCard}>
          {internship.logoUrl && (
            <div className={styles.logoSection}>
              <img 
                src={internship.logoUrl} 
                alt={internship.title} 
                className={styles.logo}
              />
            </div>
          )}

          <div className={styles.header}>
            <div className={styles.titleSection}>
              <h1 className={styles.title}>{internship.title}</h1>
              <span className={`${styles.badge} ${styles[internship.status]}`}>
                {internship.status}
              </span>
            </div>
            
            <div className={styles.actions}>
              <button 
                className={styles.editButton}
                onClick={() => navigate(`/internships/edit/${internship.id}`)}
              >
                ✏️ Edit Internship
              </button>
            </div>
          </div>

          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>📋 Description</h2>
            <p className={styles.description}>{internship.description}</p>
          </div>

          <div className={styles.infoGrid}>
            <div className={styles.infoCard}>
              <span className={styles.infoIcon}>⏱️</span>
              <div className={styles.infoContent}>
                <span className={styles.infoLabel}>Duration</span>
                <span className={styles.infoValue}>{internship.duration}</span>
              </div>
            </div>

            <div className={styles.infoCard}>
              <span className={styles.infoIcon}>📍</span>
              <div className={styles.infoContent}>
                <span className={styles.infoLabel}>Location</span>
                <span className={styles.infoValue}>
                  {internship.location} ({internship.locationType})
                </span>
              </div>
            </div>

            <div className={styles.infoCard}>
              <span className={styles.infoIcon}>📝</span>
              <div className={styles.infoContent}>
                <span className={styles.infoLabel}>Applications</span>
                <span className={styles.infoValue}>{internship.applicationsCount || 0}</span>
              </div>
            </div>

            <div className={styles.infoCard}>
              <span className={styles.infoIcon}>👥</span>
              <div className={styles.infoContent}>
                <span className={styles.infoLabel}>Enrolled Students</span>
                <span className={styles.infoValue}>{internship.currentStudentsCount || 0}</span>
              </div>
            </div>
          </div>

          {internship.requiredSkills && internship.requiredSkills.length > 0 && (
            <div className={styles.section}>
              <h2 className={styles.sectionTitle}>💼 Required Skills</h2>
              <div className={styles.skillsContainer}>
                {internship.requiredSkills.map((skill, index) => (
                  <span key={index} className={styles.skillBadge}>
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Applications List */}
          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>📝 Applications ({applications.length})</h2>
            {applications.length === 0 ? (
              <p className={styles.emptyMessage}>No applications yet</p>
            ) : (
              <div className={styles.listContainer}>
                {applications.map((app) => (
                  <div key={app.id} className={styles.listItem}>
                    <div className={styles.listItemHeader}>
                      <div className={styles.studentInfo}>
                        <span className={styles.studentName}>{app.studentName}</span>
                        <span className={styles.studentEmail}>{app.studentEmail}</span>
                      </div>
                      <span className={`${styles.statusBadge} ${styles[app.status]}`}>
                        {app.status}
                      </span>
                    </div>
                    {app.coverLetter && (
                      <p className={styles.coverLetterPreview}>
                        {app.coverLetter.substring(0, 150)}
                        {app.coverLetter.length > 150 ? '...' : ''}
                      </p>
                    )}
                    <div className={styles.listItemFooter}>
                      <span className={styles.timestamp}>
                        Applied: {new Date(app.createdAt).toLocaleDateString()}
                      </span>
                      <button 
                        className={styles.viewButton}
                        onClick={() => navigate('/applications')}
                      >
                        View in Applications
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Enrolled Students List */}
          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>👥 Enrolled Students ({enrollments.length})</h2>
            {enrollments.length === 0 ? (
              <p className={styles.emptyMessage}>No enrolled students yet</p>
            ) : (
              <div className={styles.listContainer}>
                {enrollments.map((enrollment) => (
                  <div key={enrollment.id} className={styles.listItem}>
                    <div className={styles.listItemHeader}>
                      <div className={styles.studentInfo}>
                        <span className={styles.studentName}>{enrollment.studentName}</span>
                        <span className={styles.studentEmail}>{enrollment.studentEmail}</span>
                      </div>
                      <span className={`${styles.statusBadge} ${styles.enrolled}`}>
                        Enrolled
                      </span>
                    </div>
                    <div className={styles.listItemFooter}>
                      <span className={styles.timestamp}>
                        Enrolled: {new Date(enrollment.enrolledAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </CompanyLayout>
  );
};

export default InternshipDetailsPage;
