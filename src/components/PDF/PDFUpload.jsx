import { useState, useRef } from 'react';
import { useNotifications } from '../../contexts/NotificationContext';
import { useAuth } from '../../contexts/AuthContext';
import DocumentService from '../../services/documentService';
import './PDFUpload.css';

// Create a simple mock audio URL for demo purposes
const createMockAudio = () => {
  // Return a simple data URL that represents a short silent audio for demo
  // In production, this would be a real recorded voice explanation
  return 'data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAA=';
};

const PDFUpload = ({ onDocumentUploaded }) => {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef(null);
  const { showNotification } = useNotifications();
  const { currentUser } = useAuth();

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file || file.type !== 'application/pdf') {
      showNotification('Please select a PDF file', 'error');
      return;
    }

    if (!currentUser) {
      showNotification('Please sign in to upload documents', 'error');
      return;
    }

    setUploading(true);
    setUploadProgress(0);
    
    try {
      // Extract metadata from file name
      const metadata = {
        title: file.name.replace('.pdf', ''),
        subject: 'General', // TODO: Add subject selection UI
        description: `Study document uploaded by ${currentUser.displayName || currentUser.email}`,
        tags: [] // TODO: Add tags input UI
      };

      // Upload to Firebase
      const documentData = await DocumentService.uploadDocument(
        file, 
        metadata, 
        currentUser, 
        (progress) => {
          setUploadProgress(progress);
        }
      );

      showNotification('Document uploaded successfully!', 'success');
      
      // Convert Firebase document to format expected by PDFViewer
      const viewerDocument = {
        id: documentData.id,
        title: documentData.title,
        url: documentData.pdfUrl,
        size: documentData.fileSize,
        uploadedAt: documentData.createdAt,
        // Initialize with mock data for demo - will be replaced with real highlights from Firebase
        interactions: [
          {
            id: '1',
            pageNumber: 1,
            x: 0.4,
            y: 0.2,
            type: 'voice_note',
            content: {
              message: "Welcome to collaborative learning!",
              audioUrl: null
            },
            userDisplayName: currentUser.displayName || 'You',
            createdAt: new Date().toISOString()
          }
        ],
        highlights: [
          {
            id: 'demo-highlight-1',
            text: 'Start highlighting text to collaborate',
            pageNumber: 1,
            position: { x: 0.2, y: 0.3, width: 0.35, height: 0.03 },
            color: '#ffeb3b',
            createdAt: new Date().toISOString(),
            createdBy: currentUser.uid,
            hasHelp: false,
            needsHelp: false,
            helpRequests: []
          }
        ]
      };

      onDocumentUploaded(viewerDocument);
      
    } catch (error) {
      console.error('Upload error:', error);
      showNotification(error.message || 'Failed to upload document', 'error');
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="upload-section">
      <div className="upload-container">
        <h2>Start Studying Together</h2>
        <div 
          className={`upload-area ${uploading ? 'uploading' : ''}`}
          onClick={!uploading ? handleUploadClick : undefined}
        >
          <div className="upload-icon">📄</div>
          <h3>Drop your PDF here or click to upload</h3>
          <p>Convert any document into an interactive study session</p>
          
          {uploading && (
            <div className="upload-progress">
              <div className="progress-bar">
                <div 
                  className="progress-fill" 
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
              <p>Uploading... {Math.round(uploadProgress)}%</p>
            </div>
          )}
        </div>
        
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf"
          style={{ display: 'none' }}
          onChange={handleFileUpload}
          disabled={uploading}
        />
      </div>
    </div>
  );
};

export default PDFUpload;