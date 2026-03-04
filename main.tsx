// main.tsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import App from './App'
import Admin from './Admin'

// PASTIKAN BARIS INI BENAR
// Jika file index.css ada di folder yang sama dengan main.tsx
import './index.css' 

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/backoffice" element={<Admin />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>,
)
