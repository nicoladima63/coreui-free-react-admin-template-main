import React, { useState } from 'react';
import { CButton, CCard, CCardBody, CCardHeader, CCardText, CCardTitle, CRow, CCol } from '@coreui/react';
import Step1User from './Step1User';
import Step2Provider from './Step2Provider';
//import Step3Category from './Step3Category';
//import Step4Work from './Step4Work';
//import Step5Steps from './Step5Steps';
//import Step6Task from './Step6Task';
import { CheckCircle, XCircle, ArrowRight } from 'lucide-react';

const WizardContainer = () => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    user: null,
    provider: null,
    category: null,
    work: null,
    steps: []
  });


  const [steps2, setSteps] = useState([
    { name: 'User', completed: false, loading: true },
    { name: 'Provider', completed: false, loading: true },
    { name: 'Category', completed: false, loading: true },
    { name: 'Work', completed: false, loading: true },
    { name: 'Step', completed: false, loading: true }
  ]);
  const [currentStep, setCurrentStep] = useState(0);
  const [canCreateTasks, setCanCreateTasks] = useState(false);


  const nextStep = () => setStep(step + 1);
  const prevStep = () => setStep(step - 1);

  const updateFormData = (newData) => {
    setFormData((prevData) => ({ ...prevData, ...newData }));
  };

  return (
    <CRow className="justify-content-center">
      <CCol md="6">
        <CCard>
          <CCardHeader>Wizard Inserimento Lavori</CCardHeader>
          <CCardBody>
            {step === 1 && <Step1User nextStep={nextStep} updateFormData={updateFormData} />}
            {step === 2 && <Step2Provider nextStep={nextStep} prevStep={prevStep} updateFormData={updateFormData} />}
            {step === 3 && <Step3Category nextStep={nextStep} prevStep={prevStep} updateFormData={updateFormData} />}
            {step === 4 && <Step4Work nextStep={nextStep} prevStep={prevStep} updateFormData={updateFormData} />}
            {step === 5 && <Step5Steps nextStep={nextStep} prevStep={prevStep} updateFormData={updateFormData} />}
            {step === 6 && <Step6Task prevStep={prevStep} formData={formData} />}
          </CCardBody>
        </CCard>
      </CCol>
      <CCol md="6">
        <CCard className="w-full max-w-2xl mx-auto">
          <CCardHeader>
            <CCardTitle>Setup Configuration Wizard</CCardTitle>
          </CCardHeader>
          <CCardBody>
            <div className="space-y-4">
              {steps2.map((step, index) => (
                <div
                  key={step.name}
                  className={`flex items-center justify-between p-4 border rounded
                ${currentStep === index ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}`}
                >
                  <div className="flex items-center space-x-3">
                    {step.loading ? (
                      <div className="w-5 h-5 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
                    ) : step.completed ? (
                      <CheckCircle className="w-5 h-5 text-green-500" />
                    ) : (
                      <XCircle className="w-5 h-5 text-red-500" />
                    )}
                    <span className="font-medium">{step.name}</span>
                  </div>

                  {currentStep === index && !step.completed && !step.loading && (
                    <Button
                      onClick={handleStepAction}
                      className="flex items-center space-x-2"
                    >
                      <span>Configure {step.name}</span>
                      <ArrowRight className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              ))}

              {canCreateTasks && (
                <CAlert className="bg-green-50 border-green-200">
                  <CCardText className="text-green-800">
                    All prerequisites are met! You can now create tasks.
                  </CCardText>
                </CAlert>
              )}
            </div>
          </CCardBody>
        </CCard>
      </CCol>
    </CRow>
  );
};

export default WizardContainer;
