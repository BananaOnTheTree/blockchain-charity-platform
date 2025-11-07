import React from 'react';

const GalleryPreview = ({ files, onImageClick, onRemove }) => {
  if (!files || files.length === 0) return null;

  return (
    <div className="gallery-preview">
      <h4>Gallery Images ({files.length})</h4>
      <div className="gallery-grid">
        {files.map((file, index) => {
          const imageUrl = file instanceof File 
            ? URL.createObjectURL(file) 
            : file;

          return (
            <div key={index} className="gallery-item">
              <img 
                src={imageUrl} 
                alt={`Gallery ${index + 1}`}
                onClick={() => onImageClick && onImageClick(index)}
                style={{ cursor: onImageClick ? 'pointer' : 'default' }}
              />
              {onRemove && (
                <button
                  type="button"
                  className="gallery-remove"
                  onClick={(e) => {
                    e.stopPropagation();
                    onRemove(index);
                  }}
                >
                  ×
                </button>
              )}
              <div className="gallery-label">Image {index + 1}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default GalleryPreview;
