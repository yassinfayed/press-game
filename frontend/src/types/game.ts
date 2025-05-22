export interface Player {
  id: string;
  name: string;
  key: string;
  taps: number;
  isReady: boolean;
  isSelf: boolean;
}

export interface GameTimings {
  serverStartTime: number;
  clientStartTime: number;
  scheduledStartTime: number;
  gameDuration: number; // in milliseconds
}
