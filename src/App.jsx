import { useState } from 'react';
import Header from './components/UI/Header';
import PDFUpload from './components/PDF/PDFUpload';
import PDFViewer from './components/PDF/PDFViewer';
import FloatingToolbar from './components/UI/FloatingToolbar';
import MyDocumentsPopup from './components/Popups/MyDocumentsPopup';
import HelpRequestPopup from './components/Popups/HelpRequestPopup';
import RecordingPopup from './components/Popups/RecordingPopup';
import NotificationProvider from './contexts/NotificationContext';

function App() {
  const [currentDocument, setCurrentDocument] = useState(null);
  const [activePopup, setActivePopup] = useState(null);
  const [selectedText, setSelectedText] = useState('');
  const [selectionPosition, setSelectionPosition] = useState({ x: 0, y: 0 });
  const [currentHighlightId, setCurrentHighlightId] = useState(null);

  const handleDocumentUploaded = (docData) => {
    setCurrentDocument(docData);
  };

  const handleTextSelection = (text, position) => {
    setSelectedText(text);
    setSelectionPosition(position);
    setCurrentHighlightId(position.highlightId || null);
  };

  const handleHelpRequested = (helpRequest) => {
    console.log('Help requested for highlight:', currentHighlightId, helpRequest);
    // In real app: save help request to database and link to highlight
    // For now, just log it
  };

  const openPopup = (popupType) => {
    setActivePopup(popupType);
  };

  const closePopup = () => {
    setActivePopup(null);
  };

  return (
    <NotificationProvider>
      <div className="app">
        <Header 
          currentDocument={currentDocument}
          onOpenMyDocs={() => openPopup('myDocs')}
        />
        
        <main className="main-container">
          {currentDocument ? (
            <>
              <PDFViewer 
                document={currentDocument}
                onTextSelection={handleTextSelection}
                onOpenHelp={() => openPopup('help')}
              />
              <FloatingToolbar 
                onOpenHelp={() => openPopup('help')}
                onOpenRecord={() => openPopup('record')}
              />
            </>
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
        />
      </div>
    </NotificationProvider>
  );
}

export default App;
