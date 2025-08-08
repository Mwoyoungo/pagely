import { useState, useRef } from 'react';
import { useNotifications } from '../../contexts/NotificationContext';
import { v4 as uuidv4 } from 'uuid';
import './PDFUpload.css';

const PDFUpload = ({ onDocumentUploaded }) => {
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);
  const { showNotification } = useNotifications();

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file || file.type !== 'application/pdf') {
      showNotification('Please select a PDF file', 'error');
      return;
    }

    setUploading(true);
    
    try {
      // Create URL for the uploaded file
      const fileUrl = URL.createObjectURL(file);
      
      // Mock document data structure
      const documentData = {
        id: uuidv4(),
        title: file.name,
        url: fileUrl, // This will work with react-pdf for local files
        size: file.size,
        uploadedAt: new Date().toISOString(),
        // Mock interactions for demonstration
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
            createdAt: new Date(Date.now() - 3600000).toISOString() // 1 hour ago
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
            createdAt: new Date(Date.now() - 7200000).toISOString() // 2 hours ago
          }
        ]
      };

      // Simulate upload delay
      await new Promise(resolve => setTimeout(resolve, 2000));

      showNotification('Document uploaded successfully!', 'success');
      onDocumentUploaded(documentData);
      
    } catch (error) {
      console.error('Upload error:', error);
      showNotification('Failed to upload document', 'error');
    } finally {
      setUploading(false);
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
              <div className="spinner" />
              <p>Uploading...</p>
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