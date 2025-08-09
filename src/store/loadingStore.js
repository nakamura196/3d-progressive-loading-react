import { create } from 'zustand';

export const useLoadingStore = create((set) => ({
  status: 'Initializing',
  lodLevel: '-',
  vertices: '-',
  fileSize: '-',
  loadTime: '-',
  progress: 0,
  isComplete: false,
  
  updateLoadingInfo: (data) => set((state) => {
    // isCompleteを明示的に設定
    let isComplete = state.isComplete;
    if (data.isComplete !== undefined) {
      isComplete = data.isComplete;
    } else if (data.status === 'Complete') {
      isComplete = true;
    }
    
    const newState = {
      ...state,
      ...data,
      isComplete: isComplete
    };
    
    // if (data.isComplete !== undefined || data.status === 'Complete') {
    //   console.log('Status update:', data.status, 'isComplete:', newState.isComplete, 'data:', data);
    // }
    return newState;
  }),
  
  reset: () => set({
    status: 'Initializing',
    lodLevel: '-',
    vertices: '-',
    fileSize: '-',
    loadTime: '-',
    progress: 0,
    isComplete: false
  })
}));