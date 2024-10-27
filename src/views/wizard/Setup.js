import React, { useState, useEffect } from 'react';
import { CButton, CCard, CCardBody, CCardHeader, CCardText, CCardTitle, CRow, CCol, CAlert } from '@coreui/react';
import { CheckCircle, XCircle, ArrowRight } from 'lucide-react';
import { checkForData } from './checkForData'; // Importa la funzione API corretta

import ModalUser from '../users/ModalUser';
import ModalProvider from '../provider/ModalNewProvider';
import ModalCategory from '../categories/ModalCategory';
import ModalWork from '../works/ModalWork';
import ModalStep from '../steps/ModalStep';

const SetupWizard = () => {
  const [steps, setSteps] = useState([
    { name: 'User', completed: false, loading: true },
    { name: 'Provider', completed: false, loading: true },
    { name: 'Category', completed: false, loading: true },
    { name: 'Work', completed: false, loading: true },
    { name: 'Step', completed: false, loading: true }
  ]);
  const [currentStep, setCurrentStep] = useState(0);
  const [canCreateTasks, setCanCreateTasks] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);

  useEffect(() => {
    checkPrerequisites();
  }, []);

  const checkPrerequisites = async () => {
    try {
      // Chiamata API vera per controllare i prerequisiti
      const { success, missingSteps, firstMissingStep, canCreateTasks } = await checkForData();

      // Aggiorna gli step in base ai risultati dell'API
      const updatedSteps = steps.map((step) => ({
        ...step,
        completed: !missingSteps.includes(step.name.toLowerCase()), // Verifica se esiste negli step mancanti
        loading: false,
      }));

      setSteps(updatedSteps);

      // Aggiorna il primo step mancante
      if (firstMissingStep) {
        const stepIndex = updatedSteps.findIndex((step) => step.name.toLowerCase() === firstMissingStep);
        setCurrentStep(stepIndex !== -1 ? stepIndex : 0);
      }

      setCanCreateTasks(success);
    } catch (error) {
      console.error("Errore durante il controllo dei prerequisiti:", error);
    }
  };

  const handleStepAction = () => {
    // Apri la Modal corrispondente al passo attuale
    switch (steps[currentStep].name) {
      case 'User':
        setModalVisible({ ...modalVisible, user: true });
        break;
      case 'Provider':
        setModalVisible({ ...modalVisible, provider: true });
        break;
      case 'Category':
        setModalVisible({ ...modalVisible, category: true });
        break;
      case 'Work':
        setModalVisible({ ...modalVisible, work: true });
        break;
      case 'Step':
        setModalVisible({ ...modalVisible, step: true });
        break;
      default:
        break;
    }
  };

  const closeModal = async (modal) => {
    setModalVisible({ ...modalVisible, [modal]: false });
    // Ricarica i prerequisiti per aggiornare la UI
    await checkPrerequisites();
  };
  return (
    <CCard className="w-full max-w-2xl mx-auto">
      <CCardHeader>
        <CCardTitle>Setup Configuration Wizard</CCardTitle>
      </CCardHeader>
      <CCardBody>
        <div className="space-y-4">
          {steps.map((step, index) => (
            <CCard key={index} className={`mb-3 ${step.completed ? 'border-success' : step.loading ? 'border-primary' : 'border-danger'} `}>
              <CCardHeader className="d-flex justify-content-between align-items-center">
                <div className="d-flex align-items-center">
                  {step.completed ? (
                    <CheckCircle className="me-2 text-success" size={20} />
                  ) : step.loading ? (
                    <ArrowRight className="me-2 text-primary animate-spin" size={20} />
                    ) : (
                    <XCircle className="me-2 text-danger" size={20} />
                  )}
                  <span className="fw-bold">{step.name}</span>
                </div>

                {currentStep === index && !step.completed && !step.loading && (
                  <CButton
                    onClick={handleStepAction}
                    color="primary"
                    variant="outline"
                    className="d-flex align-items-center"
                  >
                    <span>Configure {step.name}</span>
                    <ArrowRight className="ms-2" size={16} />
                  </CButton>
                )}
              </CCardHeader>
            </CCard>
          ))}

          {canCreateTasks && (
            <CAlert color="success" className="mt-4">
              <CCardText className="text-success">
                All prerequisites are met! You can now create tasks.
              </CCardText>
            </CAlert>
          )}
        </div>
      </CCardBody>

      {/* Renderizza le modali in base allo stato */}
      <ModalUser visible={modalVisible.user} onClose={() => closeModal('user')} />
      <ModalProvider visible={modalVisible.provider} onClose={() => closeModal('provider')} />
      <ModalCategory visible={modalVisible.category} onClose={() => closeModal('category')} />
      <ModalWork visible={modalVisible.work} onClose={() => closeModal('work')} />
      <ModalStep visible={modalVisible.step} onClose={() => closeModal('step')} />

    </CCard>
  );

};

export default SetupWizard;
