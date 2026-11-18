import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import App from './App.jsx'
import { ThemeProvider } from './context/ThemeContext.jsx'
import { AppProvider } from './context/AppContext.jsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <ThemeProvider>
        <AppProvider>
          <App />
          <Toaster
            position="bottom-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: '#1e1e2a',
                color: '#f1f5f9',
                border: '1px solid #2a2a3a',
                borderRadius: '0.75rem',
                fontSize: '0.875rem',
              },
              success: {
                iconTheme: { primary: '#22c55e', secondary: '#1e1e2a' },
              },
              error: {
                iconTheme: { primary: '#ef4444', secondary: '#1e1e2a' },
              },
            }}
          />
        </AppProvider>
      </ThemeProvider>
    </BrowserRouter>
  </React.StrictMode>
)
