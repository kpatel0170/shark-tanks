"use client";

import {
  createContext,
  useContext,
  useReducer,
  useCallback,
  useEffect,
} from "react";
import type { PlayerState, BulletState, WallState } from "@/lib/game-types";

// Game state types
interface GameState {
  players: PlayerState[];
  bullets: BulletState[];
  walls: WallState[];
  localPlayer: PlayerState | null;
  score: number;
  gameStats: {
    shotsFired: number;
    hits: number;
    accuracy: number;
    timePlayed: number;
  };
  performance: {
    fps: number;
    ping: number;
    quality: "low" | "medium" | "high";
  };
}

type GameAction =
  | { type: "SET_PLAYERS"; payload: PlayerState[] }
  | { type: "SET_BULLETS"; payload: BulletState[] }
  | { type: "SET_WALLS"; payload: WallState[] }
  | { type: "SET_LOCAL_PLAYER"; payload: PlayerState | null }
  | { type: "UPDATE_SCORE"; payload: number }
  | { type: "SHOT_FIRED" }
  | { type: "HIT_REGISTERED" }
  | { type: "UPDATE_PERFORMANCE"; payload: Partial<GameState["performance"]> }
  | { type: "RESET_GAME" };

// Game state reducer
function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case "SET_PLAYERS":
      return { ...state, players: action.payload };

    case "SET_BULLETS":
      return { ...state, bullets: action.payload };

    case "SET_WALLS":
      return { ...state, walls: action.payload };

    case "SET_LOCAL_PLAYER":
      return { ...state, localPlayer: action.payload };

    case "UPDATE_SCORE":
      return { ...state, score: action.payload };

    case "SHOT_FIRED":
      const newShotsFired = state.gameStats.shotsFired + 1;
      return {
        ...state,
        gameStats: {
          ...state.gameStats,
          shotsFired: newShotsFired,
          accuracy:
            newShotsFired > 0
              ? (state.gameStats.hits / newShotsFired) * 100
              : 0,
        },
      };

    case "HIT_REGISTERED":
      const newHits = state.gameStats.hits + 1;
      return {
        ...state,
        gameStats: {
          ...state.gameStats,
          hits: newHits,
          accuracy:
            state.gameStats.shotsFired > 0
              ? (newHits / state.gameStats.shotsFired) * 100
              : 0,
        },
      };

    case "UPDATE_PERFORMANCE":
      return {
        ...state,
        performance: { ...state.performance, ...action.payload },
      };

    case "RESET_GAME":
      return {
        ...state,
        score: 0,
        gameStats: {
          shotsFired: 0,
          hits: 0,
          accuracy: 0,
          timePlayed: 0,
        },
      };

    default:
      return state;
  }
}

// Initial state
const initialState: GameState = {
  players: [],
  bullets: [],
  walls: [],
  localPlayer: null,
  score: 0,
  gameStats: {
    shotsFired: 0,
    hits: 0,
    accuracy: 0,
    timePlayed: 0,
  },
  performance: {
    fps: 60,
    ping: 0,
    quality: "high",
  },
};

// Game context
const GameContext = createContext<{
  state: GameState;
  dispatch: React.Dispatch<GameAction>;
  actions: {
    updatePlayers: (players: PlayerState[]) => void;
    updateBullets: (bullets: BulletState[]) => void;
    updateWalls: (walls: WallState[]) => void;
    setLocalPlayer: (player: PlayerState | null) => void;
    updateScore: (score: number) => void;
    shotFired: () => void;
    hitRegistered: () => void;
    updatePerformance: (perf: Partial<GameState["performance"]>) => void;
    resetGame: () => void;
  };
} | null>(null);

// Game provider component
export function GameProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(gameReducer, initialState);

  // Action creators
  const actions = {
    updatePlayers: useCallback((players: PlayerState[]) => {
      dispatch({ type: "SET_PLAYERS", payload: players });
    }, []),

    updateBullets: useCallback((bullets: BulletState[]) => {
      dispatch({ type: "SET_BULLETS", payload: bullets });
    }, []),

    updateWalls: useCallback((walls: WallState[]) => {
      dispatch({ type: "SET_WALLS", payload: walls });
    }, []),

    setLocalPlayer: useCallback((player: PlayerState | null) => {
      dispatch({ type: "SET_LOCAL_PLAYER", payload: player });
    }, []),

    updateScore: useCallback((score: number) => {
      dispatch({ type: "UPDATE_SCORE", payload: score });
    }, []),

    shotFired: useCallback(() => {
      dispatch({ type: "SHOT_FIRED" });
    }, []),

    hitRegistered: useCallback(() => {
      dispatch({ type: "HIT_REGISTERED" });
    }, []),

    updatePerformance: useCallback(
      (perf: Partial<GameState["performance"]>) => {
        dispatch({ type: "UPDATE_PERFORMANCE", payload: perf });
      },
      [],
    ),

    resetGame: useCallback(() => {
      dispatch({ type: "RESET_GAME" });
    }, []),
  };

  // Track game time
  useEffect(() => {
    const interval = setInterval(() => {
      // Update game time played separately
      dispatch({ type: "UPDATE_PERFORMANCE", payload: {} });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  return (
    <GameContext.Provider value={{ state, dispatch, actions }}>
      {children}
    </GameContext.Provider>
  );
}

// Hook to use game context
export function useGame() {
  const context = useContext(GameContext);
  if (!context) {
    throw new Error("useGame must be used within a GameProvider");
  }
  return context;
}

// Game utilities
export const gameUtils = {
  // Calculate distance between two points
  distance: (x1: number, y1: number, x2: number, y2: number) => {
    return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
  },

  // Check if point is in range
  inRange: (x1: number, y1: number, x2: number, y2: number, range: number) => {
    return gameUtils.distance(x1, y1, x2, y2) <= range;
  },

  // Normalize angle to 0-360 degrees
  normalizeAngle: (angle: number) => {
    return ((angle % 360) + 360) % 360;
  },

  // Calculate angle between two points
  angleBetween: (x1: number, y1: number, x2: number, y2: number) => {
    return Math.atan2(y2 - y1, x2 - x1);
  },

  // Interpolate between two values
  lerp: (start: number, end: number, t: number) => {
    return start + (end - start) * t;
  },

  // Clamp value between min and max
  clamp: (value: number, min: number, max: number) => {
    return Math.min(Math.max(value, min), max);
  },

  // Format time display
  formatTime: (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  },

  // Format score display
  formatScore: (score: number) => {
    return score.toLocaleString();
  },

  // Calculate performance rating
  getPerformanceRating: (fps: number, accuracy: number) => {
    if (fps >= 55 && accuracy >= 70) return "S";
    if (fps >= 45 && accuracy >= 50) return "A";
    if (fps >= 30 && accuracy >= 30) return "B";
    return "C";
  },
};
