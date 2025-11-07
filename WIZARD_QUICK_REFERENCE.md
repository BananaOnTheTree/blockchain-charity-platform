# Quick Reference - Wizard Components

## 📦 Import Components

```javascript
// Import all wizard components
import {
  WizardProgress,
  FormField,
  CategorySelector,
  ImageUploader,
  ImagePreview,
  GalleryPreview,
  Lightbox,
  CAMPAIGN_CATEGORIES  // Constant
} from '../components/wizard';

// Import lightbox hook
import useLightbox from '../hooks/useLightbox';

// Import all styles
import '../styles/wizard/index.css';
```

## 🎯 Common Patterns

### Multi-Step Form with Progress

```jsx
const [currentStep, setCurrentStep] = useState(1);

const steps = [
  { number: 1, title: 'Basic Info', icon: '📝' },
  { number: 2, title: 'Details', icon: '📋' }
];

<WizardProgress 
  steps={steps} 
  currentStep={currentStep}
  onStepClick={setCurrentStep}
/>
```

### Form Fields

```jsx
// Text input
<FormField
  label="Title"
  value={data.title}
  onChange={(e) => setData({...data, title: e.target.value})}
  required
/>

// Textarea
<FormField
  label="Description"
  type="textarea"
  rows={5}
  value={data.description}
  onChange={(e) => setData({...data, description: e.target.value})}
/>

// Number input
<FormField
  label="Amount (ETH)"
  type="number"
  step="0.01"
  min="0"
  value={data.amount}
  onChange={(e) => setData({...data, amount: e.target.value})}
/>
```

### Category Selection

```jsx
<CategorySelector
  selectedCategory={data.category}
  onSelect={(cat) => setData({...data, category: cat})}
/>

// Access all categories
import { CAMPAIGN_CATEGORIES } from '../components/wizard';
console.log(CAMPAIGN_CATEGORIES); // Array of 21 categories
```

### Single Image Upload

```jsx
<ImageUploader
  id="main-image"
  label="Main Image"
  onFileChange={(e) => setData({...data, image: e.target.files[0]})}
  onFileRemove={() => setData({...data, image: null})}
  selectedFile={data.image}
/>

{data.image && (
  <ImagePreview
    file={data.image}
    onClick={() => lightbox.openLightbox([data.image], 0)}
  />
)}
```

### Gallery Upload

```jsx
<ImageUploader
  id="gallery"
  label="Gallery Images"
  multiple
  onFileChange={(e) => {
    const files = Array.from(e.target.files);
    setData({...data, gallery: [...data.gallery, ...files]});
  }}
/>

<GalleryPreview
  files={data.gallery}
  onImageClick={(index) => lightbox.openLightbox(data.gallery, index)}
  onRemove={(index) => {
    const updated = data.gallery.filter((_, i) => i !== index);
    setData({...data, gallery: updated});
  }}
/>
```

### Lightbox

```jsx
const lightbox = useLightbox();

// Open lightbox
<img onClick={() => lightbox.openLightbox([image1, image2], 0)} />

// Lightbox component
<Lightbox
  isOpen={lightbox.isOpen}
  images={lightbox.images}
  currentIndex={lightbox.currentIndex}
  onClose={lightbox.closeLightbox}
  onNext={lightbox.nextImage}
  onPrev={lightbox.prevImage}
/>
```

## 🎨 CSS Customization

### Override Wizard Colors

```css
/* In your CSS file */
.wizard-header {
  background: linear-gradient(135deg, #your-color 0%, #your-color-2 100%);
}

.btn-next,
.btn-submit {
  background: your-gradient;
}

.category-btn.selected {
  background: your-gradient;
  border-color: your-color;
}
```

### Custom Category Grid

```css
.category-grid {
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  gap: 1rem;
}
```

### Lightbox Customization

