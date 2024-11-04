import React, { useState, useEffect } from 'react';
import {
  CCard,
  CCardBody,
  CCardHeader,
  CCardTitle,
  CCardText,
  CCol,
  CNavLink,
  CRow,
  CWidgetStatsF,
  CSpinner,
  CAlert,
  CProgress,
  CButton,
} from '@coreui/react';


import { CheckCircle, XCircle, ArrowRight, AlertCircle, Loader2 } from 'lucide-react';
import { checkPrerequisites } from './prerequisites';

const SetupWizard = () => {
  const [setupState, setSetupState] = useState({
    loading: true,
    error: null,
    steps: [
      {
        name: 'User',
        key: 'user',
        route: 'http://localhost:5000/users',
        description: 'Create system users and administrators'
      },
      {
        name: 'Provider',
        key: 'provider',
        route: 'http://localhost:5000/providers',
        description: 'Configure service providers'
      },
      {
        name: 'Category',
        key: 'category',
        route: 'http://localhost:5000/categories',
        description: 'Set up work categories'
      },
      {
        name: 'Work',
        key: 'work',
        route: 'http://localhost:5000/works',
        description: 'Define work types'
      },
      {
        name: 'Step',
        key: 'step',
        route: 'http://localhost:5000/steps',
        description: 'Configure work steps'
      }
    ],
    details: {},
    currentStep: null,
    canCreateTasks: false
  });

  useEffect(() => {
    //checkSetupStatus();
  }, []);

  const checkSetupStatus = async () => {
    try {
      setSetupState(prev => ({ ...prev, loading: true, error: null }));

      const result = await checkPrerequisites();

      setSetupState(prev => ({
        ...prev,
        loading: false,
        details: result.details,
        currentStep: result.firstMissingStep,
        canCreateTasks: result.canCreateTasks
      }));
    } catch (error) {
      setSetupState(prev => ({
        ...prev,
        loading: false,
        error: 'Error checking setup status: ' + error.message
      }));
    }
  };

  const handleStepAction = (route) => {
    // Qui puoi usare il router della tua applicazione
    // Per esempio con react-router:
    // navigate(route);
    console.log('Navigating to:', route);
  };

  const renderStepStatus = (step) => {
    const details = setupState.details[step.key];

    if (!details) return null;

    return (
      <div className="text-sm text-gray-600">
        {details.count > 0 && (
          <span>Found {details.count} {step.name.toLowerCase()}{details.count !== 1 ? 's' : ''}</span>
        )}
        {step.key === 'work' && details.hasValidRelations === false && (
          <CAlert className="mt-2 bg-yellow-50">
            <AlertCircle className="h-4 w-4" />
            <CCardText>
              Some works have missing provider or category relationships
            </CCardText>
          </CAlert>
        )}
        {step.key === 'step' && details.hasValidRelations === false && (
          <CAlert className="mt-2 bg-yellow-50">
            <AlertCircle className="h-4 w-4" />
            <CCardText>
              Some steps have missing work relationships
            </CCardText>
          </CAlert>
        )}
      </div>
    );
  };

  if (setupState.loading) {
    return (
      <CCard className="w-full max-w-2xl mx-auto">
        <CCardBody className="p-6">
          <div className="flex items-center justify-center space-x-2">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span>Checking setup status...</span>
          </div>
        </CCardBody>
      </CCard>
    );
  }

  if (setupState.error) {
    return (
      <CCard className="w-full max-w-2xl mx-auto">
        <CCardBody className="p-6">
          <CAlert className="bg-red-50">
            <CCardText className="text-red-800">
              {setupState.error}
            </CCardText>
          </CAlert>
        </CCardBody>
      </CCard>
    );
  }

  return (
    <CCard className="w-full max-w-2xl mx-auto">
      <CCardHeader>
        <CCardTitle>System Setup Wizard</CCardTitle>
      </CCardHeader>
      <CCardBody className="space-y-4">
        {setupState.steps.map((step) => {
          const details = setupState.details[step.key];
          const isCurrentStep = setupState.currentStep === step.key;
          const isCompleted = details?.exists;

          return (
            <div
              key={step.key}
              className={`
                p-4 rounded-lg border transition-all
                ${isCurrentStep ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}
                ${isCompleted ? 'bg-green-50' : ''}
              `}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  {setupState.loading ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : isCompleted ? (
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  ) : (
                    <XCircle className="h-5 w-5 text-red-500" />
                  )}
                  <div>
                    <h3 className="font-medium">{step.name}</h3>
                    <p className="text-sm text-gray-600">{step.description}</p>
                    {renderStepStatus(step)}
                  </div>
                </div>

                {isCurrentStep && !isCompleted && (
                  <Button
                    onClick={() => handleStepAction(step.route)}
                    className="flex items-center space-x-2"
                  >
                    <span>Configure {step.name}</span>
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          );
        })}

        {setupState.canCreateTasks ? (
          <CAlert className="bg-green-50 border-green-200">
            <CCardText className="text-green-800">
              All prerequisites are met! You can now create tasks.
            </CCardText>
          </CAlert>
        ) : (
          <CAlert className="bg-blue-50 border-blue-200">
              <CCardText>
              Complete all steps above to enable task creation.
            </CCardText>
          </CAlert>
        )}
      </CCardBody>
    </CCard>
  );
};

export default SetupWizard;
