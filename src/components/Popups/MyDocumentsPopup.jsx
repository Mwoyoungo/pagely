import { useState, useEffect } from 'react';
import { useNotifications } from '../../contexts/NotificationContext';
import { useAuth } from '../../contexts/AuthContext';
import DocumentService from '../../services/documentService';
import './MyDocumentsPopup.css';

const MyDocumentsPopup = ({ isOpen, onClose, onDocumentSelect }) => {
  const { showNotification } = useNotifications();
  const { currentUser } = useAuth();
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(false);

  // Load user's documents when popup opens
  useEffect(() => {
    if (isOpen && currentUser) {
      loadUserDocuments();
    }
  }, [isOpen, currentUser]);

  const loadUserDocuments = async () => {
    if (!currentUser) return;
    
    setLoading(true);
    try {
      const userDocs = await DocumentService.getUserDocuments(currentUser.uid);
      setDocuments(userDocs);
    } catch (error) {
      console.error('Error loading documents:', error);
      showNotification('Failed to load documents', 'error');
    } finally {
      setLoading(false);
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return 'Unknown';
    
    try {
      // Handle Firestore timestamp
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
      const now = new Date();
      const diffMs = now - date;
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMs / 3600000);
      const diffDays = Math.floor(diffMs / 86400000);

      if (diffMins < 60) {
        return `${diffMins} minutes ago`;
      } else if (diffHours < 24) {
        return `${diffHours} hours ago`;
      } else if (diffDays < 7) {
        return `${diffDays} days ago`;
      } else {
        return date.toLocaleDateString();
      }
    } catch (error) {
      return 'Unknown';
    }
  };

  const loadDocument = (doc) => {
    onClose();
    
    // Convert Firebase document to format expected by PDFViewer
    const documentData = {
      id: doc.id,
      title: doc.title,
      url: doc.pdfUrl,
      size: doc.fileSize,
      uploadedAt: doc.createdAt,
      // Mock interactions for now - will be replaced with real highlights
      interactions: [
        {
          id: '1',
          pageNumber: 1,
          x: 0.4,
          y: 0.2,
          type: 'voice_note',
          content: {
            message: "Continue from where you left off",
            audioUrl: null
          },
          userDisplayName: currentUser?.displayName || 'You',
          createdAt: new Date().toISOString()
        }
      ],
      highlights: [] // Will be loaded from Firestore highlights subcollection
    };

    onDocumentSelect(documentData);
    showNotification(`Loading ${doc.title}...`, 'info');
  };

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="popup-overlay" onClick={handleOverlayClick}>
      <div className="popup my-docs-popup">
        <button className="close-popup" onClick={onClose}>
          &times;
        </button>
        
        <h3>My Documents</h3>
        
        {loading ? (
          <div className="loading">
            <div className="spinner" />
            <p>Loading your documents...</p>
          </div>
        ) : documents.length > 0 ? (
          <div className="doc-grid">
            {documents.map(doc => (
              <div 
                key={doc.id}
                className="doc-item"
                onClick={() => loadDocument(doc)}
              >
                <div className="doc-icon">📄</div>
                <div className="doc-info">
                  <div className="doc-title">{doc.title}</div>
                  <div className="doc-meta">
                    Last activity: {formatDate(doc.lastActivity)}<br />
                    {doc.totalHighlights || 0} highlights • {formatFileSize(doc.fileSize || 0)}
                  </div>
                  <div className="doc-stats">
                    {doc.activeCollaborators > 1 && (
                      <span className="collaborators">👥 {doc.activeCollaborators} collaborators</span>
                    )}
                    {doc.helpRequestsOpen > 0 && (
                      <span className="help-requests">❓ {doc.helpRequestsOpen} help requests</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <div className="empty-icon">📚</div>
            <h4>No documents yet</h4>
            <p>Upload your first PDF to start collaborative learning!</p>
          </div>
        )}
        
        <div className="upload-new">
          <p>Want to study a new document?</p>
          <button 
            className="upload-new-btn"
            onClick={() => {
              onClose();
              // In a real app, this would trigger file upload
              showNotification('Click "Upload" to add a new document', 'info');
            }}
          >
            Upload New Document
          </button>
        </div>
      </div>
    </div>
  );
};

export default MyDocumentsPopup;