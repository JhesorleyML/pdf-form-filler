import React, { useCallback } from 'react';
import { Upload } from 'lucide-react';

interface FileSelectorProps {
  onFileSelect: (file: File) => void;
}

const FileSelector: React.FC<FileSelectorProps> = ({ onFileSelect }) => {
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type === 'application/pdf') {
      onFileSelect(file);
    } else {
      alert('Please upload a valid PDF file.');
    }
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
  };

  const handleDrop = useCallback(
    (event: React.DragEvent<HTMLDivElement>) => {
      event.preventDefault();
      const file = event.dataTransfer.files?.[0];
      if (file && file.type === 'application/pdf') {
        onFileSelect(file);
      } else {
        alert('Please upload a valid PDF file.');
      }
    },
    [onFileSelect]
  );

  return (
    <div
      className="file-selector"
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      style={{
        border: '2px dashed #ccc',
        borderRadius: '12px',
        padding: '40px',
        textAlign: 'center',
        cursor: 'pointer',
        backgroundColor: '#f9f9f9',
        color: '#666',
        transition: 'border-color 0.3s',
      }}
      onClick={() => document.getElementById('file-input')?.click()}
    >
      <Upload size={48} style={{ marginBottom: '16px', color: '#646cff' }} />
      <h3>Click or drag and drop to upload PDF</h3>
      <p>Maximum file size: 10MB</p>
      <input
        id="file-input"
        type="file"
        accept=".pdf"
        onChange={handleFileChange}
        style={{ display: 'none' }}
      />
    </div>
  );
};

export default FileSelector;
