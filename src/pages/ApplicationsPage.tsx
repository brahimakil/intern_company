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

interface Enrollment {
  id: string;
  studentId: string;
  studentName: string;
  studentEmail: string;
  internshipId: string;
}

const ApplicationsPage: React.FC = () => {
  const { company } = useAuth();
  const [applications, setApplications] = useState<Application[]>([]);
  const [internships, setInternships] = useState<Internship[]>([]);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'accepted' | 'rejected'>('all');
  const [filterInternship, setFilterInternship] = useState<string>('all');
  const [selectedApplication, setSelectedApplication] = useState<Application | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingApplication, setEditingApplication] = useState<Application | null>(null);
  const [formData, setFormData] = useState({
    internshipId: '',
    enrollmentId: '',
    coverLetter: '',
    projectDescription: '',
    resumeUrl: '',
    githubUrl: '',
    portfolioUrl: '',
    notes: '',
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [appsResponse, internshipsResponse, enrollmentsResponse] = await Promise.all([
        api.get('/applications'),
        api.get('/internships'),
        api.get('/enrollments'),
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

      // Filter enrollments for this company's internships
      const companyEnrollments = enrollmentsResponse.data
        .filter((enrollment: any) => companyInternshipIds.has(enrollment.internshipId))
        .map((enrollment: any) => ({
          id: enrollment.id,
          studentId: enrollment.studentId,
          studentName: enrollment.studentName || 'Unknown Student',
          studentEmail: enrollment.studentEmail || 'N/A',
          internshipId: enrollment.internshipId,
        }));

      setApplications(companyApplications);
      setInternships(companyInternships);
      setEnrollments(companyEnrollments);
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Failed to load applications');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateApplication = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const selectedEnrollment = enrollments.find(e => e.id === formData.enrollmentId);
    if (!selectedEnrollment) {
      alert('Please select a valid enrollment');
      return;
    }

    try {
      await api.post('/applications', {
        studentId: selectedEnrollment.studentId,
        internshipId: formData.internshipId,
        status: 'pending',
        coverLetter: formData.coverLetter,
        projectDescription: formData.projectDescription,
        resumeUrl: formData.resumeUrl,
        githubUrl: formData.githubUrl,
        portfolioUrl: formData.portfolioUrl,
        notes: formData.notes,
      });

      await fetchData();
      setShowCreateModal(false);
      setFormData({
        internshipId: '',
        enrollmentId: '',
        coverLetter: '',
        projectDescription: '',
        resumeUrl: '',
        githubUrl: '',
        portfolioUrl: '',
        notes: '',
      });
    } catch (err) {
      console.error('Error creating application:', err);
      alert('Failed to create application');
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

  const handleEdit = (application: Application) => {
    setEditingApplication(application);
    setFormData({
      internshipId: application.internshipId,
      enrollmentId: '', // Will be populated from enrollment data
      coverLetter: application.coverLetter,
      projectDescription: application.projectDescription,
      resumeUrl: application.resumeUrl,
      githubUrl: application.githubUrl || '',
      portfolioUrl: application.portfolioUrl || '',
      notes: application.notes || '',
    });
    setShowEditModal(true);
  };

  const handleUpdateApplication = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!editingApplication) return;

    try {
      await api.put(`/applications/${editingApplication.id}`, {
        coverLetter: formData.coverLetter,
        projectDescription: formData.projectDescription,
        resumeUrl: formData.resumeUrl,
        githubUrl: formData.githubUrl,
        portfolioUrl: formData.portfolioUrl,
        notes: formData.notes,
      });

      await fetchData();
      setShowEditModal(false);
      setEditingApplication(null);
      setFormData({
        internshipId: '',
        enrollmentId: '',
        coverLetter: '',
        projectDescription: '',
        resumeUrl: '',
        githubUrl: '',
        portfolioUrl: '',
        notes: '',
      });
    } catch (err) {
      console.error('Error updating application:', err);
      alert('Failed to update application');
    }
  };

  const handleDelete = async (applicationId: string) => {
    if (!window.confirm('Are you sure you want to delete this application? This action cannot be undone.')) {
      return;
    }

    try {
      await api.delete(`/applications/${applicationId}`);
      setApplications(applications.filter(app => app.id !== applicationId));
    } catch (err) {
      console.error('Error deleting application:', err);
      alert('Failed to delete application');
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
          <button 
            className={styles.createButton}
            onClick={() => setShowCreateModal(true)}
          >
            + Create Application
          </button>
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

                <div className={styles.cardActions}>
                  <button
                    className={styles.editButton}
                    onClick={() => handleEdit(application)}
                  >
                    ✏️ Edit
                  </button>
                  <button
                    className={styles.deleteButton}
                    onClick={() => handleDelete(application.id)}
                  >
                    🗑️ Delete
                  </button>
                </div>
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

        {/* Create Application Modal */}
        {showCreateModal && (
          <div className={styles.modal} onClick={() => setShowCreateModal(false)}>
            <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
              <div className={styles.modalHeader}>
                <h2>Create New Application</h2>
                <button className={styles.closeButton} onClick={() => setShowCreateModal(false)}>
                  ✕
                </button>
              </div>

              <form onSubmit={handleCreateApplication} className={styles.form}>
                <div className={styles.formSection}>
                  <h3>📋 Select Internship & Student</h3>
                  
                  <div className={styles.formGroup}>
                    <label className={styles.label}>Internship *</label>
                    <select
                      value={formData.internshipId}
                      onChange={(e) => {
                        setFormData({ 
                          ...formData, 
                          internshipId: e.target.value,
                          enrollmentId: '' // Reset enrollment when internship changes
                        });
                      }}
                      required
                      className={styles.select}
                    >
                      <option value="">-- Select an internship --</option>
                      {internships.map((internship) => (
                        <option key={internship.id} value={internship.id}>
                          {internship.title}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className={styles.formGroup}>
                    <label className={styles.label}>Student (Enrolled) *</label>
                    <select
                      value={formData.enrollmentId}
                      onChange={(e) => setFormData({ ...formData, enrollmentId: e.target.value })}
                      required
                      className={styles.select}
                      disabled={!formData.internshipId}
                    >
                      <option value="">-- Select a student --</option>
                      {enrollments
                        .filter(e => e.internshipId === formData.internshipId)
                        .map((enrollment) => (
                          <option key={enrollment.id} value={enrollment.id}>
                            {enrollment.studentName} ({enrollment.studentEmail})
                          </option>
                        ))}
                    </select>
                    {formData.internshipId && enrollments.filter(e => e.internshipId === formData.internshipId).length === 0 && (
                      <p className={styles.hint}>💡 No enrolled students for this internship</p>
                    )}
                  </div>
                </div>

                <div className={styles.formSection}>
                  <h3>✍️ Application Content</h3>
                  
                  <div className={styles.formGroup}>
                    <label className={styles.label}>Cover Letter *</label>
                    <textarea
                      value={formData.coverLetter}
                      onChange={(e) => setFormData({ ...formData, coverLetter: e.target.value })}
                      required
                      className={styles.textarea}
                      rows={6}
                      placeholder="Enter cover letter..."
                    />
                    <span className={styles.charCount}>{formData.coverLetter.length} characters</span>
                  </div>

                  <div className={styles.formGroup}>
                    <label className={styles.label}>Project Description *</label>
                    <textarea
                      value={formData.projectDescription}
                      onChange={(e) => setFormData({ ...formData, projectDescription: e.target.value })}
                      required
                      className={styles.textarea}
                      rows={6}
                      placeholder="Describe the project work..."
                    />
                  </div>
                </div>

                <div className={styles.formSection}>
                  <h3>🔗 Links (Optional)</h3>
                  
                  <div className={styles.formGroup}>
                    <label className={styles.label}>Resume URL</label>
                    <input
                      type="url"
                      value={formData.resumeUrl}
                      onChange={(e) => setFormData({ ...formData, resumeUrl: e.target.value })}
                      className={styles.input}
                      placeholder="https://..."
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label className={styles.label}>GitHub URL</label>
                    <input
                      type="url"
                      value={formData.githubUrl}
                      onChange={(e) => setFormData({ ...formData, githubUrl: e.target.value })}
                      className={styles.input}
                      placeholder="https://github.com/..."
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label className={styles.label}>Portfolio URL</label>
                    <input
                      type="url"
                      value={formData.portfolioUrl}
                      onChange={(e) => setFormData({ ...formData, portfolioUrl: e.target.value })}
                      className={styles.input}
                      placeholder="https://..."
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label className={styles.label}>Notes</label>
                    <textarea
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      className={styles.textarea}
                      rows={3}
                      placeholder="Additional notes..."
                    />
                  </div>
                </div>

                <div className={styles.modalActions}>
                  <button
                    type="button"
                    className={styles.cancelButton}
                    onClick={() => setShowCreateModal(false)}
                  >
                    Cancel
                  </button>
                  <button type="submit" className={styles.submitButton}>
                    Create Application
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Edit Application Modal */}
        {showEditModal && editingApplication && (
          <div className={styles.modal} onClick={() => setShowEditModal(false)}>
            <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
              <div className={styles.modalHeader}>
                <h2>Edit Application</h2>
                <button className={styles.closeButton} onClick={() => setShowEditModal(false)}>
                  ✕
                </button>
              </div>

              <form onSubmit={handleUpdateApplication} className={styles.form}>
                <div className={styles.formSection}>
                  <h3>ℹ️ Application Info</h3>
                  <div className={styles.infoDisplay}>
                    <p><strong>Student:</strong> {editingApplication.studentName}</p>
                    <p><strong>Internship:</strong> {editingApplication.internshipTitle}</p>
                  </div>
                </div>

                <div className={styles.formSection}>
                  <h3>✍️ Application Content</h3>
                  
                  <div className={styles.formGroup}>
                    <label className={styles.label}>Cover Letter *</label>
                    <textarea
                      value={formData.coverLetter}
                      onChange={(e) => setFormData({ ...formData, coverLetter: e.target.value })}
                      required
                      className={styles.textarea}
                      rows={6}
                      placeholder="Enter cover letter..."
                    />
                    <span className={styles.charCount}>{formData.coverLetter.length} characters</span>
                  </div>

                  <div className={styles.formGroup}>
                    <label className={styles.label}>Project Description *</label>
                    <textarea
                      value={formData.projectDescription}
                      onChange={(e) => setFormData({ ...formData, projectDescription: e.target.value })}
                      required
                      className={styles.textarea}
                      rows={6}
                      placeholder="Describe the project work..."
                    />
                  </div>
                </div>

                <div className={styles.formSection}>
                  <h3>🔗 Links (Optional)</h3>
                  
                  <div className={styles.formGroup}>
                    <label className={styles.label}>Resume URL</label>
                    <input
                      type="url"
                      value={formData.resumeUrl}
                      onChange={(e) => setFormData({ ...formData, resumeUrl: e.target.value })}
                      className={styles.input}
                      placeholder="https://..."
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label className={styles.label}>GitHub URL</label>
                    <input
                      type="url"
                      value={formData.githubUrl}
                      onChange={(e) => setFormData({ ...formData, githubUrl: e.target.value })}
                      className={styles.input}
                      placeholder="https://github.com/..."
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label className={styles.label}>Portfolio URL</label>
                    <input
                      type="url"
                      value={formData.portfolioUrl}
                      onChange={(e) => setFormData({ ...formData, portfolioUrl: e.target.value })}
                      className={styles.input}
                      placeholder="https://..."
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label className={styles.label}>Notes</label>
                    <textarea
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      className={styles.textarea}
                      rows={3}
                      placeholder="Additional notes..."
                    />
                  </div>
                </div>

                <div className={styles.modalActions}>
                  <button
                    type="button"
                    className={styles.cancelButton}
                    onClick={() => setShowEditModal(false)}
                  >
                    Cancel
                  </button>
                  <button type="submit" className={styles.submitButton}>
                    Update Application
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </CompanyLayout>
  );
};

export default ApplicationsPage;
