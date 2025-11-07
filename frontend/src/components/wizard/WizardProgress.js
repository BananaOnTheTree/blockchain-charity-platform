import React from 'react';

const WizardProgress = ({ steps, currentStep, onStepClick }) => {
  const totalSteps = steps.length;

  return (
    <div className="progress-indicator">
      <div className="progress-bar-track">
        <div 
          className="progress-bar-fill" 
          style={{ width: `${(currentStep / totalSteps) * 100}%` }}
        ></div>
      </div>
      <div className="steps-container">
        {steps.map((step) => (
          <div 
            key={step.number}
            className={`step-item ${currentStep >= step.number ? 'active' : ''} ${currentStep > step.number ? 'completed' : ''}`}
            onClick={() => currentStep > step.number && onStepClick && onStepClick(step.number)}
          >
            <div className="step-circle">
              {currentStep > step.number ? '✓' : step.icon}
            </div>
            <div className="step-label">
              <span className="step-number">Step {step.number}</span>
              <span className="step-title">{step.title}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default WizardProgress;
