/**
 * API Client for Hexea 3D Viewer
 *
 * Comprehensive API service layer providing all endpoints for model management,
 * user preferences, collaboration, analytics, and more.
 *
 * This is designed to be easily swapped between mock and real API implementations.
 */

import type {
  User,
  UserPreferences,
  Model,
  SavedView,
  Annotation,
  Project,
  ExportRequest,
  ConversionJob,
  Analytics,
  Comment,
  APIResponse,
  PaginatedResponse,
} from './types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

class APIClient {
  private baseUrl: string;
  private token: string | null = null;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
    this.token = localStorage.getItem('hexea-token');
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'API request failed');
    }

    return response.json();
  }

  // ===== Authentication =====

  async login(email: string, password: string): Promise<APIResponse<{ user: User; token: string }>> {
    const result = await this.request<APIResponse<{ user: User; token: string }>>(
      '/auth/login',
      {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      }
    );
    this.token = result.data.token;
    localStorage.setItem('hexea-token', this.token);
    return result;
  }

  async logout(): Promise<void> {
    this.token = null;
    localStorage.removeItem('hexea-token');
  }

  async register(email: string, password: string, name: string): Promise<APIResponse<User>> {
    return this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, name }),
    });
  }

  // ===== User Management =====

  async getCurrentUser(): Promise<APIResponse<User>> {
    return this.request('/users/me');
  }

  async updateUserPreferences(preferences: Partial<UserPreferences>): Promise<APIResponse<User>> {
    return this.request('/users/preferences', {
      method: 'PATCH',
      body: JSON.stringify(preferences),
    });
  }

  async getUserProfile(userId: string): Promise<APIResponse<User>> {
    return this.request(`/users/${userId}`);
  }

  // ===== Model Management =====

  async uploadModel(file: File, metadata: { name: string; description?: string; tags?: string[]; isPublic?: boolean }): Promise<APIResponse<Model>> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('metadata', JSON.stringify(metadata));

    const response = await fetch(`${this.baseUrl}/models/upload`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.token}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Upload failed');
    }

    return response.json();
  }

  async getModel(modelId: string): Promise<APIResponse<Model>> {
    return this.request(`/models/${modelId}`);
  }

  async getModels(params?: {
    page?: number;
    pageSize?: number;
    tags?: string[];
    search?: string;
  }): Promise<PaginatedResponse<Model>> {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.set('page', params.page.toString());
    if (params?.pageSize) queryParams.set('pageSize', params.pageSize.toString());
    if (params?.tags) queryParams.set('tags', params.tags.join(','));
    if (params?.search) queryParams.set('search', params.search);

    return this.request(`/models?${queryParams.toString()}`);
  }

  async updateModel(modelId: string, updates: Partial<Model>): Promise<APIResponse<Model>> {
    return this.request(`/models/${modelId}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });
  }

  async deleteModel(modelId: string): Promise<APIResponse<void>> {
    return this.request(`/models/${modelId}`, {
      method: 'DELETE',
    });
  }

  async downloadModel(modelId: string): Promise<Blob> {
    const response = await fetch(`${this.baseUrl}/models/${modelId}/download`, {
      headers: {
        Authorization: `Bearer ${this.token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Download failed');
    }

    return response.blob();
  }

  // ===== Saved Views =====

  async createSavedView(view: Omit<SavedView, 'id' | 'userId' | 'createdAt'>): Promise<APIResponse<SavedView>> {
    return this.request('/views', {
      method: 'POST',
      body: JSON.stringify(view),
    });
  }

  async getSavedViews(modelId: string): Promise<APIResponse<SavedView[]>> {
    return this.request(`/views?modelId=${modelId}`);
  }

  async deleteSavedView(viewId: string): Promise<APIResponse<void>> {
    return this.request(`/views/${viewId}`, {
      method: 'DELETE',
    });
  }

  // ===== Annotations & Measurements =====

  async createAnnotation(annotation: Omit<Annotation, 'id' | 'userId' | 'createdAt' | 'updatedAt'>): Promise<APIResponse<Annotation>> {
    return this.request('/annotations', {
      method: 'POST',
      body: JSON.stringify(annotation),
    });
  }

  async getAnnotations(modelId: string): Promise<APIResponse<Annotation[]>> {
    return this.request(`/annotations?modelId=${modelId}`);
  }

  async updateAnnotation(annotationId: string, updates: Partial<Annotation>): Promise<APIResponse<Annotation>> {
    return this.request(`/annotations/${annotationId}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });
  }

  async deleteAnnotation(annotationId: string): Promise<APIResponse<void>> {
    return this.request(`/annotations/${annotationId}`, {
      method: 'DELETE',
    });
  }

  // ===== Projects & Collaboration =====

  async createProject(project: Omit<Project, 'id' | 'userId' | 'createdAt' | 'updatedAt'>): Promise<APIResponse<Project>> {
    return this.request('/projects', {
      method: 'POST',
      body: JSON.stringify(project),
    });
  }

  async getProjects(): Promise<PaginatedResponse<Project>> {
    return this.request('/projects');
  }

  async getProject(projectId: string): Promise<APIResponse<Project>> {
    return this.request(`/projects/${projectId}`);
  }

  async updateProject(projectId: string, updates: Partial<Project>): Promise<APIResponse<Project>> {
    return this.request(`/projects/${projectId}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });
  }

  async addCollaborator(projectId: string, userId: string, role: 'editor' | 'viewer'): Promise<APIResponse<Project>> {
    return this.request(`/projects/${projectId}/collaborators`, {
      method: 'POST',
      body: JSON.stringify({ userId, role }),
    });
  }

  async removeCollaborator(projectId: string, userId: string): Promise<APIResponse<Project>> {
    return this.request(`/projects/${projectId}/collaborators/${userId}`, {
      method: 'DELETE',
    });
  }

  // ===== Export & Conversion =====

  async exportModel(request: ExportRequest): Promise<APIResponse<{ downloadUrl: string }>> {
    return this.request('/export', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  async convertModel(modelId: string, toFormat: string): Promise<APIResponse<ConversionJob>> {
    return this.request('/conversions', {
      method: 'POST',
      body: JSON.stringify({ modelId, toFormat }),
    });
  }

  async getConversionStatus(jobId: string): Promise<APIResponse<ConversionJob>> {
    return this.request(`/conversions/${jobId}`);
  }

  // ===== Analytics =====

  async getModelAnalytics(modelId: string, startDate?: string, endDate?: string): Promise<APIResponse<Analytics>> {
    const params = new URLSearchParams();
    if (startDate) params.set('startDate', startDate);
    if (endDate) params.set('endDate', endDate);
    return this.request(`/analytics/models/${modelId}?${params.toString()}`);
  }

  async trackModelView(modelId: string): Promise<void> {
    await this.request('/analytics/track', {
      method: 'POST',
      body: JSON.stringify({ event: 'model_view', modelId }),
    });
  }

  // ===== Comments =====

  async createComment(modelId: string, content: string, parentId?: string): Promise<APIResponse<Comment>> {
    return this.request('/comments', {
      method: 'POST',
      body: JSON.stringify({ modelId, content, parentId }),
    });
  }

  async getComments(modelId: string): Promise<APIResponse<Comment[]>> {
    return this.request(`/comments?modelId=${modelId}`);
  }

  async deleteComment(commentId: string): Promise<APIResponse<void>> {
    return this.request(`/comments/${commentId}`, {
      method: 'DELETE',
    });
  }

  async addReaction(commentId: string, emoji: string): Promise<APIResponse<Comment>> {
    return this.request(`/comments/${commentId}/reactions`, {
      method: 'POST',
      body: JSON.stringify({ emoji }),
    });
  }

  // ===== Search =====

  async searchModels(query: string, filters?: {
    fileType?: string[];
    tags?: string[];
    minVertices?: number;
    maxVertices?: number;
  }): Promise<PaginatedResponse<Model>> {
    const params = new URLSearchParams({ query });
    if (filters?.fileType) params.set('fileType', filters.fileType.join(','));
    if (filters?.tags) params.set('tags', filters.tags.join(','));
    if (filters?.minVertices) params.set('minVertices', filters.minVertices.toString());
    if (filters?.maxVertices) params.set('maxVertices', filters.maxVertices.toString());

    return this.request(`/search?${params.toString()}`);
  }

  // ===== Webhooks (for integrations) =====

  async createWebhook(url: string, events: string[]): Promise<APIResponse<{ id: string; url: string; events: string[] }>> {
    return this.request('/webhooks', {
      method: 'POST',
      body: JSON.stringify({ url, events }),
    });
  }

  async getWebhooks(): Promise<APIResponse<Array<{ id: string; url: string; events: string[] }>>> {
    return this.request('/webhooks');
  }

  async deleteWebhook(webhookId: string): Promise<APIResponse<void>> {
    return this.request(`/webhooks/${webhookId}`, {
      method: 'DELETE',
    });
  }
}

export const apiClient = new APIClient();
export default apiClient;
