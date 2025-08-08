import { useState, useRef, useEffect } from 'react';
import { useNotifications } from '../../contexts/NotificationContext';
import './RecordingPopup.css';

const RecordingPopup = ({ isOpen, onClose, position, isRecordingHelp = false, selectedText = '', onVoiceRecorded }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordedBlob, setRecordedBlob] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [permissionStatus, setPermissionStatus] = useState('prompt'); // 'prompt', 'granted', 'denied'
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [audioLevel, setAudioLevel] = useState(0);
  
  const mediaRecorderRef = useRef(null);
  const streamRef = useRef(null);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const durationIntervalRef = useRef(null);
  const levelIntervalRef = useRef(null);
  
  const { showNotification } = useNotifications();

  // Check microphone permissions on popup open and auto-start recording for help
  useEffect(() => {
    if (isOpen) {
      checkMicrophonePermissions();
      
      // Auto-request microphone access if this is for helping another student
      if (isRecordingHelp) {
        console.log('Help mode - requesting microphone access...');
        setTimeout(async () => {
          if (permissionStatus !== 'granted') {
            console.log('Requesting microphone permissions...');
            const stream = await requestMicrophoneAccess();
            if (stream) {
              console.log('Permissions granted, auto-starting recording...');
              setTimeout(() => startRecording(), 500);
            }
          } else {
            console.log('Permissions already granted, auto-starting recording...');
            startRecording();
          }
        }, 1000);
      }
    }
    
    return () => {
      // Cleanup on close
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current);
      }
      if (levelIntervalRef.current) {
        clearInterval(levelIntervalRef.current);
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, [isOpen, isRecordingHelp]);

  const checkMicrophonePermissions = async () => {
    try {
      // Check if browser supports permissions API
      if ('permissions' in navigator) {
        const permission = await navigator.permissions.query({ name: 'microphone' });
        setPermissionStatus(permission.state);
        
        permission.addEventListener('change', () => {
          setPermissionStatus(permission.state);
        });
      } else {
        setPermissionStatus('prompt');
      }
    } catch (error) {
      console.log('Permissions API not supported, will prompt when needed');
      setPermissionStatus('prompt');
    }
  };

  const requestMicrophoneAccess = async () => {
    try {
      // Check if mediaDevices is supported (works on your vanilla HTML)
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        // Try fallback getUserMedia for older browsers
        if (navigator.getUserMedia) {
          return new Promise((resolve, reject) => {
            navigator.getUserMedia(
              { audio: true },
              (stream) => {
                streamRef.current = stream;
                setPermissionStatus('granted');
                showNotification('Microphone access granted!', 'success');
                resolve(stream);
              },
              (error) => reject(error)
            );
          });
        }
        throw new Error('MediaDevices API not supported. Please use HTTPS or a modern browser.');
      }

      // Use simple audio config for mobile compatibility (like your vanilla HTML)
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: true // Simple config like your working example
      });
      
      streamRef.current = stream;
      setPermissionStatus('granted');
      showNotification('Microphone access granted!', 'success');
      return stream;
    } catch (error) {
      console.error('Error accessing microphone:', error);
      setPermissionStatus('denied');
      
      if (error.message.includes('MediaDevices API not supported')) {
        showNotification('⚠️ Microphone needs HTTPS. Try localhost or file:// access.', 'error');
      } else if (error.name === 'NotAllowedError') {
        showNotification('Microphone access denied. Please allow and refresh.', 'error');
      } else if (error.name === 'NotFoundError') {
        showNotification('No microphone found. Please connect a microphone.', 'error');
      } else if (error.name === 'NotSupportedError') {
        showNotification('Microphone not supported on this device.', 'error');
      } else {
        showNotification(`Microphone error: ${error.message}`, 'error');
      }
      return null;
    }
  };

  const setupAudioAnalyser = (stream) => {
    try {
      audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
      analyserRef.current = audioContextRef.current.createAnalyser();
      const source = audioContextRef.current.createMediaStreamSource(stream);
      
      analyserRef.current.fftSize = 256;
      source.connect(analyserRef.current);
      
      // Start monitoring audio levels
      const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
      
      levelIntervalRef.current = setInterval(() => {
        analyserRef.current.getByteFrequencyData(dataArray);
        const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
        setAudioLevel(average / 255); // Normalize to 0-1
      }, 100);
      
    } catch (error) {
      console.error('Error setting up audio analyser:', error);
    }
  };

  const startRecording = async () => {
    console.log('startRecording called, permissionStatus:', permissionStatus);
    try {
      // Request microphone access if needed
      const stream = streamRef.current || await requestMicrophoneAccess();
      if (!stream) {
        console.log('No stream available, cannot start recording');
        return;
      }
      console.log('Stream obtained, setting up recording...');

      // Setup audio analysis for visual feedback
      setupAudioAnalyser(stream);

      // Setup MediaRecorder
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/mp4'
      });
      
      mediaRecorderRef.current = mediaRecorder;
      const audioChunks = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunks.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunks, { 
          type: MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/mp4'
        });
        setRecordedBlob(audioBlob);
        
        // Stop audio level monitoring
        if (levelIntervalRef.current) {
          clearInterval(levelIntervalRef.current);
          setAudioLevel(0);
        }
      };

      // Start recording
      mediaRecorder.start();
      setIsRecording(true);
      setRecordingDuration(0);
      
      // Start duration timer
      durationIntervalRef.current = setInterval(() => {
        setRecordingDuration(prev => prev + 1);
      }, 1000);

      showNotification('Recording started! Speak clearly into your microphone.', 'success');

      // Auto-stop after 2 minutes
      setTimeout(() => {
        if (mediaRecorderRef.current?.state === 'recording') {
          stopRecording();
        }
      }, 120000);

    } catch (error) {
      console.error('Error starting recording:', error);
      showNotification('Failed to start recording. Please check your microphone.', 'error');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
    
    setIsRecording(false);
    
    // Clear timers
    if (durationIntervalRef.current) {
      clearInterval(durationIntervalRef.current);
    }
    if (levelIntervalRef.current) {
      clearInterval(levelIntervalRef.current);
    }
    
    showNotification('Recording stopped! Review your audio before sharing.', 'success');
  };

  const uploadRecording = async () => {
    if (!recordedBlob) return;

    setUploading(true);
    
    try {
      // Simulate upload
      await new Promise(resolve => setTimeout(resolve, 2000));

      if (isRecordingHelp) {
        showNotification('Thank you for helping! Your explanation has been attached to the highlighted text.', 'success');
        onVoiceRecorded?.(recordedBlob, window.currentAddVoiceExplanation);
      } else {
        showNotification('Recording uploaded! Other students can now see your explanation.', 'success');
        onVoiceRecorded?.(recordedBlob);
      }
      
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
    setRecordingDuration(0);
    setAudioLevel(0);
  };

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getPermissionMessage = () => {
    switch (permissionStatus) {
      case 'granted':
        return null;
      case 'denied':
        return (
          <div className="permission-denied">
            <p>🎤 Microphone access is required to record voice explanations.</p>
            <p>Please enable microphone permissions in your browser settings and refresh the page.</p>
          </div>
        );
      default:
        return (
          <div className="permission-prompt">
            <p>🎤 PagePop needs microphone access to record your voice explanations.</p>
            {!navigator.mediaDevices ? (
              <div style={{ fontSize: '0.85rem', color: '#ff6b6b', marginBottom: '1rem', lineHeight: '1.4' }}>
                <strong>📱 Mobile Browser Issue:</strong><br/>
                Microphone requires HTTPS on mobile devices.<br/>
                <strong>Solutions:</strong><br/>
                • Try on desktop browser<br/>
                • Use localhost if possible<br/>
                • Contact admin for HTTPS setup
              </div>
            ) : null}
            <button 
              className="permission-btn"
              onClick={requestMicrophoneAccess}
              disabled={!navigator.mediaDevices}
            >
              {!navigator.mediaDevices ? 'Microphone Not Available' : 'Enable Microphone'}
            </button>
          </div>
        );
    }
  };

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget && !isRecordingHelp) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="popup-overlay" onClick={handleOverlayClick}>
      <div className={`popup recording-popup ${isRecordingHelp ? 'help-mode' : ''}`}>
        <button className="close-popup" onClick={onClose} title={isRecordingHelp ? 'Close help recording' : 'Close recording'}>
          &times;
        </button>
        
        <div className="recording-interface">
          <h3>{isRecordingHelp ? '🤚 Help Another Student' : 'Record Voice Explanation'}</h3>
          <p>{isRecordingHelp 
            ? 'A student needs help understanding this text. We\'ll request microphone access first!' 
            : 'Help other students by explaining this concept with your voice'
          }</p>
          
          {isRecordingHelp && selectedText && (
            <div className="help-context">
              <strong>Student needs help with:</strong>
              <div className="struggling-text">"{selectedText}"</div>
            </div>
          )}
          
          {getPermissionMessage()}
          
          {permissionStatus === 'granted' && !recordedBlob && (
            <>
              <div className="recording-controls">
                <button 
                  className={`record-button ${isRecording ? 'recording' : ''}`}
                  onClick={isRecording ? stopRecording : startRecording}
                  disabled={uploading}
                >
                  {isRecording ? '⏹️' : '🎤'}
                </button>
                
                {isRecording && (
                  <div className="recording-feedback">
                    <div className="audio-visualizer">
                      <div 
                        className="audio-level"
                        style={{ 
                          width: `${audioLevel * 100}%`,
                          backgroundColor: audioLevel > 0.1 ? '#4caf50' : '#ccc'
                        }}
                      />
                    </div>
                    <div className="recording-duration">
                      {formatDuration(recordingDuration)}
                    </div>
                  </div>
                )}
              </div>
              
              <p className="record-status">
                {isRecording 
                  ? (isRecordingHelp 
                      ? '🎤 Recording your help... Explain the concept clearly!' 
                      : 'Recording... Speak clearly into your microphone'
                    )
                  : (isRecordingHelp 
                      ? (permissionStatus === 'granted' 
                          ? 'Starting recording automatically...' 
                          : 'Requesting microphone access...'
                        )
                      : 'Click the microphone to start recording'
                    )
                }
              </p>
            </>
          )}

          {recordedBlob && (
            <div className="recording-preview">
              <div className="audio-preview">
                <div className="audio-player">
                  🎵 Voice Recording ({formatDuration(recordingDuration)})
                </div>
                <audio 
                  controls 
                  src={URL.createObjectURL(recordedBlob)}
                  className="audio-player-control"
                />
                <p>Review your explanation before sharing</p>
              </div>
              <div className="recording-actions">
                <button 
                  className="retry-btn"
                  onClick={retryRecording}
                  disabled={uploading}
                >
                  🔄 Record Again
                </button>
                <button 
                  className="upload-btn"
                  onClick={uploadRecording}
                  disabled={uploading}
                >
                  {uploading ? (
                    <>
                      <div className="spinner small" />
                      Sharing...
                    </>
                  ) : (
                    '🎯 Share Explanation'
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