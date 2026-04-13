import React from 'react'
import { render, RenderOptions } from '@testing-library/react'
import { AuthProvider } from '@/context/auth-context'
import { DataProvider } from '@/context/data-context'
import { LanguageProvider } from '@/context/language-context'

// Mock implementations for contexts
export const mockAuthContext = {
  currentUser: null,
  login: jest.fn(),
  logout: jest.fn(),
  signup: jest.fn(),
}

export const mockDataContext = {
  projects: [],
  proposals: [],
  gigs: [],
  createProject: jest.fn(),
  submitProposal: jest.fn(),
  updateProposalStatus: jest.fn(),
}

export const mockLanguageContext = {
  t: (key: string) => key,
  lang: 'en' as const,
  toggleLanguage: jest.fn(),
}

// Custom render function with all providers
const AllProviders = ({ children }: { children: React.ReactNode }) => {
  return (
    <AuthProvider>
      <DataProvider>
        <LanguageProvider>
          {children}
        </LanguageProvider>
      </DataProvider>
    </AuthProvider>
  )
}

export const renderWithProviders = (
  ui: React.ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) => render(ui, { wrapper: AllProviders, ...options })

// Factory functions for creating test data
export const createMockUser = (overrides = {}) => ({
  id: 'test-user-id',
  email: 'test@example.com',
  password: 'password123',
  role: 'client' as const,
  name: 'Test User',
  bio: 'Test user bio',
  skills: [],
  ...overrides,
})

export const createMockProject = (overrides = {}) => ({
  id: 'test-project-id',
  clientId: 'test-client-id',
  title: 'Test Project',
  description: 'Test project description',
  price: 5000,
  requiredSkills: ['React', 'TypeScript'],
  status: 'open' as const,
  isLocal: false,
  location: { state: 'Delhi', city: 'New Delhi' },
  ...overrides,
})

export const createMockProposal = (overrides = {}) => ({
  id: 'test-proposal-id',
  projectId: 'test-project-id',
  freelancerId: 'test-freelancer-id',
  coverLetter: 'Test cover letter',
  status: 'pending' as const,
  ...overrides,
})

export const createMockGig = (overrides = {}) => ({
  id: 'test-gig-id',
  title: 'Test Gig',
  price: 2000,
  turnaroundTime: '2 days',
  ...overrides,
})

// Helper to reset all mocks
export const resetAllMocks = () => {
  jest.clearAllMocks()
  
  // Reset context mocks
  Object.assign(mockAuthContext, {
    currentUser: null,
    login: jest.fn(),
    logout: jest.fn(),
    signup: jest.fn(),
  })
  
  Object.assign(mockDataContext, {
    projects: [],
    proposals: [],
    gigs: [],
    createProject: jest.fn(),
    submitProposal: jest.fn(),
    updateProposalStatus: jest.fn(),
  })
  
  Object.assign(mockLanguageContext, {
    t: (key: string) => key,
    lang: 'en' as const,
    toggleLanguage: jest.fn(),
  })
}

// Wait for loading states
export const waitForLoadingToFinish = () => 
  new Promise(resolve => setTimeout(resolve, 0))

// Custom matchers for better assertions
expect.extend({
  toBeValidEmail(received: string) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    const pass = emailRegex.test(received)
    
    if (pass) {
      return {
        message: () => `expected ${received} not to be a valid email`,
        pass: true,
      }
    } else {
      return {
        message: () => `expected ${received} to be a valid email`,
        pass: false,
      }
    }
  },
  
  toHaveValidPrice(received: number) {
    const pass = received > 0 && Number.isFinite(received)
    
    if (pass) {
      return {
        message: () => `expected ${received} not to be a valid price`,
        pass: true,
      }
    } else {
      return {
        message: () => `expected ${received} to be a valid price (positive number)`,
        pass: false,
      }
    }
  },
})

// Type declarations for custom matchers
declare global {
  namespace jest {
    interface Matchers<R> {
      toBeValidEmail(): R
      toHaveValidPrice(): R
    }
  }
}