import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { DataProvider, useData, type Project, type Proposal } from '@/context/data-context'

// Test wrapper component
const TestComponent = () => {
  const { projects, proposals, gigs, createProject, submitProposal, updateProposalStatus } = useData()
  
  return (
    <div>
      <div data-testid="projects-count">{projects.length}</div>
      <div data-testid="proposals-count">{proposals.length}</div>
      <div data-testid="gigs-count">{gigs.length}</div>
      <button 
        data-testid="create-project-btn" 
        onClick={() => createProject({
          clientId: 'test-client',
          title: 'Test Project',
          description: 'Test Description',
          price: 5000,
          requiredSkills: ['React'],
          isLocal: false,
          location: { state: 'Delhi', city: 'New Delhi' }
        })}
      >
        Create Project
      </button>
      <button 
        data-testid="submit-proposal-btn" 
        onClick={() => submitProposal({
          projectId: 'test-project',
          freelancerId: 'test-freelancer',
          coverLetter: 'Test cover letter'
        })}
      >
        Submit Proposal
      </button>
      <button 
        data-testid="approve-proposal-btn" 
        onClick={() => updateProposalStatus('test-proposal', 'approved')}
      >
        Approve Proposal
      </button>
    </div>
  )
}

const renderWithDataProvider = () => {
  return render(
    <DataProvider>
      <TestComponent />
    </DataProvider>
  )
}

describe('DataContext', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('should initialize with seeded data when no existing data', () => {
    renderWithDataProvider()
    
    // Should have seeded projects and gigs
    expect(screen.getByTestId('projects-count')).toHaveTextContent('2')
    expect(screen.getByTestId('gigs-count')).toHaveTextContent('3')
    expect(screen.getByTestId('proposals-count')).toHaveTextContent('0')
  })

  it('should load existing data from localStorage', () => {
    const existingData = {
      users: [],
      projects: [
        {
          id: 'existing-project',
          clientId: 'client1',
          title: 'Existing Project',
          description: 'Existing Description',
          price: 3000,
          requiredSkills: ['Vue'],
          status: 'open',
          isLocal: true,
          location: { state: 'Maharashtra', city: 'Mumbai' }
        }
      ],
      proposals: [],
      gigs: []
    }
    
    localStorage.setItem('linkwork_data', JSON.stringify(existingData))
    
    renderWithDataProvider()
    
    expect(screen.getByTestId('projects-count')).toHaveTextContent('1')
    expect(screen.getByTestId('proposals-count')).toHaveTextContent('0')
    expect(screen.getByTestId('gigs-count')).toHaveTextContent('0')
  })

  it('should create new project', async () => {
    renderWithDataProvider()
    
    const initialCount = parseInt(screen.getByTestId('projects-count').textContent || '0')
    
    fireEvent.click(screen.getByTestId('create-project-btn'))
    
    await waitFor(() => {
      expect(screen.getByTestId('projects-count')).toHaveTextContent(String(initialCount + 1))
    })
  })

  it('should submit proposal', async () => {
    renderWithDataProvider()
    
    const initialCount = parseInt(screen.getByTestId('proposals-count').textContent || '0')
    
    fireEvent.click(screen.getByTestId('submit-proposal-btn'))
    
    await waitFor(() => {
      expect(screen.getByTestId('proposals-count')).toHaveTextContent(String(initialCount + 1))
    })
  })

  it('should update proposal status', async () => {
    // First setup a proposal
    const dataWithProposal = {
      users: [],
      projects: [
        {
          id: 'test-project',
          clientId: 'client1',
          title: 'Test Project',
          description: 'Test Description',
          price: 5000,
          requiredSkills: ['React'],
          status: 'open',
          isLocal: false,
          location: { state: 'Delhi', city: 'New Delhi' }
        }
      ],
      proposals: [
        {
          id: 'test-proposal',
          projectId: 'test-project',
          freelancerId: 'freelancer1',
          coverLetter: 'Test cover letter',
          status: 'pending'
        }
      ],
      gigs: []
    }
    
    localStorage.setItem('linkwork_data', JSON.stringify(dataWithProposal))
    
    renderWithDataProvider()
    
    fireEvent.click(screen.getByTestId('approve-proposal-btn'))
    
    // Should update localStorage with approved status
    await waitFor(() => {
      const storedData = JSON.parse(localStorage.getItem('linkwork_data') || '{}')
      const proposal = storedData.proposals.find((p: any) => p.id === 'test-proposal')
      expect(proposal?.status).toBe('approved')
      
      // Should also close the related project
      const project = storedData.projects.find((p: any) => p.id === 'test-project')
      expect(project?.status).toBe('closed')
    })
  })

  it('should handle malformed localStorage data gracefully', () => {
    localStorage.setItem('linkwork_data', 'invalid-json')
    
    renderWithDataProvider()
    
    // Should fall back to seeded data
    expect(screen.getByTestId('projects-count')).toHaveTextContent('2')
    expect(screen.getByTestId('gigs-count')).toHaveTextContent('3')
  })

  it('should throw error when useData is used outside provider', () => {
    const originalError = console.error
    console.error = jest.fn()
    
    expect(() => {
      render(<TestComponent />)
    }).toThrow('useData must be used within DataProvider')
    
    console.error = originalError
  })
})