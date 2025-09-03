import { create } from 'zustand'
import { devtools, persist } from 'zustand/middleware'
import * as storage from './storage'
import { Project as StorageProject } from './storage'

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
  thumbnail?: string
  canvasData?: string
  metadata?: {
    width: number;
    height: number;
    aspectRatio?: string;
    tags?: string[];
    [key: string]: any;
  }
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
  lastSaved: number | null
  lastAutosaved: number | null
  
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
  deleteProject: (id: string) => Promise<boolean>
  loadProjects: () => Promise<void>
  
  // Local storage project actions
  saveProjectToStorage: (canvas: fabric.Canvas, name: string, id?: string) => Promise<string | null>
  loadProjectFromStorage: (id: string) => Promise<Project | null>
  saveCurrentProjectToStorage: (canvas: fabric.Canvas) => Promise<string | null>
  autosaveProject: (canvas: fabric.Canvas) => Promise<void>
  updateThumbnail: (canvas: fabric.Canvas) => Promise<void>
  
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
  lastSaved: null,
  lastAutosaved: null,
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
        
        deleteProject: async (id) => {
          // Delete from IndexedDB first
          const success = await storage.deleteProject(id);
          
          // Update state if successful
          if (success) {
            set((state) => ({
              projects: state.projects.filter(p => p.id !== id),
              currentProject: state.currentProject?.id === id ? null : state.currentProject,
            }));
          }
          
          return success;
        },
        
        loadProjects: async () => {
          set({ isLoading: true, error: null })
          try {
            // Load projects from IndexedDB
            const projectPreviews = await storage.getProjectList();
            
            // Convert to app project format
            const projects = projectPreviews.map(preview => ({
              id: preview.id,
              name: preview.name,
              description: "",
              createdAt: new Date(preview.createdAt),
              updatedAt: new Date(preview.updatedAt),
              thumbnail: preview.thumbnail,
              metadata: preview.metadata
            }));
            
            set({ projects, isLoading: false })
          } catch (error) {
            set({ 
              error: error instanceof Error ? error.message : 'Failed to load projects',
              isLoading: false 
            })
          }
        },
        
        // Local storage project actions
        saveProjectToStorage: async (canvas, name, id) => {
          try {
            // Generate thumbnail
            const thumbnail = await storage.generateThumbnail(canvas);
            
            // Create project from canvas
            const storageProject = storage.createProjectFromCanvas(canvas, name, id);
            storageProject.thumbnail = thumbnail;
            
            // Save to storage
            const projectId = await storage.saveProject(storageProject);
            
            // Update current project in state
            const project: Project = {
              id: projectId,
              name: storageProject.name,
              createdAt: new Date(storageProject.createdAt),
              updatedAt: new Date(storageProject.updatedAt),
              thumbnail: storageProject.thumbnail,
              metadata: storageProject.metadata
            };
            
            set((state) => ({
              currentProject: project,
              projects: [...state.projects.filter(p => p.id !== projectId), project],
              isCanvasModified: false,
              lastSaved: Date.now()
            }));
            
            return projectId;
          } catch (error) {
            console.error('Failed to save project:', error);
            set({ error: 'Failed to save project' });
            return null;
          }
        },
        
        loadProjectFromStorage: async (id) => {
          try {
            set({ isLoading: true, error: null });
            
            // Load from storage
            const storageProject = await storage.loadProject(id);
            if (!storageProject) {
              throw new Error(`Project not found: ${id}`);
            }
            
            // Convert to app project format
            const project: Project = {
              id: storageProject.id,
              name: storageProject.name,
              createdAt: new Date(storageProject.createdAt),
              updatedAt: new Date(storageProject.updatedAt),
              thumbnail: storageProject.thumbnail,
              canvasData: storageProject.fabricJSON,
              metadata: storageProject.metadata
            };
            
            // Update state
            set({
              currentProject: project,
              isLoading: false,
              isCanvasModified: false,
              canvasHistory: [storageProject.fabricJSON],
              canvasHistoryIndex: 0
            });
            
            return project;
          } catch (error) {
            console.error('Failed to load project:', error);
            set({
              isLoading: false,
              error: error instanceof Error ? error.message : 'Failed to load project'
            });
            return null;
          }
        },
        
        saveCurrentProjectToStorage: async (canvas) => {
          const state = get();
          const currentProject = state.currentProject;
          
          if (!currentProject) {
            set({ error: 'No active project to save' });
            return null;
          }
          
          return await get().saveProjectToStorage(canvas, currentProject.name, currentProject.id);
        },
        
        autosaveProject: async (canvas) => {
          try {
            // Generate project from canvas
            const currentProject = get().currentProject;
            const name = currentProject?.name || 'Untitled Project';
            
            const storageProject = storage.createProjectFromCanvas(canvas, name, currentProject?.id);
            
            // Save to autosave storage
            await storage.saveAutosave(storageProject);
            
            // Update state
            set({ lastAutosaved: Date.now() });
          } catch (error) {
            console.error('Autosave failed:', error);
          }
        },
        
        updateThumbnail: async (canvas) => {
          try {
            const currentProject = get().currentProject;
            if (!currentProject) return;
            
            // Generate thumbnail
            const thumbnail = await storage.generateThumbnail(canvas);
            
            // Update project
            const updates = { thumbnail };
            get().updateProject(currentProject.id, updates);
            
            // Save to storage if needed
            if (!get().isCanvasModified) {
              await get().saveCurrentProjectToStorage(canvas);
            }
          } catch (error) {
            console.error('Failed to update thumbnail:', error);
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
