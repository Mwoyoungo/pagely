import './FloatingToolbar.css';

const FloatingToolbar = ({ onOpenHelp, onOpenRecord, onExportStudyNotes }) => {
  const toolbarButtons = [
    {
      id: 'highlight',
      icon: '✨',
      title: 'Highlight text',
      className: 'highlight-btn',
      onClick: () => {
        // This will be handled by PDFViewer's highlight mode
        console.log('Highlight mode - handled by PDF viewer');
      }
    },
    {
      id: 'help',
      icon: '🤚',
      title: 'Request help',
      className: 'help-btn',
      onClick: onOpenHelp
    },
    {
      id: 'record',
      icon: '🎥',
      title: 'Record explanation',
      className: 'record-btn',
      onClick: onOpenRecord
    },
    {
      id: 'export',
      icon: '📤',
      title: 'Export study notes',
      className: 'export-btn',
      onClick: onExportStudyNotes
    }
  ];

  return (
    <div className="floating-toolbar">
      {toolbarButtons.map(button => (
        <button
          key={button.id}
          className={`toolbar-btn ${button.className}`}
          title={button.title}
          onClick={button.onClick}
        >
          {button.icon}
        </button>
      ))}
    </div>
  );
};

export default FloatingToolbar;