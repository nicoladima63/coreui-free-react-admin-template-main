// components/messaging/ChatMessage.js
import React from 'react';
import { formatDistanceToNow } from 'date-fns';
import { it } from 'date-fns/locale';

export const ChatMessage = ({ message, currentUserId }) => {
  const isOwn = message.fromId === currentUserId;

  return (
    <div className={`d-flex ${isOwn ? 'justify-content-end' : 'justify-content-start'} mb-3`}>
      <div
        className={`${isOwn ? 'bg-primary text-white' : 'bg-light'
          } rounded p-2 max-w-75`}
      >
        <div className="small text-muted mb-1">
          {isOwn ? 'Tu' : message.sender?.name}
        </div>
        <div>{message.content}</div>
        <div className="small text-muted mt-1">
          {formatDistanceToNow(new Date(message.createdAt), {
            addSuffix: true,
            locale: it
          })}
          {message.read && isOwn && (
            <span className="ms-2">✓✓</span>
          )}
        </div>
      </div>
    </div>
  );
};
