export interface Artist {
  id: string;
  name: string;
  type?: string;
  country?: string;
  disambiguation?: string;
  score?: number;
}

export interface ArtistVisit {
  id: string;
  name: string;
  visitedAt: number;
}
