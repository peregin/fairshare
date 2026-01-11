
export type Status = 'pending' | 'completed';

export interface Member {
  id: string;
  name: string;
  color: string;
  totalPoints: number;
  createdAt: number;
}

export interface Chore {
  id: string;
  title: string;
  points: number;
  assignedTo: string | null;
  status: Status;
  createdAt: number;
}

export type TabType = 'dashboard' | 'chores' | 'family' | 'stats';
