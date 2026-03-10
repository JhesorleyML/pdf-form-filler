import { useState } from 'react';
import FileSelector from './components/FileSelector';
import PdfViewer from './components/PdfViewer';
import { Download, Trash2, Type, Minus, Plus } from 'lucide-react';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';

interface PdfField {
  id: string;
  page: number;
  x: number; // Percentage
  y: number; // Percentage
  value: string;
  fontSize: number;
}

function App() {
  const [file, setFile] = useState<File | null>(null);
  const [fields, setFields] = useState<PdfField[]>([]);

  const handleFileSelect = (selectedFile: File) => {
    setFile(selectedFile);
    setFields([]); // Reset fields on new upload
  };

  const handlePageClick = (page: number, x: number, y: number) => {
    const newField: PdfField = {
      id: Math.random().toString(36).substring(2, 9),
      page,
      x,
      y,
      value: '',
      fontSize: 11, // Default font size
      };
      setFields([...fields, newField]);
      };

      const updateField = (id: string, updates: Partial<PdfField>) => {
      setFields(fields.map(f => (f.id === id ? { ...f, ...updates } : f)));
      };

      const deleteField = (id: string) => {
      setFields(fields.filter(f => f.id !== id));
      };

      const generatePdf = async () => {
      if (!file) return;

      try {
      const fileBuffer = await file.arrayBuffer();
      const pdfDoc = await PDFDocument.load(fileBuffer);
      const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
      const pages = pdfDoc.getPages();

      fields.forEach((field) => {
        const pageIndex = field.page - 1;
        if (pageIndex < pages.length) {
          const page = pages[pageIndex];
          const { width, height } = page.getSize();

          // Map percentages back to PDF points
          const pdfX = (field.x / 100) * width;
          // Baseline alignment: subtract about 35% of the font size to better align the text center
          const pdfY = height - ((field.y / 100) * height) - (field.fontSize * 0.35);
          
          page.drawText(field.value, {            x: pdfX,
            y: pdfY,
            size: field.fontSize,
            font: font,
            color: rgb(0, 0, 0),
          });
        }
      });
      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes as any], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `filled_${file.name}`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Failed to generate PDF. Check console for details.');
    }
  };

  return (
    <div className="app-container" style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px' }}>
      <header style={{ marginBottom: '30px', textAlign: 'center' }}>
        <h1>PDF Form Filler</h1>
        <p>Click on the PDF to add a text field.</p>
      </header>
      
      <main>
        {!file ? (
          <div style={{ maxWidth: '600px', margin: '0 auto' }}>
            <FileSelector onFileSelect={handleFileSelect} />
          </div>
        ) : (
          <div className="editor-layout" style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '20px' }}>
            <div className="pdf-editor-section">
              <PdfViewer 
                file={file} 
                fields={fields} 
                onPageClick={handlePageClick} 
                onFieldUpdate={(id, value) => updateField(id, { value })}
              />
            </div>
            
            <aside className="sidebar" style={{ border: '1px solid #ddd', borderRadius: '8px', padding: '20px', backgroundColor: '#fff', height: 'fit-content', position: 'sticky', top: '20px' }}>
              <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
                <button 
                  onClick={generatePdf} 
                  disabled={fields.length === 0}
                  style={{ flex: 2, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', padding: '8px 12px', backgroundColor: '#646cff', color: 'white', border: 'none' }}
                >
                  <Download size={16} /> Download
                </button>
                <button 
                  onClick={() => { if(confirm('Start over? Current changes will be lost.')) setFile(null); }}
                  style={{ flex: 1, border: '1px solid #ddd', backgroundColor: 'white', color: '#666' }}
                >
                  Reset
                </button>
              </div>
              
              <div className="fields-list" style={{ display: 'flex', flexDirection: 'column', gap: '15px', maxHeight: '60vh', overflowY: 'auto', paddingRight: '5px' }}>
                {fields.length === 0 && <p style={{ color: '#999', fontSize: '0.9em' }}>No fields added yet. Click on the document to start filling.</p>}
                {fields.map((field) => (
                  <div key={field.id} style={{ border: '1px solid #eee', padding: '12px', borderRadius: '8px', backgroundColor: '#fafafa' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', fontSize: '0.75rem', fontWeight: '600', color: '#888', textTransform: 'uppercase' }}>
                      <span>Page {field.page}</span>
                      <button 
                        onClick={() => deleteField(field.id)} 
                        style={{ border: 'none', background: 'none', color: '#ff4d4f', cursor: 'pointer', padding: 0 }}
                        title="Delete field"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                    
                    <input
                      type="text"
                      placeholder="Enter value..."
                      value={field.value}
                      onChange={(e) => updateField(field.id, { value: e.target.value })}
                      style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd', marginBottom: '10px' }}
                    />

                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#666' }}>
                        <Type size={14} />
                        <span style={{ fontSize: '0.8rem' }}>Size: {field.fontSize}px</span>
                      </div>
                      <div style={{ display: 'flex', gap: '4px', marginLeft: 'auto' }}>
                        <button 
                          onClick={() => updateField(field.id, { fontSize: Math.max(8, field.fontSize - 1) })}
                          style={{ padding: '2px 6px', border: '1px solid #ddd', background: '#fff', borderRadius: '4px' }}
                        >
                          <Minus size={12} />
                        </button>
                        <button 
                          onClick={() => updateField(field.id, { fontSize: Math.min(72, field.fontSize + 1) })}
                          style={{ padding: '2px 6px', border: '1px solid #ddd', background: '#fff', borderRadius: '4px' }}
                        >
                          <Plus size={12} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              <div style={{ marginTop: '20px', padding: '15px', border: '1px solid #646cff', borderRadius: '8px', backgroundColor: '#f0f0ff' }}>
                <p style={{ margin: 0, fontSize: '0.85em', fontWeight: 'bold', color: '#646cff' }}>
                  Privacy Check:
                </p>
                <p style={{ margin: 0, fontSize: '0.8em', color: '#666' }}>
                  Everything stays in your browser. No data is sent to any server.
                </p>
              </div>
            </aside>
          </div>
        )}
      </main>
    </div>
  )
}

export default App
