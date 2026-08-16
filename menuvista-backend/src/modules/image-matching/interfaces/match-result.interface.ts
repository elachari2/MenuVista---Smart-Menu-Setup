export interface MatchResult {
  imageUrl: string;
  score: number;
  matched: boolean;
  source?: 'fts5_fuse' | 'cache' | 'fallback' | string;
  category?: string;
  candidateImages?: string[];
}

export interface MatchingStats {
  totalRequests: number;
  totalMatchingRequests: number;
  successfulMatches: number;
  fallbackMatches: number;
  cacheHits: number;
  averageLatencyMs: number;
  avgLatencyMs: number;
  matchRatePercentage: number;
}
