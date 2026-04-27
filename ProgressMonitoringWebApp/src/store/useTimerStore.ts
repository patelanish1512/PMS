import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface TimerState {
  isTracking: boolean;
  startTime: number | null;
  accumulatedTime: number;
  selectedProjectId: string;
  taskDescription: string;
  
  startTimer: () => void;
  pauseTimer: () => void;
  stopTimer: () => void;
  setProject: (id: string) => void;
  setTask: (desc: string) => void;
  getElapsedSeconds: () => number;
}

export const useTimerStore = create<TimerState>()(
  persist(
    (set, get) => ({
      isTracking: false,
      startTime: null,
      accumulatedTime: 0,
      selectedProjectId: '',
      taskDescription: '',

      startTimer: () => {
        if (!get().isTracking) {
          set({ isTracking: true, startTime: Date.now() });
        }
      },
      
      pauseTimer: () => {
        const { isTracking, startTime, accumulatedTime } = get();
        if (isTracking && startTime) {
          const now = Date.now();
          const elapsed = Math.floor((now - startTime) / 1000);
          set({ 
            isTracking: false, 
            startTime: null, 
            accumulatedTime: accumulatedTime + elapsed 
          });
        }
      },

      stopTimer: () => {
        set({
          isTracking: false,
          startTime: null,
          accumulatedTime: 0,
          selectedProjectId: '',
          taskDescription: ''
        });
      },

      setProject: (id) => set({ selectedProjectId: id }),
      setTask: (desc) => set({ taskDescription: desc }),

      getElapsedSeconds: () => {
        const { isTracking, startTime, accumulatedTime } = get();
        if (!isTracking || !startTime) return accumulatedTime;
        
        const now = Date.now();
        const elapsedSinceStart = Math.floor((now - startTime) / 1000);
        return accumulatedTime + elapsedSinceStart;
      }
    }),
    {
      name: 'timer-storage',
    }
  )
);
