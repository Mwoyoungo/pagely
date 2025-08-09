import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNotifications } from '../../contexts/NotificationContext';
import DocumentService from '../../services/documentService';
import './PublicFeed.css';

const PublicFeed = ({ onDocumentSelect, onUploadDocument }) => {
  const { currentUser } = useAuth();
  const { showNotification } = useNotifications();
  const [publicDocuments, setPublicDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('all');

  useEffect(() => {
    loadPublicDocuments();
  }, []);

  const loadPublicDocuments = async () => {
    try {
      setLoading(true);
      const docs = await DocumentService.getPublicDocuments(50);
      setPublicDocuments(docs);
    } catch (error) {
      console.error('Error loading public documents:', error);
      showNotification('Failed to load public documents', 'error');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return 'Unknown';
    
    try {
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
      const now = new Date();
      const diffMs = now - date;
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMs / 3600000);
      const diffDays = Math.floor(diffMs / 86400000);

      if (diffMins < 60) {
        return `${diffMins}m ago`;
      } else if (diffHours < 24) {
        return `${diffHours}h ago`;
      } else if (diffDays < 7) {
        return `${diffDays}d ago`;
      } else {
        return date.toLocaleDateString();
      }
    } catch (error) {
      return 'Unknown';
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const joinDocument = async (doc) => {
    if (!currentUser) {
      showNotification('Please sign in to join documents', 'error');
      return;
    }

    try {
      await DocumentService.joinDocument(doc.id, currentUser.uid);
      
      // Convert to viewer format and open
      const documentData = {
        id: doc.id,
        title: doc.title,
        url: doc.pdfUrl,
        size: doc.fileSize,
        uploadedAt: doc.createdAt,
        interactions: [],
        highlights: [] // Will be loaded from Firestore
      };

      onDocumentSelect(documentData);
      showNotification(`Joined "${doc.title}" - you can now collaborate!`, 'success');
    } catch (error) {
      console.error('Error joining document:', error);
      showNotification('Failed to join document', 'error');
    }
  };

  const getSubjectColor = (subject) => {
    const colors = {
      'Computer Science': '#4ecdc4',
      'Mathematics': '#45b7d1',
      'Physics': '#96ceb4',
      'Biology': '#ffeaa7',
      'Chemistry': '#fd79a8',
      'General': '#6c5ce7'
    };
    return colors[subject] || colors['General'];
  };

  // Filter documents
  const filteredDocuments = publicDocuments.filter(doc => {
    const matchesSearch = !searchTerm || 
      doc.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesSubject = selectedSubject === 'all' || doc.subject === selectedSubject;
    
    return matchesSearch && matchesSubject;
  });

  // Get unique subjects for filter
  const subjects = ['all', ...new Set(publicDocuments.map(doc => doc.subject))];

  return (
    <div className="public-feed">
      <div className="feed-header">
        <div className="header-content">
          <h2>📚 Discover Study Documents</h2>
          <p>Join collaborative learning sessions with students worldwide</p>
        </div>
        
        {onUploadDocument && (
          <button className="upload-cta" onClick={onUploadDocument}>
            📄 Upload New Document
          </button>
        )}
        
        <div className="feed-controls">
          <div className="search-box">
            <input
              type="text"
              placeholder="Search documents..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
            <span className="search-icon">🔍</span>
          </div>
          
          <select
            value={selectedSubject}
            onChange={(e) => setSelectedSubject(e.target.value)}
            className="subject-filter"
          >
            <option value="all">All Subjects</option>
            {subjects.slice(1).map(subject => (
              <option key={subject} value={subject}>{subject}</option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="loading">
          <div className="spinner" />
          <p>Loading public documents...</p>
        </div>
      ) : filteredDocuments.length > 0 ? (
        <div className="documents-grid">
          {filteredDocuments.map(doc => (
            <div key={doc.id} className="document-card">
              <div className="doc-header">
                <div className="doc-icon">📄</div>
                <div className="doc-subject" 
                     style={{ backgroundColor: getSubjectColor(doc.subject) }}>
                  {doc.subject}
                </div>
              </div>
              
              <div className="doc-content">
                <h3 className="doc-title">{doc.title}</h3>
                <p className="doc-description">{doc.description}</p>
                
                <div className="doc-metadata">
                  <span className="uploader">
                    👤 {doc.uploadedByName}
                  </span>
                  <span className="upload-time">
                    {formatDate(doc.uploadedAt)}
                  </span>
                </div>
                
                <div className="doc-stats">
                  <div className="stat-item">
                    <span className="stat-icon">👥</span>
                    <span>{doc.activeCollaborators || 0} collaborators</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-icon">✏️</span>
                    <span>{doc.totalHighlights || 0} highlights</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-icon">🎤</span>
                    <span>{doc.totalVoiceExplanations || 0} explanations</span>
                  </div>
                  {doc.helpRequestsOpen > 0 && (
                    <div className="stat-item help-needed">
                      <span className="stat-icon">❓</span>
                      <span>{doc.helpRequestsOpen} need help</span>
                    </div>
                  )}
                </div>

                {doc.tags && doc.tags.length > 0 && (
                  <div className="doc-tags">
                    {doc.tags.map((tag, index) => (
                      <span key={index} className="tag">#{tag}</span>
                    ))}
                  </div>
                )}

                <div className="doc-info">
                  <span className="file-size">{formatFileSize(doc.fileSize || 0)}</span>
                  <span className="last-activity">
                    Last activity: {formatDate(doc.lastActivity)}
                  </span>
                </div>
              </div>
              
              <div className="doc-actions">
                <button 
                  className="join-btn"
                  onClick={() => joinDocument(doc)}
                >
                  {doc.collaborators?.includes(currentUser?.uid) ? 
                    '📖 Continue Learning' : 
                    '🚀 Join & Learn Together'
                  }
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <div className="empty-icon">🔍</div>
          <h3>No documents found</h3>
          <p>Try adjusting your search or upload a new document to get started!</p>
        </div>
      )}
    </div>
  );
};

export default PublicFeed;