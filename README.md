# Fillr: Private PDF Form Filler

**Fillr** is a lightweight, privacy-focused, browser-based application designed to help you fill out PDF forms without ever uploading your data to a server. It allows you to place text and images directly onto a PDF, resize them, and reposition them using an intuitive drag-and-drop interface.

## 🚀 Live Demo
Access the app here: **[https://JhesorleyML.github.io/pdf-form-filler/](https://JhesorleyML.github.io/pdf-form-filler/)**

---

## ✨ Key Features

-   **🔒 Privacy-First Design:** All processing happens locally in your browser. Your documents and data never leave your computer.
-   **✍️ Dynamic Text Fields:** Text boxes automatically expand and contract as you type.
-   **🖼️ Image Support:** Upload and embed PNG/JPG images (like signatures or photos) directly into the PDF.
-   **🖱️ Drag-and-Drop Repositioning:** Click and drag any field (text or image) to position it with pixel-perfect accuracy.
-   **📏 Real-time Scaling:** Adjust font sizes or image scales with live visual feedback.
-   **📄 Multi-Page Support:** Seamlessly navigate and fill fields across multiple pages.
-   **💾 Client-Side Generation:** Generate and download your updated PDF instantly using `pdf-lib`.

---

## 🛠️ Technology Stack

-   **Framework:** [React 19](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
-   **Build Tool:** [Vite](https://vitejs.dev/)
-   **PDF Rendering:** [react-pdf](https://projects.wojtekmaj.pl/react-pdf/)
-   **PDF Manipulation:** [pdf-lib](https://pdf-lib.js.org/)
-   **Icons:** [Lucide React](https://lucide.dev/)
-   **Deployment:** GitHub Actions + GitHub Pages

---

## 🏗️ Architecture

The application follows a **frontend-only architecture**, requiring no backend or database.

```text
User Browser
     │
     │ 1. Upload PDF & Images
     │
React Application (Vite/TS)
     │
     ├── Render PDF (react-pdf)
     ├── Interactive Overlay (Drag & Drop)
     ├── Data Capture
     └── Generate Modified PDF (pdf-lib)
     │
     ▼
2. Download Updated PDF
```

---

## 📦 Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) (v18 or higher)
- npm or yarn

### Installation
1. Clone the repository:
   ```bash
   git clone https://github.com/JhesorleyML/pdf-form-filler.git
   ```
2. Navigate to the project folder:
   ```bash
   cd pdf-editor
   ```
3. Install dependencies:
   ```bash
   npm install
   ```
4. Start the development server:
   ```bash
   npm run dev
   ```

---

## 📜 Implementation Details
For a detailed breakdown of the development phases and technical refinements (like the coordinate mapping logic), please refer to the [implementation.md](./implementation.md) file.

---

## 🤝 Contributing
Feel free to fork this project and submit pull requests. For major changes, please open an issue first to discuss what you would like to change.

## 📄 License
[MIT](https://choosealicense.com/licenses/mit/)
