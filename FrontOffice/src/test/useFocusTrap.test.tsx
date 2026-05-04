import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, act } from '@testing-library/react'
import React from 'react'
import { useFocusTrap } from '../app/hooks/useFocusTrap'

// Helper component that uses the hook with a real DOM container
function TrapComponent({
  isOpen,
  onClose,
}: {
  isOpen: boolean
  onClose?: () => void
}) {
  const ref = useFocusTrap(isOpen, onClose)
  return (
    <div ref={ref} data-testid="trap-container">
      <button data-testid="btn1">Button 1</button>
      <button data-testid="btn2">Button 2</button>
      <input data-testid="input1" />
    </div>
  )
}

describe('useFocusTrap', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render without errors when isOpen is false', () => {
    expect(() => render(<TrapComponent isOpen={false} />)).not.toThrow()
  })

  it('should render without errors when isOpen is true', () => {
    expect(() => render(<TrapComponent isOpen={true} />)).not.toThrow()
  })

  it('should call onClose when Escape key is pressed and isOpen is true', () => {
    const onClose = vi.fn()
    render(<TrapComponent isOpen={true} onClose={onClose} />)

    act(() => {
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))
    })

    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('should not call onClose when Escape is pressed and isOpen is false', () => {
    const onClose = vi.fn()
    render(<TrapComponent isOpen={false} onClose={onClose} />)

    act(() => {
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))
    })

    expect(onClose).not.toHaveBeenCalled()
  })

  it('should not call onClose when other keys are pressed', () => {
    const onClose = vi.fn()
    render(<TrapComponent isOpen={true} onClose={onClose} />)

    act(() => {
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }))
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Space', bubbles: true }))
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }))
    })

    expect(onClose).not.toHaveBeenCalled()
  })

  it('should work without onClose callback (no crash on Escape)', () => {
    render(<TrapComponent isOpen={true} />)

    expect(() => {
      act(() => {
        document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))
      })
    }).not.toThrow()
  })

  it('should handle Tab key without throwing', () => {
    render(<TrapComponent isOpen={true} />)

    expect(() => {
      act(() => {
        document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', bubbles: true }))
      })
    }).not.toThrow()
  })

  it('should handle Shift+Tab key without throwing', () => {
    render(<TrapComponent isOpen={true} />)

    expect(() => {
      act(() => {
        document.dispatchEvent(
          new KeyboardEvent('keydown', { key: 'Tab', shiftKey: true, bubbles: true })
        )
      })
    }).not.toThrow()
  })

  it('should stop listening when isOpen changes to false', () => {
    const onClose = vi.fn()
    const { rerender } = render(<TrapComponent isOpen={true} onClose={onClose} />)

    rerender(<TrapComponent isOpen={false} onClose={onClose} />)

    act(() => {
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))
    })

    expect(onClose).not.toHaveBeenCalled()
  })

  it('should start listening when isOpen changes to true', () => {
    const onClose = vi.fn()
    const { rerender } = render(<TrapComponent isOpen={false} onClose={onClose} />)

    rerender(<TrapComponent isOpen={true} onClose={onClose} />)

    act(() => {
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))
    })

    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('should clean up event listener on unmount', () => {
    const onClose = vi.fn()
    const { unmount } = render(<TrapComponent isOpen={true} onClose={onClose} />)

    unmount()

    act(() => {
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))
    })

    expect(onClose).not.toHaveBeenCalled()
  })
})
