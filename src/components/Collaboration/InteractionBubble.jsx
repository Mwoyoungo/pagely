import './InteractionBubble.css';

const InteractionBubble = ({ interaction, onClick, style }) => {
  const getIcon = (type) => {
    switch (type) {
      case 'voice_note': return '🎵';
      case 'video_explanation': return '🎥';
      case 'help_request': return '🤚';
      case 'highlight': return '✨';
      default: return '💬';
    }
  };

  const getTitle = (interaction) => {
    const timeAgo = formatTimeAgo(new Date(interaction.createdAt));
    return `${interaction.userDisplayName} - ${timeAgo}`;
  };

  return (
    <div 
      className="interaction-bubble"
      style={style}
      onClick={onClick}
      title={getTitle(interaction)}
    >
      {getIcon(interaction.type)}
    </div>
  );
};

const formatTimeAgo = (date) => {
  const now = new Date();
  const diff = now - date;
  
  const minutes = Math.floor(diff / (1000 * 60));
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  
  if (minutes < 60) {
    return `${minutes}m ago`;
  } else if (hours < 24) {
    return `${hours}h ago`;
  } else {
    return `${days}d ago`;
  }
};

export default InteractionBubble;