import { useState, useRef, useEffect } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import { useAuth } from '../../contexts/AuthContext';
import { useNotifications } from '../../contexts/NotificationContext';
import { useHighlighting } from '../../hooks/useHighlighting';
import InteractionBubble from '../Collaboration/InteractionBubble';
import HelpRequestBubble from '../Collaboration/HelpRequestBubble';
import ClassEnrollmentPopup from '../Popups/ClassEnrollmentPopup';
import Highlight from './Highlight';
import ClassService from '../../services/classService';
import './PDFViewer.css';

// Import react-pdf CSS for proper text layer rendering
import 'react-pdf/dist/Page/TextLayer.css';
import 'react-pdf/dist/Page/AnnotationLayer.css';

// Configure PDF.js worker - use local worker file
pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.js';

const PDFViewer = ({ document: pdfDocument, onTextSelection, onOpenHelp, onOpenRecord, onVoiceRecorded, onHighlightsChange, isHelperMode }) => {
  const [numPages, setNumPages] = useState(null);
  const [scale, setScale] = useState(() => {
    // Mobile-first responsive scaling optimized for South African students
    if (window.innerWidth <= 480) return 0.9; // Larger scale for small phones
    if (window.innerWidth <= 768) return 0.85; // Improved mobile scale
    return 1.0;
  });
  const [highlightMode, setHighlightMode] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [showClassEnrollment, setShowClassEnrollment] = useState(false);
  const [hasShownEnrollment, setHasShownEnrollment] = useState(false);
  const [textContentCheck, setTextContentCheck] = useState({ 
    isChecking: false, 
    hasText: null, 
    isImageBased: false 
  });
  const containerRef = useRef(null);
  const { currentUser } = useAuth();
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

  // Check PDF text content for highlighting capability
  const checkPDFTextContent = async (pdf) => {
    setTextContentCheck({ isChecking: true, hasText: null, isImageBased: false });
    
    try {
      let totalTextLength = 0;
      const maxPagesToCheck = Math.min(3, pdf.numPages); // Check first 3 pages or all if less
      
      for (let pageNum = 1; pageNum <= maxPagesToCheck; pageNum++) {
        const page = await pdf.getPage(pageNum);
        const textContent = await page.getTextContent();
        
        const pageText = textContent.items.map(item => item.str).join('').trim();
        totalTextLength += pageText.length;
      }
      
      const hasText = totalTextLength > 50; // Threshold: at least 50 characters
      const isImageBased = !hasText;
      
      setTextContentCheck({ 
        isChecking: false, 
        hasText, 
        isImageBased 
      });
      
      // Show notification if PDF is image-based
      if (isImageBased) {
        setTimeout(() => {
          showNotification(
            '⚠️ This PDF appears to be image-based and may not support highlighting. Try converting through Google Docs for full functionality.',
            'warning',
            8000 // Show for 8 seconds
          );
        }, 2000);
      }
      
    } catch (error) {
      console.error('Error checking PDF text content:', error);
      setTextContentCheck({ isChecking: false, hasText: true, isImageBased: false }); // Assume it has text on error
    }
  };

  // PDF Document handlers
  const onDocumentLoadSuccess = ({ numPages }) => {
    setNumPages(numPages);
    setLoading(false);
    setError(null);
    showNotification(`PDF loaded successfully! ${numPages} pages`, 'success');
    
    // Check text content for highlighting capability
    if (window.pdfjsLib) {
      window.pdfjsLib.getDocument(pdfDocument.url).promise.then(checkPDFTextContent);
    }
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

    let range;
    try {
      range = selection.getRangeAt(0);
    } catch (error) {
      console.log('No range available:', error);
      return;
    }

    const rect = range.getBoundingClientRect();
    
    // Find the page container for accurate positioning
    let pageContainer = containerRef.current?.querySelector('.pdf-page-container');
    
    // If not found, try to find the closest page container from the selection
    if (!pageContainer) {
      let element = range.commonAncestorContainer;
      if (element.nodeType === Node.TEXT_NODE) {
        element = element.parentElement;
      }
      pageContainer = element.closest('.pdf-page-container');
      
      if (!pageContainer) {
        console.error('Page container not found');
        return;
      }
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
    const currentPage = pageElement ? parseInt(pageElement.dataset.pageNumber) : 1;
    
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

  // Scroll to specific page
  const scrollToPage = (pageNum) => {
    const pageElement = containerRef.current?.querySelector(`[data-page-number="${pageNum}"]`);
    if (pageElement) {
      pageElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // Handle resize and mobile detection
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth <= 768;
      setIsMobile(mobile);
      
      // Adjust scale for mobile with improved readability
      if (window.innerWidth <= 480 && scale < 0.9) {
        setScale(0.9); // Better scale for small phones
      } else if (window.innerWidth <= 768 && window.innerWidth > 480 && scale < 0.85) {
        setScale(0.85); // Improved mobile scale
      } else if (!mobile && scale < 1.0) {
        setScale(1.0);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [scale]);

  // Add touch gesture support for mobile
  useEffect(() => {
    if (!isMobile || !containerRef.current) return;

    let initialDistance = 0;
    let initialScale = scale;

    const handleTouchStart = (e) => {
      if (e.touches.length === 2) {
        const touch1 = e.touches[0];
        const touch2 = e.touches[1];
        initialDistance = Math.sqrt(
          Math.pow(touch2.clientX - touch1.clientX, 2) + 
          Math.pow(touch2.clientY - touch1.clientY, 2)
        );
        initialScale = scale;
      }
    };

    const handleTouchMove = (e) => {
      if (e.touches.length === 2) {
        e.preventDefault();
        const touch1 = e.touches[0];
        const touch2 = e.touches[1];
        const currentDistance = Math.sqrt(
          Math.pow(touch2.clientX - touch1.clientX, 2) + 
          Math.pow(touch2.clientY - touch1.clientY, 2)
        );
        
        const scaleChange = currentDistance / initialDistance;
        const newScale = Math.min(1.5, Math.max(0.5, initialScale * scaleChange));
        setScale(newScale);
      }
    };

    const container = containerRef.current;
    container.addEventListener('touchstart', handleTouchStart, { passive: false });
    container.addEventListener('touchmove', handleTouchMove, { passive: false });

    return () => {
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchmove', handleTouchMove);
    };
  }, [isMobile, scale]);

  // Global audio cleanup when leaving PDF viewer
  useEffect(() => {
    const stopAllAudio = () => {
      // Stop all audio elements on the page
      const audioElements = document.querySelectorAll('audio');
      audioElements.forEach(audio => {
        if (!audio.paused) {
          audio.pause();
          audio.currentTime = 0;
        }
      });
      console.log('🛑 Stopped all audio playback');
    };

    const handleBeforeUnload = stopAllAudio;
    const handlePageHide = stopAllAudio;
    const handleUnload = stopAllAudio;
    
    // Add event listeners for various page exit scenarios
    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('pagehide', handlePageHide);
    window.addEventListener('unload', handleUnload);
    
    // Cleanup on component unmount (when navigating away from PDF viewer)
    return () => {
      stopAllAudio();
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('pagehide', handlePageHide);
      window.removeEventListener('unload', handleUnload);
    };
  }, []);

  // Add mouse and touch event listeners for text selection
  useEffect(() => {
    const handleMouseUp = () => {
      setTimeout(handleTextSelection, 10); // Small delay to ensure selection is complete
    };

    const handleTouchEnd = () => {
      // On mobile, check for selection after touch events
      setTimeout(() => {
        const selection = window.getSelection();
        if (selection && selection.toString().trim()) {
          handleTextSelection();
        }
      }, 100); // Longer delay for mobile to ensure selection is complete
    };

    const globalDoc = window.document;
    globalDoc.addEventListener('mouseup', handleMouseUp);
    globalDoc.addEventListener('touchend', handleTouchEnd);
    globalDoc.addEventListener('selectionchange', () => {
      // Handle selection change events (important for mobile)
      if (isMobile) {
        setTimeout(() => {
          const selection = window.getSelection();
          if (selection && selection.toString().trim()) {
            handleTextSelection();
          }
        }, 200);
      }
    });

    return () => {
      globalDoc.removeEventListener('mouseup', handleMouseUp);
      globalDoc.removeEventListener('touchend', handleTouchEnd);
    };
  }, [highlightMode, isMobile]);

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

  // Class enrollment popup timer - show after 120 seconds
  useEffect(() => {
    if (!currentUser || !pdfDocument || hasShownEnrollment) return;

    const timer = setTimeout(async () => {
      try {
        // Check if user has already requested class for this document
        const hasRequested = await ClassService.hasUserRequestedClass(currentUser.uid, pdfDocument.id);
        
        if (!hasRequested) {
          setShowClassEnrollment(true);
          setHasShownEnrollment(true);
        }
      } catch (error) {
        console.error('Error checking class request status:', error);
        // Still show popup even if check fails
        setShowClassEnrollment(true);
        setHasShownEnrollment(true);
      }
    }, 120000); // 120 seconds = 2 minutes

    return () => clearTimeout(timer);
  }, [currentUser, pdfDocument, hasShownEnrollment]);

  if (!pdfDocument || !pdfDocument.url) {
    return (
      <div className="pdf-viewer">
        <div className="loading">No document selected</div>
      </div>
    );
  }

  return (
    <div className="pdf-viewer" ref={containerRef}>
      {loading && <div className="loading">Loading PDF...</div>}
      
      {error && (
        <div className="error-message">
          <p>{error}</p>
          <button onClick={() => window.location.reload()}>Retry</button>
        </div>
      )}
      
      {/* Text content warning */}
      {textContentCheck.isImageBased && !loading && (
        <div className="pdf-warning-banner">
          <div className="warning-content">
            <span className="warning-icon">⚠️</span>
            <div className="warning-text">
              <strong>Limited Highlighting</strong>
              <p>This PDF is image-based. For full highlighting functionality, try converting it through Google Docs first.</p>
            </div>
            <button 
              className="dismiss-warning"
              onClick={() => setTextContentCheck(prev => ({ ...prev, isImageBased: false }))}
            >
              ×
            </button>
          </div>
        </div>
      )}
      
      {/* Mobile highlighting instructions */}
      {isMobile && !textContentCheck.isImageBased && textContentCheck.hasText && (
        <div className="mobile-instruction-banner">
          <div className="instruction-content">
            <span className="instruction-icon">💡</span>
            <div className="instruction-text">
              <strong>Mobile Tip:</strong> Long press on text to select and highlight
            </div>
          </div>
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
          <div className="pdf-pages-container">
            {Array.from(new Array(numPages), (el, index) => (
              <div key={index + 1} className="pdf-page-wrapper" data-page-number={index + 1}>
                <div className="page-number-label">Page {index + 1}</div>
                <div className="pdf-page-container" data-page-number={index + 1}>
                  <Page
                    pageNumber={index + 1}
                    scale={scale}
                    renderTextLayer={true}
                    renderAnnotationLayer={false}
                    loading={<div className="loading">Loading page...</div>}
                  />
                  
                  {/* Loading indicator for highlights */}
                  {highlightsLoading && (
                    <div className="highlights-loading">
                      <div className="spinner"></div>
                      <span>Loading highlights...</span>
                    </div>
                  )}
                  
                  {/* Render highlights for this page */}
                  {!highlightsLoading && getHighlightsForPage(index + 1)
                    .filter(highlight => !pendingHighlight || highlight.id !== pendingHighlight.id)
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
                  {pendingHighlight && pendingHighlight.pageNumber === (index + 1) && (
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
                  {isHelperMode && getHighlightsForPage(index + 1)
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

                  {/* Render interaction bubbles for this page */}
                  {pdfDocument.interactions
                    ?.filter(interaction => interaction.pageNumber === (index + 1))
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
              </div>
            ))}
          </div>
        </Document>
      </div>

      {/* Floating Controls */}
      <div className={`floating-controls ${isMobile ? 'mobile' : ''}`}>
        <div className="zoom-controls">
          <button onClick={() => setScale(Math.max(isMobile ? 0.6 : 0.6, scale - 0.1))}>
            -
          </button>
          <span>{Math.round(scale * 100)}%</span>
          <button onClick={() => setScale(Math.min(isMobile ? 1.8 : 2, scale + 0.1))}>
            +
          </button>
        </div>
        
        {/* Page Jump */}
        {numPages && numPages > 1 && (
          <div className="page-jump">
            <select onChange={(e) => scrollToPage(parseInt(e.target.value))}>
              {Array.from(new Array(numPages), (el, index) => (
                <option key={index + 1} value={index + 1}>
                  {isMobile ? `${index + 1}` : `Page ${index + 1}`}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Class Enrollment Popup */}
      <ClassEnrollmentPopup
        isOpen={showClassEnrollment}
        onClose={() => setShowClassEnrollment(false)}
        documentTitle={pdfDocument?.title || 'Document'}
        documentId={pdfDocument?.id}
      />
    </div>
  );
};

export default PDFViewer;