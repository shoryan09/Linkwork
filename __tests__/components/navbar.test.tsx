import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { usePathname } from 'next/navigation'
import { Navbar } from '@/components/navbar'
import { AuthProvider } from '@/context/auth-context'
import { LanguageProvider } from '@/context/language-context'

// Mock the hooks
jest.mock('next/navigation')
jest.mock('@/context/auth-context')
jest.mock('@/context/language-context')

const mockUseAuth = {
  currentUser: null,
  logout: jest.fn(),
}

const mockUseLanguage = {
  t: (key: string) => key, // Simple mock that returns the key
  lang: 'en',
  toggleLanguage: jest.fn(),
}

const renderNavbar = (user = null) => {
  (usePathname as jest.Mock).mockReturnValue('/')
  require('@/context/auth-context').useAuth.mockReturnValue({
    ...mockUseAuth,
    currentUser: user,
  })
  require('@/context/language-context').useLanguage.mockReturnValue(mockUseLanguage)

  return render(<Navbar />)
}

describe('Navbar', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should render app name link', () => {
    renderNavbar()
    expect(screen.getByText('appName')).toBeInTheDocument()
  })

  it('should render login and signup buttons when user is not authenticated', () => {
    renderNavbar()
    expect(screen.getByText('login')).toBeInTheDocument()
    expect(screen.getByText('signup')).toBeInTheDocument()
  })

  it('should render logout button when user is authenticated', () => {
    const mockUser = {
      id: '1',
      email: 'test@test.com',
      role: 'client' as const,
      name: 'Test User',
      bio: 'Test bio',
      skills: [],
      password: 'password'
    }
    
    renderNavbar(mockUser)
    expect(screen.getByText('logout')).toBeInTheDocument()
    expect(screen.queryByText('login')).not.toBeInTheDocument()
    expect(screen.queryByText('signup')).not.toBeInTheDocument()
  })

  it('should show client dashboard link for client users', () => {
    const clientUser = {
      id: '1',
      email: 'client@test.com',
      role: 'client' as const,
      name: 'Client User',
      bio: 'Client bio',
      skills: [],
      password: 'password'
    }
    
    renderNavbar(clientUser)
    expect(screen.getByText('clientDashboard')).toBeInTheDocument()
    expect(screen.queryByText('freelancerDashboard')).not.toBeInTheDocument()
  })

  it('should show freelancer dashboard link for freelancer users', () => {
    const freelancerUser = {
      id: '1',
      email: 'freelancer@test.com',
      role: 'freelancer' as const,
      name: 'Freelancer User',
      bio: 'Freelancer bio',
      skills: ['React'],
      password: 'password'
    }
    
    renderNavbar(freelancerUser)
    expect(screen.getByText('freelancerDashboard')).toBeInTheDocument()
    expect(screen.queryByText('clientDashboard')).not.toBeInTheDocument()
  })

  it('should call logout when logout button is clicked', () => {
    const mockUser = {
      id: '1',
      email: 'test@test.com',
      role: 'client' as const,
      name: 'Test User',
      bio: 'Test bio',
      skills: [],
      password: 'password'
    }
    
    renderNavbar(mockUser)
    
    fireEvent.click(screen.getByText('logout'))
    expect(mockUseAuth.logout).toHaveBeenCalled()
  })

  it('should show gigs link', () => {
    renderNavbar()
    expect(screen.getByText('gigs')).toBeInTheDocument()
  })

  it('should call toggleLanguage when language button is clicked', () => {
    renderNavbar()
    
    fireEvent.click(screen.getByText('EN'))
    expect(mockUseLanguage.toggleLanguage).toHaveBeenCalled()
  })

  it('should highlight active route', () => {
    (usePathname as jest.Mock).mockReturnValue('/gigs')
    renderNavbar()
    
    const gigsLink = screen.getByText('gigs')
    expect(gigsLink).toHaveClass('text-primary')
  })
})