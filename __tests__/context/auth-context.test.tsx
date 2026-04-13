import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { AuthProvider, useAuth, type User, type Role } from '@/context/auth-context'

// Test wrapper component
const TestComponent = () => {
  const { currentUser, login, logout, signup } = useAuth()
  
  return (
    <div>
      <div data-testid="current-user">
        {currentUser ? JSON.stringify(currentUser) : 'null'}
      </div>
      <button 
        data-testid="login-btn" 
        onClick={() => login('test@test.com', 'password')}
      >
        Login
      </button>
      <button 
        data-testid="logout-btn" 
        onClick={logout}
      >
        Logout
      </button>
      <button 
        data-testid="signup-btn" 
        onClick={() => signup({
          email: 'new@test.com',
          password: 'newpass',
          role: 'client' as Role,
          name: 'Test User',
          bio: 'Test bio',
          skills: ['skill1']
        })}
      >
        Signup
      </button>
    </div>
  )
}

const renderWithAuthProvider = () => {
  return render(
    <AuthProvider>
      <TestComponent />
    </AuthProvider>
  )
}

describe('AuthContext', () => {
  beforeEach(() => {
    // Clear storage before each test
    localStorage.clear()
    sessionStorage.clear()
  })

  it('should provide initial null user state', () => {
    renderWithAuthProvider()
    expect(screen.getByTestId('current-user')).toHaveTextContent('null')
  })

  it('should handle successful login with existing user', async () => {
    // Mock existing user in localStorage
    const mockUser: User = {
      id: 'test-id',
      email: 'test@test.com',
      password: 'password',
      role: 'client',
      name: 'Test User',
      bio: 'Test bio',
      skills: []
    }
    
    localStorage.setItem('linkwork_data', JSON.stringify({
      users: [mockUser]
    }))

    renderWithAuthProvider()
    
    fireEvent.click(screen.getByTestId('login-btn'))
    
    await waitFor(() => {
      expect(screen.getByTestId('current-user')).toHaveTextContent(JSON.stringify(mockUser))
    })
  })

  it('should handle failed login with invalid credentials', async () => {
    renderWithAuthProvider()
    
    fireEvent.click(screen.getByTestId('login-btn'))
    
    await waitFor(() => {
      expect(screen.getByTestId('current-user')).toHaveTextContent('null')
    })
  })

  it('should handle logout', async () => {
    const mockUser: User = {
      id: 'test-id',
      email: 'test@test.com',
      password: 'password',
      role: 'client',
      name: 'Test User',
      bio: 'Test bio',
      skills: []
    }
    
    localStorage.setItem('linkwork_data', JSON.stringify({
      users: [mockUser]
    }))

    renderWithAuthProvider()
    
    // Login first
    fireEvent.click(screen.getByTestId('login-btn'))
    
    await waitFor(() => {
      expect(screen.getByTestId('current-user')).not.toHaveTextContent('null')
    })
    
    // Then logout
    fireEvent.click(screen.getByTestId('logout-btn'))
    
    await waitFor(() => {
      expect(screen.getByTestId('current-user')).toHaveTextContent('null')
    })
  })

  it('should handle successful signup', async () => {
    renderWithAuthProvider()
    
    fireEvent.click(screen.getByTestId('signup-btn'))
    
    await waitFor(() => {
      const currentUserText = screen.getByTestId('current-user').textContent
      expect(currentUserText).toContain('new@test.com')
      expect(currentUserText).toContain('Test User')
    })
  })

  it('should prevent signup with existing email', async () => {
    // Setup existing user
    localStorage.setItem('linkwork_data', JSON.stringify({
      users: [{
        id: 'existing-id',
        email: 'new@test.com',
        password: 'existing',
        role: 'freelancer',
        name: 'Existing User',
        bio: 'Existing bio',
        skills: []
      }]
    }))

    renderWithAuthProvider()
    
    fireEvent.click(screen.getByTestId('signup-btn'))
    
    await waitFor(() => {
      expect(screen.getByTestId('current-user')).toHaveTextContent('null')
    })
  })

  it('should restore session from sessionStorage on mount', () => {
    const mockUser: User = {
      id: 'session-id',
      email: 'session@test.com',
      password: 'sessionpass',
      role: 'freelancer',
      name: 'Session User',
      bio: 'Session bio',
      skills: ['React']
    }
    
    sessionStorage.setItem('linkwork_session_user', JSON.stringify(mockUser))
    
    renderWithAuthProvider()
    
    expect(screen.getByTestId('current-user')).toHaveTextContent(JSON.stringify(mockUser))
  })

  it('should throw error when useAuth is used outside provider', () => {
    // Temporarily suppress console.error for this test
    const originalError = console.error
    console.error = jest.fn()
    
    expect(() => {
      render(<TestComponent />)
    }).toThrow('useAuth must be used within AuthProvider')
    
    console.error = originalError
  })
})