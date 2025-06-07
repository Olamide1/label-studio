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
    ['eq3', {
      id: 'eq3',
      name: '3-Band EQ',
      type: 'equalizer',
      vendor: 'CollabDAW',
      version: '1.0.0',
      description: 'Simple 3-band equalizer',
      parameters: {
        lowGain: { min: -12, max: 12, default: 0, unit: 'dB' },
        midGain: { min: -12, max: 12, default: 0, unit: 'dB' },
        highGain: { min: -12, max: 12, default: 0, unit: 'dB' },
        lowFreq: { min: 20, max: 500, default: 200, unit: 'Hz' },
        highFreq: { min: 1000, max: 20000, default: 4000, unit: 'Hz' }
      }
    }],
    ['compressor', {
      id: 'compressor',
      name: 'Compressor',
      type: 'dynamics',
      vendor: 'CollabDAW',
      version: '1.0.0',
      description: 'Dynamic range compressor',
      parameters: {
        threshold: { min: -60, max: 0, default: -24, unit: 'dB' },
        ratio: { min: 1, max: 20, default: 4, unit: ':1' },
        attack: { min: 0, max: 1, default: 0.003, unit: 's' },
        release: { min: 0, max: 1, default: 0.1, unit: 's' },
        knee: { min: 0, max: 40, default: 30, unit: 'dB' }
      }
    }],
    ['reverb', {
      id: 'reverb',
      name: 'Reverb',
      type: 'spatial',
      vendor: 'CollabDAW',
      version: '1.0.0',
      description: 'Algorithmic reverb',
      parameters: {
        roomSize: { min: 0, max: 1, default: 0.5, unit: '' },
        decay: { min: 0, max: 10, default: 2, unit: 's' },
        wetLevel: { min: 0, max: 1, default: 0.3, unit: '' },
        dryLevel: { min: 0, max: 1, default: 0.7, unit: '' }
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
      case 'eq3':
        return createEQ3(audioContext);
      case 'compressor':
        return createCompressor(audioContext);
      case 'reverb':
        return createReverb(audioContext);
      default:
        throw new Error(`Effect not implemented: ${effectType}`);
    }
  }

  // 3-Band EQ implementation
  function createEQ3(audioContext) {
    const input = audioContext.createGain();
    const output = audioContext.createGain();
    
    const lowFilter = audioContext.createBiquadFilter();
    const midFilter = audioContext.createBiquadFilter();
    const highFilter = audioContext.createBiquadFilter();
    
    // Configure filters
    lowFilter.type = 'lowshelf';
    lowFilter.frequency.value = 200;
    
    midFilter.type = 'peaking';
    midFilter.frequency.value = 1000;
    midFilter.Q.value = 1;
    
    highFilter.type = 'highshelf';
    highFilter.frequency.value = 4000;
    
    // Connect filters in series
    input.connect(lowFilter);
    lowFilter.connect(midFilter);
    midFilter.connect(highFilter);
    highFilter.connect(output);
    
    return {
      input,
      output,
      parameters: {
        lowGain: lowFilter.gain,
        midGain: midFilter.gain,
        highGain: highFilter.gain,
        lowFreq: lowFilter.frequency,
        highFreq: highFilter.frequency
      },
      type: 'eq3',
      bypass: false,
      dispose: () => {
        lowFilter.disconnect();
        midFilter.disconnect();
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
    
    input.connect(compressor);
    compressor.connect(output);
    
    return {
      input,
      output,
      parameters: {
        threshold: compressor.threshold,
        ratio: compressor.ratio,
        attack: compressor.attack,
        release: compressor.release,
        knee: compressor.knee
      },
      type: 'compressor',
      bypass: false,
      dispose: () => {
        compressor.disconnect();
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
    const wetGain = audioContext.createGain();
    const dryGain = audioContext.createGain();
    
    // Create impulse response for reverb
    const sampleRate = audioContext.sampleRate;
    const length = sampleRate * 2; // 2 second reverb
    const impulse = audioContext.createBuffer(2, length, sampleRate);
    
    for (let channel = 0; channel < 2; channel++) {
      const channelData = impulse.getChannelData(channel);
      for (let i = 0; i < length; i++) {
        channelData[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, 2);
      }
    }
    
    convolver.buffer = impulse;
    
    // Connect wet/dry signal paths
    input.connect(dryGain);
    input.connect(convolver);
    convolver.connect(wetGain);
    
    dryGain.connect(output);
    wetGain.connect(output);
    
    // Default settings
    wetGain.gain.value = 0.3;
    dryGain.gain.value = 0.7;
    
    return {
      input,
      output,
      parameters: {
        wetLevel: wetGain.gain,
        dryLevel: dryGain.gain,
        roomSize: { value: 0.5 }, // Dummy parameter for UI
        decay: { value: 2 } // Dummy parameter for UI
      },
      type: 'reverb',
      bypass: false,
      dispose: () => {
        convolver.disconnect();
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