import './Header.css';

const Header = ({ currentDocument, onOpenMyDocs }) => {
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
        <button className="my-docs-btn" onClick={onOpenMyDocs}>
          My Documents
        </button>
        
        <div className="live-users">
          {liveUsers.map(user => (
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
      </div>
    </header>
  );
};

export default Header;