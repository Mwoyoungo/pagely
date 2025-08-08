import UserProfile from '../Auth/UserProfile';
import './Header.css';

const Header = ({ currentDocument, onOpenMyDocs, onOpenAuth, currentUser }) => {
  // Mock live users for demonstration
  const liveUsers = [
    { id: 1, name: 'Sarah', initial: 'S', status: 'studying now', color: '#ff6b6b' },
    { id: 2, name: 'Mike', initial: 'M', status: 'helping others', color: '#4ecdc4' },
    { id: 3, name: 'You', initial: 'A', status: 'active', color: '#45b7d1' }
  ];

  return (
    <header className="header">
      <div className="logo">PagePop</div>
      
      <div className="user-actions">
        {currentUser ? (
          <>
            <button className="my-docs-btn" onClick={onOpenMyDocs}>
              📚 My Documents
            </button>
            
            <div className="live-users">
              {liveUsers.slice(0, 2).map(user => (
                <div
                  key={user.id}
                  className="user-avatar"
                  style={{ backgroundColor: user.color }}
                  title={`${user.name} (${user.status})`}
                >
                  {user.initial}
                </div>
              ))}
            </div>
            
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