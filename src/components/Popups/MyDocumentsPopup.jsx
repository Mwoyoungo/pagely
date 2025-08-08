import { useNotifications } from '../../contexts/NotificationContext';
import './MyDocumentsPopup.css';

const MyDocumentsPopup = ({ isOpen, onClose, onDocumentSelect }) => {
  const { showNotification } = useNotifications();

  // Mock documents data
  const mockDocuments = [
    {
      id: 'ml-fundamentals',
      title: 'ML Fundamentals.pdf',
      lastStudied: '2 hours ago',
      interactions: 5,
      size: '2.4 MB'
    },
    {
      id: 'statistics',
      title: 'Statistics Guide.pdf',
      lastStudied: 'Yesterday',
      interactions: 12,
      size: '1.8 MB'
    },
    {
      id: 'research-methods',
      title: 'Research Methods.pdf',
      lastStudied: '3 days ago',
      interactions: 3,
      size: '3.1 MB'
    }
  ];

  const loadDocument = (doc) => {
    onClose();
    
    // Create mock document data similar to PDFUpload
    const documentData = {
      id: doc.id,
      title: doc.title,
      url: '/mock-pdf-url',
      size: doc.size,
      uploadedAt: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
      interactions: [
        {
          id: '1',
          pageNumber: 1,
          x: 0.4,
          y: 0.2,
          type: 'voice_note',
          content: {
            message: "Great explanation of this concept",
            audioUrl: null
          },
          userDisplayName: 'Sarah',
          createdAt: new Date(Date.now() - 3600000).toISOString()
        },
        {
          id: '2',
          pageNumber: 1,
          x: 0.6,
          y: 0.4,
          type: 'video_explanation',
          content: {
            title: 'Video Explanation',
            videoUrl: null
          },
          userDisplayName: 'Mike',
          createdAt: new Date(Date.now() - 7200000).toISOString()
        }
      ]
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
        
        <div className="doc-grid">
          {mockDocuments.map(doc => (
            <div 
              key={doc.id}
              className="doc-item"
              onClick={() => loadDocument(doc)}
            >
              <div className="doc-icon">📄</div>
              <div className="doc-info">
                <div className="doc-title">{doc.title}</div>
                <div className="doc-meta">
                  Last studied: {doc.lastStudied}<br />
                  {doc.interactions} interactions • {doc.size}
                </div>
              </div>
            </div>
          ))}
        </div>
        
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