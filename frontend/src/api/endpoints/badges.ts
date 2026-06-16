import client from '../client';
import type { BadgeDefinition } from '../types';

export const badgesApi = {
  list: () => client.get<BadgeDefinition[]>('/badges/'),
};
