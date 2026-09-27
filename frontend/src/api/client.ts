// MindGarten REST API Client

export interface Tag {
  id: number;
  name: string;
  color: string;
  description: string | null;
  linkCount?: number;
}

export interface LinkItem {
  id: number;
  url: string;
  title: string;
  description: string | null;
  faviconUrl: string | null;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  tags: Tag[];
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  error?: string;
  total?: number;
  skip?: number;
  take?: number;
}

export interface CreateLinkInput {
  url: string;
  title?: string;
  description?: string;
  faviconUrl?: string;
  tags?: (number | string)[];
  createdBy?: string;
}

export interface UpdateLinkInput {
  url?: string;
  title?: string;
  description?: string;
  faviconUrl?: string | null;
  tags?: (number | string)[];
}

export interface CreateTagInput {
  name: string;
  color?: string;
  description?: string;
}

export interface UpdateTagInput {
  name?: string;
  color?: string;
  description?: string;
}

class ApiClient {
  private tokenKey = 'mindgarten_api_token';
  private apiUrlKey = 'mindgarten_api_base_url';

  public getToken(): string {
    return localStorage.getItem(this.tokenKey) || 'mindgarten-secret-token';
  }

  public setToken(token: string): void {
    localStorage.setItem(this.tokenKey, token.trim());
  }

  public getBaseUrl(): string {
    return localStorage.getItem(this.apiUrlKey) || '';
  }

  public setBaseUrl(url: string): void {
    localStorage.setItem(this.apiUrlKey, url.trim().replace(/\/$/, ''));
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const base = this.getBaseUrl();
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    const url = `${base}${cleanEndpoint}`;

    const headers: Record<string, string> = {
      Authorization: `Bearer ${this.getToken()}`,
      ...(options.headers as Record<string, string>),
    };

    if (options.body) {
      headers['Content-Type'] = 'application/json';
    }

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (response.status === 204) {
      return {} as T;
    }

    let json: any = {};
    const text = await response.text();
    if (text) {
      try {
        json = JSON.parse(text);
      } catch {
        json = { error: text };
      }
    }

    if (!response.ok || json.success === false) {
      throw new Error(json.error || `HTTP ${response.status}: Request failed`);
    }

    return json;
  }

  // Links API
  async getLinks(params?: {
    skip?: number;
    take?: number;
    tag?: string | number;
    search?: string;
    sort?: string;
  }): Promise<ApiResponse<LinkItem[]>> {
    const query = new URLSearchParams();
    if (params?.skip !== undefined) query.set('skip', params.skip.toString());
    if (params?.take !== undefined) query.set('take', params.take.toString());
    if (params?.tag) query.set('tag', params.tag.toString());
    if (params?.search) query.set('search', params.search);
    if (params?.sort) query.set('sort', params.sort);

    const qs = query.toString();
    return this.request<ApiResponse<LinkItem[]>>(`/api/v1/links${qs ? `?${qs}` : ''}`);
  }

  async getLink(id: number): Promise<ApiResponse<LinkItem>> {
    return this.request<ApiResponse<LinkItem>>(`/api/v1/links/${id}`);
  }

  async createLink(input: CreateLinkInput): Promise<ApiResponse<LinkItem>> {
    return this.request<ApiResponse<LinkItem>>('/api/v1/links', {
      method: 'POST',
      body: JSON.stringify(input),
    });
  }

  async updateLink(id: number, input: UpdateLinkInput): Promise<ApiResponse<LinkItem>> {
    return this.request<ApiResponse<LinkItem>>(`/api/v1/links/${id}`, {
      method: 'PUT',
      body: JSON.stringify(input),
    });
  }

  async deleteLink(id: number): Promise<void> {
    await this.request<void>(`/api/v1/links/${id}`, {
      method: 'DELETE',
    });
  }

  async searchLinks(query: string): Promise<ApiResponse<LinkItem[]>> {
    return this.request<ApiResponse<LinkItem[]>>(`/api/v1/links/search?q=${encodeURIComponent(query)}`);
  }

  // Tags API
  async getTags(): Promise<ApiResponse<Tag[]>> {
    return this.request<ApiResponse<Tag[]>>('/api/v1/tags');
  }

  async getTag(id: number): Promise<ApiResponse<Tag>> {
    return this.request<ApiResponse<Tag>>(`/api/v1/tags/${id}`);
  }

  async createTag(input: CreateTagInput): Promise<ApiResponse<Tag>> {
    return this.request<ApiResponse<Tag>>('/api/v1/tags', {
      method: 'POST',
      body: JSON.stringify(input),
    });
  }

  async updateTag(id: number, input: UpdateTagInput): Promise<ApiResponse<Tag>> {
    return this.request<ApiResponse<Tag>>(`/api/v1/tags/${id}`, {
      method: 'PUT',
      body: JSON.stringify(input),
    });
  }

  async deleteTag(id: number): Promise<void> {
    await this.request<void>(`/api/v1/tags/${id}`, {
      method: 'DELETE',
    });
  }

  // Health
  async checkHealth(): Promise<{ status: string; version: string }> {
    return this.request<{ status: string; version: string }>('/health');
  }

  async checkReady(): Promise<{ status: string; database: string }> {
    return this.request<{ status: string; database: string }>('/ready');
  }
}

export const api = new ApiClient();
export default api;
