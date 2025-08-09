import { useState } from 'react';
import Header from './components/UI/Header';
import PDFUpload from './components/PDF/PDFUpload';
import PDFViewer from './components/PDF/PDFViewer';
import FloatingToolbar from './components/UI/FloatingToolbar';
import DemoControls from './components/UI/DemoControls';
import MyDocumentsPopup from './components/Popups/MyDocumentsPopup';
import HelpRequestPopup from './components/Popups/HelpRequestPopup';
import RecordingPopup from './components/Popups/RecordingPopup';
import ExportPopup from './components/Popups/ExportPopup';
import NotificationProvider, { useNotifications } from './contexts/NotificationContext';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import AuthModal from './components/Auth/AuthModal';
import UserProfile from './components/Auth/UserProfile';
import PublicFeed from './components/Feed/PublicFeed';

function AppContent() {
  const [currentDocument, setCurrentDocument] = useState(null);
  const [activePopup, setActivePopup] = useState(null);
  const [selectedText, setSelectedText] = useState('');
  const [selectionPosition, setSelectionPosition] = useState({ x: 0, y: 0 });
  const [currentHighlightId, setCurrentHighlightId] = useState(null);
  const [isRecordingHelp, setIsRecordingHelp] = useState(false);
  const [isHelperMode, setIsHelperMode] = useState(false);
  const [currentHighlights, setCurrentHighlights] = useState([]);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showUploadMode, setShowUploadMode] = useState(false);
  const { showNotification } = useNotifications();
  const { currentUser } = useAuth();

  const handleDocumentUploaded = (docData) => {
    setCurrentDocument(docData);
    setShowUploadMode(false); // Return to feed after upload
  };

  const handleShowUpload = () => {
    setShowUploadMode(true);
  };

  const handleBackToFeed = () => {
    if (showUploadMode) {
      setShowUploadMode(false);
    } else {
      setCurrentDocument(null);
    }
  };

  const handleTextSelection = (text, position) => {
    setSelectedText(text);
    setSelectionPosition(position);
    setCurrentHighlightId(position.highlightId || null);
    setIsRecordingHelp(position.isRecordingHelp || false);
  };

  const handleHelpRequested = (helpRequest) => {
    console.log('Help requested for highlight:', currentHighlightId, helpRequest);
    // In real app: save help request to database and link to highlight
    // For now, just log it
  };

  const handleVoiceRecorded = (audioBlob, addVoiceExplanationFn) => {
    if (isRecordingHelp && currentHighlightId && addVoiceExplanationFn) {
      console.log('Voice explanation recorded for highlight:', currentHighlightId);
      
      // Add voice explanation to the highlight
      addVoiceExplanationFn(currentHighlightId, audioBlob, selectedText);
      
      // Reset recording state
      setIsRecordingHelp(false);
      setCurrentHighlightId(null);
      setSelectedText('');
      
      // Close the recording popup
      closePopup();
    }
  };

  const handleExportStudyNotes = () => {
    openPopup('export');
  };

  const openPopup = (popupType) => {
    setActivePopup(popupType);
  };

  const closePopup = () => {
    setActivePopup(null);
  };

  const handleToggleDemoMode = (helperMode) => {
    setIsHelperMode(helperMode);
    if (helperMode) {
      showNotification('👨‍🎓 You are now Student B (Helper) - Look for help request bubbles!', 'info');
      
      // Add test function for recording
      window.testRecordHelp = () => {
        console.log('Test recording help function called');
        setSelectedText('machine learning algorithms');
        setSelectionPosition({ 
          x: 0.2, 
          y: 0.3, 
          highlightId: 'test-highlight-1',
          pageNumber: 1,
          isRecordingHelp: true 
        });
        setIsRecordingHelp(true);
        openPopup('record');
      };
    } else {
      showNotification('👨‍🎓 You are now Student A (Needs Help) - Highlight text to request help!', 'info');
      window.testRecordHelp = null; // Clean up
    }
  };

  return (
    <div className="app">
        <Header 
          currentDocument={currentDocument || showUploadMode}
          onOpenMyDocs={() => openPopup('myDocs')}
          onOpenAuth={() => setShowAuthModal(true)}
          currentUser={currentUser}
          onBackToFeed={handleBackToFeed}
        />
        
        <main className="main-container">
          {currentDocument ? (
            <>
              <PDFViewer 
                document={currentDocument}
                onTextSelection={handleTextSelection}
                onOpenHelp={() => openPopup('help')}
                onOpenRecord={() => openPopup('record')}
                onVoiceRecorded={handleVoiceRecorded}
                onHighlightsChange={setCurrentHighlights}
                isHelperMode={isHelperMode}
              />
              <FloatingToolbar 
                onOpenHelp={() => openPopup('help')}
                onOpenRecord={() => openPopup('record')}
                onExportStudyNotes={handleExportStudyNotes}
              />
              <DemoControls 
                onToggleMode={handleToggleDemoMode}
                isHelperMode={isHelperMode}
              />
            </>
          ) : showUploadMode ? (
            <PDFUpload onDocumentUploaded={handleDocumentUploaded} />
          ) : currentUser ? (
            <PublicFeed 
              onDocumentSelect={handleDocumentUploaded}
              onUploadDocument={handleShowUpload}
            />
          ) : (
            <PDFUpload onDocumentUploaded={handleDocumentUploaded} />
          )}
        </main>

        {/* Popups */}
        <MyDocumentsPopup 
          isOpen={activePopup === 'myDocs'}
          onClose={closePopup}
          onDocumentSelect={setCurrentDocument}
        />
        
        <HelpRequestPopup 
          isOpen={activePopup === 'help'}
          onClose={closePopup}
          selectedText={selectedText}
          position={selectionPosition}
          onHelpRequested={handleHelpRequested}
        />
        
        <RecordingPopup 
          isOpen={activePopup === 'record'}
          onClose={closePopup}
          position={selectionPosition}
          isRecordingHelp={isRecordingHelp}
          selectedText={selectedText}
          onVoiceRecorded={handleVoiceRecorded}
        />
        
        <ExportPopup
          isOpen={activePopup === 'export'}
          onClose={closePopup}
          highlights={currentHighlights}
          documentTitle={currentDocument?.title || 'Study Session'}
        />
        
        <AuthModal 
          isOpen={showAuthModal}
          onClose={() => setShowAuthModal(false)}
        />
      </div>
    );
}

function App() {
  return (
    <AuthProvider>
      <NotificationProvider>
        <AppContent />
      </NotificationProvider>
    </AuthProvider>
  );
}

export default App;
