import React, { useMemo } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { setSelectedFilter, setModalState } from './slices/dashboardSlice'

import { useQuery } from '@tanstack/react-query'
import {
  CCard,
  CCardHeader,
  CCardBody,
  CCol,
  CRow,
  CSpinner,
  CAlert,
  CButton,
  CButtonGroup,
  CTooltip,
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import * as icon from '@coreui/icons'

import { useWebSocket } from '../../context/WebSocketContext'
import { useWebSocketHandlers } from './hooks/useWebSocketHandlers'
import { TasksService } from '../../services/api'
import { QUERY_KEYS } from '../../constants/queryKeys'

import FilterGroupButton from '../../components/FilterGroupButton'
import TaskWidget from './components/TaskWidget'
import ModalNew from './components/ModalNew'
import ModalSteps from './components/ModalSteps'
import MessagesSection from './components/MessagesSection'

const Dashboard = () => {
  const { socket } = useWebSocket()
  const auth = useSelector((state) => state.auth)
  const { selectedFilter, modalState } = useSelector((state) => state.dashboard)
  const dispatch = useDispatch()

  // Setup WebSocket handlers
  useWebSocketHandlers(socket, auth?.user?.id)

  // Query principale
  const {
    data: tasks = [],
    isLoading,
    error,
    isFetching,
  } = useQuery({
    queryKey: [QUERY_KEYS.TASKS],
    queryFn: TasksService.getTasksForDashboard,
    staleTime: 30000,
    cacheTime: 5 * 60 * 1000,
  })

  // Filtraggio tasks
  const filteredTasks = useMemo(() => {
    switch (selectedFilter) {
      case 'completed':
        return tasks.filter((task) => task.completed)
      case 'incomplete':
        return tasks.filter((task) => !task.completed)
      default:
        return tasks
    }
  }, [tasks, selectedFilter])

  const handleOpenSteps = (task) => {
    dispatch(setModalState({ stepsVisible: true, selectedTask: task }))
  }

  const handleCloseModal = (modalType) => {
    dispatch(setModalState({ [modalType]: false, selectedTask: null }))
  }

  if (!auth?.user?.id) {
    return null
  }

  return (
    <CRow>
      <CCol xs={12} xl={2}>
        <MessagesSection userId={auth.user.id} onOpenSteps={handleOpenSteps} />
      </CCol>

      <CCol xs={12} lg={10}>
        <CCard className="mb-4">
          <CCardHeader>
            <div className="d-flex justify-content-between align-items-center">
              <h4 className="mb-0">Flussi di lavoro</h4>

              <div className="d-flex gap-2 align-items-center">
                <FilterGroupButton
                  selectedFilter={selectedFilter}
                  onFilterChange={(filter) => dispatch(setSelectedFilter(filter))}
                  disabled={isLoading || isFetching}
                />

                <CButtonGroup>
                  <CTooltip content="Nuovo task">
                    <CButton
                      color="primary"
                      size="sm"
                      onClick={() => dispatch(setModalState({ addVisible: true }))}
                      disabled={isLoading || isFetching}
                    >
                      <CIcon icon={icon.cilPlus} className="me-2" />
                      Nuova
                    </CButton>
                  </CTooltip>
                </CButtonGroup>
              </div>
            </div>
          </CCardHeader>

          <CCardBody>
            {isLoading ? (
              <div className="text-center p-3">
                <CSpinner color="primary" />
              </div>
            ) : error ? (
              <CAlert color="danger" className="text-center">
                {error?.message || 'Si è verificato un errore'}
              </CAlert>
            ) : filteredTasks.length === 0 ? (
              <CAlert color="info" className="text-center">
                Molto bene... o forse no... nessuna lavorazione da completare
              </CAlert>
            ) : (
              <CRow xs={{ gutter: 4 }}>
                {filteredTasks.map((task) => (
                  <CCol key={task.id} xs={12} sm={6} lg={3} xl={4} xxl={2}>
                    <TaskWidget task={task} onOpenSteps={handleOpenSteps} />
                  </CCol>
                ))}
              </CRow>
            )}
          </CCardBody>
        </CCard>
      </CCol>

      <ModalNew visible={modalState.addVisible} onClose={() => handleCloseModal('addVisible')} />

      <ModalSteps
        visible={modalState.stepsVisible}
        onClose={() => handleCloseModal('stepsVisible')}
        task={modalState.selectedTask}
      />
    </CRow>
  )
}

export default Dashboard
