import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { fieldList } from '@/fields'
import { Panel } from '@/panel/panel'
import { slots } from '@/slots'
import './index.css'

const root = document.getElementById('root')
if (root) {
  createRoot(root).render(
    <StrictMode>
      <Panel fields={fieldList} slots={slots} />
    </StrictMode>,
  )
}
