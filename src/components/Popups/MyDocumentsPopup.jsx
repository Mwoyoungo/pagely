import { useState, useEffect } from 'react';
import { useNotifications } from '../../contexts/NotificationContext';
import { useAuth } from '../../contexts/AuthContext';
import DocumentService from '../../services/documentService';
import EmptyState from '../UI/EmptyState';
import analyticsService from '../../services/analyticsService';
import './MyDocumentsPopup.css';

const MyDocumentsPopup = ({ isOpen, onClose, onDocumentSelect }) => {
  const { showNotification } = useNotifications();
  const { currentUser } = useAuth();
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [deletingDoc, setDeletingDoc] = useState(null);

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

  const handleDeleteDocument = async (docId, docTitle) => {
    if (!currentUser) return;
    
    // Confirm deletion
    if (!window.confirm(`Are you sure you want to delete "${docTitle}"? This action cannot be undone and will remove all highlights and voice explanations.`)) {
      return;
    }
    
    setDeletingDoc(docId);
    
    try {
      await DocumentService.deleteDocument(docId, currentUser.uid);
      
      // Track analytics
      analyticsService.track('document_delete', {
        documentId: docId,
        userId: currentUser.uid
      });
      
      // Remove from local state
      setDocuments(prev => prev.filter(doc => doc.id !== docId));
      
      showNotification(`Document "${docTitle}" deleted successfully`, 'success');
    } catch (error) {
      console.error('Error deleting document:', error);
      showNotification(error.message || 'Failed to delete document', 'error');
    } finally {
      setDeletingDoc(null);
    }
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
              >
                <div className="doc-main" onClick={() => loadDocument(doc)}>
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
                
                {/* Delete button for document owners */}
                {doc.uploadedBy === currentUser?.uid && (
                  <button
                    className="delete-doc-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteDocument(doc.id, doc.title);
                    }}
                    disabled={deletingDoc === doc.id}
                    title="Delete document"
                  >
                    {deletingDoc === doc.id ? '⏳' : '🗑️'}
                  </button>
                )}
              </div>
            ))}
          </div>
        ) : (
          <EmptyState
            icon="📚"
            title="No documents yet"
            description="Upload your first PDF to start collaborative learning!"
            actionText="Upload New Document"
            onAction={() => {
              onClose();
              showNotification('Click "Upload" to add a new document', 'info');
            }}
          />
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