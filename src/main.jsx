import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { initializeTracking } from './utils/visitorTracker'

// Initialize visitor tracking
initializeTracking();

createRoot(document.getElementById('root')).render(
<StrictMode>
    <App />
 </StrictMode>,
)
