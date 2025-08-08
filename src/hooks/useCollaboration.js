import { useState, useEffect, useCallback } from 'react';
import { useNotifications } from '../contexts/NotificationContext';
import { v4 as uuidv4 } from 'uuid';

// Mock users for simulation
const MOCK_USERS = [
  { id: 'sarah', name: 'Sarah', avatar: 'S', color: '#ff6b6b', expertise: ['Machine Learning', 'Statistics'] },
  { id: 'mike', name: 'Mike', avatar: 'M', color: '#4ecdc4', expertise: ['Data Science', 'Python'] },
  { id: 'emma', name: 'Emma', avatar: 'E', color: '#45b7d1', expertise: ['Mathematics', 'Research Methods'] },
  { id: 'alex', name: 'Alex', avatar: 'A', color: '#f39c12', expertise: ['Computer Science', 'Algorithms'] }
];

// Mock activities that can happen
const ACTIVITY_TYPES = [
  {
    type: 'user_joined',
    probability: 0.1,
    message: (user) => `${user.name} joined the study session`,
    notificationType: 'info'
  },
  {
    type: 'new_highlight',
    probability: 0.15,
    message: (user) => `${user.name} highlighted text on page {{page}}`,
    notificationType: 'info'
  },
  {
    type: 'help_request',
    probability: 0.12,
    message: (user) => `${user.name} requested help with a concept`,
    notificationType: 'warning'
  },
  {
    type: 'explanation_added',
    probability: 0.08,
    message: (user) => `${user.name} added a video explanation`,
    notificationType: 'success'
  },
  {
    type: 'voice_note',
    probability: 0.10,
    message: (user) => `${user.name} left a voice note explaining a concept`,
    notificationType: 'success'
  }
];

export const useCollaboration = (pdfDocument, currentPage = 1) => {
  const [activeUsers, setActiveUsers] = useState([]);
  const [recentActivities, setRecentActivities] = useState([]);
  const [liveInteractions, setLiveInteractions] = useState([]);
  const { showNotification } = useNotifications();

  // Simulate users joining/leaving
  useEffect(() => {
    // Start with some users already active
    const initialUsers = MOCK_USERS.slice(0, 2).map(user => ({
      ...user,
      joinedAt: new Date(Date.now() - Math.random() * 3600000), // Joined within last hour
      currentPage: Math.floor(Math.random() * 3) + 1,
      lastActive: new Date()
    }));
    
    setActiveUsers(initialUsers);

    // Simulate user activity every 10-20 seconds
    const activityInterval = setInterval(() => {
      simulateUserActivity();
    }, Math.random() * 10000 + 10000);

    // Simulate users joining/leaving every 30-60 seconds
    const userJoinLeaveInterval = setInterval(() => {
      simulateUserJoinLeave();
    }, Math.random() * 30000 + 30000);

    return () => {
      clearInterval(activityInterval);
      clearInterval(userJoinLeaveInterval);
    };
  }, [pdfDocument]);

  const simulateUserActivity = useCallback(() => {
    if (activeUsers.length === 0) return;

    // Pick a random activity
    const activity = ACTIVITY_TYPES[Math.floor(Math.random() * ACTIVITY_TYPES.length)];
    const user = activeUsers[Math.floor(Math.random() * activeUsers.length)];
    
    if (Math.random() < activity.probability) {
      const activityData = {
        id: uuidv4(),
        type: activity.type,
        user,
        timestamp: new Date(),
        page: Math.floor(Math.random() * 3) + 1
      };

      // Add to recent activities
      setRecentActivities(prev => [activityData, ...prev.slice(0, 9)]); // Keep last 10

      // Show notification
      const message = activity.message(user).replace('{{page}}', activityData.page);
      showNotification(message, activity.notificationType);

      // Create live interaction for certain activities
      if (['explanation_added', 'voice_note', 'help_request'].includes(activity.type)) {
        createLiveInteraction(activityData);
      }
    }
  }, [activeUsers, showNotification]);

  const simulateUserJoinLeave = useCallback(() => {
    if (Math.random() < 0.7) {
      // User joins
      const availableUsers = MOCK_USERS.filter(u => !activeUsers.find(au => au.id === u.id));
      if (availableUsers.length > 0) {
        const newUser = {
          ...availableUsers[Math.floor(Math.random() * availableUsers.length)],
          joinedAt: new Date(),
          currentPage: currentPage,
          lastActive: new Date()
        };
        
        setActiveUsers(prev => [...prev, newUser]);
        showNotification(`${newUser.name} joined the study session!`, 'info');
      }
    } else {
      // User leaves
      if (activeUsers.length > 1) {
        const leavingUser = activeUsers[Math.floor(Math.random() * activeUsers.length)];
        setActiveUsers(prev => prev.filter(u => u.id !== leavingUser.id));
        showNotification(`${leavingUser.name} left the study session`, 'info');
      }
    }
  }, [activeUsers, currentPage, showNotification]);

  const createLiveInteraction = useCallback((activityData) => {
    const interaction = {
      id: uuidv4(),
      pageNumber: activityData.page,
      x: 0.3 + Math.random() * 0.4, // Random position between 30-70%
      y: 0.2 + Math.random() * 0.6, // Random position between 20-80%
      type: activityData.type === 'explanation_added' ? 'video_explanation' : 
            activityData.type === 'voice_note' ? 'voice_note' : 'help_request',
      content: {
        message: getInteractionMessage(activityData.type),
        title: `${activityData.user.name}'s ${activityData.type.replace('_', ' ')}`
      },
      userDisplayName: activityData.user.name,
      userColor: activityData.user.color,
      createdAt: activityData.timestamp.toISOString(),
      isNew: true // Flag for animation
    };

    setLiveInteractions(prev => [interaction, ...prev]);

    // Remove the "new" flag after animation
    setTimeout(() => {
      setLiveInteractions(prev => prev.map(i => 
        i.id === interaction.id ? { ...i, isNew: false } : i
      ));
    }, 2000);

    // Remove old interactions (keep last 10 per page)
    setTimeout(() => {
      setLiveInteractions(prev => 
        prev.slice(0, 30) // Keep last 30 total interactions
      );
    }, 5000);

  }, []);

  const getInteractionMessage = (type) => {
    const messages = {
      explanation_added: [
        "Great explanation of this concept!",
        "This helped me understand it better",
        "Clear breakdown of the process",
        "Visual example makes it click"
      ],
      voice_note: [
        "Quick explanation of the key points",
        "My understanding of this section",
        "Tips for remembering this concept",
        "Connection to previous chapter"
      ],
      help_request: [
        "Can someone explain this part?",
        "Struggling with this concept",
        "Need help with the example",
        "What does this mean exactly?"
      ]
    };

    const messageList = messages[type] || messages.help_request;
    return messageList[Math.floor(Math.random() * messageList.length)];
  };

  // Get interactions for a specific page
  const getInteractionsForPage = useCallback((pageNumber) => {
    return liveInteractions.filter(i => i.pageNumber === pageNumber);
  }, [liveInteractions]);

  // Update user's current page (called when user navigates)
  const updateCurrentPage = useCallback((newPage) => {
    // Update current user's page (in real app, this would be the authenticated user)
    // For simulation, we'll just track it
  }, []);

  return {
    activeUsers,
    recentActivities,
    liveInteractions: getInteractionsForPage,
    updateCurrentPage,
    totalActiveUsers: activeUsers.length + 1 // +1 for current user
  };
};