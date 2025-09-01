import { create } from 'zustand'
import { devtools, persist } from 'zustand/middleware'

// Types
export interface User {
  id: string
  name: string
  email: string
  avatar?: string
}

export interface Project {
  id: string
  name: string
  description?: string
  createdAt: Date
  updatedAt: Date
  canvasData?: string
}

export interface AppState {
  // User state
  user: User | null
  isAuthenticated: boolean
  
  // UI state
  isLoading: boolean
  error: string | null
  theme: 'light' | 'dark' | 'system'
  sidebarOpen: boolean
  
  // Project state
  currentProject: Project | null
  projects: Project[]
  
  // Canvas state
  canvasHistory: string[]
  canvasHistoryIndex: number
  isCanvasModified: boolean
}

export interface AppActions {
  // User actions
  setUser: (user: User | null) => void
  login: (email: string, password: string) => Promise<void>
  logout: () => void
  
  // UI actions
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  setTheme: (theme: 'light' | 'dark' | 'system') => void
  toggleSidebar: () => void
  setSidebarOpen: (open: boolean) => void
  
  // Project actions
  setCurrentProject: (project: Project | null) => void
  addProject: (project: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>) => void
  updateProject: (id: string, updates: Partial<Project>) => void
  deleteProject: (id: string) => void
  loadProjects: () => Promise<void>
  
  // Canvas actions
  saveCanvasState: (canvasData: string) => void
  undo: () => string | null
  redo: () => string | null
  clearHistory: () => void
  setCanvasModified: (modified: boolean) => void
}

type Store = AppState & AppActions

const initialState: AppState = {
  user: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
  theme: 'system',
  sidebarOpen: true,
  currentProject: null,
  projects: [],
  canvasHistory: [],
  canvasHistoryIndex: -1,
  isCanvasModified: false,
}

export const useStore = create<Store>()(
  devtools(
    persist(
      (set, get) => ({
        ...initialState,
        
        // User actions
        setUser: (user) => set({ user, isAuthenticated: !!user }),
        
        login: async (email, password) => {
          set({ isLoading: true, error: null })
          try {
            // This would integrate with your API
            const response = await fetch(`${import.meta.env.VITE_API_URL}/auth/login`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ email, password }),
            })
            
            if (!response.ok) {
              throw new Error('Login failed')
            }
            
            const user = await response.json()
            set({ user, isAuthenticated: true, isLoading: false })
          } catch (error) {
            set({ 
              error: error instanceof Error ? error.message : 'Login failed',
              isLoading: false 
            })
          }
        },
        
        logout: () => set({ 
          user: null, 
          isAuthenticated: false, 
          currentProject: null,
          projects: [],
          canvasHistory: [],
          canvasHistoryIndex: -1,
          isCanvasModified: false,
        }),
        
        // UI actions
        setLoading: (isLoading) => set({ isLoading }),
        setError: (error) => set({ error }),
        setTheme: (theme) => set({ theme }),
        toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
        setSidebarOpen: (sidebarOpen) => set({ sidebarOpen }),
        
        // Project actions
        setCurrentProject: (currentProject) => set({ currentProject }),
        
        addProject: (projectData) => {
          const newProject: Project = {
            ...projectData,
            id: crypto.randomUUID(),
            createdAt: new Date(),
            updatedAt: new Date(),
          }
          set((state) => ({ 
            projects: [...state.projects, newProject],
            currentProject: newProject,
          }))
        },
        
        updateProject: (id, updates) => {
          set((state) => ({
            projects: state.projects.map(p => 
              p.id === id ? { ...p, ...updates, updatedAt: new Date() } : p
            ),
            currentProject: state.currentProject?.id === id 
              ? { ...state.currentProject, ...updates, updatedAt: new Date() }
              : state.currentProject,
          }))
        },
        
        deleteProject: (id) => {
          set((state) => ({
            projects: state.projects.filter(p => p.id !== id),
            currentProject: state.currentProject?.id === id ? null : state.currentProject,
          }))
        },
        
        loadProjects: async () => {
          set({ isLoading: true, error: null })
          try {
            // This would integrate with your API
            const response = await fetch(`${import.meta.env.VITE_API_URL}/projects`)
            if (!response.ok) throw new Error('Failed to load projects')
            
            const projects = await response.json()
            set({ projects, isLoading: false })
          } catch (error) {
            set({ 
              error: error instanceof Error ? error.message : 'Failed to load projects',
              isLoading: false 
            })
          }
        },
        
        // Canvas actions
        saveCanvasState: (canvasData) => {
          const state = get()
          const newHistory = state.canvasHistory.slice(0, state.canvasHistoryIndex + 1)
          newHistory.push(canvasData)
          
          // Limit history to 50 states
          if (newHistory.length > 50) {
            newHistory.shift()
          }
          
          set({
            canvasHistory: newHistory,
            canvasHistoryIndex: newHistory.length - 1,
            isCanvasModified: true,
          })
        },
        
        undo: () => {
          const state = get()
          if (state.canvasHistoryIndex > 0) {
            const newIndex = state.canvasHistoryIndex - 1
            set({ canvasHistoryIndex: newIndex })
            return state.canvasHistory[newIndex]
          }
          return null
        },
        
        redo: () => {
          const state = get()
          if (state.canvasHistoryIndex < state.canvasHistory.length - 1) {
            const newIndex = state.canvasHistoryIndex + 1
            set({ canvasHistoryIndex: newIndex })
            return state.canvasHistory[newIndex]
          }
          return null
        },
        
        clearHistory: () => set({
          canvasHistory: [],
          canvasHistoryIndex: -1,
          isCanvasModified: false,
        }),
        
        setCanvasModified: (isCanvasModified) => set({ isCanvasModified }),
      }),
      {
        name: 'pintu-store',
        partialize: (state) => ({
          user: state.user,
          isAuthenticated: state.isAuthenticated,
          theme: state.theme,
          sidebarOpen: state.sidebarOpen,
          projects: state.projects,
          currentProject: state.currentProject,
        }),
      }
    ),
    { name: 'pintu-store' }
  )
)
