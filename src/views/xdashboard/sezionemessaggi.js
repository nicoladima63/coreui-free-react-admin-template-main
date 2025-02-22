const MessageItem = React.memo(({ message, onClick, isLoading }) => {
  // Utilizziamo le classi CoreUI per la compatibilità con i temi
  return (
    <div
      onClick={onClick}
      className={`
        d-flex p-3 border-bottom 
        ${!message.read ? 'bg-light' : ''} 
        ${!message.read ? 'cursor-pointer' : ''}
      `}
      style={{
        borderLeft: '4px solid',
        borderLeftColor: message.priority === 'high' ? 'var(--cui-danger)' :
          message.type === 'step_notification' ? 'var(--cui-info)' :
            'var(--cui-primary)',
      }}
    >
      {/* Icona/Avatar */}
      <div className="me-3">
        <div className={`
          rounded-circle d-flex align-items-center justify-content-center
          ${message.type === 'step_notification' ? 'bg-info' : 'bg-primary'}
          bg-opacity-10
        `}
          style={{ width: '40px', height: '40px' }}>
          <CIcon
            icon={message.type === 'step_notification' ? icon.cilBell : icon.cilEnvelopeClosed}
            className={message.type === 'step_notification' ? 'text-info' : 'text-primary'}
          />
        </div>
      </div>

      {/* Contenuto */}
      <div className="flex-grow-1 min-width-0">
        <div className="d-flex justify-content-between align-items-start mb-1">
          <h6 className="mb-0 text-truncate">
            {message.type === 'step_notification' ? 'Notifica Step' : message.from?.name || 'Sistema'}
          </h6>
          <small className="text-medium-emphasis ms-2 text-nowrap">
            {formatTimeAgo(message.createdAt)}
          </small>
        </div>

        <p className="mb-1 text-body text-break">
          {message.content}
        </p>

        <div className="d-flex align-items-center mt-1">
          {!message.read && (
            <CBadge color="primary" shape="rounded-pill" className="me-2">
              Nuovo
            </CBadge>
          )}
          {message.priority === 'high' && (
            <CBadge color="danger" shape="rounded-pill">
              Priorità Alta
            </CBadge>
          )}
          {message.type === 'step_notification' && (
            <small className="text-info ms-2">
              <CIcon icon={icon.cilArrowRight} size="sm" className="me-1" />
              Vai al task
            </small>
          )}
        </div>
      </div>

      {/* Indicatore di stato */}
      {isLoading ? (
        <div className="ms-2">
          <CSpinner size="sm" />
        </div>
      ) : !message.read && (
        <div
          className="ms-2 bg-primary rounded-circle"
          style={{ width: '8px', height: '8px' }}
        />
      )}
    </div>
  );
});

const MessagesSection = ({ userId }) => {
  // ... stati e logica esistenti ...

  return (
    <CCard className="h-100">
      <CCardHeader>
        <div className="d-flex justify-content-between align-items-center">
          <div className="d-flex align-items-center">
            <h5 className="mb-0 me-3">Centro Notifiche</h5>
            <CBadge
              color={isConnected ? 'success' : 'danger'}
              className="d-flex align-items-center px-2"
              shape="rounded-pill"
            >
              <CIcon
                icon={isConnected ? icon.cilCheckCircle : icon.cilWarning}
                size="sm"
                className="me-1"
              />
              {isConnected ? 'Online' : 'Offline'}
            </CBadge>
          </div>
          {unreadCount > 0 && (
            <CBadge
              color="primary"
              shape="rounded-pill"
              className="px-3"
            >
              {unreadCount} {unreadCount === 1 ? 'nuovo' : 'nuovi'}
            </CBadge>
          )}
        </div>
      </CCardHeader>

      <div className="messages-container position-relative">
        {isLoading ? (
          <div className="text-center p-4">
            <CSpinner className="mb-2" />
            <p className="text-medium-emphasis mb-0">Caricamento messaggi...</p>
          </div>
        ) : error ? (
          <CAlert color="danger" className="m-3">
            <CIcon icon={icon.cilBan} className="me-2" />
            {error.message || 'Errore nel caricamento dei messaggi'}
          </CAlert>
        ) : sortedTodos.length === 0 ? (
          <div className="text-center p-4">
            <div className="text-medium-emphasis mb-3">
              <CIcon
                icon={icon.cilInbox}
                size="3xl"
                className="opacity-50"
              />
            </div>
            <h6>Nessun messaggio</h6>
            <p className="text-medium-emphasis small mb-0">
              I nuovi messaggi appariranno qui
            </p>
          </div>
        ) : (
          <div className="messages-list">
            {sortedTodos.map((message) => (
              <MessageItem
                key={message?.id || Math.random()}
                message={message}
                onClick={() => handleMessageClick(message)}
                isLoading={markAsReadMutation.isLoading && markAsReadMutation.variables === message?.id}
              />
            ))}
          </div>
        )}

        {isFetching && !isLoading && (
          <div className="text-center p-2 border-top">
            <small className="text-medium-emphasis">
              <CSpinner size="sm" className="me-2" />
              Aggiornamento...
            </small>
          </div>
        )}
      </div>
    </CCard>
  );
};

// Stili da aggiungere al tuo CSS
const styles = `
.messages-container {
  max-height: calc(100vh - 200px);
  overflow-y: auto;
}

.messages-list {
  overflow-y: auto;
}

/* Stilizzazione scrollbar compatibile con i temi */
.messages-container {
  scrollbar-width: thin;
  scrollbar-color: var(--cui-border-color) transparent;
}

.messages-container::-webkit-scrollbar {
  width: 6px;
}

.messages-container::-webkit-scrollbar-track {
  background: transparent;
}

.messages-container::-webkit-scrollbar-thumb {
  background-color: var(--cui-border-color);
  border-radius: 3px;
}

/* Hover effect sui messaggi */
.message-item {
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.message-item:hover {
  transform: translateY(-1px);
  box-shadow: 0 2px 4px var(--cui-shadow-color);
}

/* Utilità per il text truncate */
.text-truncate {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* Helper per min-width */
.min-width-0 {
  min-width: 0;
}
`;
