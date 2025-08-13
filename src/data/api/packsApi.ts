import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { PackManifest } from '../../shared/types/contentPack';

export interface AvailablePack {
  id: string;
  name: string;
  version: string;
  description: string;
  size: number;
  downloadUrl: string;
  manifestUrl: string;
  isInstalled: boolean;
  installedVersion?: string;
}

export interface DownloadProgress {
  packId: string;
  downloaded: number;
  total: number;
  percentage: number;
  status: 'downloading' | 'verifying' | 'installing' | 'complete' | 'error';
}

// Base URL should be configured from environment
const API_BASE_URL = 'https://cdn.examengine.com/api/v1';

export const packsApi = createApi({
  reducerPath: 'packsApi',
  baseQuery: fetchBaseQuery({
    baseUrl: API_BASE_URL,
    timeout: 30000, // 30 second timeout
  }),
  tagTypes: ['Pack', 'Manifest'],
  endpoints: (builder) => ({
    getAvailablePacks: builder.query<AvailablePack[], void>({
      query: () => 'packs',
      providesTags: ['Pack'],
    }),
    getPackManifest: builder.query<PackManifest, string>({
      query: (packId) => `packs/${packId}/manifest.json`,
      providesTags: (result, error, packId) => [{ type: 'Manifest', id: packId }],
    }),
    checkAppCompatibility: builder.query<{ compatible: boolean; minVersion: string }, {
      packId: string;
      appVersion: string;
    }>({
      query: ({ packId, appVersion }) => ({
        url: `packs/${packId}/compatibility`,
        params: { appVersion },
      }),
    }),
  }),
});

export const {
  useGetAvailablePacksQuery,
  useGetPackManifestQuery,
  useCheckAppCompatibilityQuery,
} = packsApi;
