import React, { useState, useEffect } from 'react';
import CompanyLayout from '../components/layout/CompanyLayout';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import styles from './ApplicationsPage.module.css';

interface Application {
  id: string;
  studentId: string;
  studentName: string;
  studentEmail: string;
  internshipId: string;
  internshipTitle: string;
  status: 'pending' | 'accepted' | 'rejected';
  coverLetter: string;
  resumeUrl: string;
  githubUrl?: string;
  portfolioUrl?: string;
  projectDescription: string;
  notes?: string;
  createdAt: string;
  updatedAt?: string;
}

interface Internship {
  id: string;
  title: string;
}

const ApplicationsPage: React.FC = () => {
  const { company } = useAuth();
  const [applications, setApplications] = useState<Application[]>([]);
  const [internships, setInternships] = useState<Internship[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'accepted' | 'rejected'>('all');
  const [filterInternship, setFilterInternship] = useState<string>('all');
  const [selectedApplication, setSelectedApplication] = useState<Application | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [appsResponse, internshipsResponse] = await Promise.all([
        api.get('/applications'),
        api.get('/internships'),
      ]);

      // Filter applications for this company's internships
      const companyInternships = internshipsResponse.data.filter(
        (internship: any) => internship.id.startsWith(company?.email.replace(/[@.]/g, '_') || '')
      );
      
      const companyInternshipIds = new Set(companyInternships.map((i: any) => i.id));
      const companyApplications = appsResponse.data
        .filter((app: any) => companyInternshipIds.has(app.internshipId))
        .map((app: any) => ({
          ...app,
          studentName: app.student?.fullName || 'Unknown Student',
          studentEmail: app.student?.email || 'Unknown Email',
          internshipTitle: app.internship?.title || 'Unknown Internship',
        }));

      setApplications(companyApplications);
      setInternships(companyInternships);
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Failed to load applications');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (applicationId: string, newStatus: 'pending' | 'accepted' | 'rejected') => {
    try {
      await api.patch(`/applications/${applicationId}/status`, { status: newStatus });
      setApplications(applications.map(app => 
        app.id === applicationId ? { ...app, status: newStatus } : app
      ));
    } catch (err) {
      console.error('Error updating status:', err);
      alert('Failed to update application status');
    }
  };

  const filteredApplications = applications.filter(app => {
    if (filterStatus !== 'all' && app.status !== filterStatus) return false;
    if (filterInternship !== 'all' && app.internshipId !== filterInternship) return false;
    return true;
  });

  return (
    <CompanyLayout>
      <div className={styles.page}>
        <div className={styles.header}>
          <h1>Applications</h1>
        </div>

        {/* Filters */}
        <div className={styles.filters}>
          <div className={styles.filterGroup}>
            <label>Status:</label>
            <select 
              value={filterStatus} 
              onChange={(e) => setFilterStatus(e.target.value as any)}
              className={styles.filterSelect}
            >
              <option value="all">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="accepted">Accepted</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>

          <div className={styles.filterGroup}>
            <label>Internship:</label>
            <select 
              value={filterInternship} 
              onChange={(e) => setFilterInternship(e.target.value)}
              className={styles.filterSelect}
            >
              <option value="all">All Internships</option>
              {internships.map(internship => (
                <option key={internship.id} value={internship.id}>
                  {internship.title}
                </option>
              ))}
            </select>
          </div>

          <div className={styles.stats}>
            <span>Total: {filteredApplications.length}</span>
            <span>Pending: {filteredApplications.filter(a => a.status === 'pending').length}</span>
            <span>Accepted: {filteredApplications.filter(a => a.status === 'accepted').length}</span>
          </div>
        </div>

        {error && <div className={styles.error}>{error}</div>}

        {loading ? (
          <div className={styles.loading}>Loading applications...</div>
        ) : filteredApplications.length === 0 ? (
          <div className={styles.empty}>
            <p>📋 No applications found</p>
            <p>Applications to your internships will appear here.</p>
          </div>
        ) : (
          <div className={styles.applicationsGrid}>
            {filteredApplications.map((application) => (
              <div key={application.id} className={styles.applicationCard}>
                <div className={styles.cardHeader}>
                  <div className={styles.studentInfo}>
                    <h3>{application.studentName}</h3>
                    <p className={styles.email}>{application.studentEmail}</p>
                  </div>
                  <select
                    value={application.status}
                    onChange={(e) => handleStatusChange(application.id, e.target.value as any)}
                    className={`${styles.statusSelect} ${styles[application.status]}`}
                  >
                    <option value="pending">Pending</option>
                    <option value="accepted">Accepted</option>
                    <option value="rejected">Rejected</option>
                  </select>
                </div>

                <div className={styles.internshipBadge}>
                  📌 {application.internshipTitle}
                </div>

                <div className={styles.cardContent}>
                  <div className={styles.section}>
                    <h4>Cover Letter</h4>
                    <p className={styles.text}>{application.coverLetter}</p>
                  </div>

                  <div className={styles.section}>
                    <h4>Project Description</h4>
                    <p className={styles.text}>{application.projectDescription}</p>
                  </div>

                  {(application.resumeUrl || application.githubUrl || application.portfolioUrl) && (
                    <div className={styles.section}>
                      <h4>Links & Resources</h4>
                      <div className={styles.links}>
                        {application.resumeUrl && (
                          <a href={application.resumeUrl} target="_blank" rel="noopener noreferrer" className={styles.link}>
                            📄 Resume
                          </a>
                        )}
                        {application.githubUrl && (
                          <a href={application.githubUrl} target="_blank" rel="noopener noreferrer" className={styles.link}>
                            💻 GitHub
                          </a>
                        )}
                        {application.portfolioUrl && (
                          <a href={application.portfolioUrl} target="_blank" rel="noopener noreferrer" className={styles.link}>
                            🌐 Portfolio
                          </a>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                <button
                  className={styles.viewButton}
                  onClick={() => setSelectedApplication(application)}
                >
                  View Full Details
                </button>
              </div>
            ))}
          </div>
        )}

        {/* View Details Modal */}
        {selectedApplication && (
          <div className={styles.modal} onClick={() => setSelectedApplication(null)}>
            <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
              <div className={styles.modalHeader}>
                <h2>Application Details</h2>
                <button 
                  className={styles.closeButton}
                  onClick={() => setSelectedApplication(null)}
                >
                  ✕
                </button>
              </div>

              <div className={styles.detailsContent}>
                {/* Status Badge */}
                <div className={styles.statusBadgeContainer}>
                  <select
                    value={selectedApplication.status}
                    onChange={(e) => {
                      handleStatusChange(selectedApplication.id, e.target.value as any);
                      setSelectedApplication({ ...selectedApplication, status: e.target.value as any });
                    }}
                    className={`${styles.statusSelectLarge} ${styles[selectedApplication.status]}`}
                  >
                    <option value="pending">⏳ Pending Review</option>
                    <option value="accepted">✅ Accepted</option>
                    <option value="rejected">❌ Rejected</option>
                  </select>
                </div>

                {/* Applicant Information */}
                <div className={styles.detailSection}>
                  <h3>👤 Applicant Information</h3>
                  <div className={styles.infoRow}>
                    <span className={styles.infoLabel}>Full Name</span>
                    <span className={styles.infoValue}>{selectedApplication.studentName}</span>
                  </div>
                  <div className={styles.infoRow}>
                    <span className={styles.infoLabel}>Email Address</span>
                    <span className={styles.infoValue}>{selectedApplication.studentEmail}</span>
                  </div>
                </div>

                {/* Position Details */}
                <div className={styles.detailSection}>
                  <h3>💼 Position Details</h3>
                  <div className={styles.infoRow}>
                    <span className={styles.infoLabel}>Internship Title</span>
                    <span className={styles.infoValue}>{selectedApplication.internshipTitle}</span>
                  </div>
                  <div className={styles.infoRow}>
                    <span className={styles.infoLabel}>Company</span>
                    <span className={styles.infoValue}>{company?.name || 'Your Company'}</span>
                  </div>
                </div>

                {/* Cover Letter */}
                <div className={styles.detailSection}>
                  <h3>✍️ Cover Letter</h3>
                  <div className={styles.textBox}>
                    <p className={styles.fullText}>{selectedApplication.coverLetter}</p>
                  </div>
                </div>

                {/* Project Description */}
                <div className={styles.detailSection}>
                  <h3>🚀 Project Description</h3>
                  <div className={styles.textBox}>
                    <p className={styles.fullText}>{selectedApplication.projectDescription}</p>
                  </div>
                </div>

                {/* Links & Resources */}
                {(selectedApplication.resumeUrl || selectedApplication.githubUrl || selectedApplication.portfolioUrl) ? (
                  <div className={styles.detailSection}>
                    <h3>🔗 Links & Resources</h3>
                    <div className={styles.linksGrid}>
                      {selectedApplication.resumeUrl && (
                        <a href={selectedApplication.resumeUrl} target="_blank" rel="noopener noreferrer" className={styles.linkCard}>
                          <span className={styles.linkIcon}>📄</span>
                          <div className={styles.linkInfo}>
                            <span className={styles.linkLabel}>Resume</span>
                            <span className={styles.linkUrl}>{selectedApplication.resumeUrl}</span>
                          </div>
                        </a>
                      )}
                      {selectedApplication.githubUrl && (
                        <a href={selectedApplication.githubUrl} target="_blank" rel="noopener noreferrer" className={styles.linkCard}>
                          <span className={styles.linkIcon}>💻</span>
                          <div className={styles.linkInfo}>
                            <span className={styles.linkLabel}>GitHub</span>
                            <span className={styles.linkUrl}>{selectedApplication.githubUrl}</span>
                          </div>
                        </a>
                      )}
                      {selectedApplication.portfolioUrl && (
                        <a href={selectedApplication.portfolioUrl} target="_blank" rel="noopener noreferrer" className={styles.linkCard}>
                          <span className={styles.linkIcon}>🌐</span>
                          <div className={styles.linkInfo}>
                            <span className={styles.linkLabel}>Portfolio</span>
                            <span className={styles.linkUrl}>{selectedApplication.portfolioUrl}</span>
                          </div>
                        </a>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className={styles.detailSection}>
                    <h3>🔗 Links & Resources</h3>
                    <p className={styles.emptyMessage}>No links provided</p>
                  </div>
                )}

                {/* Timeline */}
                <div className={styles.detailSection}>
                  <h3>⏰ Timeline</h3>
                  <div className={styles.timelineGrid}>
                    <div className={styles.timelineItem}>
                      <span className={styles.timelineIcon}>📅</span>
                      <div className={styles.timelineInfo}>
                        <span className={styles.timelineLabel}>Submitted</span>
                        <span className={styles.timelineDate}>
                          {selectedApplication.createdAt ? new Date(selectedApplication.createdAt).toLocaleDateString('en-US', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          }) : 'N/A'}
                        </span>
                      </div>
                    </div>
                    {selectedApplication.createdAt !== selectedApplication.updatedAt && (
                      <div className={styles.timelineItem}>
                        <span className={styles.timelineIcon}>🔄</span>
                        <div className={styles.timelineInfo}>
                          <span className={styles.timelineLabel}>Last Updated</span>
                          <span className={styles.timelineDate}>
                            {selectedApplication.updatedAt ? new Date(selectedApplication.updatedAt).toLocaleDateString('en-US', {
                              weekday: 'long',
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            }) : 'N/A'}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </CompanyLayout>
  );
};

export default ApplicationsPage;
