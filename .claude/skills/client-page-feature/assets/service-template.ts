import { authApi, publicApi } from './http';
import type { ApiResponse, EntityId } from '../types';

export interface ExampleItem {
  id: EntityId;
  name: string;
}

export interface CreateExampleInput {
  name: string;
}

export const exampleAPI = {
  // Public read endpoints use publicApi (no Bearer header required).
  list: async (): Promise<ApiResponse<ExampleItem[]>> =>
    (await publicApi.get('/api/examples')).data,

  // Authenticated write endpoints always use authApi (Bearer token interceptor).
  create: async (payload: CreateExampleInput): Promise<ApiResponse<ExampleItem>> =>
    (await authApi.post('/api/examples', payload)).data,

  // Use the HTTP status when the endpoint returns 204 No Content.
  remove: async (id: EntityId): Promise<number> =>
    (await authApi.delete(`/api/examples/${id}`)).status,
};
