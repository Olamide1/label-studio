import { defineStore } from 'pinia';
import { ref, computed } from 'vue';

export const useHistoryStore = defineStore('history', () => {
  // History state
  const history = ref([]); // Array of state snapshots
  const currentIndex = ref(-1); // Current position in history
  const maxHistorySize = ref(50); // Limit history to prevent memory issues
  const isUndoing = ref(false); // Flag to prevent recursive history saves
  const lastActionDescription = ref('');
  
  // Computed properties
  const canUndo = computed(() => currentIndex.value > 0);
  const canRedo = computed(() => currentIndex.value < history.value.length - 1);
  
  const undoDescription = computed(() => {
    if (currentIndex.value > 0) {
      return history.value[currentIndex.value]?.description || 'Undo';
    }
    return 'Nothing to undo';
  });
  
  const redoDescription = computed(() => {
    if (currentIndex.value < history.value.length - 1) {
      return history.value[currentIndex.value + 1]?.description || 'Redo';
    }
    return 'Nothing to redo';
  });
  
  // Create a snapshot of the current project state
  function createSnapshot(projectStore, description = 'Action') {
    if (isUndoing.value) return; // Don't save history while undoing/redoing
    
    const snapshot = {
      id: `snapshot-${Date.now()}-${Math.random()}`,
      timestamp: Date.now(),
      description: description,
      state: {
        // Project state
        projectName: projectStore.projectName,
        bpm: projectStore.bpm,
        timeSignature: { ...projectStore.timeSignature },
        
        // Deep clone tracks and clips to avoid reference issues
        tracks: projectStore.tracks.map(track => ({
          ...track,
          effects: [...track.effects]
        })),
        
        clips: projectStore.clips.map(clip => ({
          ...clip,
          data: clip.type === 'midi' 
            ? { notes: [...(clip.data.notes || [])] }
            : { ...clip.data }
        })),
        
        // Selection state
        selectedTrackId: projectStore.selectedTrackId,
        selectedClipId: projectStore.selectedClipId,
        
        // Transport state
        loopEnabled: projectStore.loopEnabled,
        loopStart: projectStore.loopStart,
        loopEnd: projectStore.loopEnd
      }
    };
    
    // Remove future history if we're not at the end
    if (currentIndex.value < history.value.length - 1) {
      history.value = history.value.slice(0, currentIndex.value + 1);
    }
    
    // Add new snapshot
    history.value.push(snapshot);
    currentIndex.value = history.value.length - 1;
    
    // Limit history size
    if (history.value.length > maxHistorySize.value) {
      history.value.shift();
      currentIndex.value--;
    }
    
    lastActionDescription.value = description;
    console.log(`📸 Snapshot saved: ${description} (${history.value.length} in history)`);
  }
  
  // Restore state from a snapshot
  function restoreSnapshot(projectStore, snapshot) {
    if (!snapshot) return false;
    
    isUndoing.value = true;
    
    try {
      // Restore project state
      projectStore.projectName = snapshot.state.projectName;
      projectStore.bpm = snapshot.state.bpm;
      projectStore.timeSignature = { ...snapshot.state.timeSignature };
      
      // Restore tracks
      projectStore.tracks.splice(0);
      snapshot.state.tracks.forEach(track => {
        projectStore.tracks.push({
          ...track,
          effects: [...track.effects]
        });
      });
      
      // Restore clips
      projectStore.clips.splice(0);
      snapshot.state.clips.forEach(clip => {
        projectStore.clips.push({
          ...clip,
          data: clip.type === 'midi' 
            ? { notes: [...(clip.data.notes || [])] }
            : { ...clip.data }
        });
      });
      
      // Restore selection state
      projectStore.selectedTrackId = snapshot.state.selectedTrackId;
      projectStore.selectedClipId = snapshot.state.selectedClipId;
      
      // Restore transport state
      projectStore.loopEnabled = snapshot.state.loopEnabled;
      projectStore.loopStart = snapshot.state.loopStart;
      projectStore.loopEnd = snapshot.state.loopEnd;
      
      console.log(`🔄 State restored: ${snapshot.description}`);
      return true;
      
    } catch (error) {
      console.error('Failed to restore snapshot:', error);
      return false;
    } finally {
      isUndoing.value = false;
    }
  }
  
  // Undo the last action
  function undo(projectStore) {
    if (!canUndo.value) {
      console.log('❌ Nothing to undo');
      return false;
    }
    
    currentIndex.value--;
    const snapshot = history.value[currentIndex.value];
    
    if (restoreSnapshot(projectStore, snapshot)) {
      console.log(`↩️ Undid: ${undoDescription.value}`);
      return true;
    }
    
    // Revert index if restore failed
    currentIndex.value++;
    return false;
  }
  
  // Redo the next action
  function redo(projectStore) {
    if (!canRedo.value) {
      console.log('❌ Nothing to redo');
      return false;
    }
    
    currentIndex.value++;
    const snapshot = history.value[currentIndex.value];
    
    if (restoreSnapshot(projectStore, snapshot)) {
      console.log(`↪️ Redid: ${redoDescription.value}`);
      return true;
    }
    
    // Revert index if restore failed
    currentIndex.value--;
    return false;
  }
  
  // Clear all history
  function clearHistory() {
    history.value = [];
    currentIndex.value = -1;
    lastActionDescription.value = '';
    console.log('🧹 History cleared');
  }
  
  // Initialize with current state
  function initializeHistory(projectStore, description = 'Initial state') {
    clearHistory();
    createSnapshot(projectStore, description);
    console.log('🚀 History initialized');
  }
  
  // Get history stats for debugging
  const historyStats = computed(() => ({
    totalSnapshots: history.value.length,
    currentPosition: currentIndex.value + 1,
    canUndo: canUndo.value,
    canRedo: canRedo.value,
    memoryUsage: `${Math.round(JSON.stringify(history.value).length / 1024)}KB`
  }));
  
  return {
    // State
    history,
    currentIndex,
    maxHistorySize,
    isUndoing,
    lastActionDescription,
    
    // Computed
    canUndo,
    canRedo,
    undoDescription,
    redoDescription,
    historyStats,
    
    // Actions
    createSnapshot,
    restoreSnapshot,
    undo,
    redo,
    clearHistory,
    initializeHistory
  };
}); 