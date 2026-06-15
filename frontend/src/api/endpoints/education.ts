import client from '../client';
import type { Article, PaginatedResponse } from '../types';

export const educationApi = {
  list: (params?: { category?: string; q?: string }) =>
    client.get<PaginatedResponse<Article>>('/education/articles/', { params }),

  detail: (slug: string) => client.get<Article>(`/education/articles/${slug}/`),
};
