import React, { useEffect } from 'react';

const Lightbox = ({ 
  isOpen, 
  images, 
  currentIndex, 
  onClose, 
  onNext, 
  onPrev 
}) => {
  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight' && onNext) onNext();
      if (e.key === 'ArrowLeft' && onPrev) onPrev();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, onNext, onPrev]);

  if (!isOpen || !images || images.length === 0) return null;

  const currentImage = images[currentIndex];
  const imageUrl = currentImage instanceof File 
    ? URL.createObjectURL(currentImage) 
    : currentImage;

  return (
    <div className="lightbox-overlay" onClick={onClose}>
      <button className="lightbox-close" onClick={onClose}>×</button>
      
      {images.length > 1 && (
        <>
          <button 
            className="lightbox-arrow lightbox-prev" 
            onClick={(e) => { 
              e.stopPropagation(); 
              onPrev && onPrev(); 
            }}
          >
            ‹
          </button>
          
          <button 
            className="lightbox-arrow lightbox-next" 
            onClick={(e) => { 
              e.stopPropagation(); 
              onNext && onNext(); 
            }}
          >
            ›
          </button>
        </>
      )}
      
      <div className="lightbox-content" onClick={(e) => e.stopPropagation()}>
        <img 
          src={imageUrl} 
          alt={`Preview ${currentIndex + 1}`}
        />
        {images.length > 1 && (
          <div className="lightbox-caption">
            {currentIndex + 1} / {images.length}
          </div>
        )}
      </div>
    </div>
  );
};

export default Lightbox;
