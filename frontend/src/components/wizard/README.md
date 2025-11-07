# Wizard Components

A reusable, modular wizard system for multi-step forms with image upload and preview capabilities.

## 📁 Structure

```
frontend/src/
├── components/wizard/
│   ├── index.js                 # Export all wizard components
│   ├── WizardProgress.js        # Progress bar and step indicators
│   ├── FormField.js             # Reusable form input component
│   ├── CategorySelector.js      # Visual category selection grid
│   ├── ImageUploader.js         # File upload component
│   ├── ImagePreview.js          # Single image preview with overlay
│   ├── GalleryPreview.js        # Gallery grid with thumbnails
│   └── Lightbox.js              # Full-screen image viewer modal
├── hooks/
│   └── useLightbox.js           # Custom hook for lightbox state management
└── styles/wizard/
    ├── index.css                # Main CSS file (imports all below)
    ├── WizardLayout.css         # Wizard container, header, navigation
    ├── CategorySelector.css     # Category grid styling
    ├── ImageUpload.css          # File upload and preview styles
    ├── Lightbox.css             # Modal and lightbox styles
    └── CampaignSummary.css      # Summary component styles
```

## 🎯 Components

### WizardProgress
Displays progress bar and step indicators.

```jsx
import { WizardProgress } from '../components/wizard';

<WizardProgress 
  steps={[
    { number: 1, title: 'Basic Info', icon: '📝' },
    { number: 2, title: 'Details', icon: '📋' }
  ]} 
  currentStep={1}
  onStepClick={(stepNumber) => setCurrentStep(stepNumber)}
/>
```

**Props:**
- `steps` (array) - Array of step objects with number, title, and icon
- `currentStep` (number) - Current active step
- `onStepClick` (function) - Optional callback when clicking on completed steps

---

### FormField
Reusable form input component supporting text, textarea, number, and other input types.

```jsx
import { FormField } from '../components/wizard';

<FormField
  label="Campaign Title"
  type="text"
  placeholder="Enter title"
  value={value}
  onChange={(e) => setValue(e.target.value)}
  helperText="Make it descriptive"
  required
/>
```

**Props:**
- `label` (string) - Field label
- `type` (string) - Input type (text, textarea, number, url, etc.)
- `value` (string) - Input value
- `onChange` (function) - Change handler
- `placeholder` (string) - Placeholder text
- `helperText` (string) - Helper text below input
- `required` (boolean) - Whether field is required
- `rows` (number) - Textarea rows (when type="textarea")
- `min`, `step` - Number input attributes

---

### CategorySelector
Visual grid-based category selection with icons.

```jsx
import { CategorySelector, CAMPAIGN_CATEGORIES } from '../components/wizard';

<CategorySelector
  selectedCategory={category}
  onSelect={(category) => setCategory(category)}
/>
```

**Props:**
- `selectedCategory` (string) - Currently selected category value
- `onSelect` (function) - Callback when category is selected

**Exports:**
- `CAMPAIGN_CATEGORIES` - Predefined array of 21 categories with icons

---

### ImageUploader
File upload component with drag-and-drop support.

```jsx
import { ImageUploader } from '../components/wizard';

<ImageUploader
  id="main-image"
  label="Main Campaign Image"
  helperText="This will be the primary image"
  onFileChange={(e) => handleFileChange(e)}
  onFileRemove={() => setFile(null)}
  selectedFile={file}
  icon="📸"
  primaryText="Click to upload image"
  multiple={false}
/>
```

**Props:**
- `id` (string) - Input element ID
- `label` (string) - Label text
- `helperText` (string) - Helper text
- `multiple` (boolean) - Allow multiple file selection
- `onFileChange` (function) - File change handler
- `onFileRemove` (function) - Optional remove handler (for single files)
- `selectedFile` (File) - Currently selected file (for single upload)
- `icon` (string) - Emoji icon to display
- `primaryText` (string) - Primary upload text
- `secondaryText` (string) - Secondary upload text

---

### ImagePreview
Preview for a single image with click-to-view functionality.

```jsx
import { ImagePreview } from '../components/wizard';

<ImagePreview
  file={imageFile}
  onClick={() => openLightbox([imageFile], 0)}
  onRemove={() => setImageFile(null)}
  className="main-image-preview"
/>
```

**Props:**
- `file` (File|string) - File object or URL
- `onClick` (function) - Optional click handler for viewing full size
- `onRemove` (function) - Optional remove handler
- `className` (string) - Additional CSS classes

---

### GalleryPreview
Grid display of multiple images with thumbnails.

```jsx
import { GalleryPreview } from '../components/wizard';

<GalleryPreview
  files={galleryFiles}
  onImageClick={(index) => openLightbox(galleryFiles, index)}
  onRemove={(index) => removeFile(index)}
/>
```

**Props:**
- `files` (array) - Array of File objects or URLs
- `onImageClick` (function) - Optional click handler with index
- `onRemove` (function) - Optional remove handler with index

---

### Lightbox
Full-screen image viewer modal with keyboard navigation.

```jsx
import { Lightbox } from '../components/wizard';

<Lightbox
  isOpen={isOpen}
  images={images}
  currentIndex={currentIndex}
  onClose={() => closeLightbox()}
  onNext={() => nextImage()}
  onPrev={() => prevImage()}
/>
```

