import { useState, useCallback } from 'react';
import { useNotifications } from '../contexts/NotificationContext';
import { v4 as uuidv4 } from 'uuid';

export const useHighlighting = (pdfDocument) => {
  const [highlights, setHighlights] = useState(pdfDocument?.highlights || []);
  const [pendingHighlight, setPendingHighlight] = useState(null);
  const { showNotification } = useNotifications();

  // Create a new highlight from text selection
  const createHighlight = useCallback((selectedText, position, pageNumber) => {
    if (!selectedText.trim()) return null;

    const highlight = {
      id: uuidv4(),
      text: selectedText.trim(),
      pageNumber,
      position: {
        x: position.x,
        y: position.y,
        width: position.width || 0.2, // Default width
        height: position.height || 0.03 // Default height
      },
      color: '#ffeb3b', // Default highlight color
      createdAt: new Date().toISOString(),
      createdBy: 'current-user', // In real app, get from auth context
      hasHelp: false, // Will be true when help is requested/provided
      helpRequests: []
    };

    // Set as pending highlight (will be saved when help is requested or dismissed)
    setPendingHighlight(highlight);
    
    return highlight;
  }, []);

  // Save highlight permanently (called when help is requested or user confirms)
  const saveHighlight = useCallback((highlight, helpRequest = null) => {
    const updatedHighlight = {
      ...highlight,
      hasHelp: !!helpRequest,
      helpRequests: helpRequest ? [helpRequest] : highlight.helpRequests,
      needsHelp: !helpRequest // Mark as needing help if no help provided yet
    };

    setHighlights(prev => {
      const existing = prev.find(h => h.id === highlight.id);
      if (existing) {
        return prev.map(h => h.id === highlight.id ? updatedHighlight : h);
      }
      return [...prev, updatedHighlight];
    });

    setPendingHighlight(null);
    
    if (helpRequest) {
      showNotification('Help request sent! Other students will see this and can record explanations.', 'success');
      
      // Simulate help request appearing for other students after 3 seconds
      setTimeout(() => {
        showNotification('Another student is viewing your help request...', 'info');
        
        // After 5 seconds, simulate the help bubble appearing for helpers
        setTimeout(() => {
          showNotification('🤚 Help requests are now visible for other students to see and record explanations!', 'success');
        }, 2000);
      }, 3000);
    } else {
      showNotification('Highlight saved!', 'success');
    }

    // In real app: persist to database and notify other users
    console.log('Saving highlight:', updatedHighlight);
  }, [showNotification]);

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
  const addVoiceExplanation = useCallback((highlightId, audioBlob, explanation) => {
    // Create audio URL (in real app, upload to server)
    const audioUrl = URL.createObjectURL(audioBlob);
    
    const voiceExplanation = {
      id: Date.now().toString(),
      type: 'voice_explanation',
      audioUrl,
      explanation: explanation || 'Voice explanation',
      recordedBy: 'Helper Student', // In real app, get from auth
      recordedAt: new Date().toISOString(),
      duration: 0 // Could calculate from blob
    };

    setHighlights(prev => prev.map(highlight => {
      if (highlight.id === highlightId) {
        return {
          ...highlight,
          hasHelp: true,
          needsHelp: false,
          voiceExplanations: [...(highlight.voiceExplanations || []), voiceExplanation]
        };
      }
      return highlight;
    }));

    showNotification('Voice explanation added! Students can now hear your help.', 'success');
  }, [showNotification]);

  return {
    highlights,
    pendingHighlight,
    createHighlight,
    saveHighlight,
    cancelHighlight,
    getHighlightsForPage,
    findOverlappingHighlight,
    addHelpToHighlight,
    addVoiceExplanation
  };
};