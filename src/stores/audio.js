import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { 
  start, 
  getTransport, 
  Gain, 
  MembraneSynth, 
  PolySynth, 
  Synth,
  Player,
  getContext
} from 'tone';
import { useProjectStore } from './project';
import { usePluginsStore } from './plugins';

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
  const audioBuffers = new Map(); // clipId -> AudioBuffer

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
    
    // Create track effects chain with input -> effects -> output -> master
    const trackInput = new Gain(1.0); // Track input gain
    const trackOutput = new Gain(0.8); // Track output gain
    
    // Initially connect input directly to output (bypass effects)
    trackInput.connect(trackOutput);
    trackOutput.connect(masterGain);
    
    // Store both input and output gains
    trackOutputs.set(trackId, {
      input: trackInput,
      output: trackOutput,
      effectsChain: [], // Will be populated as effects are added
      bypassed: false
    });
    
    // Create default instrument for track
    let instrument;
    if (trackType === 'midi') {
      instrument = new PolySynth(Synth, {
        oscillator: { type: 'triangle' },
        envelope: { attack: 0.02, decay: 0.1, sustain: 0.3, release: 1 }
      }).connect(trackInput); // Connect to track input instead of output
    } else if (trackType === 'drums') {
      // Create a simple drum kit
      instrument = new MembraneSynth({
        pitchDecay: 0.05,
        octaves: 4,
        oscillator: { type: 'sine' },
        envelope: { attack: 0.001, decay: 0.4, sustain: 0.01, release: 1.4 }
      }).connect(trackInput);
    } else if (trackType === 'audio') {
      // For audio tracks, we'll create players dynamically per clip
      instrument = trackInput; // Use the input gain as placeholder
    }
    
    instruments.set(trackId, instrument);
    console.log(`✅ Created ${trackType} track with effects routing:`, trackId);
  }

  function removeTrack(trackId) {
    // Dispose of instrument
    const instrument = instruments.get(trackId);
    if (instrument) {
      instrument.dispose();
      instruments.delete(trackId);
    }
    
    // Dispose of track chain and effects
    const trackChain = trackOutputs.get(trackId);
    if (trackChain) {
      // Clean up effects chain
      if (trackChain.effectsChain) {
        trackChain.effectsChain.forEach(effect => {
          if (effect.dispose) effect.dispose();
        });
      }
      // Dispose gain nodes
      if (trackChain.input && trackChain.input.dispose) {
        trackChain.input.dispose();
      }
      if (trackChain.output && trackChain.output.dispose) {
        trackChain.output.dispose();
      }
      trackOutputs.delete(trackId);
    }
    console.log('🗑️ Removed track and effects:', trackId);
  }

  function setTrackVolume(trackId, volume) {
    const trackChain = trackOutputs.get(trackId);
    if (trackChain && trackChain.output) {
      trackChain.output.gain.value = volume;
    }
  }

  function setTrackMute(trackId, muted) {
    const trackChain = trackOutputs.get(trackId);
    if (trackChain && trackChain.output) {
      trackChain.output.mute = muted;
    }
  }

  // Effects chain management
  function addEffectToTrack(trackId, effect) {
    const trackChain = trackOutputs.get(trackId);
    if (!trackChain) return false;
    
    // Disconnect current chain
    const input = trackChain.input;
    const output = trackChain.output;
    const effectsChain = trackChain.effectsChain;
    
    // Rebuild connections: input -> effects -> new effect -> output
    input.disconnect();
    if (effectsChain.length > 0) {
      // Disconnect last effect from output
      const lastEffect = effectsChain[effectsChain.length - 1];
      lastEffect.output.disconnect();
      
      // Connect last effect to new effect
      lastEffect.output.connect(effect.input);
    } else {
      // First effect - connect input to effect
      input.connect(effect.input);
    }
    
    // Connect new effect to output
    effect.output.connect(output);
    
    // Add to effects chain
    effectsChain.push(effect);
    
    console.log(`✅ Added ${effect.type} effect to track ${trackId}`);
    return true;
  }

  function removeEffectFromTrack(trackId, effectId) {
    const trackChain = trackOutputs.get(trackId);
    if (!trackChain) return false;
    
    const effectsChain = trackChain.effectsChain;
    const effectIndex = effectsChain.findIndex(e => e.id === effectId);
    if (effectIndex === -1) return false;
    
    const effect = effectsChain[effectIndex];
    
    // Rebuild connections without this effect
    rebuildEffectsChain(trackId);
    
    // Remove from chain and dispose
    effectsChain.splice(effectIndex, 1);
    effect.dispose();
    
    console.log(`🗑️ Removed effect ${effectId} from track ${trackId}`);
    return true;
  }

  function rebuildEffectsChain(trackId) {
    const trackChain = trackOutputs.get(trackId);
    if (!trackChain) return;
    
    const { input, output, effectsChain } = trackChain;
    
    // Disconnect everything
    input.disconnect();
    effectsChain.forEach(effect => {
      effect.input.disconnect();
      effect.output.disconnect();
    });
    
    if (effectsChain.length === 0) {
      // No effects - direct connection
      input.connect(output);
    } else {
      // Reconnect chain: input -> effect1 -> effect2 -> ... -> output
      input.connect(effectsChain[0].input);
      
      for (let i = 0; i < effectsChain.length - 1; i++) {
        effectsChain[i].output.connect(effectsChain[i + 1].input);
      }
      
      effectsChain[effectsChain.length - 1].output.connect(output);
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

  // Load audio file and return buffer
  async function loadAudioFile(file) {
    try {
      const audioContext = getContext().rawContext;
      const arrayBuffer = await file.arrayBuffer();
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
      return audioBuffer;
    } catch (error) {
      console.error('Failed to load audio file:', error);
      throw error;
    }
  }

  // Schedule clips for playback
  function scheduleClip(clip) {
    if (!isInitialized.value) return;
    
    const trackChain = trackOutputs.get(clip.trackId);
    if (!trackChain || !clip.data) return;
    
    // Clear previous scheduling for this clip
    transport.cancel(clip.startTime);
    
    if (clip.type === 'midi' && clip.data.notes) {
      // Schedule MIDI notes - instrument already connects to track input
      const instrument = instruments.get(clip.trackId);
      if (!instrument) return;
      
      clip.data.notes.forEach(note => {
        const time = clip.startTime + note.time;
        transport.schedule((scheduleTime) => {
          instrument.triggerAttackRelease(note.pitch, note.duration, scheduleTime);
        }, time);
      });
    } else if (clip.type === 'audio' && clip.data.audioBuffer) {
      // Schedule audio playback - connect to track input for effects processing
      const player = new Player(clip.data.audioBuffer).connect(trackChain.input);
      transport.schedule((scheduleTime) => {
        player.start(scheduleTime);
        // Clean up player after playback
        setTimeout(() => {
          player.dispose();
        }, (clip.duration * 1000) + 1000);
      }, clip.startTime);
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
    instruments, // Expose instruments map
    trackOutputs, // Expose track chains for effects integration
    
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
    addEffectToTrack,
    removeEffectFromTrack,
    rebuildEffectsChain,
    playNote,
    scheduleClip,
    loadAudioFile
  };
}); 