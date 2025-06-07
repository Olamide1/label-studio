import { defineStore } from 'pinia';
import { ref } from 'vue';

export const usePresetsStore = defineStore('presets', () => {
  // Effects presets organized by effect type
  const effectPresets = ref(new Map([
    ['eq4', new Map([
      ['flat', {
        name: 'Flat',
        description: 'No EQ applied - neutral sound',
        parameters: {
          lowGain: 0,
          lowMidGain: 0,
          highMidGain: 0,
          highGain: 0
        }
      }],
      ['vocals', {
        name: 'Vocal Presence',
        description: 'Enhance vocal clarity and presence',
        parameters: {
          lowGain: -2,
          lowMidGain: 1,
          highMidGain: 3,
          highGain: 2,
          lowMidFreq: 400,
          highMidFreq: 3000
        }
      }],
      ['drums', {
        name: 'Punchy Drums',
        description: 'Add punch and clarity to drums',
        parameters: {
          lowGain: 3,
          lowMidGain: -1,
          highMidGain: 2,
          highGain: 4,
          lowFreq: 80,
          highMidFreq: 5000
        }
      }],
      ['bass', {
        name: 'Deep Bass',
        description: 'Enhance low-end warmth and definition',
        parameters: {
          lowGain: 4,
          lowMidGain: 2,
          highMidGain: -1,
          highGain: 0,
          lowFreq: 60,
          lowMidFreq: 200
        }
      }],
      ['bright', {
        name: 'Bright & Airy',
        description: 'Add sparkle and air to sounds',
        parameters: {
          lowGain: 0,
          lowMidGain: -1,
          highMidGain: 2,
          highGain: 5,
          highMidFreq: 4000,
          highFreq: 10000
        }
      }]
    ])],
    
    ['compressor', new Map([
      ['gentle', {
        name: 'Gentle Compression',
        description: 'Subtle dynamic control for natural sound',
        parameters: {
          threshold: -12,
          ratio: 2,
          attack: 30,
          release: 200,
          knee: 5,
          makeupGain: 2,
          mix: 100
        }
      }],
      ['vocal', {
        name: 'Vocal Compressor',
        description: 'Smooth vocal dynamics and presence',
        parameters: {
          threshold: -18,
          ratio: 3,
          attack: 10,
          release: 100,
          knee: 3,
          makeupGain: 4,
          mix: 100
        }
      }],
      ['drums', {
        name: 'Drum Punch',
        description: 'Add punch and sustain to drums',
        parameters: {
          threshold: -15,
          ratio: 6,
          attack: 1,
          release: 50,
          knee: 1,
          makeupGain: 5,
          mix: 100
        }
      }],
      ['squash', {
        name: 'Heavy Squash',
        description: 'Aggressive compression for effect',
        parameters: {
          threshold: -24,
          ratio: 10,
          attack: 5,
          release: 30,
          knee: 0,
          makeupGain: 8,
          mix: 80
        }
      }],
      ['parallel', {
        name: 'Parallel Compression',
        description: 'Blend compressed and dry signal',
        parameters: {
          threshold: -20,
          ratio: 8,
          attack: 3,
          release: 80,
          knee: 2,
          makeupGain: 6,
          mix: 50
        }
      }]
    ])],
    
    ['reverb', new Map([
      ['room', {
        name: 'Small Room',
        description: 'Intimate room ambience',
        parameters: {
          roomSize: 0.3,
          decay: 1.2,
          damping: 6000,
          earlyReflections: 0.4,
          wetLevel: 0.2,
          dryLevel: 0.8,
          predelay: 10
        }
      }],
      ['hall', {
        name: 'Concert Hall',
        description: 'Large hall reverb for orchestral sound',
        parameters: {
          roomSize: 0.8,
          decay: 4.0,
          damping: 4000,
          earlyReflections: 0.3,
          wetLevel: 0.4,
          dryLevel: 0.6,
          predelay: 30
        }
      }],
      ['plate', {
        name: 'Vintage Plate',
        description: 'Classic plate reverb sound',
        parameters: {
          roomSize: 0.6,
          decay: 2.5,
          damping: 8000,
          earlyReflections: 0.2,
          wetLevel: 0.3,
          dryLevel: 0.7,
          predelay: 15
        }
      }],
      ['vocal', {
        name: 'Vocal Reverb',
        description: 'Perfect for vocal tracks',
        parameters: {
          roomSize: 0.4,
          decay: 1.8,
          damping: 7000,
          earlyReflections: 0.3,
          wetLevel: 0.25,
          dryLevel: 0.75,
          predelay: 25
        }
      }]
    ])],
    
    ['delay', new Map([
      ['slap', {
        name: 'Slap Delay',
        description: 'Short delay for vocal slap effect',
        parameters: {
          delayTime: 120,
          feedback: 15,
          wetLevel: 20,
          stereoWidth: 0,
          highCut: 8000
        }
      }],
      ['eighth', {
        name: 'Eighth Note',
        description: 'Rhythmic eighth note delay',
        parameters: {
          delayTime: 250,
          feedback: 35,
          wetLevel: 30,
          stereoWidth: 60,
          highCut: 6000
        }
      }],
      ['ambient', {
        name: 'Ambient Space',
        description: 'Long delay for atmospheric effects',
        parameters: {
          delayTime: 500,
          feedback: 50,
          wetLevel: 40,
          stereoWidth: 80,
          highCut: 4000
        }
      }],
      ['ping-pong', {
        name: 'Ping Pong',
        description: 'Stereo ping pong delay',
        parameters: {
          delayTime: 200,
          feedback: 40,
          wetLevel: 35,
          stereoWidth: 100,
          highCut: 7000
        }
      }]
    ])],
    
    ['saturator', new Map([
      ['subtle', {
        name: 'Subtle Warmth',
        description: 'Gentle harmonic saturation',
        parameters: {
          drive: 15,
          warmth: 30,
          mix: 40,
          outputGain: 0
        }
      }],
      ['tape', {
        name: 'Tape Saturation',
        description: 'Vintage tape machine warmth',
        parameters: {
          drive: 25,
          warmth: 60,
          mix: 60,
          outputGain: -1
        }
      }],
      ['drive', {
        name: 'Tube Drive',
        description: 'Tube amplifier saturation',
        parameters: {
          drive: 40,
          warmth: 70,
          mix: 75,
          outputGain: -2
        }
      }],
      ['heavy', {
        name: 'Heavy Saturation',
        description: 'Aggressive harmonic distortion',
        parameters: {
          drive: 70,
          warmth: 80,
          mix: 90,
          outputGain: -4
        }
      }]
    ])]
  ]));

  // Get presets for a specific effect type
  function getPresetsForEffect(effectType) {
    return effectPresets.value.get(effectType) || new Map();
  }

  // Apply preset to effect
  function applyPreset(effectType, presetName, updateParameterFunction) {
    const effectPresetMap = effectPresets.value.get(effectType);
    if (!effectPresetMap) return false;

    const preset = effectPresetMap.get(presetName);
    if (!preset) return false;

    // Apply each parameter from the preset
    Object.entries(preset.parameters).forEach(([paramName, value]) => {
      updateParameterFunction(paramName, value);
    });

    console.log(`✅ Applied ${presetName} preset to ${effectType}`);
    return true;
  }

  // Get all effect types that have presets
  function getEffectTypesWithPresets() {
    return Array.from(effectPresets.value.keys());
  }

  // Get preset info
  function getPresetInfo(effectType, presetName) {
    const effectPresetMap = effectPresets.value.get(effectType);
    if (!effectPresetMap) return null;
    return effectPresetMap.get(presetName);
  }

  return {
    effectPresets,
    getPresetsForEffect,
    applyPreset,
    getEffectTypesWithPresets,
    getPresetInfo
  };
}); 