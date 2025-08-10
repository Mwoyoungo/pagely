import './EmptyState.css';

const EmptyState = ({ 
  icon, 
  title, 
  description, 
  actionText, 
  onAction,
  size = 'medium' 
}) => {
  return (
    <div className={`empty-state ${size}`}>
      <div className="empty-state-content">
        <div className="empty-state-icon">{icon}</div>
        <h3 className="empty-state-title">{title}</h3>
        <p className="empty-state-description">{description}</p>
        {actionText && onAction && (
          <button 
            className="empty-state-action"
            onClick={onAction}
          >
            {actionText}
          </button>
        )}
      </div>
    </div>
  );
};

export default EmptyState;