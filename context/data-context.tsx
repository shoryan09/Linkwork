"use client"

import type React from "react"
import { createContext, useContext, useEffect, useMemo, useState } from "react"
import type { User } from "./auth-context"

export type ProjectStatus = "open" | "closed"
export type ProposalStatus = "pending" | "approved" | "rejected"

export type Project = {
  id: string
  clientId: string
  title: string
  description: string
  price: number
  requiredSkills: string[]
  status: ProjectStatus
  isLocal: boolean
  location: { state: string; city: string }
}

export type Proposal = {
  id: string
  projectId: string
  freelancerId: string
  coverLetter: string
  status: ProposalStatus
}

export type Gig = {
  id: string
  title: string
  price: number
  turnaroundTime: string
}

type Store = {
  users: User[]
  projects: Project[]
  proposals: Proposal[]
  gigs: Gig[]
}

type DataContextValue = {
  projects: Project[]
  proposals: Proposal[]
  gigs: Gig[]
  createProject: (data: Omit<Project, "id" | "status">) => void
  submitProposal: (data: Omit<Proposal, "id" | "status">) => void
  updateProposalStatus: (proposalId: string, status: ProposalStatus) => void
}

const DATA_KEY = "linkwork_data"
const DataContext = createContext<DataContextValue | null>(null)

function seedData(): Store {
  const clientId = crypto.randomUUID()
  const freelancerId = crypto.randomUUID()
  const users: User[] = [
    {
      id: clientId,
      email: "client@client.com",
      password: "client",
      role: "client",
      name: "Client One",
      bio: "Small business owner focusing on branding.",
      skills: [],
    },
    {
      id: freelancerId,
      email: "freelancer@freelancer.com",
      password: "freelancer",
      role: "freelancer",
      name: "Freelancer Pro",
      bio: "Designer and writer with 5+ years experience.",
      skills: ["Design", "Writing"],
    },
  ]
  const projects: Project[] = [
    {
      id: crypto.randomUUID(),
      clientId,
      title: "Logo for coffee shop",
      description: "Need a clean, modern logo for a neighborhood coffee shop. Deliver vector and social media assets.",
      price: 4000,
      requiredSkills: ["Design", "Branding"],
      status: "open",
      isLocal: true,
      location: { state: "Delhi", city: "New Delhi" },
    },
    {
      id: crypto.randomUUID(),
      clientId,
      title: "Website copy refresh",
      description: "Revamp homepage and about page copy to improve conversions.",
      price: 6000,
      requiredSkills: ["Writing", "Marketing"],
      status: "open",
      isLocal: false,
      location: { state: "Maharashtra", city: "Mumbai" },
    },
  ]
  const proposals: Proposal[] = []
  const gigs: Gig[] = [
    { id: crypto.randomUUID(), title: "One-page brochure", price: 1500, turnaroundTime: "2 days" },
    { id: crypto.randomUUID(), title: "Landing page wireframe", price: 2500, turnaroundTime: "3 days" },
    { id: crypto.randomUUID(), title: "Product description copy (3 items)", price: 1200, turnaroundTime: "1 day" },
  ]
  return { users, projects, proposals, gigs }
}

export function DataProvider({ children }: { children: React.ReactNode }) {
  const [projects, setProjects] = useState<Project[]>([])
  const [proposals, setProposals] = useState<Proposal[]>([])
  const [gigs, setGigs] = useState<Gig[]>([])

  // Initialize store
  useEffect(() => {
    if (typeof window === "undefined") return
    const existing = localStorage.getItem(DATA_KEY)
    if (!existing) {
      const seeded = seedData()
      localStorage.setItem(DATA_KEY, JSON.stringify(seeded))
      setProjects(seeded.projects)
      setProposals(seeded.proposals)
      setGigs(seeded.gigs)
      return
    }
    try {
      const parsed: Store = JSON.parse(existing)
      setProjects(parsed.projects || [])
      setProposals(parsed.proposals || [])
      setGigs(parsed.gigs || [])
    } catch {
      const seeded = seedData()
      localStorage.setItem(DATA_KEY, JSON.stringify(seeded))
      setProjects(seeded.projects)
      setProposals(seeded.proposals)
      setGigs(seeded.gigs)
    }
  }, [])

  const save = (updates: Partial<Store>) => {
    if (typeof window === "undefined") return
    const current: Store = JSON.parse(localStorage.getItem(DATA_KEY) || "{}")
    const merged: Store = {
      users: current.users || [],
      projects: updates.projects ?? current.projects ?? [],
      proposals: updates.proposals ?? current.proposals ?? [],
      gigs: updates.gigs ?? current.gigs ?? [],
    }
    localStorage.setItem(DATA_KEY, JSON.stringify(merged))
  }

  const createProject = (data: Omit<Project, "id" | "status">) => {
    const newProject: Project = { ...data, id: crypto.randomUUID(), status: "open" }
    setProjects((prev) => {
      const next = [newProject, ...prev]
      save({ projects: next })
      return next
    })
  }

  const submitProposal = (data: Omit<Proposal, "id" | "status">) => {
    const newProposal: Proposal = { ...data, id: crypto.randomUUID(), status: "pending" }
    setProposals((prev) => {
      const next = [newProposal, ...prev]
      save({ proposals: next })
      return next
    })
  }

  const updateProposalStatus = (proposalId: string, status: ProposalStatus) => {
    setProposals((prev) => {
      const next = prev.map((p) => (p.id === proposalId ? { ...p, status } : p))
      save({ proposals: next })
      return next
    })
    if (status === "approved") {
      setProjects((prev) => {
        // Find proposal to get projectId
        const proposal = proposals.find((p) => p.id === proposalId)
        if (!proposal) return prev
        const next = prev.map((pr) => (pr.id === proposal.projectId ? { ...pr, status: "closed" } : pr))
        save({ projects: next })
        return next
      })
    }
  }

  const value = useMemo<DataContextValue>(
    () => ({ projects, proposals, gigs, createProject, submitProposal, updateProposalStatus }),
    [projects, proposals, gigs],
  )

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>
}

export function useData() {
  const ctx = useContext(DataContext)
  if (!ctx) throw new Error("useData must be used within DataProvider")
  return ctx
}
