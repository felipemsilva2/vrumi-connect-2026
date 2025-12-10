import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MobileHeader } from '@/components/Layout/MobileHeader'

describe('MobileHeader', () => {
    const mockUser = { email: 'test@example.com' }
    const mockProfile = { full_name: 'Test User' }

    it('renders with full profile data', () => {
        render(<MobileHeader user={mockUser} profile={mockProfile} />)
        // Use flexible text matching
        expect(screen.getByText(/Olá, Test/i)).toBeDefined()
        expect(screen.getByText(/Confira as novidades/i)).toBeDefined()
    })

    it('renders with only user email (fallback)', () => {
        render(<MobileHeader user={mockUser} profile={null} />)
        expect(screen.getByText(/Olá, test/i)).toBeDefined()
    })

    it('renders with no data (default fallback)', () => {
        render(<MobileHeader user={null} profile={null} />)
        expect(screen.getByText(/Olá, Estudante/i)).toBeDefined()
    })

    it('renders custom subtitle', () => {
        render(<MobileHeader user={mockUser} profile={mockProfile} subtitle="Custom Subtitle" />)
        expect(screen.getByText('Custom Subtitle')).toBeDefined()
    })

    it('reloads page on button click', () => {
        const reloadMock = vi.fn()
        // Mock window.location.reload using a different approach compatible with JSDOM
        const originalLocation = window.location

        // JSDOM might throw if we try to assign window.location directly
        // So we delete it first (if configurable)
        try {
            delete (window as any).location
                ; (window as any).location = { ...originalLocation, reload: reloadMock }

            render(<MobileHeader user={mockUser} profile={mockProfile} />)
            const reloadBtn = screen.getByLabelText('Atualizar página')
            fireEvent.click(reloadBtn)

            expect(reloadMock).toHaveBeenCalled()
        } finally {
            // Restore
            if (!(window.location as any).reload) {
                (window as any).location = originalLocation
            }
        }
    })
})
