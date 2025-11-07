import { useState } from 'react';

const useLightbox = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [images, setImages] = useState([]);

  const openLightbox = (imageArray, startIndex = 0) => {
    setImages(imageArray);
    setCurrentIndex(startIndex);
    setIsOpen(true);
  };

  const closeLightbox = () => {
    setIsOpen(false);
  };

  const nextImage = () => {
    setCurrentIndex((prev) => (prev + 1) % images.length);
  };

  const prevImage = () => {
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  return {
    isOpen,
    currentIndex,
    images,
    openLightbox,
    closeLightbox,
    nextImage,
    prevImage
  };
};

export default useLightbox;
