import { useState, useEffect } from 'react';
import Header from './components/UI/Header';
import LandingPage from './components/Landing/LandingPage';
import PDFUpload from './components/PDF/PDFUpload';
import PDFViewer from './components/PDF/PDFViewer';
import FloatingActionButton from './components/UI/FloatingActionButton';
import MyDocumentsPopup from './components/Popups/MyDocumentsPopup';
import HelpRequestPopup from './components/Popups/HelpRequestPopup';
import RecordingPopup from './components/Popups/RecordingPopup';
import ExportPopup from './components/Popups/ExportPopup';
import NotificationProvider, { useNotifications } from './contexts/NotificationContext';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import AuthModal from './components/Auth/AuthModal';
import UserProfile from './components/Auth/UserProfile';
import PublicFeed from './components/Feed/PublicFeed';
import analyticsService from './services/analyticsService';

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
  const [showLanding, setShowLanding] = useState(true);
  const { showNotification } = useNotifications();
  const { currentUser } = useAuth();

  // Track page views and user actions
  useEffect(() => {
    analyticsService.trackPageView('app_load');
  }, []);

  useEffect(() => {
    if (currentDocument) {
      analyticsService.trackPageView('pdf_viewer');
      analyticsService.trackDocumentOpen(currentDocument.id, 'app');
    } else if (showUploadMode) {
      analyticsService.trackPageView('upload');
    } else {
      analyticsService.trackPageView('feed');
    }
  }, [currentDocument, showUploadMode]);

  useEffect(() => {
    if (currentUser) {
      analyticsService.track('user_session_start', {
        userId: currentUser.uid,
        userEmail: currentUser.email
      });
      // Hide landing page for authenticated users
      setShowLanding(false);
    } else {
      // Show landing page for unauthenticated users
      setShowLanding(true);
    }
  }, [currentUser]);

  const handleDocumentUploaded = (docData) => {
    setCurrentDocument(docData);
    setShowUploadMode(false); // Return to feed after upload
    setShowLanding(false); // Hide landing page when document is loaded
  };

  const handleShowUpload = () => {
    analyticsService.trackFeatureUsage('upload_button', 'click');
    setShowUploadMode(true);
  };

  const handleBackToFeed = () => {
    if (showUploadMode) {
      setShowUploadMode(false);
    } else {
      setCurrentDocument(null);
    }
    setShowLanding(false); // Always go to main app when navigating
  };

  const handleTextSelection = (text, position) => {
    setSelectedText(text);
    setSelectionPosition(position);
    setCurrentHighlightId(position.highlightId || null);
    setIsRecordingHelp(position.isRecordingHelp || false);
  };

  const handleHelpRequested = async (helpRequest) => {
    console.log('Help requested for highlight:', currentHighlightId, helpRequest);
    
    // We need to get the saveHighlight function and create the highlight
    // The issue is that App.jsx doesn't have access to the useHighlighting hook
    // We need to restructure this to pass the saveHighlight function up from PDFViewer
    
    // For now, store the help request to be handled by PDFViewer
    window.pendingHelpRequest = helpRequest;
    
    showNotification('Help request created! Processing...', 'info');
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
    analyticsService.trackFeatureUsage(`${popupType}_popup`, 'open');
    setActivePopup(popupType);
  };

  const closePopup = () => {
    setActivePopup(null);
  };

  const handleToggleDemoMode = (helperMode) => {
    analyticsService.trackFeatureUsage('demo_mode', helperMode ? 'helper_mode' : 'student_mode');
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

  // Show landing page for new users
  if (showLanding && !currentDocument && !showUploadMode) {
    return (
      <>
        <LandingPage 
          onDocumentUploaded={handleDocumentUploaded}
          onShowAuth={() => setShowAuthModal(true)}
        />
        <AuthModal 
          isOpen={showAuthModal}
          onClose={() => setShowAuthModal(false)}
        />
      </>
    );
  }

  return (
    <div className="app">
        <Header 
          currentDocument={currentDocument || showUploadMode}
          onOpenMyDocs={() => openPopup('myDocs')}
          onOpenAuth={() => setShowAuthModal(true)}
          currentUser={currentUser}
          onBackToFeed={handleBackToFeed}
        />
        
        <main className={`main-container ${currentDocument ? 'pdf-view' : 'feed-view'}`}>
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
              <FloatingActionButton 
                onOpenHelp={() => openPopup('help')}
                onOpenRecord={() => openPopup('record')}
                onExportStudyNotes={handleExportStudyNotes}
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
          currentDocument={currentDocument}
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
