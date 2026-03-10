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
  value: string;
  fontSize: number;
}

interface PdfViewerProps {
  file: File;
  fields: PdfField[];
  onPageClick: (pageNumber: number, x: number, y: number) => void;
  onFieldUpdate: (id: string, value: string) => void;
}

const PdfViewer: React.FC<PdfViewerProps> = ({ file, fields, onPageClick, onFieldUpdate }) => {
  const [numPages, setNumPages] = useState<number | null>(null);
  const [scale, setScale] = useState(1.2);

  // Responsive scaling
  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      if (width < 600) {
        setScale(0.6);
      } else if (width < 1024) {
        setScale(0.8);
      } else {
        setScale(1.2);
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
  };

  const handlePageClick = (pageNumber: number, event: React.MouseEvent<HTMLDivElement>) => {
    // If user clicked an input, don't add a new field
    if ((event.target as HTMLElement).tagName === 'INPUT') return;
    
    const rect = event.currentTarget.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * 100;
    const y = ((event.clientY - rect.top) / rect.height) * 100;
    onPageClick(pageNumber, x, y);
  };

  return (
    <div className="pdf-viewer-container" style={{ overflowY: 'auto', maxHeight: '85vh', padding: '10px', border: '1px solid #ddd', borderRadius: '8px', backgroundColor: '#525659' }}>
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
                cursor: 'crosshair', 
                position: 'relative',
                width: 'fit-content',
                margin: '0 auto 20px auto'
              }}
              onClick={(e) => handlePageClick(pageNumber, e)}
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
                  style={{
                    position: 'absolute',
                    left: `${field.x}%`,
                    top: `${field.y}%`,
                    transform: 'translate(0, -50%)',
                    zIndex: 10,
                    display: 'inline-grid',
                    alignItems: 'center'
                  }}
                >
                  {/* Ghost text for auto-sizing width */}
                  <span
                    style={{
                      gridArea: '1/1',
                      visibility: 'hidden',
                      whiteSpace: 'pre',
                      padding: '2px 6px',
                      fontSize: `${field.fontSize * scale}px`,
                      fontFamily: 'Inter, system-ui, sans-serif',
                      minWidth: '30px'
                    }}
                  >
                    {field.value || ' '}
                  </span>
                  
                  <input
                    type="text"
                    value={field.value}
                    onChange={(e) => onFieldUpdate(field.id, e.target.value)}
                    placeholder=""
                    style={{
                      gridArea: '1/1',
                      width: '100%',
                      height: '100%',
                      padding: '2px 4px',
                      fontSize: `${field.fontSize * scale}px`,
                      border: '1px solid #646cff',
                      borderRadius: '2px',
                      backgroundColor: 'rgba(255, 255, 255, 0.3)',
                      color: '#000',
                      outline: 'none',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                      fontFamily: 'inherit'
                    }}
                    autoFocus={field.value === ''}
                    onClick={(e) => e.stopPropagation()}
                  />
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
