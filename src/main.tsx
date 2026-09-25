import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { App } from './App'
// Self-hosted so the PWA works offline and every platform gets the same rounded face.
import '@fontsource-variable/nunito'
import './styles.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
