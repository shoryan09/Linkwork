import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AuthProvider, useAuth } from '@/context/auth-context'
import { DataProvider } from '@/context/data-context'
import { LanguageProvider } from '@/context/language-context'

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
}

// Mock sessionStorage  
const sessionStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
}

Object.defineProperty(window, 'localStorage', { value: localStorageMock })
Object.defineProperty(window, 'sessionStorage', { value: sessionStorageMock })

// Test component that uses auth
const AuthTestComponent = () => {
  const { currentUser, login, logout, signup } = useAuth()
  
  return (
    <div>
      <div data-testid="auth-status">
        {currentUser ? `Logged in as ${currentUser.email}` : 'Not logged in'}
      </div>
      <div data-testid="user-role">
        {currentUser ? currentUser.role : 'No role'}
      </div>
      <button 
        data-testid="login-client"
        onClick={() => login('client@client.com', 'client')}
      >
        Login as Client
      </button>
      <button 
        data-testid="login-freelancer"
        onClick={() => login('freelancer@freelancer.com', 'freelancer')}
      >
        Login as Freelancer
      </button>
      <button 
        data-testid="signup-new"
        onClick={() => signup({
          email: 'new@test.com',
          password: 'newpassword',
          role: 'client',
          name: 'New User',
          bio: 'New user bio',
          skills: []
        })}
      >
        Sign Up New User
      </button>
      <button data-testid="logout" onClick={logout}>
        Logout
      </button>
    </div>
  )
}

const Wrapper = ({ children }: { children: React.ReactNode }) => (
  <AuthProvider>
    <DataProvider>
      <LanguageProvider>
        {children}
      </LanguageProvider>
    </DataProvider>
  </AuthProvider>
)

describe('Authentication Flow Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    localStorageMock.getItem.mockReturnValue(null)
    sessionStorageMock.getItem.mockReturnValue(null)
  })

  it('should complete full authentication flow', async () => {
    // Setup seeded data
    const seedData = {
      users: [
        {
          id: 'client-id',
          email: 'client@client.com',
          password: 'client',
          role: 'client',
          name: 'Client User',
          bio: 'Client bio',
          skills: []
        },
        {
          id: 'freelancer-id',
          email: 'freelancer@freelancer.com',
          password: 'freelancer',
          role: 'freelancer',
          name: 'Freelancer User',
          bio: 'Freelancer bio',
          skills: ['React']
        }
      ],
      projects: [],
      proposals: [],
      gigs: []
    }
    
    localStorageMock.getItem.mockReturnValue(JSON.stringify(seedData))

    render(
      <Wrapper>
        <AuthTestComponent />
      </Wrapper>
    )

    // Initially not logged in
    expect(screen.getByTestId('auth-status')).toHaveTextContent('Not logged in')

    // Login as client
    fireEvent.click(screen.getByTestId('login-client'))

    await waitFor(() => {
      expect(screen.getByTestId('auth-status')).toHaveTextContent('Logged in as client@client.com')
      expect(screen.getByTestId('user-role')).toHaveTextContent('client')
    })

    // Logout
    fireEvent.click(screen.getByTestId('logout'))

    await waitFor(() => {
      expect(screen.getByTestId('auth-status')).toHaveTextContent('Not logged in')
    })

    // Login as freelancer
    fireEvent.click(screen.getByTestId('login-freelancer'))

    await waitFor(() => {
      expect(screen.getByTestId('auth-status')).toHaveTextContent('Logged in as freelancer@freelancer.com')
      expect(screen.getByTestId('user-role')).toHaveTextContent('freelancer')
    })
  })

  it('should handle signup and auto-login', async () => {
    // Setup empty user data
    localStorageMock.getItem.mockReturnValue(JSON.stringify({ users: [] }))

    render(
      <Wrapper>
        <AuthTestComponent />
      </Wrapper>
    )

    // Sign up new user
    fireEvent.click(screen.getByTestId('signup-new'))

    await waitFor(() => {
      expect(screen.getByTestId('auth-status')).toHaveTextContent('Logged in as new@test.com')
      expect(screen.getByTestId('user-role')).toHaveTextContent('client')
    })

    // Verify localStorage was updated
    expect(localStorageMock.setItem).toHaveBeenCalledWith(
      'linkwork_data',
      expect.stringContaining('new@test.com')
    )
  })

  it('should persist session across page reloads', () => {
    const userData = {
      id: 'test-id',
      email: 'test@test.com',
      role: 'client',
      name: 'Test User',
      bio: 'Test bio',
      skills: [],
      password: 'password'
    }

    // Mock session storage having user data
    sessionStorageMock.getItem.mockReturnValue(JSON.stringify(userData))

    render(
      <Wrapper>
        <AuthTestComponent />
      </Wrapper>
    )

    // Should auto-login from session
    expect(screen.getByTestId('auth-status')).toHaveTextContent('Logged in as test@test.com')
  })

  it('should handle login errors gracefully', async () => {
    // Setup data without matching user
    localStorageMock.getItem.mockReturnValue(JSON.stringify({ users: [] }))

    render(
      <Wrapper>
        <AuthTestComponent />
      </Wrapper>
    )

    // Try to login with non-existent user
    fireEvent.click(screen.getByTestId('login-client'))

    await waitFor(() => {
      expect(screen.getByTestId('auth-status')).toHaveTextContent('Not logged in')
    })
  })

  it('should handle signup with existing email', async () => {
    const existingUserData = {
      users: [{
        id: 'existing-id',
        email: 'new@test.com',
        password: 'existing',
        role: 'freelancer',
        name: 'Existing User',
        bio: 'Existing bio',
        skills: []
      }]
    }

    localStorageMock.getItem.mockReturnValue(JSON.stringify(existingUserData))

    render(
      <Wrapper>
        <AuthTestComponent />
      </Wrapper>
    )

    // Try to signup with existing email
    fireEvent.click(screen.getByTestId('signup-new'))

    await waitFor(() => {
      expect(screen.getByTestId('auth-status')).toHaveTextContent('Not logged in')
    })
  })
})