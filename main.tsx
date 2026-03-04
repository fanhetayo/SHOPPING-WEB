import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import App from './App'
import Admin from './Admin'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        {/* Halaman Toko Utama */}
        <Route path="/" element={<App />} />
        
        {/* Halaman Admin Panel sesuai permintaan */}
        <Route path="/backoffice" element={<Admin />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>,
)
