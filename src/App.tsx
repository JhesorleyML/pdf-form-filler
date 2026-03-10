import { useState } from "react";
import FileSelector from "./components/FileSelector";
import PdfViewer from "./components/PdfViewer";
import { Download, Trash2, Type, Minus, Plus, Image as ImageIcon, MousePointer2 } from "lucide-react";
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";

interface PdfField {
  id: string;
  page: number;
  x: number; // Percentage
  y: number; // Percentage
  value: string; // Text value OR base64 image data
  fontSize: number;
  type: 'text' | 'image';
  width?: number;
  height?: number;
  scale?: number; // Scaling factor for images
}

function App() {
  const [file, setFile] = useState<File | null>(null);
  const [fields, setFields] = useState<PdfField[]>([]);
  const [toolMode, setToolMode] = useState<'text' | 'image'>('text');

  const handleFileSelect = (selectedFile: File) => {
    setFile(selectedFile);
    setFields([]); // Reset fields on new upload
  };

  const handlePageClick = async (page: number, x: number, y: number) => {
    if (toolMode === 'text') {
      const newField: PdfField = {
        id: Math.random().toString(36).substring(2, 9),
        page,
        x,
        y,
        value: "",
        fontSize: 11,
        type: 'text'
      };
      setFields([...fields, newField]);
    } else {
      // Image mode: trigger file picker
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/png, image/jpeg';
      input.onchange = async (e) => {
        const file = (e.target as HTMLInputElement).files?.[0];
        if (file) {
          const reader = new FileReader();
          reader.onload = (event) => {
            const base64 = event.target?.result as string;
            
            // Get dimensions
            const img = new Image();
            img.onload = () => {
              const newField: PdfField = {
                id: Math.random().toString(36).substring(2, 9),
                page,
                x,
                y,
                value: base64,
                fontSize: 0,
                type: 'image',
                width: img.width,
                height: img.height,
                scale: 0.5 // Default scale
              };
              setFields([...fields, newField]);
            };
            img.src = base64;
          };
          reader.readAsDataURL(file);
        }
      };
      input.click();
    }
  };

  const updateField = (id: string, updates: Partial<PdfField>) => {
    setFields(fields.map((f) => (f.id === id ? { ...f, ...updates } : f)));
  };

  const deleteField = (id: string) => {
    setFields(fields.filter((f) => f.id !== id));
  };

  const generatePdf = async () => {
    if (!file) return;

    try {
      const fileBuffer = await file.arrayBuffer();
      const pdfDoc = await PDFDocument.load(fileBuffer);
      const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
      const pages = pdfDoc.getPages();

      for (const field of fields) {
        const pageIndex = field.page - 1;
        if (pageIndex < pages.length) {
          const page = pages[pageIndex];
          const { width, height } = page.getSize();

          const pdfX = (field.x / 100) * width;
          const pdfY = height - (field.y / 100) * height;

          if (field.type === 'text') {
            page.drawText(field.value, {
              x: pdfX,
              y: pdfY - field.fontSize * 0.35,
              size: field.fontSize,
              font: font,
              color: rgb(0, 0, 0),
            });
          } else if (field.type === 'image') {
            const imageBytes = await fetch(field.value).then(res => res.arrayBuffer());
            const isPng = field.value.includes('image/png');
            const embeddedImage = isPng ? await pdfDoc.embedPng(imageBytes) : await pdfDoc.embedJpg(imageBytes);
            
            const imgWidth = (field.width || 100) * (field.scale || 1);
            const imgHeight = (field.height || 100) * (field.scale || 1);

            page.drawImage(embeddedImage, {
              x: pdfX - imgWidth / 2,
              y: pdfY - imgHeight / 2,
              width: imgWidth,
              height: imgHeight,
            });
          }
        }
      }

      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes as any], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `filled_${file.name}`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error generating PDF:", error);
      alert("Failed to generate PDF. Check console for details.");
    }
  };

  return (
    <div className="app-container">
      <header style={{ marginBottom: "20px", textAlign: "center" }}>
        <h1>Fillr</h1>
        <h3>PDF Form Filler</h3>
        <p>Choose a tool, then click on the PDF.</p>
        
        {file && (
          <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', marginTop: '15px' }}>
            <button 
              onClick={() => setToolMode('text')}
              style={{
                display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px',
                backgroundColor: toolMode === 'text' ? '#646cff' : '#f0f0f0',
                color: toolMode === 'text' ? 'white' : '#666',
                border: 'none', borderRadius: '4px', cursor: 'pointer'
              }}
            >
              <Type size={18} /> Text Tool
            </button>
            <button 
              onClick={() => setToolMode('image')}
              style={{
                display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px',
                backgroundColor: toolMode === 'image' ? '#646cff' : '#f0f0f0',
                color: toolMode === 'image' ? 'white' : '#666',
                border: 'none', borderRadius: '4px', cursor: 'pointer'
              }}
            >
              <ImageIcon size={18} /> Image Tool
            </button>
          </div>
        )}
      </header>

      <main>
        {!file ? (
          <div style={{ maxWidth: "600px", margin: "0 auto" }}>
            <FileSelector onFileSelect={handleFileSelect} />
          </div>
        ) : (
          <div className="editor-layout">
            <div className="pdf-editor-section">
              <PdfViewer
                file={file}
                fields={fields}
                onPageClick={handlePageClick}
                onFieldUpdate={(id, value) => updateField(id, { value })}
                onFieldMove={(id, x, y) => updateField(id, { x, y })}
              />
            </div>

            <aside className="sidebar">
              <div
                style={{ display: "flex", gap: "8px", marginBottom: "20px" }}
              >
                <button
                  onClick={generatePdf}
                  disabled={fields.length === 0}
                  style={{
                    flex: 2,
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    gap: "8px",
                    padding: "8px 12px",
                    backgroundColor: "#646cff",
                    color: "white",
                    border: "none",
                  }}
                >
                  <Download size={16} /> Download
                </button>
                <button
                  onClick={() => {
                    if (confirm("Start over? Current changes will be lost."))
                      setFile(null);
                  }}
                  style={{
                    flex: 1,
                    border: "1px solid #ddd",
                    backgroundColor: "white",
                    color: "#666",
                  }}
                >
                  Reset
                </button>
              </div>

              <div className="fields-list-container">
                <h3 style={{ marginBottom: "15px" }}>
                  Fields ({fields.length})
                </h3>
                <div
                  className="fields-list"
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "15px",
                    maxHeight: "60vh",
                    overflowY: "auto",
                    paddingRight: "5px",
                  }}
                >
                  {fields.length === 0 && (
                    <p style={{ color: "#999", fontSize: "0.9em" }}>
                      No fields added yet. Choose a tool and click on the document.
                    </p>
                  )}
                  {fields.map((field) => (
                    <div
                      key={field.id}
                      style={{
                        border: "1px solid #eee",
                        padding: "10px",
                        borderRadius: "6px",
                        backgroundColor: "#fafafa",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          marginBottom: "8px",
                          fontSize: "0.8em",
                          color: "#666",
                        }}
                      >
                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          {field.type === 'text' ? <Type size={12}/> : <ImageIcon size={12}/>}
                          Page {field.page}
                        </span>
                        <button
                          onClick={() => deleteField(field.id)}
                          style={{
                            border: "none",
                            background: "none",
                            color: "#ff4d4f",
                            cursor: "pointer",
                            padding: 0,
                          }}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                      
                      {field.type === 'text' ? (
                        <>
                          <input
                            type="text"
                            placeholder="Enter value..."
                            value={field.value}
                            onChange={(e) =>
                              updateField(field.id, { value: e.target.value })
                            }
                            style={{
                              width: "100%",
                              padding: "8px",
                              borderRadius: "4px",
                              border: "1px solid #ddd",
                              marginBottom: "8px",
                            }}
                          />
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "10px",
                            }}
                          >
                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "4px",
                                color: "#666",
                              }}
                            >
                              <Type size={14} />
                              <span style={{ fontSize: "0.8rem" }}>
                                {field.fontSize}px
                              </span>
                            </div>
                            <div
                              style={{
                                display: "flex",
                                gap: "4px",
                                marginLeft: "auto",
                              }}
                            >
                              <button
                                onClick={() =>
                                  updateField(field.id, {
                                    fontSize: Math.max(8, field.fontSize - 1),
                                  })
                                }
                                style={{
                                  padding: "2px 6px",
                                  border: "1px solid #ddd",
                                  background: "#fff",
                                  borderRadius: "4px",
                                }}
                              >
                                <Minus size={12} />
                              </button>
                              <button
                                onClick={() =>
                                  updateField(field.id, {
                                    fontSize: Math.min(72, field.fontSize + 1),
                                  })
                                }
                                style={{
                                  padding: "2px 6px",
                                  border: "1px solid #ddd",
                                  background: "#fff",
                                  borderRadius: "4px",
                                }}
                              >
                                <Plus size={12} />
                              </button>
                            </div>
                          </div>
                        </>
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          <img 
                            src={field.value} 
                            alt="preview" 
                            style={{ width: '100%', height: '60px', objectFit: 'contain', background: '#eee', borderRadius: '4px' }}
                          />
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <span style={{ fontSize: '0.8rem', color: '#666' }}>Scale: {(field.scale || 1).toFixed(2)}x</span>
                            <input 
                              type="range" 
                              min="0.1" 
                              max="2.0" 
                              step="0.05"
                              value={field.scale || 0.5}
                              onChange={(e) => updateField(field.id, { scale: parseFloat(e.target.value) })}
                              style={{ flex: 1 }}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div
                style={{
                  marginTop: "20px",
                  padding: "15px",
                  border: "1px solid #646cff",
                  borderRadius: "8px",
                  backgroundColor: "#f0f0ff",
                }}
              >
                <p
                  style={{
                    margin: 0,
                    fontSize: "0.85em",
                    fontWeight: "bold",
                    color: "#646cff",
                  }}
                >
                  Privacy Check:
                </p>
                <p style={{ margin: 0, fontSize: "0.8em", color: "#666" }}>
                  Everything stays in your browser. No data is sent to any
                  server.
                </p>
              </div>
            </aside>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
