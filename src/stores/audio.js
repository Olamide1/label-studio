import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { 
  start, 
  getTransport, 
  Gain, 
  MembraneSynth, 
  PolySynth, 
  Synth,
  getContext
} from 'tone';
import { useProjectStore } from './project';

export const useAudioStore = defineStore('audio', () => {
  // Audio state
  const isInitialized = ref(false);
  const isPlaying = ref(false);
  const currentPosition = ref(0);
  const bpm = ref(120);
  const metronomeEnabled = ref(false);
  
  // Tone.js objects
  let transport = null;
  let metronome = null;
  let masterGain = null;
  const trackOutputs = new Map(); // trackId -> Gain
  const instruments = new Map(); // trackId -> Synth/Sampler

  // Initialize audio engine
  async function initializeAudio() {
    if (isInitialized.value) return;
    
    try {
      // Start Tone.js context
      await start();
      console.log('Audio context started');
      
      // Initialize transport
      transport = getTransport();
      transport.bpm.value = bpm.value;
      
      // Create master gain
      masterGain = new Gain(0.7).toDestination();
      
      // Create metronome
      metronome = new MembraneSynth({
        pitchDecay: 0.05,
        octaves: 2,
        oscillator: { type: 'sine' },
        envelope: { attack: 0.001, decay: 0.4, sustain: 0.01, release: 1.4 }
      }).connect(masterGain);
      
      // Set up transport callbacks
      transport.scheduleRepeat((time) => {
        updatePosition();
        if (metronomeEnabled.value) {
          metronome.triggerAttackRelease('C4', '8n', time);
        }
      }, '4n');
      
      isInitialized.value = true;
      console.log('Audio engine initialized successfully');
    } catch (error) {
      console.error('Failed to initialize audio:', error);
    }
  }

  // Transport controls
  function play() {
    if (!isInitialized.value) return;
    
    // Schedule all clips for playback
    const projectStore = useProjectStore();
    projectStore.clips.forEach(clip => {
      if (clip.type === 'midi' && clip.data && clip.data.notes) {
        scheduleClip(clip);
      }
    });
    
    transport.start();
    isPlaying.value = true;
    
    // Update project store
    projectStore.setPlaying(true);
  }

  function pause() {
    if (!isInitialized.value) return;
    
    transport.pause();
    isPlaying.value = false;
    
    // Update project store
    const projectStore = useProjectStore();
    projectStore.setPlaying(false);
  }

  function stop() {
    if (!isInitialized.value) return;
    
    // Clear all scheduled events
    transport.cancel(0);
    transport.stop();
    transport.position = 0;
    isPlaying.value = false;
    currentPosition.value = 0;
    
    // Update project store
    const projectStore = useProjectStore();
    projectStore.setPlaying(false);
    projectStore.setPosition(0);
  }

  function setBPM(newBPM) {
    bpm.value = newBPM;
    if (transport) {
      transport.bpm.value = newBPM;
    }
  }

  function updatePosition() {
    if (transport) {
      const positionInBeats = parseFloat(transport.position.split(':')[2]) || 0;
      currentPosition.value = positionInBeats;
      
      // Update project store
      const projectStore = useProjectStore();
      projectStore.setPosition(positionInBeats);
    }
  }

  // Track management
  function createTrack(trackId, trackType = 'midi') {
    if (!isInitialized.value) return;
    
    // Create track output gain
    const trackGain = new Gain(0.8).connect(masterGain);
    trackOutputs.set(trackId, trackGain);
    
    // Create default instrument for track
    let instrument;
    if (trackType === 'midi') {
      instrument = new PolySynth(Synth, {
        oscillator: { type: 'triangle' },
        envelope: { attack: 0.02, decay: 0.1, sustain: 0.3, release: 1 }
      }).connect(trackGain);
    } else if (trackType === 'drums') {
      // Create a simple drum kit
      instrument = new MembraneSynth({
        pitchDecay: 0.05,
        octaves: 4,
        oscillator: { type: 'sine' },
        envelope: { attack: 0.001, decay: 0.4, sustain: 0.01, release: 1.4 }
      }).connect(trackGain);
    }
    
    instruments.set(trackId, instrument);
    console.log(`Created ${trackType} track:`, trackId);
  }

  function removeTrack(trackId) {
    // Dispose of instrument
    const instrument = instruments.get(trackId);
    if (instrument) {
      instrument.dispose();
      instruments.delete(trackId);
    }
    
    // Dispose of track output
    const trackOutput = trackOutputs.get(trackId);
    if (trackOutput) {
      trackOutput.dispose();
      trackOutputs.delete(trackId);
    }
  }

  function setTrackVolume(trackId, volume) {
    const trackOutput = trackOutputs.get(trackId);
    if (trackOutput) {
      trackOutput.gain.value = volume;
    }
  }

  function setTrackMute(trackId, muted) {
    const trackOutput = trackOutputs.get(trackId);
    if (trackOutput) {
      trackOutput.mute = muted;
    }
  }

  // Play individual notes (for testing/preview)
  function playNote(trackId, note = 'C4', duration = '8n') {
    if (!isInitialized.value) return;
    
    const instrument = instruments.get(trackId);
    if (instrument) {
      instrument.triggerAttackRelease(note, duration);
    }
  }

  // Schedule clips for playback
  function scheduleClip(clip) {
    if (!isInitialized.value) return;
    
    const instrument = instruments.get(clip.trackId);
    if (!instrument || !clip.data) return;
    
    // Clear previous scheduling for this clip
    transport.cancel(clip.startTime);
    
    // Schedule notes
    if (clip.type === 'midi' && clip.data.notes) {
      clip.data.notes.forEach(note => {
        const time = clip.startTime + note.time;
        transport.schedule((scheduleTime) => {
          instrument.triggerAttackRelease(note.pitch, note.duration, scheduleTime);
        }, time);
      });
    }
  }

  // Get current audio context state
  const audioContextState = computed(() => {
    if (!isInitialized.value) return 'uninitialized';
    return getContext().state;
  });

  const formattedPosition = computed(() => {
    const beats = Math.floor(currentPosition.value);
    const measures = Math.floor(beats / 4) + 1;
    const beatInMeasure = (beats % 4) + 1;
    return `${measures}.${beatInMeasure}`;
  });

  return {
    // State
    isInitialized,
    isPlaying,
    currentPosition,
    bpm,
    metronomeEnabled,
    audioContextState,
    formattedPosition,
    
    // Actions
    initializeAudio,
    play,
    pause,
    stop,
    setBPM,
    createTrack,
    removeTrack,
    setTrackVolume,
    setTrackMute,
    playNote,
    scheduleClip
  };
}); 