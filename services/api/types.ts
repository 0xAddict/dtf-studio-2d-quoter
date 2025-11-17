/**
 * API Types and Interfaces for Hexea 3D Viewer
 *
 * This file defines all the TypeScript interfaces for the API layer,
 * providing type safety and documentation for API interactions.
 */

export interface User {
  id: string;
  email: string;
  name: string;
  avatarUrl?: string;
  preferences: UserPreferences;
  createdAt: string;
  updatedAt: string;
}

export interface UserPreferences {
  theme: 'light' | 'dark' | 'auto';
  defaultModelColor: string;
  defaultBackgroundColor: string;
  enableAutosave: boolean;
  enableKeyboardShortcuts: boolean;
  gridSize: number;
  cameraSpeed: number;
}

export interface Model {
  id: string;
  userId: string;
  name: string;
  description?: string;
  fileUrl: string;
  thumbnailUrl?: string;
  fileType: 'stl' | 'fbx' | 'obj' | 'gltf' | 'glb';
  fileSize: number;
  metadata: ModelMetadata;
  tags: string[];
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ModelMetadata {
  vertices: number;
  triangles: number;
  dimensions: {
    x: number;
    y: number;
    z: number;
  };
  boundingBox: {
    min: { x: number; y: number; z: number };
    max: { x: number; y: number; z: number };
  };
  materials?: string[];
  animations?: string[];
}

export interface SavedView {
  id: string;
  modelId: string;
  userId: string;
  name: string;
  description?: string;
  camera: {
    position: [number, number, number];
    target: [number, number, number];
    fov: number;
  };
  modelState: {
    color?: string;
    wireframe?: boolean;
    visible?: boolean;
  };
  createdAt: string;
}

export interface Annotation {
  id: string;
  modelId: string;
  userId: string;
  type: 'measurement' | 'comment' | 'highlight';
  position: [number, number, number];
  content: string;
  metadata?: {
    distance?: number;
    points?: [number, number, number][];
    color?: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface Project {
  id: string;
  userId: string;
  name: string;
  description?: string;
  models: string[]; // Model IDs
  collaborators: Collaborator[];
  tags: string[];
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Collaborator {
  userId: string;
  role: 'owner' | 'editor' | 'viewer';
  addedAt: string;
}

export interface ExportRequest {
  modelId: string;
  format: 'stl' | 'fbx' | 'obj' | 'gltf' | 'glb' | 'png' | 'jpg' | 'pdf';
  options: {
    quality?: 'low' | 'medium' | 'high';
    scale?: number;
    includeTextures?: boolean;
    resolution?: { width: number; height: number };
  };
}

export interface ConversionJob {
  id: string;
  modelId: string;
  userId: string;
  fromFormat: string;
  toFormat: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  resultUrl?: string;
  error?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Analytics {
  modelId: string;
  views: number;
  downloads: number;
  shares: number;
  averageViewDuration: number;
  uniqueVisitors: number;
  topReferrers: Array<{ source: string; count: number }>;
  period: {
    start: string;
    end: string;
  };
}

export interface Comment {
  id: string;
  modelId: string;
  userId: string;
  userName: string;
  content: string;
  parentId?: string; // For threaded comments
  reactions: Array<{ emoji: string; count: number }>;
  createdAt: string;
  updatedAt: string;
}

export interface APIResponse<T> {
  data: T;
  success: boolean;
  message?: string;
  timestamp: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
  success: boolean;
}

export interface APIError {
  error: string;
  message: string;
  statusCode: number;
  timestamp: string;
  details?: Record<string, any>;
}
