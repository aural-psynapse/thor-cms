import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { PreviewPage } from '@/demo/preview-page'
import { fieldList } from '@/fields'
import { Panel } from '@/panel/panel'
import { slots } from '@/slots'
import './index.css'

// The same page draws the demo site when the preview frame asks for it with
// ?preview, so the demo needs nothing but this one app.
const showingPreview = new URLSearchParams(window.location.search).has('preview')

const root = document.getElementById('root')
if (root) {
  createRoot(root).render(
    <StrictMode>
      {showingPreview ? <PreviewPage /> : <Panel fields={fieldList} slots={slots} />}
    </StrictMode>,
  )
}
