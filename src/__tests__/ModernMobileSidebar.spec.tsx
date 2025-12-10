import { describe, it, expect, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ModernMobileSidebar } from '@/components/Layout/ModernMobileSidebar'
import { MemoryRouter } from 'react-router-dom'

// Mock icons
vi.mock('lucide-react', async (importOriginal) => {
    const actual = await importOriginal()
    return {
        ...actual as any,
    }
})

describe('ModernMobileSidebar', () => {
    const defaultProps = {
        isOpen: true,
        onClose: vi.fn(),
        userName: 'Test User',
        userPlan: 'Free Plan',
        hasActivePass: false,
        isAdmin: false,
        onNavigate: vi.fn(),
        onLogout: vi.fn(),
    }

    const renderWithRouter = (ui: React.ReactNode) => {
        return render(
            <MemoryRouter>
                {ui}
            </MemoryRouter>
        )
    }

    it('should be visible when isOpen is true', () => {
        renderWithRouter(<ModernMobileSidebar {...defaultProps} />)
        expect(screen.getByText('Test User')).toBeDefined()
    })

    it('should not be visible when isOpen is false', () => {
        renderWithRouter(<ModernMobileSidebar {...defaultProps} isOpen={false} />)
        expect(screen.queryByText('Test User')).toBeNull()
    })

    it('calls onNavigate and onClose when a nav item is clicked', async () => {
        const user = userEvent.setup()
        renderWithRouter(<ModernMobileSidebar {...defaultProps} />)

        const studyRoomLink = screen.getByText('Sala de Estudos')
        await user.click(studyRoomLink)

        expect(defaultProps.onNavigate).toHaveBeenCalledWith('/sala-de-estudos')
        expect(defaultProps.onClose).toHaveBeenCalled()
    })

    it('calls onClose when close button is clicked', async () => {
        const user = userEvent.setup()
        renderWithRouter(<ModernMobileSidebar {...defaultProps} />)

        const closeBtn = screen.getByLabelText('Fechar menu')
        // Using await waitFor just in case of animation delays, though user.click handles it mostly
        await user.click(closeBtn)

        expect(defaultProps.onClose).toHaveBeenCalled()
    })
})
