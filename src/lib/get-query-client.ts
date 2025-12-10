// src/lib/get-query-client.ts
import { QueryClient } from '@tanstack/react-query';
import { cache } from 'react';

// cache() is necessary to ensure that each server request gets its own query client.
const getQueryClient = cache(() => new QueryClient());
export default getQueryClient;
