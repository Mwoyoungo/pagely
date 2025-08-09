import UserProfile from '../Auth/UserProfile';
import ActiveUsers from '../Collaboration/ActiveUsers';
import './Header.css';

const Header = ({ currentDocument, onOpenMyDocs, onOpenAuth, currentUser, onBackToFeed }) => {
  return (
    <header className="header">
      <div className="header-left">
        {currentDocument && onBackToFeed ? (
          <button className="back-btn" onClick={onBackToFeed}>
            ← Back to Feed
          </button>
        ) : (
          <div className="logo">PagePop</div>
        )}
      </div>
      
      {/* Show active users when viewing a document */}
      {currentDocument && currentUser && (
        <div className="header-center">
          <ActiveUsers document={currentDocument} />
        </div>
      )}
      
      <div className="user-actions">
        {currentUser ? (
          <>
            <button className="my-docs-btn" onClick={onOpenMyDocs}>
              📚 My Documents
            </button>
            <UserProfile />
          </>
        ) : (
          <button className="auth-btn" onClick={onOpenAuth}>
            🚀 Sign In
          </button>
        )}
      </div>
    </header>
  );
};

export default Header;