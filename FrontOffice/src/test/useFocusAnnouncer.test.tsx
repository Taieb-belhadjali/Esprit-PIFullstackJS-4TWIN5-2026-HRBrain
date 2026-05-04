import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useFocusAnnouncer } from '../app/hooks/useFocusAnnouncer'

describe('useFocusAnnouncer', () => {
  let speak: ReturnType<typeof vi.fn>

  beforeEach(() => {
    speak = vi.fn()
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.clearAllMocks()
  })

  it('should not throw when disabled', () => {
    expect(() => renderHook(() => useFocusAnnouncer(speak, false))).not.toThrow()
  })

  it('should not throw when enabled', () => {
    expect(() => renderHook(() => useFocusAnnouncer(speak, true))).not.toThrow()
  })

  it('should not speak on focus without prior Tab key press', () => {
    renderHook(() => useFocusAnnouncer(speak, true))

    const button = document.createElement('button')
    button.textContent = 'Click me'
    document.body.appendChild(button)

    act(() => {
      // No Tab key — mouse navigation mode
      button.dispatchEvent(new FocusEvent('focus', { bubbles: true }))
    })

    vi.runAllTimers()
    expect(speak).not.toHaveBeenCalled()

    document.body.removeChild(button)
  })

  it('should speak on focus after Tab key press', () => {
    renderHook(() => useFocusAnnouncer(speak, true))

    const button = document.createElement('button')
    button.textContent = 'Click me'
    document.body.appendChild(button)

    act(() => {
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', bubbles: true }))
    })

    act(() => {
      const focusEvent = new FocusEvent('focus', { bubbles: true })
      Object.defineProperty(focusEvent, 'target', { value: button })
      document.dispatchEvent(focusEvent)
    })

    vi.runAllTimers()
    expect(speak).toHaveBeenCalledWith('Click me')

    document.body.removeChild(button)
  })

  it('should not speak after mousedown resets keyboard mode', () => {
    renderHook(() => useFocusAnnouncer(speak, true))

    const button = document.createElement('button')
    button.textContent = 'Click me'
    document.body.appendChild(button)

    act(() => {
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', bubbles: true }))
      document.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }))
    })

    act(() => {
      const focusEvent = new FocusEvent('focus', { bubbles: true })
      Object.defineProperty(focusEvent, 'target', { value: button })
      document.dispatchEvent(focusEvent)
    })

    vi.runAllTimers()
    expect(speak).not.toHaveBeenCalled()

    document.body.removeChild(button)
  })

  it('should read aria-label when available', () => {
    renderHook(() => useFocusAnnouncer(speak, true))

    const button = document.createElement('button')
    button.setAttribute('aria-label', 'Close dialog')
    button.textContent = 'X'
    document.body.appendChild(button)

    act(() => {
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', bubbles: true }))
    })

    act(() => {
      const focusEvent = new FocusEvent('focus', { bubbles: true })
      Object.defineProperty(focusEvent, 'target', { value: button })
      document.dispatchEvent(focusEvent)
    })

    vi.runAllTimers()
    expect(speak).toHaveBeenCalledWith('Close dialog')

    document.body.removeChild(button)
  })

  it('should not speak when disabled even after Tab key', () => {
    renderHook(() => useFocusAnnouncer(speak, false))

    const button = document.createElement('button')
    button.textContent = 'Click me'
    document.body.appendChild(button)

    act(() => {
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', bubbles: true }))
    })

    act(() => {
      const focusEvent = new FocusEvent('focus', { bubbles: true })
      Object.defineProperty(focusEvent, 'target', { value: button })
      document.dispatchEvent(focusEvent)
    })

    vi.runAllTimers()
    expect(speak).not.toHaveBeenCalled()

    document.body.removeChild(button)
  })

  it('should clean up listeners on unmount', () => {
    const { unmount } = renderHook(() => useFocusAnnouncer(speak, true))

    const button = document.createElement('button')
    button.textContent = 'After unmount'
    document.body.appendChild(button)

    unmount()

    act(() => {
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', bubbles: true }))
    })

    act(() => {
      const focusEvent = new FocusEvent('focus', { bubbles: true })
      Object.defineProperty(focusEvent, 'target', { value: button })
      document.dispatchEvent(focusEvent)
    })

    vi.runAllTimers()
    expect(speak).not.toHaveBeenCalled()

    document.body.removeChild(button)
  })

  it('should re-register listeners when enabled changes to true', () => {
    const { rerender } = renderHook(
      ({ enabled }) => useFocusAnnouncer(speak, enabled),
      { initialProps: { enabled: false } }
    )

    const button = document.createElement('button')
    button.textContent = 'Now enabled'
    document.body.appendChild(button)

    rerender({ enabled: true })

    act(() => {
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', bubbles: true }))
    })

    act(() => {
      const focusEvent = new FocusEvent('focus', { bubbles: true })
      Object.defineProperty(focusEvent, 'target', { value: button })
      document.dispatchEvent(focusEvent)
    })

    vi.runAllTimers()
    expect(speak).toHaveBeenCalledWith('Now enabled')

    document.body.removeChild(button)
  })

  it('should skip BODY element on focus', () => {
    renderHook(() => useFocusAnnouncer(speak, true))

    act(() => {
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', bubbles: true }))
    })

    act(() => {
      const focusEvent = new FocusEvent('focus', { bubbles: true })
      Object.defineProperty(focusEvent, 'target', { value: document.body })
      document.dispatchEvent(focusEvent)
    })

    vi.runAllTimers()
    expect(speak).not.toHaveBeenCalled()
  })
})
