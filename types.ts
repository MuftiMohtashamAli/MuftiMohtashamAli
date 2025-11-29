export enum ConnectionState {
  DISCONNECTED = 'DISCONNECTED',
  CONNECTING = 'CONNECTING',
  CONNECTED = 'CONNECTED',
  ERROR = 'ERROR',
}

export interface TranscriptionItem {
  text: string;
  sender: 'user' | 'model';
  timestamp: Date;
}

export interface AudioVisualizerProps {
  analyser: AnalyserNode | null;
  isActive: boolean;
  color?: string;
}
