import { useState, useRef, useEffect } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import { useNotifications } from '../../contexts/NotificationContext';
import { useHighlighting } from '../../hooks/useHighlighting';
import InteractionBubble from '../Collaboration/InteractionBubble';
import HelpRequestBubble from '../Collaboration/HelpRequestBubble';
import Highlight from './Highlight';
import './PDFViewer.css';

// Import react-pdf CSS for proper text layer rendering
import 'react-pdf/dist/Page/TextLayer.css';
import 'react-pdf/dist/Page/AnnotationLayer.css';

// Configure PDF.js worker - use local worker file
pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.js';

const PDFViewer = ({ document: pdfDocument, onTextSelection, onOpenHelp, onOpenRecord, onVoiceRecorded, onHighlightsChange, isHelperMode }) => {
  const [numPages, setNumPages] = useState(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [scale, setScale] = useState(1.2);
  const [highlightMode, setHighlightMode] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const containerRef = useRef(null);
  const { showNotification } = useNotifications();
  
  // Initialize highlighting system with Firebase integration
  const {
    highlights,
    pendingHighlight,
    loading: highlightsLoading,
    createHighlight,
    saveHighlight,
    cancelHighlight,
    getHighlightsForPage,
    findOverlappingHighlight,
    addHelpToHighlight,
    addVoiceExplanation
  } = useHighlighting(pdfDocument);

  // Handle recording help for other students
  const handleRecordHelp = (highlight) => {
    console.log('handleRecordHelp called for highlight:', highlight.id);
    // Set the highlight as the one we're helping with
    onTextSelection(highlight.text, { 
      x: highlight.position.x, 
      y: highlight.position.y,
      highlightId: highlight.id,
      pageNumber: highlight.pageNumber,
      isRecordingHelp: true // Flag to indicate we're recording help
    });
    
    // Open recording popup with voice explanation function
    console.log('Opening recording popup...');
    setTimeout(() => {
      onOpenRecord();
      // Pass the addVoiceExplanation function to the parent
      if (onVoiceRecorded) {
        window.currentAddVoiceExplanation = addVoiceExplanation;
      }
    }, 100);
  };

  // PDF Document handlers
  const onDocumentLoadSuccess = ({ numPages }) => {
    setNumPages(numPages);
    setLoading(false);
    setError(null);
    showNotification(`PDF loaded successfully! ${numPages} pages`, 'success');
  };

  const onDocumentLoadError = (error) => {
    console.error('Error loading PDF:', error);
    setError('Failed to load PDF document');
    setLoading(false);
    showNotification('Failed to load PDF document', 'error');
  };

  // Enhanced text selection handler with intelligent highlighting
  const handleTextSelection = () => {
    const selection = window.getSelection();
    if (!selection.toString().trim()) return;

    const range = selection.getRangeAt(0);
    const rect = range.getBoundingClientRect();
    
    // Find the page container for accurate positioning
    const pageContainer = containerRef.current.querySelector('.pdf-page-container');
    if (!pageContainer) {
      console.error('Page container not found');
      return;
    }
    
    const pageRect = pageContainer.getBoundingClientRect();
    
    // Calculate relative position within the current page container
    const relativeX = (rect.left - pageRect.left) / pageRect.width;
    const relativeY = (rect.top - pageRect.top) / pageRect.height;
    const relativeWidth = rect.width / pageRect.width;
    const relativeHeight = rect.height / pageRect.height;
    
    // Get page number from the closest page element
    let containerElement = range.startContainer;
    
    // If it's a text node, get its parent element
    if (containerElement.nodeType === Node.TEXT_NODE) {
      containerElement = containerElement.parentElement;
    }
    
    // Find the page container element
    const pageElement = containerElement.closest('[data-page-number]');
    const currentPage = pageElement ? parseInt(pageElement.dataset.pageNumber) : pageNumber;
    
    const selectedText = selection.toString();
    const position = { 
      x: relativeX, 
      y: relativeY, 
      width: relativeWidth,
      height: relativeHeight,
      pageNumber: currentPage 
    };
    
    // Clear selection
    selection.removeAllRanges();
    
    // Check if overlapping with existing highlight
    const overlappingHighlight = findOverlappingHighlight(position, currentPage);
    
    if (overlappingHighlight) {
      // If overlapping with existing highlight, show help for that highlight
      showNotification(`Clicked on existing highlight: "${overlappingHighlight.text.slice(0, 30)}..."`, 'info');
      if (overlappingHighlight.hasHelp) {
        // Show existing help
        showNotification('Viewing existing help for this highlight', 'info');
      } else {
        // Offer to add help to existing highlight
        onTextSelection(overlappingHighlight.text, { 
          ...position, 
          highlightId: overlappingHighlight.id 
        });
        onOpenHelp();
      }
      return;
    }
    
    // Create new highlight
    const newHighlight = createHighlight(selectedText, position, currentPage);
    
    if (newHighlight) {
      showNotification('Text highlighted! Click "Get Help" to request assistance.', 'info');
      
      // Pass data to parent for help popup
      onTextSelection(selectedText, { 
        ...position,
        highlightId: newHighlight.id 
      });
      
      // Auto-open help popup - this is the magic of PagePop!
      setTimeout(() => {
        onOpenHelp();
      }, 500);
    }
  };

  const handleInteractionClick = (interaction) => {
    const messages = {
      voice_note: `Playing ${interaction.userDisplayName}'s voice note: "${interaction.content.message}"`,
      video_explanation: `Playing ${interaction.userDisplayName}'s video explanation...`
    };
    
    showNotification(messages[interaction.type] || 'Playing interaction...', 'info');
  };

  // Handle page navigation
  const goToPrevPage = () => {
    setPageNumber(prev => Math.max(1, prev - 1));
  };

  const goToNextPage = () => {
    setPageNumber(prev => Math.min(numPages, prev + 1));
  };

  // Add mouseup event listener for text selection
  useEffect(() => {
    const handleMouseUp = () => {
      setTimeout(handleTextSelection, 10); // Small delay to ensure selection is complete
    };

    const globalDoc = window.document;
    globalDoc.addEventListener('mouseup', handleMouseUp);
    return () => globalDoc.removeEventListener('mouseup', handleMouseUp);
  }, [highlightMode, pageNumber]);

  // Notify parent when highlights change
  useEffect(() => {
    if (onHighlightsChange) {
      onHighlightsChange(highlights);
    }
  }, [highlights, onHighlightsChange]);

  // Listen for pending help requests from the help popup
  useEffect(() => {
    const checkPendingHelpRequest = async () => {
      if (window.pendingHelpRequest && pendingHighlight) {
        console.log('🎯 Processing pending help request:', window.pendingHelpRequest);
        console.log('📍 Pending highlight position:', pendingHighlight.position);
        
        try {
          // Save the pending highlight with the help request
          const savedHighlight = await saveHighlight(pendingHighlight, window.pendingHelpRequest);
          
          if (savedHighlight) {
            console.log('✅ Highlight saved successfully:', savedHighlight);
            showNotification('✅ Highlight saved with help request! Other students can now see it.', 'success');
          }
        } catch (error) {
          console.error('Error saving highlight with help request:', error);
          showNotification('❌ Failed to save highlight: ' + error.message, 'error');
        }
        
        // Clear the pending request
        window.pendingHelpRequest = null;
      }
    };

    // Check for pending help requests periodically
    const interval = setInterval(checkPendingHelpRequest, 500);
    
    return () => clearInterval(interval);
  }, [pendingHighlight, saveHighlight, showNotification]);

  if (!pdfDocument || !pdfDocument.url) {
    return (
      <div className="pdf-viewer">
        <div className="loading">No document selected</div>
      </div>
    );
  }

  return (
    <div className="pdf-viewer" ref={containerRef}>
      <div className="pdf-controls">
        {/* Navigation */}
        <div className="page-navigation">
          <button 
            onClick={goToPrevPage}
            disabled={pageNumber <= 1}
          >
            ← Prev
          </button>
          <span className="page-info">
            Page {pageNumber} of {numPages || '?'}
          </span>
          <button 
            onClick={goToNextPage}
            disabled={pageNumber >= numPages}
          >
            Next →
          </button>
        </div>

        {/* Zoom Controls */}
        <div className="zoom-controls">
          <button onClick={() => setScale(Math.max(0.5, scale - 0.1))}>
            Zoom Out
          </button>
          <span>{Math.round(scale * 100)}%</span>
          <button onClick={() => setScale(Math.min(3, scale + 0.1))}>
            Zoom In
          </button>
        </div>

        {/* Highlight Mode */}
        <button 
          className={`highlight-toggle ${highlightMode ? 'active' : ''}`}
          onClick={() => {
            setHighlightMode(!highlightMode);
            showNotification(
              highlightMode ? 'Highlight mode disabled' : 'Highlight mode enabled - select text to get help!', 
              'info'
            );
          }}
        >
          ✨ {highlightMode ? 'Exit Highlight' : 'Highlight Mode'}
        </button>
      </div>
      
      {loading && <div className="loading">Loading PDF...</div>}
      
      {error && (
        <div className="error-message">
          <p>{error}</p>
          <button onClick={() => window.location.reload()}>Retry</button>
        </div>
      )}

      <div className="pdf-document-container">
        <Document
          file={pdfDocument.url}
          onLoadSuccess={onDocumentLoadSuccess}
          onLoadError={onDocumentLoadError}
          loading={<div className="loading">Loading PDF...</div>}
          error={<div className="error-message">Failed to load PDF</div>}
        >
          <div className="pdf-page-container" data-page-number={pageNumber}>
            <Page
              pageNumber={pageNumber}
              scale={scale}
              renderTextLayer={true}
              renderAnnotationLayer={false}
              loading={<div className="loading">Loading page...</div>}
            />
            
            {/* Loading indicator for highlights */}
            {highlightsLoading && (
              <div className="highlights-loading">
                <div className="spinner"></div>
                <span>Loading collaborative highlights...</span>
              </div>
            )}
            
            {/* Render highlights for current page */}
            {!highlightsLoading && getHighlightsForPage(pageNumber)
              .filter(highlight => !pendingHighlight || highlight.id !== pendingHighlight.id) // Avoid duplicates
              .map(highlight => (
              <Highlight
                key={highlight.id}
                highlight={highlight}
                onClick={(h) => showNotification(`Highlight: "${h.text.slice(0, 30)}..."`, 'info')}
                onHelpRequest={(h) => {
                  onTextSelection(h.text, { 
                    x: h.position.x, 
                    y: h.position.y,
                    highlightId: h.id,
                    pageNumber: h.pageNumber 
                  });
                  onOpenHelp();
                }}
                style={{
                  left: `${highlight.position.x * 100}%`,
                  top: `${highlight.position.y * 100}%`,
                  width: `${highlight.position.width * 100}%`,
                  height: `${highlight.position.height * 100}%`
                }}
              />
            ))}
            
            {/* Render pending highlight */}
            {pendingHighlight && pendingHighlight.pageNumber === pageNumber && (
              <Highlight
                key={pendingHighlight.id}
                highlight={pendingHighlight}
                isPending={true}
                onClick={() => {
                  onTextSelection(pendingHighlight.text, { 
                    x: pendingHighlight.position.x, 
                    y: pendingHighlight.position.y,
                    highlightId: pendingHighlight.id,
                    pageNumber: pendingHighlight.pageNumber 
                  });
                  onOpenHelp();
                }}
                style={{
                  left: `${pendingHighlight.position.x * 100}%`,
                  top: `${pendingHighlight.position.y * 100}%`,
                  width: `${pendingHighlight.position.width * 100}%`,
                  height: `${pendingHighlight.position.height * 100}%`
                }}
              />
            )}

            {/* Render help request bubbles for highlights needing help (only in helper mode) */}
            {isHelperMode && getHighlightsForPage(pageNumber)
              .filter(highlight => highlight.needsHelp)
              .map(highlight => (
                <HelpRequestBubble
                  key={`help-${highlight.id}`}
                  highlight={highlight}
                  onRecordHelp={handleRecordHelp}
                  style={{
                    left: `${(highlight.position.x + highlight.position.width/2) * 100}%`,
                    top: `${(highlight.position.y + highlight.position.height/2) * 100}%`
                  }}
                />
              ))
            }

            {/* Render interaction bubbles for current page */}
            {pdfDocument.interactions
              ?.filter(interaction => interaction.pageNumber === pageNumber)
              .map(interaction => (
                <InteractionBubble
                  key={interaction.id}
                  interaction={interaction}
                  onClick={() => handleInteractionClick(interaction)}
                  style={{
                    position: 'absolute',
                    left: `${interaction.x * 100}%`,
                    top: `${interaction.y * 100}%`,
                    transform: 'translate(-50%, -50%)'
                  }}
                />
              ))
            }
          </div>
        </Document>
      </div>
    </div>
  );
};

export default PDFViewer;