import client from '../client';
import type { NudgeRule } from '../types';

export const nudgesApi = {
  mine: () => client.get<NudgeRule[]>('/nudges/me/'),
  active: () => client.get<NudgeRule[]>('/nudges/active/'),
  dismiss: (id: number) => client.post(`/nudges/${id}/dismiss/`),
  acted: (id: number) => client.post(`/nudges/${id}/acted/`),
};
