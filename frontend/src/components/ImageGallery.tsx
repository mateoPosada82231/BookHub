"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight, X, Image as ImageIcon } from "lucide-react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";

interface ImageGalleryProps {
  images: string[];
  businessName?: string;
}

export function ImageGallery({ images, businessName }: ImageGalleryProps) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  if (images.length === 0) {
    return null;
  }

  const openLightbox = (index: number) => {
    setSelectedIndex(index);
  };

  const closeLightbox = () => {
    setSelectedIndex(null);
  };

  const goToPrevious = () => {
    if (selectedIndex !== null) {
      setSelectedIndex(
        selectedIndex === 0 ? images.length - 1 : selectedIndex - 1,
      );
    }
  };

  const goToNext = () => {
    if (selectedIndex !== null) {
      setSelectedIndex(
        selectedIndex === images.length - 1 ? 0 : selectedIndex + 1,
      );
    }
  };

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") closeLightbox();
    if (e.key === "ArrowLeft") goToPrevious();
    if (e.key === "ArrowRight") goToNext();
  };

  return (
    <>
      <div className="gallery-section">
        <div className="gallery-header">
          <ImageIcon size={20} />
          <h3>Galería</h3>
          <span className="gallery-count">
            {images.length} foto{images.length !== 1 ? "s" : ""}
          </span>
        </div>

        <div className="gallery-grid">
          {images.slice(0, 6).map((imageUrl, index) => (
            <div
              key={index}
              className={`gallery-item ${index === 0 ? "gallery-item-large" : ""}`}
              onClick={() => openLightbox(index)}
            >
              {" "}
              <Image
                src={imageUrl}
                alt={`${businessName || "Negocio"} - Foto ${index + 1}`}
                fill
                sizes="(max-width: 768px) 50vw, 33vw"
                className="gallery-img"
                loading="lazy"
                style={{ objectFit: "cover" }}
              />
              {index === 5 && images.length > 6 && (
                <div className="gallery-more-overlay">
                  <span>+{images.length - 6}</span>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Lightbox */}
      <AnimatePresence>
        {selectedIndex !== null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="lightbox-overlay"
            onClick={closeLightbox}
            onKeyDown={handleKeyDown}
            tabIndex={0}
          >
            <button className="lightbox-close" onClick={closeLightbox}>
              <X size={24} />
            </button>

            <button
              className="lightbox-nav lightbox-prev"
              onClick={(e) => {
                e.stopPropagation();
                goToPrevious();
              }}
            >
              <ChevronLeft size={32} />
            </button>

            <motion.div
              key={selectedIndex}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="lightbox-content"
              onClick={(e) => e.stopPropagation()}
            >
              <Image
                src={images[selectedIndex]}
                alt={`${businessName || "Negocio"} - Foto ${selectedIndex + 1}`}
                fill
                sizes="90vw"
                style={{ objectFit: "contain" }}
                priority
              />
              <div className="lightbox-counter">
                {selectedIndex + 1} / {images.length}
              </div>
            </motion.div>

            <button
              className="lightbox-nav lightbox-next"
              onClick={(e) => {
                e.stopPropagation();
                goToNext();
              }}
            >
              <ChevronRight size={32} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