```css
.lightbox-overlay {
  background: rgba(0, 0, 0, 0.98);
}

.lightbox-arrow {
  background: rgba(255, 255, 255, 0.3);
}
```

## 🔧 Validation Pattern

```jsx
const isStepValid = () => {
  switch (currentStep) {
    case 1:
      return data.title && data.description;
    case 2:
      return data.amount && data.duration;
    default:
      return false;
  }
};

<button 
  onClick={handleNext}
  disabled={!isStepValid()}
>
  Continue
</button>
```

## 📱 Responsive Breakpoint

All components respond at `768px`:

```css
@media (max-width: 768px) {
  /* Mobile styles automatically applied */
}
```

## 🧪 Testing Snippets

```javascript
// Test component rendering
import { render, screen } from '@testing-library/react';
import { FormField } from '../components/wizard';

test('renders form field', () => {
  render(<FormField label="Test" value="" onChange={() => {}} />);
  expect(screen.getByLabelText('Test')).toBeInTheDocument();
});

// Test lightbox hook
import { renderHook, act } from '@testing-library/react';
import useLightbox from '../hooks/useLightbox';

test('opens lightbox', () => {
  const { result } = renderHook(() => useLightbox());
  
  act(() => {
    result.current.openLightbox(['image.jpg'], 0);
  });
  
  expect(result.current.isOpen).toBe(true);
});
```

## 📋 Checklist for New Wizard Forms

- [ ] Import wizard components
- [ ] Define steps array
- [ ] Set up state management
- [ ] Add WizardProgress component
- [ ] Create step content with FormFields
- [ ] Add validation logic
- [ ] Implement navigation (next/back)
- [ ] Add submit handler
- [ ] Include useLightbox if images
- [ ] Import wizard CSS
- [ ] Test on mobile

## 🚀 Quick Start Template

```jsx
import React, { useState } from 'react';
import { WizardProgress, FormField } from '../components/wizard';
import '../styles/wizard/index.css';

const MyWizard = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [data, setData] = useState({});

  const steps = [
    { number: 1, title: 'Step 1', icon: '📝' },
    { number: 2, title: 'Step 2', icon: '✅' }
  ];

  const isValid = () => {
    // Your validation logic
    return true;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Your submit logic
  };

  return (
    <div className="wizard-container">
      <div className="wizard-header">
        <h1>My Wizard</h1>
        <p>Description</p>
      </div>

      <WizardProgress steps={steps} currentStep={currentStep} />

      <form onSubmit={handleSubmit} className="wizard-form">
        <div className="form-content">
          {currentStep === 1 && (
            <div className="step-content animate-in">
              <h2>Step 1</h2>
              <FormField
                label="Field 1"
                value={data.field1}
                onChange={(e) => setData({...data, field1: e.target.value})}
              />
            </div>
          )}

          {currentStep === 2 && (
            <div className="step-content animate-in">
              <h2>Step 2</h2>
              {/* Step 2 content */}
            </div>
          )}
        </div>

        <div className="wizard-navigation">
          {currentStep > 1 && (
            <button 
              type="button" 
              onClick={() => setCurrentStep(currentStep - 1)}
              className="btn-back"
            >
              ← Back
            </button>
          )}
          
          <div className="nav-spacer"></div>

          {currentStep < steps.length ? (
            <button 
              type="button" 
              onClick={() => setCurrentStep(currentStep + 1)}
              className="btn-next"
              disabled={!isValid()}
            >
              Continue →
            </button>
          ) : (
            <button type="submit" className="btn-submit">
              Submit
            </button>
          )}
        </div>
      </form>
    </div>
  );
};

export default MyWizard;
```

---

## 📚 Full Documentation

For complete documentation, see:
- `/frontend/src/components/wizard/README.md` - Component API docs
- `/REFACTORING_SUMMARY.md` - Refactoring details
- `/REFACTORING_ARCHITECTURE.md` - Visual architecture

---

*Quick Reference v1.0 - November 7, 2025*
