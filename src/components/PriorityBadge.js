// components/PriorityBadge.js
import React from 'react';
import { CBadge } from '@coreui/react';
import CIcon from '@coreui/icons-react';
import * as icon from '@coreui/icons';
import './styles/PriorityBadge.css';
const PriorityBadge = ({ priority, unread = false }) => {
  const getPriorityConfig = (priority) => {
    switch (priority?.toLowerCase()) {
      case 'high':
        return {
          color: 'danger',
          text: 'Alta',
          icon: icon.cilBell
        };
      case 'medium':
        return {
          color: 'warning',
          text: 'Media',
          icon: icon.cilArrowTop
        };
      case 'low':
        return {
          color: 'info',
          text: 'Bassa',
          icon: icon.cilArrowBottom
        };
      default:
        return {
          color: 'secondary',
          text: 'N/D',
          icon: icon.cilMinus
        };
    }
  };

  const config = getPriorityConfig(priority);

  return (
    <CBadge
      color={config.color}
      className="d-inline-flex align-items-center gap-1 px-2 py-1"
      title={`Priorità ${config.text}${unread ? ' - Non letto' : ''}`}
    >
      <CIcon icon={config.icon} size="sm" />
      <span className="text-uppercase">{config.text}</span>
      {unread && priority === 'high' && (
        <span className="pulse-dot" />
      )}
    </CBadge>
  );
};

export default PriorityBadge;

// Uso nel TodoMessages:
// <PriorityBadge priority={todo.priority} unread={!todo.readAt} />