**Props:**
- `isOpen` (boolean) - Whether lightbox is visible
- `images` (array) - Array of File objects or URLs
- `currentIndex` (number) - Currently displayed image index
- `onClose` (function) - Close handler
- `onNext` (function) - Next image handler
- `onPrev` (function) - Previous image handler

**Keyboard Support:**
- `Escape` - Close lightbox
- `ArrowRight` - Next image
- `ArrowLeft` - Previous image

---

## 🪝 Hooks

### useLightbox
Custom hook for managing lightbox state.

```jsx
import useLightbox from '../hooks/useLightbox';

function MyComponent() {
  const lightbox = useLightbox();

  const handleImageClick = (images, startIndex) => {
    lightbox.openLightbox(images, startIndex);
  };

  return (
    <div>
      <img onClick={() => handleImageClick([file], 0)} />
      
      <Lightbox
        isOpen={lightbox.isOpen}
        images={lightbox.images}
        currentIndex={lightbox.currentIndex}
        onClose={lightbox.closeLightbox}
        onNext={lightbox.nextImage}
        onPrev={lightbox.prevImage}
      />
    </div>
  );
}
```

**Returns:**
- `isOpen` (boolean) - Lightbox visibility state
- `currentIndex` (number) - Current image index
- `images` (array) - Array of images
- `openLightbox(images, startIndex)` - Open lightbox with images
- `closeLightbox()` - Close lightbox
- `nextImage()` - Navigate to next image
- `prevImage()` - Navigate to previous image

---

## 🎨 CSS Organization

All styles are modular and can be imported individually or as a whole:

```jsx
// Import all wizard styles
import '../styles/wizard/index.css';

// Or import specific modules
import '../styles/wizard/WizardLayout.css';
import '../styles/wizard/Lightbox.css';
```

**CSS Modules:**
- `WizardLayout.css` - Container, header, progress bar, navigation buttons
- `CategorySelector.css` - Category grid and button styles
- `ImageUpload.css` - File upload, previews, gallery grid
- `Lightbox.css` - Modal overlay and lightbox styling
- `CampaignSummary.css` - Summary component styling

---

## 📱 Responsive Design

All components are fully responsive with mobile-first design:
- Progress steps stack vertically on mobile
- Category grid adapts columns based on screen width
- Gallery grid adjusts thumbnail size
- Lightbox controls resize for touch devices
- Form inputs expand to full width

Breakpoint: `768px`

---

## ♿ Accessibility

- Keyboard navigation support (Tab, Enter, Escape, Arrows)
- Semantic HTML elements
- ARIA labels where needed
- Focus states on interactive elements
- Alt text support for images

---

## 🚀 Usage Example

```jsx
import React, { useState } from 'react';
import {
  WizardProgress,
  FormField,
  CategorySelector,
  ImageUploader,
  ImagePreview,
  GalleryPreview,
  Lightbox
} from '../components/wizard';
import useLightbox from '../hooks/useLightbox';
import '../styles/wizard/index.css';

const MyWizard = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({});
  const lightbox = useLightbox();

  const steps = [
    { number: 1, title: 'Basic Info', icon: '📝' },
    { number: 2, title: 'Media', icon: '🖼️' }
  ];

  return (
    <div className="wizard-container">
      <WizardProgress 
        steps={steps} 
        currentStep={currentStep}
      />

      {currentStep === 1 && (
        <div>
          <FormField
            label="Title"
            value={formData.title}
            onChange={(e) => setFormData({...formData, title: e.target.value})}
            required
          />
          
          <CategorySelector
            selectedCategory={formData.category}
            onSelect={(cat) => setFormData({...formData, category: cat})}
          />
        </div>
      )}

      {currentStep === 2 && (
        <div>
          <ImageUploader
            id="main-image"
            label="Main Image"
            onFileChange={(e) => setFormData({...formData, image: e.target.files[0]})}
            selectedFile={formData.image}
          />

          {formData.image && (
            <ImagePreview
              file={formData.image}
              onClick={() => lightbox.openLightbox([formData.image], 0)}
            />
          )}
        </div>
      )}

      <Lightbox {...lightbox} />
    </div>
  );
};

export default MyWizard;
```

---

## 🔧 Customization

### Styling
All CSS classes are prefixed and can be overridden:

```css
/* Override wizard header background */
.wizard-header {
  background: linear-gradient(135deg, #your-color 0%, #your-color-2 100%);
}

/* Customize category buttons */
.category-btn.selected {
  background: your-gradient;
}
```

### Extending Components
Components are designed to be extended:

```jsx
// Create a custom FormField variant
const CustomFormField = (props) => (
  <FormField
    {...props}
    className={`custom-field ${props.className}`}
  />
);
```

---

## 📦 Dependencies

- React 18+
- No external UI libraries required
- Pure CSS (no CSS-in-JS)

---

## 🤝 Contributing

When adding new wizard components:

1. Create component in `components/wizard/`
2. Add corresponding CSS in `styles/wizard/`
3. Export from `components/wizard/index.js`
4. Import CSS in `styles/wizard/index.css`
5. Document in this README

---

## 📝 Notes

- File objects are converted to URLs using `URL.createObjectURL()`
- Lightbox supports both File objects and URL strings
- All form fields are controlled components
- Validation should be handled in parent component
- CSS uses modern features (Grid, Flexbox, CSS Variables)
