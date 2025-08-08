import { useState } from 'react';
import { useNotifications } from '../../contexts/NotificationContext';
import { exportStudySession } from '../../utils/exportUtils';
import './ExportPopup.css';

const ExportPopup = ({ isOpen, onClose, highlights = [], documentTitle = 'Study Session' }) => {
  const [exporting, setExporting] = useState(false);
  const [selectedFormat, setSelectedFormat] = useState('study-guide');
  const { showNotification } = useNotifications();

  const exportFormats = [
    {
      id: 'study-guide',
      title: '📚 Study Guide',
      description: 'Markdown file with all highlights and explanations organized by page',
      icon: '📄',
      recommended: true
    },
    {
      id: 'json',
      title: '💾 Data Export',
      description: 'JSON file with all highlight data for backup or sharing',
      icon: '🔧',
      recommended: false
    },
    {
      id: 'audio-list',
      title: '🎵 Audio Summary',
      description: 'List of all voice explanations (individual audio files coming soon)',
      icon: '🎧',
      recommended: false
    }
  ];

  const handleExport = async () => {
    if (!highlights || highlights.length === 0) {
      showNotification('No highlights to export! Start by highlighting some text.', 'error');
      return;
    }

    setExporting(true);
    
    try {
      await exportStudySession(highlights, documentTitle, selectedFormat);
      
      const formatNames = {
        'study-guide': 'Study Guide',
        'json': 'Data Export', 
        'audio-list': 'Audio Summary'
      };
      
      showNotification(`${formatNames[selectedFormat]} downloaded successfully!`, 'success');
      onClose();
      
    } catch (error) {
      console.error('Export failed:', error);
      showNotification(`Export failed: ${error.message}`, 'error');
    } finally {
      setExporting(false);
    }
  };

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget && !exporting) {
      onClose();
    }
  };

  if (!isOpen) return null;

  const stats = {
    total: highlights.length,
    withVoice: highlights.filter(h => h.voiceExplanations?.length > 0).length,
    needsHelp: highlights.filter(h => h.needsHelp).length,
    pages: [...new Set(highlights.map(h => h.pageNumber))].length
  };

  return (
    <div className="popup-overlay" onClick={handleOverlayClick}>
      <div className="popup export-popup">
        <button className="close-popup" onClick={onClose} disabled={exporting}>
          &times;
        </button>
        
        <div className="export-interface">
          <h3>📤 Export Study Session</h3>
          <p>Download your collaborative study notes and explanations</p>
          
          {/* Session stats */}
          <div className="export-stats">
            <div className="stat-card">
              <div className="stat-number">{stats.total}</div>
              <div className="stat-label">Highlights</div>
            </div>
            <div className="stat-card">
              <div className="stat-number">{stats.withVoice}</div>
              <div className="stat-label">Voice Explanations</div>
            </div>
            <div className="stat-card">
              <div className="stat-number">{stats.needsHelp}</div>
              <div className="stat-label">Help Requests</div>
            </div>
            <div className="stat-card">
              <div className="stat-number">{stats.pages}</div>
              <div className="stat-label">Pages</div>
            </div>
          </div>

          {/* Format selection */}
          <div className="export-formats">
            <h4>Choose Export Format:</h4>
            
            {exportFormats.map(format => (
              <div 
                key={format.id}
                className={`format-option ${selectedFormat === format.id ? 'selected' : ''}`}
                onClick={() => setSelectedFormat(format.id)}
              >
                <div className="format-icon">{format.icon}</div>
                <div className="format-info">
                  <div className="format-title">
                    {format.title}
                    {format.recommended && <span className="recommended-badge">Recommended</span>}
                  </div>
                  <div className="format-description">{format.description}</div>
                </div>
                <div className="format-radio">
                  <input
                    type="radio"
                    name="exportFormat"
                    value={format.id}
                    checked={selectedFormat === format.id}
                    onChange={(e) => setSelectedFormat(e.target.value)}
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Document title */}
          <div className="export-title">
            <label>Document Title:</label>
            <div className="document-title">{documentTitle}</div>
          </div>

          {/* Export actions */}
          <div className="export-actions">
            <button 
              className="cancel-btn"
              onClick={onClose}
              disabled={exporting}
            >
              Cancel
            </button>
            <button 
              className="export-btn"
              onClick={handleExport}
              disabled={exporting || stats.total === 0}
            >
              {exporting ? (
                <>
                  <div className="spinner small" />
                  Exporting...
                </>
              ) : (
                <>📤 Export Study Notes</>
              )}
            </button>
          </div>

          {stats.total === 0 && (
            <div className="no-content-message">
              <p>🎯 Start highlighting text to create exportable study notes!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ExportPopup;