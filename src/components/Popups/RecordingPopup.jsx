import { useState } from 'react';
import { useNotifications } from '../../contexts/NotificationContext';
import './RecordingPopup.css';

const RecordingPopup = ({ isOpen, onClose, position }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordedBlob, setRecordedBlob] = useState(null);
  const [uploading, setUploading] = useState(false);
  const { showNotification } = useNotifications();

  const startRecording = async () => {
    try {
      // In a real app, you would use MediaRecorder here
      // For UI demo, we'll simulate recording
      setIsRecording(true);
      showNotification('Recording started...', 'info');

      // Auto-stop after 10 seconds for demo
      setTimeout(() => {
        if (isRecording) {
          stopRecording();
        }
      }, 10000);

    } catch (error) {
      console.error('Error starting recording:', error);
      showNotification('Failed to start recording. Please check camera permissions.', 'error');
    }
  };

  const stopRecording = () => {
    setIsRecording(false);
    // Simulate recorded blob
    setRecordedBlob(new Blob(['mock-video-data'], { type: 'video/webm' }));
    showNotification('Recording stopped', 'success');
  };

  const uploadRecording = async () => {
    if (!recordedBlob) return;

    setUploading(true);
    
    try {
      // Simulate upload
      await new Promise(resolve => setTimeout(resolve, 2000));

      showNotification('Recording uploaded! Other students can now see your explanation.', 'success');
      onClose();
      
      // Reset state
      setRecordedBlob(null);
      setIsRecording(false);
      
    } catch (error) {
      console.error('Upload error:', error);
      showNotification('Failed to upload recording', 'error');
    } finally {
      setUploading(false);
    }
  };

  const retryRecording = () => {
    setRecordedBlob(null);
    setIsRecording(false);
  };

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="popup-overlay" onClick={handleOverlayClick}>
      <div className="popup recording-popup">
        <button className="close-popup" onClick={onClose}>
          &times;
        </button>
        
        <div className="recording-interface">
          <h3>Record Your Explanation</h3>
          <p>Help other students by explaining this concept</p>
          
          {!recordedBlob ? (
            <>
              <button 
                className={`record-button ${isRecording ? 'recording' : ''}`}
                onClick={isRecording ? stopRecording : startRecording}
                disabled={uploading}
              >
                {isRecording ? '⏹️' : '🎥'}
              </button>
              <p className="record-status">
                {isRecording ? 'Recording... Click to stop' : 'Click to start recording'}
              </p>
            </>
          ) : (
            <div className="recording-preview">
              <div className="video-preview">
                <div className="video-placeholder">
                  🎥 Recording Preview
                </div>
                <p>Your recording is ready!</p>
              </div>
              <div className="recording-actions">
                <button 
                  className="retry-btn"
                  onClick={retryRecording}
                  disabled={uploading}
                >
                  Record Again
                </button>
                <button 
                  className="upload-btn"
                  onClick={uploadRecording}
                  disabled={uploading}
                >
                  {uploading ? (
                    <>
                      <div className="spinner small" />
                      Uploading...
                    </>
                  ) : (
                    'Share Explanation'
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RecordingPopup;