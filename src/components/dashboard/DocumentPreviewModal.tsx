"use client";

import { useState } from "react";
import { X, ZoomIn, ZoomOut, Maximize2 } from "lucide-react";
import Image from "next/image";

interface DocumentPreviewModalProps {
  isOpen: boolean;
  documents: {
    type: string;
    url: string;
    name: string;
  }[];
  onClose: () => void;
}

export function DocumentPreviewModal({
  isOpen,
  documents,
  onClose,
}: DocumentPreviewModalProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [zoom, setZoom] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);

  if (!isOpen) return null;

  const currentDoc = documents[currentIndex];
  const hasMultiple = documents.length > 1;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div
        className={`${isFullscreen ? "w-full h-full" : "w-full max-w-2xl max-h-[90vh]"} bg-white rounded-lg flex flex-col`}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div>
            <h3 className="font-semibold text-gray-900">{currentDoc.name}</h3>
            {hasMultiple && (
              <p className="text-sm text-gray-500">
                Document {currentIndex + 1} of {documents.length}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto flex items-center justify-center bg-gray-50 p-4">
          <div
            style={{ transform: `scale(${zoom})` }}
            className="transition-transform">
            {currentDoc.url.endsWith(".pdf") ? (
              <div className="flex items-center justify-center h-full">
                <p className="text-gray-500">PDF preview not available</p>
              </div>
            ) : (
              <img
                src={currentDoc.url}
                alt={currentDoc.name}
                className="max-h-[60vh] max-w-full object-contain rounded"
              />
            )}
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-between p-4 border-t border-gray-200 bg-gray-50">
          <div className="flex gap-2">
            {hasMultiple && (
              <>
                <button
                  onClick={() => setCurrentIndex(Math.max(0, currentIndex - 1))}
                  disabled={currentIndex === 0}
                  className="px-3 py-2 bg-white border border-gray-200 rounded hover:bg-gray-50 disabled:opacity-50">
                  ← Prev
                </button>
                <button
                  onClick={() =>
                    setCurrentIndex(
                      Math.min(documents.length - 1, currentIndex + 1),
                    )
                  }
                  disabled={currentIndex === documents.length - 1}
                  className="px-3 py-2 bg-white border border-gray-200 rounded hover:bg-gray-50 disabled:opacity-50">
                  Next →
                </button>
              </>
            )}
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setZoom(Math.max(0.5, zoom - 0.1))}
              title="Zoom out"
              className="p-2 bg-white border border-gray-200 rounded hover:bg-gray-50">
              <ZoomOut className="w-4 h-4" />
            </button>
            <span className="px-3 py-2 text-sm font-medium">
              {Math.round(zoom * 100)}%
            </span>
            <button
              onClick={() => setZoom(Math.min(3, zoom + 0.1))}
              title="Zoom in"
              className="p-2 bg-white border border-gray-200 rounded hover:bg-gray-50">
              <ZoomIn className="w-4 h-4" />
            </button>
            <button
              onClick={() => setIsFullscreen(!isFullscreen)}
              title="Fullscreen"
              className="p-2 bg-white border border-gray-200 rounded hover:bg-gray-50">
              <Maximize2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
