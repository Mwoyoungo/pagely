import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNotifications } from '../../contexts/NotificationContext';
import analyticsService from '../../services/analyticsService';
import ClassService from '../../services/classService';
import './ClassEnrollmentPopup.css';

const ClassEnrollmentPopup = ({ isOpen, onClose, documentTitle, documentId }) => {
  const { currentUser } = useAuth();
  const { showNotification } = useNotifications();
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [step, setStep] = useState('initial'); // 'initial' or 'form'

  const handleJoinClass = () => {
    setStep('form');
    analyticsService.track('class_enrollment_interest', {
      documentId,
      documentTitle,
      userId: currentUser?.uid
    });
  };

  const handleSubmitRequest = async (e) => {
    e.preventDefault();
    
    if (!phoneNumber.trim()) {
      showNotification('Please enter your phone number', 'error');
      return;
    }

    if (!currentUser) {
      showNotification('Please sign in to join a class', 'error');
      return;
    }

    setIsSubmitting(true);

    try {
      await ClassService.submitClassRequest({
        documentId,
        documentTitle,
        userId: currentUser.uid,
        userEmail: currentUser.email,
        userName: currentUser.displayName || currentUser.email,
        phoneNumber: phoneNumber.trim(),
        requestedAt: new Date(),
        status: 'pending'
      });

      analyticsService.track('class_enrollment_request', {
        documentId,
        documentTitle,
        userId: currentUser.uid,
        phoneNumber: phoneNumber.trim()
      });

      showNotification('Class request submitted! We\'ll contact you soon.', 'success');
      onClose();
    } catch (error) {
      console.error('Error submitting class request:', error);
      showNotification('Failed to submit class request. Please try again.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="class-enrollment-overlay" onClick={handleOverlayClick}>
      <div className="class-enrollment-popup">
        <button className="close-popup" onClick={onClose}>
          ×
        </button>

        {step === 'initial' ? (
          <div className="enrollment-content">
            <div className="enrollment-header">
              <div className="enrollment-icon">🎓</div>
              <h2>Want to join "{documentTitle}" class?</h2>
              <p className="enrollment-subtitle">
                Take your learning to the next level with personalized guidance
              </p>
            </div>

            <div className="class-benefits">
              <div className="benefit-item">
                <div className="benefit-icon">📚</div>
                <div className="benefit-text">
                  <h4>Deep Understanding</h4>
                  <p>Learn concepts thoroughly, not just memorization</p>
                </div>
              </div>
              
              <div className="benefit-item">
                <div className="benefit-icon">🤝</div>
                <div className="benefit-text">
                  <h4>No Solo Assignments</h4>
                  <p>Collaborative learning approach with peer support</p>
                </div>
              </div>
              
              <div className="benefit-item">
                <div className="benefit-icon">🎯</div>
                <div className="benefit-text">
                  <h4>Exam-Focused</h4>
                  <p>Structured curriculum designed for exam success</p>
                </div>
              </div>
            </div>

            <div className="pricing-info">
              <div className="price">
                <span className="currency">₦</span>
                <span className="amount">250</span>
                <span className="period">/month until exam</span>
              </div>
              <p className="pricing-note">
                Affordable learning with maximum impact
              </p>
            </div>

            <div className="enrollment-actions">
              <button className="join-class-btn" onClick={handleJoinClass}>
                Yes, I'm Interested!
              </button>
              <button className="not-now-btn" onClick={onClose}>
                Maybe Later
              </button>
            </div>
          </div>
        ) : (
          <div className="enrollment-form">
            <div className="form-header">
              <h2>Join "{documentTitle}" Class</h2>
              <p>We'll contact you within 24 hours to get you started</p>
            </div>

            <form onSubmit={handleSubmitRequest}>
              <div className="form-group">
                <label htmlFor="phoneNumber">Phone Number</label>
                <input
                  type="tel"
                  id="phoneNumber"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="Enter your WhatsApp number"
                  required
                  disabled={isSubmitting}
                />
                <small>We'll reach out via WhatsApp for class details</small>
              </div>

              <div className="user-info">
                <p><strong>Name:</strong> {currentUser?.displayName || 'Not provided'}</p>
                <p><strong>Email:</strong> {currentUser?.email}</p>
              </div>

              <div className="form-actions">
                <button 
                  type="submit" 
                  className="submit-request-btn"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Submitting...' : 'Submit Request'}
                </button>
                <button 
                  type="button" 
                  className="cancel-btn"
                  onClick={() => setStep('initial')}
                  disabled={isSubmitting}
                >
                  Back
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

export default ClassEnrollmentPopup;