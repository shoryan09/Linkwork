import React from 'react'
import { render, screen } from '@testing-library/react'
import { useRouter } from 'next/navigation'
import { ProtectedRoute } from '@/components/protected-route'
import { AuthProvider } from '@/context/auth-context'

// Mock Next.js router
jest.mock('next/navigation')
jest.mock('@/context/auth-context')

const mockPush = jest.fn()
const mockUseRouter = {
  push: mockPush,
  replace: jest.fn(),
  back: jest.fn(),
  forward: jest.fn(),
  refresh: jest.fn(),
  prefetch: jest.fn(),
}

const TestComponent = () => <div data-testid="protected-content">Protected Content</div>

describe('ProtectedRoute', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(useRouter as jest.Mock).mockReturnValue(mockUseRouter)
  })

  it('should render children when user is authenticated', () => {
    const mockUser = {
      id: '1',
      email: 'test@test.com',
      role: 'client' as const,
      name: 'Test User',
      bio: 'Test bio',
      skills: [],
      password: 'password'
    }

    require('@/context/auth-context').useAuth.mockReturnValue({
      currentUser: mockUser,
    })

    render(
      <AuthProvider>
        <ProtectedRoute>
          <TestComponent />
        </ProtectedRoute>
      </AuthProvider>
    )

    expect(screen.getByTestId('protected-content')).toBeInTheDocument()
  })

  it('should redirect to login when user is not authenticated', () => {
    require('@/context/auth-context').useAuth.mockReturnValue({
      currentUser: null,
    })

    render(
      <AuthProvider>
        <ProtectedRoute>
          <TestComponent />
        </ProtectedRoute>
      </AuthProvider>
    )

    expect(mockPush).toHaveBeenCalledWith('/login')
    expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument()
  })

  it('should show loading state initially', () => {
    require('@/context/auth-context').useAuth.mockReturnValue({
      currentUser: undefined, // Simulating loading state
    })

    render(
      <AuthProvider>
        <ProtectedRoute>
          <TestComponent />
        </ProtectedRoute>
      </AuthProvider>
    )

    // Should not render children or redirect while loading
    expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument()
    expect(mockPush).not.toHaveBeenCalled()
  })
})