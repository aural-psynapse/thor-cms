import { render } from '@testing-library/react'
import { ImageIcon } from 'lucide-react'
import { describe, expect, it } from 'vitest'
import { Thumb } from '@/panel/thumb'

describe('the little square on a picture box', () => {
  it('fills the square for a picture cut to a set shape', () => {
    const { container } = render(<Thumb url='https://x.test/a.jpg' icon={ImageIcon} />)
    expect(container.querySelector('img')!.className).toContain('object-cover')
  })

  it('shows the whole picture, a logo say, for a box that keeps any shape', () => {
    const { container } = render(<Thumb url='https://x.test/logo.png' icon={ImageIcon} whole />)
    expect(container.querySelector('img')!.className).toContain('object-contain')
  })
})
