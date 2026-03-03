'use client';

import { createContext, useContext, useState } from 'react';
import type { MockArticle } from '@/lib/mockData';

export type PlayerArticle = MockArticle & {
  sourceId?: string;
  summaryZh?: string;
  sourceUrl?: string;
  titleZh?: string;
};

interface PlayerContextType {
  activeArticle: PlayerArticle | null;
  openPlayer: (article: PlayerArticle) => void;
  closePlayer: () => void;
}

const PlayerContext = createContext<PlayerContextType>({
  activeArticle: null,
  openPlayer: () => {},
  closePlayer: () => {},
});

export function PlayerProvider({ children }: { children: React.ReactNode }) {
  const [activeArticle, setActiveArticle] = useState<PlayerArticle | null>(null);

  return (
    <PlayerContext.Provider
      value={{
        activeArticle,
        openPlayer: (a) => setActiveArticle(a),
        closePlayer: () => setActiveArticle(null),
      }}
    >
      {children}
    </PlayerContext.Provider>
  );
}

export const usePlayer = () => useContext(PlayerContext);
