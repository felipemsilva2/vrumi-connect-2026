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

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: () => ({
      select: () => ({
        order: () => Promise.resolve({
          data: [
            { id: '1', code: 'R1', name: 'Pare', category: 'Regulamentação', image_url: '', description: 'Desc' }
          ],
          error: null
        })
      })
    }),
    auth: { getUser: async () => ({ data: { user: null } }) }
  }
}))

describe('TrafficSignsLibrary scroll to top on study mode', () => {
  it('scrolls to top when starting linear study', async () => {
    const user = userEvent.setup()
    window.scrollTo = vi.fn()
    render(
      <MemoryRouter>
        <TrafficSignsLibrary />
      </MemoryRouter>
    )
    const btn = await screen.findByRole('button', { name: /Estudo Linear/i })
    await user.click(btn)
    expect(window.scrollTo).toHaveBeenCalled()
})

describe('TrafficSignsLibrary above-the-fold visibility', () => {
  it('shows study modes panel expanded on initial render', async () => {
    render(
      <MemoryRouter>
        <TrafficSignsLibrary />
      </MemoryRouter>
    )
    const region = await screen.findByRole('region', { name: /Painel de modalidades de estudo/i })
    expect(region).toBeDefined()
    const linearBtn = await screen.findByRole('button', { name: /Iniciar Estudo Linear/i })
    expect(linearBtn).toBeDefined()
  })

  it('shows search input and category select without scrolling', async () => {
    render(
      <MemoryRouter>
        <TrafficSignsLibrary />
      </MemoryRouter>
    )
    const search = await screen.findByPlaceholderText(/Buscar por código, nome ou descrição/i)
    expect(search).toBeDefined()
    const categorySelect = await screen.findByDisplayValue(/Todas/i)
    expect(categorySelect).toBeDefined()
  })
})
  it('scrolls to top when starting smart study', async () => {
    const user = userEvent.setup()
    window.scrollTo = vi.fn()
    render(
      <MemoryRouter>
        <TrafficSignsLibrary />
      </MemoryRouter>
    )
    const btn = await screen.findByRole('button', { name: /Estudo Inteligente/i })
    await user.click(btn)
    expect(window.scrollTo).toHaveBeenCalled()
  })

  it('scrolls to top when starting timed challenge', async () => {
    const user = userEvent.setup()
    window.scrollTo = vi.fn()
    render(
      <MemoryRouter>
        <TrafficSignsLibrary />
      </MemoryRouter>
    )
    const btn = await screen.findByRole('button', { name: /Desafio 60s/i })
    await user.click(btn)
    expect(window.scrollTo).toHaveBeenCalled()
  })
})
