import { useState } from 'react';
import './DemoControls.css';

const DemoControls = ({ onToggleMode, isHelperMode }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className={`demo-controls ${isExpanded ? 'expanded' : ''}`}>
      <button 
        className="demo-toggle"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        🎭 Demo Mode
      </button>
      
      {isExpanded && (
        <div className="demo-panel">
          <h4>Test Collaborative Learning</h4>
          <p>Switch between student perspectives:</p>
          
          <div className="mode-buttons">
            <button 
              className={`mode-btn ${!isHelperMode ? 'active' : ''}`}
              onClick={() => onToggleMode(false)}
            >
              📚 Student A<br />
              <small>(Needs Help)</small>
            </button>
            
            <button 
              className={`mode-btn ${isHelperMode ? 'active' : ''}`}
              onClick={() => onToggleMode(true)}
            >
              🎓 Student B<br />
              <small>(Helper)</small>
            </button>
          </div>
          
          <div className="instructions">
            {!isHelperMode ? (
              <div>
                <strong>As Student A:</strong>
                <ol>
                  <li>Highlight confusing text</li>
                  <li>Click "📝 Explain this concept"</li>
                  <li>Switch to Student B mode to see help requests</li>
                </ol>
              </div>
            ) : (
              <div>
                <strong>As Student B:</strong>
                <ol>
                  <li>Look for pulsing 🤚 help bubbles</li>
                  <li>Hover to see what students need help with</li>
                  <li>Click "🎤 Record Explanation" to help</li>
                </ol>
                <button 
                  className="test-record-btn"
                  onClick={() => {
                    // Trigger test recording
                    if (window.testRecordHelp) {
                      window.testRecordHelp();
                    }
                  }}
                  style={{
                    background: '#ff9800',
                    color: 'white',
                    border: 'none',
                    padding: '0.5rem 1rem',
                    borderRadius: '6px',
                    marginTop: '0.5rem',
                    cursor: 'pointer',
                    fontSize: '0.8rem'
                  }}
                >
                  🧪 Test Recording
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default DemoControls;