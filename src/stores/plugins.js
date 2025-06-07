import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { getContext } from 'tone';

export const usePluginsStore = defineStore('plugins', () => {
  // Plugin state
  const availablePlugins = ref(new Map()); // plugin URL -> plugin info
  const loadedPlugins = ref(new Map()); // pluginId -> WAM instance
  const trackEffects = ref(new Map()); // trackId -> array of effect instances
  const masterEffects = ref([]);
  const isLoading = ref(false);
  const loadingStatus = ref('');
  
  // WAM Plugin Registry - Add known plugin URLs here
  const wamPluginRegistry = ref(new Map([
    ['dexed', {
      url: 'https://webaudiomodules.org/wamsynths/dexed/index.js',
      name: 'Dexed FM Synth',
      type: 'instrument',
      vendor: 'WAM Community',
      description: 'Classic FM synthesizer based on Yamaha DX7'
    }],
    ['obxd', {
      url: 'https://webaudiomodules.org/wamsynths/obxd/index.js', 
      name: 'OB-Xd Analog Synth',
      type: 'instrument',
      vendor: 'WAM Community',
      description: 'Virtual analog synthesizer'
    }],
    ['pingpongdelay', {
      url: 'https://webaudiomodules.org/wamsynths/pingpongdelay/index.js',
      name: 'Ping Pong Delay',
      type: 'effect',
      vendor: 'WAM Community', 
      description: 'Stereo ping pong delay effect'
    }]
  ]));
  
  // Built-in effects registry
  const builtInEffects = ref(new Map([
    ['eq4', {
      id: 'eq4',
      name: '4-Band EQ',
      type: 'equalizer',
      vendor: 'CollabDAW',
      version: '1.0.0',
      description: 'Professional 4-band parametric equalizer',
      parameters: {
        lowGain: { min: -24, max: 24, default: 0, unit: 'dB' },
        lowMidGain: { min: -24, max: 24, default: 0, unit: 'dB' },
        highMidGain: { min: -24, max: 24, default: 0, unit: 'dB' },
        highGain: { min: -24, max: 24, default: 0, unit: 'dB' },
        lowFreq: { min: 20, max: 500, default: 100, unit: 'Hz' },
        lowMidFreq: { min: 200, max: 2000, default: 500, unit: 'Hz' },
        highMidFreq: { min: 1000, max: 8000, default: 2000, unit: 'Hz' },
        highFreq: { min: 2000, max: 20000, default: 8000, unit: 'Hz' },
        lowMidQ: { min: 0.1, max: 30, default: 1, unit: 'Q' },
        highMidQ: { min: 0.1, max: 30, default: 1, unit: 'Q' }
      }
    }],
    ['compressor', {
      id: 'compressor',
      name: 'Compressor',
      type: 'dynamics',
      vendor: 'CollabDAW',
      version: '1.0.0',
      description: 'Professional dynamics compressor',
      parameters: {
        threshold: { min: -60, max: 0, default: -18, unit: 'dB' },
        ratio: { min: 1, max: 20, default: 4, unit: ':1' },
        attack: { min: 0, max: 200, default: 10, unit: 'ms' },
        release: { min: 10, max: 5000, default: 100, unit: 'ms' },
        knee: { min: 0, max: 40, default: 2, unit: 'dB' },
        makeupGain: { min: 0, max: 30, default: 0, unit: 'dB' },
        mix: { min: 0, max: 100, default: 100, unit: '%' }
      }
    }],
    ['reverb', {
      id: 'reverb',
      name: 'Reverb',
      type: 'spatial',
      vendor: 'CollabDAW',
      version: '1.0.0',
      description: 'Professional algorithmic reverb',
      parameters: {
        roomSize: { min: 0, max: 1, default: 0.5, unit: '' },
        decay: { min: 0.1, max: 10, default: 2, unit: 's' },
        damping: { min: 0, max: 1, default: 0.5, unit: '' },
        earlyReflections: { min: 0, max: 1, default: 0.3, unit: '' },
        wetLevel: { min: 0, max: 1, default: 0.3, unit: '' },
        dryLevel: { min: 0, max: 1, default: 0.7, unit: '' },
        predelay: { min: 0, max: 100, default: 20, unit: 'ms' }
      }
    }],
    ['saturator', {
      id: 'saturator',
      name: 'Saturator',
      type: 'distortion',
      vendor: 'CollabDAW', 
      version: '1.0.0',
      description: 'Harmonic saturation and warmth',
      parameters: {
        drive: { min: 0, max: 100, default: 10, unit: '%' },
        warmth: { min: 0, max: 100, default: 50, unit: '%' },
        mix: { min: 0, max: 100, default: 50, unit: '%' },
        outputGain: { min: -12, max: 12, default: 0, unit: 'dB' }
      }
    }],
    ['delay', {
      id: 'delay',
      name: 'Stereo Delay',
      type: 'time',
      vendor: 'CollabDAW',
      version: '1.0.0',
      description: 'Stereo delay with modulation',
      parameters: {
        delayTime: { min: 1, max: 2000, default: 250, unit: 'ms' },
        feedback: { min: 0, max: 95, default: 30, unit: '%' },
        wetLevel: { min: 0, max: 100, default: 25, unit: '%' },
        stereoWidth: { min: 0, max: 100, default: 50, unit: '%' },
        highCut: { min: 1000, max: 20000, default: 8000, unit: 'Hz' },
        sync: { min: 0, max: 1, default: 0, unit: 'bool' }
      }
    }]
  ]));

  // Get audio context
  function getAudioContext() {
    return getContext().rawContext;
  }

  // Load WAM plugin from registry
  async function loadWAMPluginFromRegistry(pluginKey) {
    const pluginInfo = wamPluginRegistry.value.get(pluginKey);
    if (!pluginInfo) {
      throw new Error(`Plugin '${pluginKey}' not found in registry`);
    }
    
    return await loadWAMPlugin(pluginInfo.url, pluginKey);
  }

  // Load WAM plugin from URL
  async function loadWAMPlugin(pluginUrl, pluginId = null) {
    try {
      isLoading.value = true;
      loadingStatus.value = `Loading plugin from ${pluginUrl}...`;
      
      const audioContext = getAudioContext();
      
      // More robust plugin loading with error handling
      let WAMPlugin;
      try {
        const module = await import(/* @vite-ignore */ pluginUrl);
        WAMPlugin = module.default || module;
      } catch (importError) {
        // Fallback: try loading as script tag (for older WAM plugins)
        console.warn('Dynamic import failed, trying script tag approach:', importError);
        await loadWAMPluginViaScript(pluginUrl);
        // After script loads, plugin should be available globally
        WAMPlugin = window.WAMPlugin || window[pluginId];
        if (!WAMPlugin) {
          throw new Error('Plugin not found after script loading');
        }
      }
      
      // Validate plugin
      if (!WAMPlugin || typeof WAMPlugin.createInstance !== 'function') {
        throw new Error('Invalid WAM plugin: missing createInstance method');
      }
      
      // Create plugin instance
      const groupId = 'collab-daw-group';
      const pluginInstance = await WAMPlugin.createInstance(groupId, audioContext);
      
      if (!pluginInstance || !pluginInstance.descriptor) {
        throw new Error('Failed to create plugin instance');
      }
      
      const id = pluginId || `plugin-${Date.now()}`;
      loadedPlugins.value.set(id, pluginInstance);
      
      console.log(`✅ WAM Plugin loaded: ${pluginInstance.descriptor.name}`);
      return { id, instance: pluginInstance };
      
    } catch (error) {
      console.error('Failed to load WAM plugin:', error);
      throw new Error(`Plugin loading failed: ${error.message}`);
    } finally {
      isLoading.value = false;
      loadingStatus.value = '';
    }
  }

  // Fallback loading method for older WAM plugins
  async function loadWAMPluginViaScript(pluginUrl) {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = pluginUrl;
      script.onload = resolve;
      script.onerror = () => reject(new Error(`Failed to load script: ${pluginUrl}`));
      document.head.appendChild(script);
    });
  }

  // Create built-in effect using Web Audio API nodes
  function createBuiltInEffect(effectType, audioContext) {
    const effectInfo = builtInEffects.value.get(effectType);
    if (!effectInfo) throw new Error(`Unknown effect type: ${effectType}`);
    
    switch (effectType) {
      case 'eq4':
        return createEQ4(audioContext);
      case 'compressor':
        return createCompressor(audioContext);
      case 'reverb':
        return createReverb(audioContext);
      case 'saturator':
        return createSaturator(audioContext);
      case 'delay':
        return createDelay(audioContext);
      default:
        throw new Error(`Effect not implemented: ${effectType}`);
    }
  }

  // 4-Band EQ implementation
  function createEQ4(audioContext) {
    const input = audioContext.createGain();
    const output = audioContext.createGain();
    
    const lowFilter = audioContext.createBiquadFilter();
    const lowMidFilter = audioContext.createBiquadFilter();
    const highMidFilter = audioContext.createBiquadFilter();
    const highFilter = audioContext.createBiquadFilter();
    
    // Configure filters
    lowFilter.type = 'lowshelf';
    lowFilter.frequency.value = 100;
    
    lowMidFilter.type = 'peaking';
    lowMidFilter.frequency.value = 500;
    lowMidFilter.Q.value = 1;
    
    highMidFilter.type = 'peaking';
    highMidFilter.frequency.value = 2000;
    highMidFilter.Q.value = 1;
    
    highFilter.type = 'highshelf';
    highFilter.frequency.value = 8000;
    
    // Connect filters in series
    input.connect(lowFilter);
    lowFilter.connect(lowMidFilter);
    lowMidFilter.connect(highMidFilter);
    highMidFilter.connect(highFilter);
    highFilter.connect(output);
    
    return {
      input,
      output,
      parameters: {
        lowGain: lowFilter.gain,
        lowMidGain: lowMidFilter.gain,
        highMidGain: highMidFilter.gain,
        highGain: highFilter.gain,
        lowFreq: lowFilter.frequency,
        lowMidFreq: lowMidFilter.frequency,
        highMidFreq: highMidFilter.frequency,
        highFreq: highFilter.frequency
      },
      type: 'eq4',
      bypass: false,
      dispose: () => {
        lowFilter.disconnect();
        lowMidFilter.disconnect();
        highMidFilter.disconnect();
        highFilter.disconnect();
        input.disconnect();
        output.disconnect();
      }
    };
  }

  // Compressor implementation
  function createCompressor(audioContext) {
    const input = audioContext.createGain();
    const output = audioContext.createGain();
    const compressor = audioContext.createDynamicsCompressor();
    const makeupGain = audioContext.createGain();
    const dryGain = audioContext.createGain();
    const wetGain = audioContext.createGain();
    
    // Create wet/dry signal paths for mix control
    input.connect(dryGain);
    input.connect(compressor);
    compressor.connect(makeupGain);
    makeupGain.connect(wetGain);
    
    dryGain.connect(output);
    wetGain.connect(output);
    
    // Default settings for professional sound
    compressor.threshold.value = -18;
    compressor.ratio.value = 4;
    compressor.attack.value = 0.01; // 10ms
    compressor.release.value = 0.1; // 100ms
    compressor.knee.value = 2;
    makeupGain.gain.value = 1;
    wetGain.gain.value = 1;
    dryGain.gain.value = 0;
    
    return {
      input,
      output,
      parameters: {
        threshold: compressor.threshold,
        ratio: compressor.ratio,
        attack: compressor.attack,
        release: compressor.release,
        knee: compressor.knee,
        makeupGain: makeupGain.gain,
        mix: wetGain.gain
      },
      type: 'compressor',
      bypass: false,
      dispose: () => {
        compressor.disconnect();
        makeupGain.disconnect();
        dryGain.disconnect();
        wetGain.disconnect();
        input.disconnect();
        output.disconnect();
      }
    };
  }

  // Reverb implementation
  function createReverb(audioContext) {
    const input = audioContext.createGain();
    const output = audioContext.createGain();
    const convolver = audioContext.createConvolver();
    const predelay = audioContext.createDelay();
    const wetGain = audioContext.createGain();
    const dryGain = audioContext.createGain();
    const damping = audioContext.createBiquadFilter();
    const earlyReflections = audioContext.createGain();
    
    // Configure predelay and damping
    predelay.delayTime.value = 0.02; // 20ms predelay
    damping.type = 'lowpass';
    damping.frequency.value = 8000;
    damping.Q.value = 1;
    
    // Create more sophisticated impulse response
    const sampleRate = audioContext.sampleRate;
    const length = sampleRate * 2; // 2 second reverb
    const impulse = audioContext.createBuffer(2, length, sampleRate);
    
    for (let channel = 0; channel < 2; channel++) {
      const channelData = impulse.getChannelData(channel);
      
      // Create room-like impulse response with early reflections
      for (let i = 0; i < length; i++) {
        const n = i / length;
        
        // Early reflections (first 100ms)
        let sample = 0;
        if (i < sampleRate * 0.1) {
          sample = (Math.random() * 2 - 1) * 0.5 * Math.pow(1 - n * 10, 2);
        }
        
        // Late reverb tail with exponential decay
        sample += (Math.random() * 2 - 1) * Math.pow(1 - n, 1.5) * 0.3;
        
        // Add some filtered noise for texture
        if (Math.random() < 0.1) {
          sample *= 2;
        }
        
        channelData[i] = sample;
      }
    }
    
    convolver.buffer = impulse;
    
    // Connect signal chain: input -> predelay -> convolver -> damping -> wet
    input.connect(dryGain);
    input.connect(earlyReflections);
    input.connect(predelay);
    predelay.connect(convolver);
    convolver.connect(damping);
    damping.connect(wetGain);
    
    earlyReflections.connect(output);
    dryGain.connect(output);
    wetGain.connect(output);
    
    // Default settings
    wetGain.gain.value = 0.3;
    dryGain.gain.value = 0.7;
    earlyReflections.gain.value = 0.3;
    
    return {
      input,
      output,
      parameters: {
        roomSize: { value: 0.5 },
        decay: { value: 2 },
        damping: damping.frequency,
        earlyReflections: earlyReflections.gain,
        wetLevel: wetGain.gain,
        dryLevel: dryGain.gain,
        predelay: predelay.delayTime
      },
      type: 'reverb',
      bypass: false,
      dispose: () => {
        convolver.disconnect();
        predelay.disconnect();
        damping.disconnect();
        earlyReflections.disconnect();
        wetGain.disconnect();
        dryGain.disconnect();
        input.disconnect();
        output.disconnect();
      }
    };
  }

  // Saturator implementation
  function createSaturator(audioContext) {
    const input = audioContext.createGain();
    const output = audioContext.createGain();
    const waveShaper = audioContext.createWaveShaper();
    const gain = audioContext.createGain();
    
    // Create wave shaping curve
    const curve = new Float32Array(2048);
    for (let i = 0; i < curve.length; i++) {
      const x = i / (curve.length / 2);
      curve[i] = (Math.sin(Math.PI * x) * 0.5 + 0.5) * 2;
    }
    
    waveShaper.curve = curve;
    
    // Connect signal paths
    input.connect(waveShaper);
    waveShaper.connect(gain);
    gain.connect(output);
    
    // Default settings
    gain.gain.value = 1;
    
    return {
      input,
      output,
      parameters: {
        drive: gain.gain,
        warmth: 0, // Placeholder for warmth parameter
        mix: 100,
        outputGain: 0
      },
      type: 'saturator',
      bypass: false,
      dispose: () => {
        waveShaper.disconnect();
        gain.disconnect();
        input.disconnect();
        output.disconnect();
      }
    };
  }

  // Delay implementation
  function createDelay(audioContext) {
    const input = audioContext.createGain();
    const output = audioContext.createGain();
    const delay = audioContext.createDelay();
    const feedback = audioContext.createGain();
    const wetGain = audioContext.createGain();
    const dryGain = audioContext.createGain();
    
    // Connect signal paths
    input.connect(dryGain);
    input.connect(delay);
    delay.connect(feedback);
    feedback.connect(delay);
    delay.connect(wetGain);
    
    dryGain.connect(output);
    wetGain.connect(output);
    
    // Default settings
    delay.delayTime.value = 0.25; // 250ms delay
    feedback.gain.value = 0.3;
    wetGain.gain.value = 0.25;
    dryGain.gain.value = 0.75;
    
    return {
      input,
      output,
      parameters: {
        delayTime: delay.delayTime,
        feedback: feedback.gain,
        wetLevel: wetGain.gain,
        stereoWidth: 50, // Placeholder for stereoWidth parameter
        highCut: 8000, // Placeholder for highCut parameter
        sync: 0
      },
      type: 'delay',
      bypass: false,
      dispose: () => {
        delay.disconnect();
        feedback.disconnect();
        wetGain.disconnect();
        dryGain.disconnect();
        input.disconnect();
        output.disconnect();
      }
    };
  }

  // Add effect to track
  async function addEffectToTrack(trackId, effectType, effectId = null) {
    try {
      let effect;
      
      // Check if it's a built-in effect
      if (builtInEffects.value.has(effectType)) {
        const audioContext = getAudioContext();
        effect = createBuiltInEffect(effectType, audioContext);
        effect.info = builtInEffects.value.get(effectType);
      } 
      // Check if it's a WAM plugin from registry
      else if (wamPluginRegistry.value.has(effectType)) {
        try {
          const { instance } = await loadWAMPluginFromRegistry(effectType);
          effect = createWAMEffectWrapper(instance);
        } catch (error) {
          console.error(`Failed to load WAM plugin ${effectType}:`, error);
          throw new Error(`WAM plugin loading failed: ${error.message}`);
        }
      }
      // Check if it's already loaded WAM
      else if (loadedPlugins.value.has(effectType)) {
        const instance = loadedPlugins.value.get(effectType);
        effect = createWAMEffectWrapper(instance);
      }
      else {
        throw new Error(`Unknown effect type: ${effectType}`);
      }
      
      effect.id = effectId || `effect-${Date.now()}`;
      effect.trackId = trackId;
      
      // Add to track effects
      if (!trackEffects.value.has(trackId)) {
        trackEffects.value.set(trackId, []);
      }
      trackEffects.value.get(trackId).push(effect);
      
      console.log(`✅ Added ${effectType} to track ${trackId}`);
      return effect;
      
    } catch (error) {
      console.error(`Failed to add effect ${effectType} to track:`, error);
      throw error;
    }
  }

  // Create wrapper for WAM plugin to match built-in effect interface
  function createWAMEffectWrapper(wamInstance) {
    return {
      input: wamInstance.audioNode,
      output: wamInstance.audioNode,
      parameters: wamInstance.getParameterInfo ? 
        Object.fromEntries(
          wamInstance.getParameterInfo().map(param => [
            param.id, 
            { value: param.defaultValue, ...param }
          ])
        ) : {},
      type: 'wam',
      bypass: false,
      wamInstance,
      dispose: () => {
        if (wamInstance.destroy) wamInstance.destroy();
        if (wamInstance.audioNode && wamInstance.audioNode.disconnect) {
          wamInstance.audioNode.disconnect();
        }
      }
    };
  }

  // Remove effect from track
  function removeEffectFromTrack(trackId, effectId) {
    const effects = trackEffects.value.get(trackId);
    if (!effects) return false;
    
    const effectIndex = effects.findIndex(e => e.id === effectId);
    if (effectIndex === -1) return false;
    
    const effect = effects[effectIndex];
    effect.dispose();
    effects.splice(effectIndex, 1);
    
    console.log(`🗑️ Removed effect ${effectId} from track ${trackId}`);
    return true;
  }

  // Get track effects chain
  function getTrackEffects(trackId) {
    return trackEffects.value.get(trackId) || [];
  }

  // Clear all effects from track
  function clearTrackEffects(trackId) {
    const effects = trackEffects.value.get(trackId);
    if (effects) {
      effects.forEach(effect => effect.dispose());
      trackEffects.value.delete(trackId);
    }
  }

  // Update effect parameter
  function updateEffectParameter(trackId, effectId, paramName, value) {
    const effects = getTrackEffects(trackId);
    const effect = effects.find(e => e.id === effectId);
    
    if (effect && effect.parameters[paramName]) {
      if (typeof effect.parameters[paramName].value !== 'undefined') {
        effect.parameters[paramName].value = value;
      } else {
        effect.parameters[paramName] = value;
      }
      console.log(`🎛️ Updated ${paramName} = ${value} on ${effect.type}`);
    }
  }

  // Get all available effects (built-in + WAM registry + loaded WAMs)
  const availableEffects = computed(() => {
    const effects = new Map(builtInEffects.value);
    
    // Add WAM plugins from registry (not yet loaded)
    wamPluginRegistry.value.forEach((pluginInfo, pluginKey) => {
      if (pluginInfo.type === 'effect' && !loadedPlugins.value.has(pluginKey)) {
        effects.set(pluginKey, {
          id: pluginKey,
          name: pluginInfo.name,
          type: 'wam-registry',
          vendor: pluginInfo.vendor,
          description: pluginInfo.description,
          isWAM: true,
          needsLoading: true
        });
      }
    });
    
    // Add loaded WAM plugins
    loadedPlugins.value.forEach((plugin, id) => {
      effects.set(id, {
        id,
        name: plugin.descriptor.name,
        type: 'wam-loaded',
        vendor: plugin.descriptor.vendor,
        version: plugin.descriptor.version,
        description: plugin.descriptor.description,
        isWAM: true,
        needsLoading: false
      });
    });
    
    return effects;
  });

  return {
    // State
    availablePlugins,
    loadedPlugins,
    trackEffects,
    masterEffects,
    builtInEffects,
    isLoading,
    loadingStatus,
    
    // Computed
    availableEffects,
    
    // Actions
    loadWAMPlugin,
    loadWAMPluginFromRegistry,
    createBuiltInEffect,
    createWAMEffectWrapper,
    addEffectToTrack,
    removeEffectFromTrack,
    getTrackEffects,
    clearTrackEffects,
    updateEffectParameter,
    getAudioContext
  };
}); 