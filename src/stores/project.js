import { defineStore } from 'pinia';
import { ref, computed, watch } from 'vue';
import { useCollaborationStore } from './collaboration';

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
  
  // Track management
  function addTrack(type = 'midi') {
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
    const index = tracks.value.findIndex(t => t.id === trackId);
    if (index !== -1) {
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
    const index = clips.value.findIndex(c => c.id === clipId);
    if (index !== -1) {
      clips.value.splice(index, 1);
      
      if (sharedClips) {
        sharedClips.delete(index);
      }
    }
  }
  
  function updateClip(clipId, updates) {
    const index = clips.value.findIndex(c => c.id === clipId);
    if (index !== -1) {
      Object.assign(clips.value[index], updates);
      
      if (sharedClips) {
        const clip = { ...clips.value[index] };
        sharedClips.delete(index);
        sharedClips.insert(index, [clip]);
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
    getTrackClips
  };
}); 