import React, { useState, useEffect } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

// Configure pdfjs worker
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

interface PdfField {
  id: string;
  page: number;
  x: number; // Percentage (0-100)
  y: number; // Percentage (0-100)
  value: string; // Text OR base64 image data
  fontSize: number;
  type: 'text' | 'image';
  width?: number;
  height?: number;
  scale?: number;
}

interface PdfViewerProps {
  file: File;
  fields: PdfField[];
  onPageClick: (pageNumber: number, x: number, y: number) => void;
  onFieldUpdate: (id: string, value: string) => void;
  onFieldMove: (id: string, x: number, y: number) => void;
}

const PdfViewer: React.FC<PdfViewerProps> = ({ file, fields, onPageClick, onFieldUpdate, onFieldMove }) => {
  const [numPages, setNumPages] = useState<number | null>(null);
  const [scale, setScale] = useState(1.2);
  const [draggingId, setDraggingId] = useState<string | null>(null);

  // Responsive scaling
  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      if (width < 600) setScale(0.6);
      else if (width < 1024) setScale(0.8);
      else setScale(1.2);
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleMouseDown = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setDraggingId(id);
  };

  const handleMouseMove = (pageNumber: number, e: React.MouseEvent<HTMLDivElement>) => {
    if (!draggingId) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    // Constrain to page boundaries
    const safeX = Math.max(0, Math.min(100, x));
    const safeY = Math.max(0, Math.min(100, y));

    onFieldMove(draggingId, safeX, safeY);
  };

  const handleMouseUp = () => {
    setDraggingId(null);
  };

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
  };

  const handlePageClick = (pageNumber: number, event: React.MouseEvent<HTMLDivElement>) => {
    if (draggingId) return;
    const target = event.target as HTMLElement;
    if (target.tagName === 'INPUT' || target.tagName === 'IMG' || target.closest('.field-container')) return;
    
    const rect = event.currentTarget.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * 100;
    const y = ((event.clientY - rect.top) / rect.height) * 100;
    onPageClick(pageNumber, x, y);
  };

  return (
    <div 
      className="pdf-viewer-container" 
      style={{ overflowY: 'auto', maxHeight: '85vh', padding: '10px', border: '1px solid #ddd', borderRadius: '8px', backgroundColor: '#525659' }}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      <Document
        file={file}
        onLoadSuccess={onDocumentLoadSuccess}
        loading={<p style={{ color: 'white' }}>Loading PDF...</p>}
      >
        {Array.from(new Array(numPages), (_, index) => {
          const pageNumber = index + 1;
          const pageFields = fields.filter(f => f.page === pageNumber);
          
          return (
            <div
              key={`page_${pageNumber}`}
              className="pdf-page-wrapper"
              style={{ 
                marginBottom: '20px', 
                display: 'flex', 
                justifyContent: 'center', 
                cursor: draggingId ? 'grabbing' : 'crosshair', 
                position: 'relative',
                width: 'fit-content',
                margin: '0 auto 20px auto',
                userSelect: draggingId ? 'none' : 'auto'
              }}
              onClick={(e) => handlePageClick(pageNumber, e)}
              onMouseMove={(e) => handleMouseMove(pageNumber, e)}
            >
              <Page
                pageNumber={pageNumber}
                renderTextLayer={true}
                renderAnnotationLayer={true}
                scale={scale}
              />
              
              {/* Overlay Fields */}
              {pageFields.map((field) => (
                <div
                  key={field.id}
                  className="field-container"
                  onMouseDown={(e) => handleMouseDown(field.id, e)}
                  style={{
                    position: 'absolute',
                    left: `${field.x}%`,
                    top: `${field.y}%`,
                    transform: field.type === 'text' ? 'translate(0, -50%)' : 'translate(-50%, -50%)',
                    zIndex: draggingId === field.id ? 100 : 10,
                    display: 'inline-block',
                    cursor: draggingId === field.id ? 'grabbing' : 'grab',
                    transition: draggingId === field.id ? 'none' : 'all 0.1s ease-out'
                  }}
                >
                  {field.type === 'text' ? (
                    <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                      <span
                        style={{
                          visibility: 'hidden',
                          whiteSpace: 'pre',
                          padding: '0 4px',
                          fontSize: `${field.fontSize * scale}px`,
                          fontFamily: 'inherit',
                          fontWeight: 'inherit',
                          letterSpacing: 'inherit',
                          minWidth: '1.5ch',
                          lineHeight: '1.4',
                          pointerEvents: 'none',
                          display: 'inline-block'
                        }}
                      >
                        {field.value ? field.value + '\u00A0' : '  '} 
                      </span>
                      
                      <input
                        type="text"
                        value={field.value}
                        onChange={(e) => onFieldUpdate(field.id, e.target.value)}
                        style={{
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          width: '100%',
                          height: '100%',
                          padding: '0 4px',
                          fontSize: `${field.fontSize * scale}px`,
                          fontFamily: 'inherit',
                          border: draggingId === field.id ? '2px solid #646cff' : '1px solid rgba(100, 108, 255, 0.5)',
                          borderRadius: '2px',
                          backgroundColor: 'rgba(255, 255, 255, 0.2)',
                          color: '#000',
                          outline: 'none',
                          lineHeight: '1.4',
                          boxSizing: 'border-box'
                        }}
                        autoFocus={field.value === ''}
                        onClick={(e) => e.stopPropagation()}
                      />
                    </div>
                  ) : (
                    <div 
                      style={{ 
                        display: 'flex', 
                        border: draggingId === field.id ? '2px solid #646cff' : '1px dashed #646cff',
                        padding: '2px',
                        backgroundColor: 'rgba(100, 108, 255, 0.1)',
                      }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <img 
                        src={field.value} 
                        alt="User upload" 
                        style={{ 
                          // The preview size should be a reasonable portion of the original scaled size
                          // We use a base width (e.g. 200px) multiplied by the scale and the PDF zoom
                          width: `${(field.width || 100) * (field.scale || 0.5) * (scale / 1.2)}px`,
                          height: 'auto',
                          objectFit: 'contain',
                          pointerEvents: 'none',
                          display: 'block'
                        }} 
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          );
        })}
      </Document>
    </div>
  );
};

export default PdfViewer;
