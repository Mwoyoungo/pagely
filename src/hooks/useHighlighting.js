import { useState, useCallback, useEffect } from 'react';
import { useNotifications } from '../contexts/NotificationContext';
import { useAuth } from '../contexts/AuthContext';
import HighlightService from '../services/highlightService';
import analyticsService from '../services/analyticsService';

export const useHighlighting = (pdfDocument) => {
  const [highlights, setHighlights] = useState([]);
  const [pendingHighlight, setPendingHighlight] = useState(null);
  const [loading, setLoading] = useState(false);
  const { showNotification } = useNotifications();
  const { currentUser } = useAuth();

  // Load highlights from Firebase when document changes
  useEffect(() => {
    if (!pdfDocument?.id) return;

    setLoading(true);
    
    // Subscribe to real-time highlights for this document
    const unsubscribe = HighlightService.subscribeToHighlights(
      pdfDocument.id, 
      (firebaseHighlights) => {
        console.log('🔥 Firebase highlights received:', firebaseHighlights.length, 'highlights');
        firebaseHighlights.forEach((highlight, index) => {
          console.log(`📍 Highlight ${index + 1}:`, {
            id: highlight.id,
            text: highlight.text.slice(0, 30) + '...',
            position: highlight.position,
            pageNumber: highlight.pageNumber
          });
        });
        setHighlights(firebaseHighlights);
        setLoading(false);
      }
    );

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [pdfDocument?.id]);

  // Create a new highlight from text selection
  const createHighlight = useCallback((selectedText, position, pageNumber) => {
    if (!selectedText.trim() || !currentUser) return null;

    const highlight = {
      id: `pending_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`, // Unique pending ID
      text: selectedText.trim(),
      pageNumber,
      position: {
        x: position.x,
        y: position.y,
        width: position.width || 0.2, // Default width
        height: position.height || 0.03 // Default height
      },
      color: '#ffeb3b', // Default highlight color
      needsHelp: false, // Can be updated when help is requested
      helpRequest: null
    };

    // Set as pending highlight (will be saved when help is requested or dismissed)
    setPendingHighlight(highlight);
    
    return highlight;
  }, [currentUser]);

  // Save highlight permanently (called when help is requested or user confirms)
  const saveHighlight = useCallback(async (highlight, helpRequest = null) => {
    // Debug logging
    console.log('🚀 saveHighlight called:', { 
      docId: pdfDocument?.id, 
      userId: currentUser?.uid,
      highlight: highlight,
      helpRequest: helpRequest 
    });

    if (!pdfDocument?.id || !currentUser) {
      console.error('❌ Missing requirements:', { docId: pdfDocument?.id, user: currentUser });
      showNotification('Error: Document ID or user authentication missing', 'error');
      return null;
    }

    try {
      setLoading(true);
      
      const highlightData = {
        ...highlight,
        needsHelp: !!helpRequest,
        helpRequest: helpRequest
      };

      // Clear pending highlight immediately to prevent duplicates
      setPendingHighlight(null);

      // Save to Firebase
      const savedHighlight = await HighlightService.createHighlight(
        pdfDocument.id, 
        highlightData, 
        currentUser
      );

      // Track analytics
      analyticsService.trackHighlightCreated(pdfDocument.id, highlight.pageNumber);
      if (helpRequest) {
        analyticsService.trackHelpRequest(pdfDocument.id, highlight.pageNumber);
      }

      // Show success notification
      if (helpRequest) {
        showNotification('Help request sent! Other students can now see this and record explanations.', 'success');
      } else {
        showNotification('Highlight saved! Other students can now see your highlight.', 'success');
      }

      return savedHighlight;
    } catch (error) {
      console.error('Error saving highlight:', error);
      showNotification('Failed to save highlight: ' + error.message, 'error');
      return null;
    } finally {
      setLoading(false);
    }
  }, [pdfDocument?.id, currentUser, showNotification]);

  // Cancel pending highlight
  const cancelHighlight = useCallback(() => {
    setPendingHighlight(null);
    showNotification('Highlight cancelled', 'info');
  }, [showNotification]);

  // Get highlights for a specific page
  const getHighlightsForPage = useCallback((pageNumber) => {
    return highlights.filter(h => h.pageNumber === pageNumber);
  }, [highlights]);

  // Check if text selection overlaps with existing highlight
  const findOverlappingHighlight = useCallback((position, pageNumber) => {
    return highlights.find(highlight => {
      if (highlight.pageNumber !== pageNumber) return false;
      
      const h = highlight.position;
      const overlap = !(
        position.x > h.x + h.width ||
        position.x + (position.width || 0.1) < h.x ||
        position.y > h.y + h.height ||
        position.y + (position.height || 0.03) < h.y
      );
      
      return overlap;
    });
  }, [highlights]);

  // Add help to existing highlight
  const addHelpToHighlight = useCallback((highlightId, helpRequest) => {
    setHighlights(prev => prev.map(highlight => {
      if (highlight.id === highlightId) {
        return {
          ...highlight,
          hasHelp: true,
          needsHelp: false, // No longer needs help
          helpRequests: [...highlight.helpRequests, helpRequest]
        };
      }
      return highlight;
    }));

    showNotification('Help added to highlight!', 'success');
  }, [showNotification]);

  // Add voice explanation to highlight (called when someone records help)
  const addVoiceExplanation = useCallback(async (highlightId, audioBlob, explanation) => {
    if (!pdfDocument?.id || !currentUser) return;

    try {
      setLoading(true);
      
      // Upload voice explanation to Firebase
      await HighlightService.addVoiceExplanation(
        pdfDocument.id,
        highlightId, 
        audioBlob, 
        explanation || 'Voice explanation',
        currentUser,
        (progress) => {
          // Could show upload progress here
          console.log('Voice upload progress:', progress);
        }
      );

      // Track analytics - find the highlight to get page number
      const highlight = highlights.find(h => h.id === highlightId);
      if (highlight) {
        analyticsService.trackVoiceExplanation(pdfDocument.id, highlight.pageNumber, audioBlob.size);
      }

      showNotification('Voice explanation uploaded! Students can now hear your help.', 'success');
    } catch (error) {
      console.error('Error adding voice explanation:', error);
      showNotification('Failed to add voice explanation: ' + error.message, 'error');
    } finally {
      setLoading(false);
    }
  }, [pdfDocument?.id, currentUser, showNotification]);

  return {
    highlights,
    pendingHighlight,
    loading,
    createHighlight,
    saveHighlight,
    cancelHighlight,
    getHighlightsForPage,
    findOverlappingHighlight,
    addHelpToHighlight,
    addVoiceExplanation
  };
};