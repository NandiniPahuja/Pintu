import { get, set, del, keys } from 'idb-keyval';

export interface Project {
  id: string;
  name: string;
  createdAt: number;
  updatedAt: number;
  thumbnail?: string;
  fabricJSON: string;
  metadata?: {
    width: number;
    height: number;
    aspectRatio?: string;
    tags?: string[];
    [key: string]: any;
  };
}

export interface ProjectPreview {
  id: string;
  name: string;
  createdAt: number;
  updatedAt: number;
  thumbnail?: string;
  metadata?: {
    width: number;
    height: number;
    aspectRatio?: string;
  };
}

// Namespace keys to avoid conflicts with other apps
const PROJECT_KEY_PREFIX = 'pintu:project:';
const PROJECT_LIST_KEY = 'pintu:project:list';
const AUTOSAVE_KEY = 'pintu:autosave';

/**
 * Save a project to IndexedDB
 */
export async function saveProject(project: Project): Promise<string> {
  // Ensure project has an ID
  if (!project.id) {
    project.id = generateUniqueId();
  }

  // Update timestamps
  project.updatedAt = Date.now();
  
  // For new projects, set creation time
  if (!project.createdAt) {
    project.createdAt = project.updatedAt;
  }

  // Store the full project
  const key = `${PROJECT_KEY_PREFIX}${project.id}`;
  await set(key, project);

  // Update project list (only with preview data)
  await updateProjectList(project);

  return project.id;
}

/**
 * Save the current project state for autosave recovery
 */
export async function saveAutosave(project: Project): Promise<void> {
  await set(AUTOSAVE_KEY, {
    ...project,
    autosaved: true,
    autosavedAt: Date.now()
  });
}

/**
 * Get the autosaved project if it exists
 */
export async function getAutosave(): Promise<Project | null> {
  try {
    return await get(AUTOSAVE_KEY);
  } catch (err) {
    console.error('Failed to get autosave:', err);
    return null;
  }
}

/**
 * Clear the autosave data
 */
export async function clearAutosave(): Promise<void> {
  await del(AUTOSAVE_KEY);
}

/**
 * Load a project by ID
 */
export async function loadProject(id: string): Promise<Project | null> {
  try {
    const key = `${PROJECT_KEY_PREFIX}${id}`;
    const project = await get<Project>(key);
    
    if (!project) {
      console.warn(`Project not found: ${id}`);
      return null;
    }

    return project;
  } catch (err) {
    console.error(`Failed to load project ${id}:`, err);
    return null;
  }
}

/**
 * Delete a project by ID
 */
export async function deleteProject(id: string): Promise<boolean> {
  try {
    const key = `${PROJECT_KEY_PREFIX}${id}`;
    
    // Delete the project
    await del(key);
    
    // Update project list
    await removeFromProjectList(id);
    
    return true;
  } catch (err) {
    console.error(`Failed to delete project ${id}:`, err);
    return false;
  }
}

/**
 * Get list of all projects (preview data only)
 */
export async function getProjectList(): Promise<ProjectPreview[]> {
  try {
    const list = await get<ProjectPreview[]>(PROJECT_LIST_KEY) || [];
    // Sort by last updated time, newest first
    return list.sort((a, b) => b.updatedAt - a.updatedAt);
  } catch (err) {
    console.error('Failed to get project list:', err);
    return [];
  }
}

/**
 * Generate a thumbnail from canvas for a project
 */
export async function generateThumbnail(canvas: fabric.Canvas): Promise<string> {
  return new Promise<string>((resolve) => {
    // Create a thumbnail at a reasonable size (max 400px in any dimension)
    const maxSize = 400;
    const originalWidth = canvas.getWidth();
    const originalHeight = canvas.getHeight();
    
    let scaleFactor = 1;
    if (originalWidth > originalHeight) {
      scaleFactor = maxSize / originalWidth;
    } else {
      scaleFactor = maxSize / originalHeight;
    }
    
    // Only scale down, not up
    if (scaleFactor > 1) scaleFactor = 1;
    
    const thumbnailDataUrl = canvas.toDataURL({
      format: 'jpeg',
      quality: 0.7,
      multiplier: scaleFactor
    });
    
    resolve(thumbnailDataUrl);
  });
}

/**
 * Create a project from a Fabric canvas
 */
export function createProjectFromCanvas(canvas: fabric.Canvas, name: string, id?: string): Project {
  const fabricJSON = JSON.stringify(canvas.toJSON(['id', 'name']));
  
  return {
    id: id || generateUniqueId(),
    name: name,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    fabricJSON,
    metadata: {
      width: canvas.getWidth(),
      height: canvas.getHeight(),
      aspectRatio: `${canvas.getWidth()}:${canvas.getHeight()}`
    }
  };
}

// Helper function to generate a unique ID
function generateUniqueId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substring(2);
}

// Helper function to update project list with preview data
async function updateProjectList(project: Project): Promise<void> {
  try {
    // Get current list
    const list = await get<ProjectPreview[]>(PROJECT_LIST_KEY) || [];
    
    // Create preview object
    const preview: ProjectPreview = {
      id: project.id,
      name: project.name,
      createdAt: project.createdAt,
      updatedAt: project.updatedAt,
      thumbnail: project.thumbnail,
      metadata: project.metadata
    };
    
    // Update existing or add new
    const index = list.findIndex(p => p.id === project.id);
    if (index >= 0) {
      list[index] = preview;
    } else {
      list.push(preview);
    }
    
    // Save updated list
    await set(PROJECT_LIST_KEY, list);
  } catch (err) {
    console.error('Failed to update project list:', err);
  }
}

// Helper function to remove a project from the project list
async function removeFromProjectList(id: string): Promise<void> {
  try {
    // Get current list
    const list = await get<ProjectPreview[]>(PROJECT_LIST_KEY) || [];
    
    // Remove the project
    const newList = list.filter(p => p.id !== id);
    
    // Save updated list
    await set(PROJECT_LIST_KEY, newList);
  } catch (err) {
    console.error('Failed to remove project from list:', err);
  }
}
