import React, { useMemo } from 'react';
import {
  CCard,
  CCardHeader,
  CCardBody,
  CCardFooter,
  CCardTitle,
  CCardText,
  CBadge,
  CTooltip
} from '@coreui/react';
import CIcon from '@coreui/icons-react';
import * as icon from '@coreui/icons';

const TaskWidget = ({ task, onOpenSteps }) => {
  const { completedSteps, totalSteps, completionPercentage } = useMemo(() => {
    const completed = task.steps?.filter(step => step.completed).length || 0;
    const total = task.steps?.length || 0;
    const percentage = total > 0 ? (completed / total) * 100 : 0;

    return {
      completedSteps: completed,
      totalSteps: total,
      completionPercentage: percentage
    };
  }, [task.steps]);

  const formatDeliveryDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('it-IT', {
      weekday: 'long',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <CCard
      className="text-center h-100 d-flex flex-column"
      style={{ transition: 'all 0.3s ease' }}
    >
      <CCardHeader
        style={{
          backgroundColor: task.work.category.color,
          borderBottom: 'none'
        }}
      >
        <div className="d-flex justify-content-between align-items-center text-white">
          <CTooltip content={task.work.name}>
            <h6 className="mb-0 text-truncate">{task.work.name}</h6>
          </CTooltip>
        </div>
      </CCardHeader>

      <CCardBody className="d-flex flex-column">
        <CCardTitle className="text-truncate">
          <CTooltip content={`Paziente: ${task.patient}`}>
            <span>Paz: {task.patient}</span>
          </CTooltip>
        </CCardTitle>

        <CCardText className="text-muted mb-3">
          Consegna per <br />
          {formatDeliveryDate(task.deliveryDate)}
        </CCardText>
      </CCardBody>

      <CCardFooter
        className="text-body-secondary"
        onClick={() => onOpenSteps(task)}
        style={{
          cursor: 'pointer',
          transition: 'background-color 0.3s ease'
        }}
        onMouseEnter={e => e.currentTarget.style.backgroundColor = '#f8f9fa'}
        onMouseLeave={e => e.currentTarget.style.backgroundColor = ''}
      >
        <div className="d-flex justify-content-between align-items-center">
          <span>
            {completedSteps} di {totalSteps} fasi completate
          </span>
          <CIcon
            icon={icon.cilArrowRight}
            className="ms-2"
            style={{ transition: 'transform 0.3s ease' }}
          />
        </div>
      </CCardFooter>
    </CCard>
  );
};

export default React.memo(TaskWidget);
