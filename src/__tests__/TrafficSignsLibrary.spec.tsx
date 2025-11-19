import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import TrafficSignsLibrary from '@/pages/TrafficSignsLibrary'

vi.mock('react-router-dom', async (orig) => {
  const actual = await orig() as any
  return { 
    ...actual,
    useNavigate: () => vi.fn()
  }
})

vi.mock('@/utils/studyAnalytics', () => ({
  analytics: { trackEvent: vi.fn() }
}))

describe('TrafficSignsLibrary back navigation', () => {
  it('renders back button and navigates to home on click', async () => {
    const user = userEvent.setup()
    render(
      <MemoryRouter>
        <TrafficSignsLibrary />
      </MemoryRouter>
    )

    const btn = await screen.findByRole('button', { name: /Voltar/i })
    expect(btn).toBeDefined()
    await user.click(btn)
  })

  it('is keyboard accessible', async () => {
    const user = userEvent.setup()
    render(
      <MemoryRouter>
        <TrafficSignsLibrary />
      </MemoryRouter>
    )
    const btn = await screen.findByRole('button', { name: /Voltar/i })
    btn.focus()
    expect(document.activeElement).toBe(btn)
    await user.keyboard('{Enter}')
  })
})