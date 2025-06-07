import { defineStore } from 'pinia';
import { ref, computed, watch } from 'vue';
import { useCollaborationStore } from './collaboration';
import { useHistoryStore } from './history';

export const useProjectStore = defineStore('project', () => {
  // Project state
  const projectName = ref('Untitled Project');
  const bpm = ref(120);
  const timeSignature = ref({ numerator: 4, denominator: 4 });
  const isPlaying = ref(false);
  const currentPosition = ref(0);
  const loopEnabled = ref(false);
  const loopStart = ref(0);
  const loopEnd = ref(16);
  
  // Tracks and clips
  const tracks = ref([]);
  const clips = ref([]);
  const selectedTrackId = ref(null);
  const selectedClipId = ref(null);
  
  // Yjs shared types
  let sharedTracks = null;
  let sharedClips = null;
  let sharedProject = null;
  
  // Initialize project with collaboration
  function initializeProject() {
    const collaborationStore = useCollaborationStore();
    const doc = collaborationStore.getDoc();
    
    if (!doc) {
      console.warn('No Yjs document available');
      return;
    }
    
    try {
      // Create shared types
      sharedTracks = doc.getArray('tracks');
      sharedClips = doc.getArray('clips');
      sharedProject = doc.getMap('project');
      
      // Set up listeners
      sharedTracks.observe(() => {
        syncTracksFromShared();
      });
      
      sharedClips.observe(() => {
        syncClipsFromShared();
      });
      
      sharedProject.observe(() => {
        syncProjectFromShared();
      });
      
      // Initial sync
      syncFromShared();
      
      console.log('Project collaboration initialized');
    } catch (error) {
      console.error('Failed to initialize project collaboration:', error);
    }
  }
  
  function syncFromShared() {
    syncTracksFromShared();
    syncClipsFromShared();
    syncProjectFromShared();
  }
  
  function syncTracksFromShared() {
    if (!sharedTracks) return;
    tracks.value = sharedTracks.toArray().map(track => ({ ...track }));
  }
  
  function syncClipsFromShared() {
    if (!sharedClips) return;
    clips.value = sharedClips.toArray().map(clip => ({ ...clip }));
  }
  
  function syncProjectFromShared() {
    if (!sharedProject) return;
    
    const sharedBpm = sharedProject.get('bpm');
    const sharedName = sharedProject.get('name');
    const sharedTimeSignature = sharedProject.get('timeSignature');
    
    if (sharedBpm !== undefined) bpm.value = sharedBpm;
    if (sharedName !== undefined) projectName.value = sharedName;
    if (sharedTimeSignature !== undefined) timeSignature.value = sharedTimeSignature;
  }
  
  // Helper function to save history before major actions
  function saveHistorySnapshot(description) {
    const historyStore = useHistoryStore();
    historyStore.createSnapshot({
      projectName: projectName.value,
      bpm: bpm.value,
      timeSignature: timeSignature.value,
      tracks: tracks.value,
      clips: clips.value,
      selectedTrackId: selectedTrackId.value,
      selectedClipId: selectedClipId.value,
      loopEnabled: loopEnabled.value,
      loopStart: loopStart.value,
      loopEnd: loopEnd.value
    }, description);
  }

  // Track management
  function addTrack(type = 'midi') {
    saveHistorySnapshot(`Add ${type} track`);
    
    const track = {
      id: generateId(),
      name: `Track ${tracks.value.length + 1}`,
      type: type,
      volume: 0.8,
      muted: false,
      solo: false,
      color: getRandomColor(),
      effects: [],
      created: Date.now()
    };
    
    tracks.value.push(track);
    
    if (sharedTracks) {
      sharedTracks.push([track]);
    }
    
    return track;
  }
  
  function removeTrack(trackId) {
    const track = tracks.value.find(t => t.id === trackId);
    if (track) {
      saveHistorySnapshot(`Remove track "${track.name}"`);
      
      const index = tracks.value.findIndex(t => t.id === trackId);
      tracks.value.splice(index, 1);
      
      if (sharedTracks) {
        sharedTracks.delete(index);
      }
      
      // Remove associated clips
      const clipIndices = clips.value
        .map((clip, i) => clip.trackId === trackId ? i : -1)
        .filter(i => i !== -1)
        .reverse();
      
      clipIndices.forEach(i => {
        clips.value.splice(i, 1);
        if (sharedClips) {
          sharedClips.delete(i);
        }
      });
    }
  }
  
  function updateTrack(trackId, updates) {
    const index = tracks.value.findIndex(t => t.id === trackId);
    if (index !== -1) {
      // Only save history for significant changes (not volume adjustments)
      const significantKeys = ['name', 'muted', 'solo'];
      const hasSignificantChange = Object.keys(updates).some(key => significantKeys.includes(key));
      
      if (hasSignificantChange) {
        const changeDescription = Object.keys(updates).map(key => {
          if (key === 'muted') return updates[key] ? 'Mute track' : 'Unmute track';
          if (key === 'solo') return updates[key] ? 'Solo track' : 'Unsolo track';
          if (key === 'name') return `Rename track to "${updates[key]}"`;
          return `Update ${key}`;
        }).join(', ');
        
        saveHistorySnapshot(changeDescription);
      }
      
      Object.assign(tracks.value[index], updates);
      
      if (sharedTracks) {
        const track = { ...tracks.value[index] };
        sharedTracks.delete(index);
        sharedTracks.insert(index, [track]);
      }
    }
  }
  
  // Clip management
  function addClip(trackId, startTime = 0, duration = 4, type = 'midi') {
    const track = tracks.value.find(t => t.id === trackId);
    saveHistorySnapshot(`Add ${type} clip${track ? ` to "${track.name}"` : ''}`);
    
    const clip = {
      id: generateId(),
      trackId: trackId,
      startTime: startTime,
      duration: duration,
      type: type,
      data: type === 'midi' ? { notes: [] } : { audioBuffer: null, url: null },
      color: getRandomColor(),
      created: Date.now()
    };
    
    clips.value.push(clip);
    
    if (sharedClips) {
      sharedClips.push([clip]);
    }
    
    return clip;
  }
  
  // Add audio clip specifically
  function addAudioClip(trackId, startTime, audioBuffer, duration, url = null) {
    const track = tracks.value.find(t => t.id === trackId);
    saveHistorySnapshot(`Import audio clip${track ? ` to "${track.name}"` : ''}`);
    
    const clip = {
      id: generateId(),
      trackId: trackId,
      startTime: startTime,
      duration: duration,
      type: 'audio',
      data: {
        audioBuffer: audioBuffer,
        url: url,
        gain: 1.0,
        pan: 0,
        fadeIn: 0,
        fadeOut: 0
      },
      color: getRandomColor(),
      created: Date.now()
    };
    
    clips.value.push(clip);
    
    if (sharedClips) {
      sharedClips.push([clip]);
    }
    
    return clip;
  }
  
  function removeClip(clipId) {
    const clip = clips.value.find(c => c.id === clipId);
    if (clip) {
      saveHistorySnapshot(`Delete ${clip.type} clip`);
      
      const index = clips.value.findIndex(c => c.id === clipId);
      clips.value.splice(index, 1);
      
      if (sharedClips) {
        sharedClips.delete(index);
      }
    }
  }
  
  function updateClip(clipId, updates) {
    const index = clips.value.findIndex(c => c.id === clipId);
    if (index !== -1) {
      const clip = clips.value[index];
      
      // Only save history for significant changes (not minor position adjustments)
      const significantKeys = ['data', 'name'];
      const hasSignificantChange = Object.keys(updates).some(key => {
        if (significantKeys.includes(key)) return true;
        if (key === 'startTime' || key === 'duration') {
          // Only save for major time changes (> 0.25 beats)
          const oldValue = clip[key] || 0;
          const newValue = updates[key] || 0;
          return Math.abs(newValue - oldValue) > 0.25;
        }
        return false;
      });
      
      if (hasSignificantChange) {
        if (updates.data) {
          saveHistorySnapshot(`Edit ${clip.type} clip content`);
        } else {
          saveHistorySnapshot(`Move/resize ${clip.type} clip`);
        }
      }
      
      Object.assign(clips.value[index], updates);
      
      if (sharedClips) {
        const updatedClip = { ...clips.value[index] };
        sharedClips.delete(index);
        sharedClips.insert(index, [updatedClip]);
      }
    }
  }
  
  // Transport controls
  function setPlaying(playing) {
    isPlaying.value = playing;
  }
  
  function setPosition(position) {
    currentPosition.value = position;
  }
  
  function setBPM(newBPM) {
    bpm.value = newBPM;
    
    if (sharedProject) {
      sharedProject.set('bpm', newBPM);
    }
  }
  
  function setProjectName(name) {
    projectName.value = name;
    
    if (sharedProject) {
      sharedProject.set('name', name);
    }
  }
  
  // Utility functions
  function generateId() {
    return Math.random().toString(36).substr(2, 9);
  }
  
  function getRandomColor() {
    const colors = [
      '#ef4444', '#f97316', '#f59e0b', '#eab308',
      '#84cc16', '#22c55e', '#10b981', '#14b8a6',
      '#06b6d4', '#0ea5e9', '#3b82f6', '#6366f1',
      '#8b5cf6', '#a855f7', '#d946ef', '#ec4899'
    ];
    return colors[Math.floor(Math.random() * colors.length)];
  }
  
  // Computed properties
  const trackCount = computed(() => tracks.value.length);
  const clipCount = computed(() => clips.value.length);
  const selectedTrack = computed(() => 
    tracks.value.find(t => t.id === selectedTrackId.value)
  );
  const selectedClip = computed(() => 
    clips.value.find(c => c.id === selectedClipId.value)
  );
  
  function getTrackClips(trackId) {
    return clips.value.filter(c => c.trackId === trackId);
  }
  
  // History management functions
  function undo() {
    const historyStore = useHistoryStore();
    return historyStore.undo({
      projectName, bpm, timeSignature, tracks, clips,
      selectedTrackId, selectedClipId, loopEnabled, loopStart, loopEnd
    });
  }
  
  function redo() {
    const historyStore = useHistoryStore();
    return historyStore.redo({
      projectName, bpm, timeSignature, tracks, clips,
      selectedTrackId, selectedClipId, loopEnabled, loopStart, loopEnd
    });
  }
  
  function initializeHistory() {
    const historyStore = useHistoryStore();
    historyStore.initializeHistory({
      projectName: projectName.value,
      bpm: bpm.value,
      timeSignature: timeSignature.value,
      tracks: tracks.value,
      clips: clips.value,
      selectedTrackId: selectedTrackId.value,
      selectedClipId: selectedClipId.value,
      loopEnabled: loopEnabled.value,
      loopStart: loopStart.value,
      loopEnd: loopEnd.value
    }, 'Project opened');
  }
  
  return {
    // State
    projectName,
    bpm,
    timeSignature,
    isPlaying,
    currentPosition,
    loopEnabled,
    loopStart,
    loopEnd,
    tracks,
    clips,
    selectedTrackId,
    selectedClipId,
    
    // Computed
    trackCount,
    clipCount,
    selectedTrack,
    selectedClip,
    
    // Actions
    initializeProject,
    addTrack,
    removeTrack,
    updateTrack,
    addClip,
    addAudioClip,
    removeClip,
    updateClip,
    setPlaying,
    setPosition,
    setBPM,
    setProjectName,
    getTrackClips,
    
    // History management
    undo,
    redo,
    initializeHistory
  };
}); 