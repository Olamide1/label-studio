<template>
  <div class="bg-gray-800 border-l border-gray-700">
    <!-- Header -->
    <div class="p-4 border-b border-gray-700">
      <h3 class="text-lg font-semibold text-white mb-2">Effects</h3>
      <div class="text-sm text-gray-400">
        {{ selectedTrack ? `Track: ${selectedTrack.name}` : 'No track selected' }}
      </div>
    </div>

    <!-- Effects List -->
    <div class="flex-1 overflow-y-auto">
      <div v-if="selectedTrack" class="p-4 space-y-4">
        <!-- Add Effect Section -->
        <div class="bg-gray-700 rounded-lg p-3">
          <h4 class="text-sm font-medium text-white mb-3">Add Effect</h4>
          
          <!-- Built-in Effects -->
          <div class="mb-4">
            <h5 class="text-xs font-medium text-gray-400 mb-2">Built-in Effects</h5>
            <div class="grid grid-cols-1 gap-2">
              <button
                v-for="[effectId, effectInfo] in builtInEffects"
                :key="effectId"
                @click="addEffect(effectId)"
                :disabled="loadingEffect === effectId"
                class="px-3 py-2 text-white text-sm rounded transition-colors flex items-center justify-between"
                :class="loadingEffect === effectId 
                  ? 'bg-gray-600 cursor-not-allowed' 
                  : 'bg-purple-600 hover:bg-purple-700'"
              >
                <span>{{ effectInfo.name }}</span>
                <div class="flex items-center space-x-1">
                  <span v-if="loadingEffect === effectId" class="text-xs">Loading...</span>
                  <span v-else class="text-xs opacity-75 capitalize">{{ effectInfo.type }}</span>
                </div>
              </button>
            </div>
          </div>

          <!-- WAM Effects -->
          <div v-if="wamEffects.length > 0">
            <h5 class="text-xs font-medium text-gray-400 mb-2">WAM Plugins</h5>
            <div class="grid grid-cols-1 gap-2">
              <button
                v-for="[effectId, effectInfo] in wamEffects"
                :key="effectId"
                @click="addEffect(effectId)"
                :disabled="loadingEffect === effectId"
                class="px-3 py-2 text-white text-sm rounded transition-colors flex items-center justify-between"
                :class="loadingEffect === effectId 
                  ? 'bg-gray-600 cursor-not-allowed' 
                  : 'bg-blue-600 hover:bg-blue-700'"
              >
                <span>{{ effectInfo.name }}</span>
                <div class="flex items-center space-x-1">
                  <span v-if="loadingEffect === effectId" class="text-xs">Loading...</span>
                  <span v-else class="text-xs opacity-75">WAM</span>
                  <span v-if="effectInfo.needsLoading" class="text-xs bg-orange-500 px-1 rounded">Load</span>
                </div>
              </button>
            </div>
          </div>
        </div>

        <!-- Current Effects -->
        <div v-if="trackEffects.length > 0" class="space-y-3">
          <h4 class="text-sm font-medium text-white">Current Effects</h4>
          
          <div 
            v-for="(effect, index) in trackEffects" 
            :key="effect.id"
            class="bg-gray-700 rounded-lg p-3 border border-gray-600"
          >
            <!-- Effect Header -->
            <div class="flex items-center justify-between mb-3">
              <div class="flex items-center space-x-2">
                <div class="w-3 h-3 bg-purple-500 rounded-full"></div>
                <span class="text-white font-medium">{{ effect.info?.name || effect.type }}</span>
                <span class="text-xs text-gray-400">#{{ index + 1 }}</span>
              </div>
              <div class="flex items-center space-x-2">
                <button
                  @click="toggleBypass(effect.id)"
                  class="px-2 py-1 text-xs rounded transition-colors"
                  :class="effect.bypass ? 'bg-red-600 text-white' : 'bg-gray-600 text-gray-300 hover:bg-gray-500'"
                >
                  {{ effect.bypass ? 'BYPASSED' : 'ACTIVE' }}
                </button>
                <button
                  @click="removeEffect(effect.id)"
                  class="p-1 text-gray-400 hover:text-red-400 transition-colors"
                >
                  <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M6 2l2-2h4l2 2h4v2H2V2h4zM3 6v12a2 2 0 002 2h10a2 2 0 002-2V6H3z"/>
                  </svg>
                </button>
              </div>
            </div>

            <!-- Effect Presets -->
            <div v-if="getPresetsForEffect(effect.type).size > 0" class="mb-3">
              <h5 class="text-xs font-medium text-gray-400 mb-2">Presets</h5>
              <div class="grid grid-cols-2 gap-1">
                <button
                  v-for="[presetKey, preset] in getPresetsForEffect(effect.type)"
                  :key="presetKey"
                  @click="applyPresetToEffect(effect, presetKey)"
                  class="px-2 py-1 bg-gray-600 hover:bg-purple-600 text-white text-xs rounded transition-colors"
                  :title="preset.description"
                >
                  {{ preset.name }}
                </button>
              </div>
            </div>

            <!-- Effect Parameters -->
            <div v-if="effect.info?.parameters" class="space-y-3">
              <div
                v-for="[paramName, paramInfo] in Object.entries(effect.info.parameters)"
                :key="paramName"
                class="flex items-center justify-between"
              >
                <label class="text-sm text-gray-300 w-20">{{ paramName }}</label>
                <div class="flex-1 mx-3">
                  <input
                    type="range"
                    :min="paramInfo.min"
                    :max="paramInfo.max"
                    :step="getParameterStep(paramInfo)"
                    :value="getParameterValue(effect, paramName)"
                    @input="updateParameter(effect.id, paramName, $event.target.value)"
                    class="w-full"
                  >
                </div>
                <div class="text-xs text-gray-400 w-16 text-right">
                  {{ formatParameterValue(getParameterValue(effect, paramName), paramInfo) }}
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Empty State -->
        <div v-else class="text-center py-8 text-gray-400">
          <svg class="w-12 h-12 mx-auto mb-3 opacity-50" fill="currentColor" viewBox="0 0 20 20">
            <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3z"/>
          </svg>
          <p class="text-sm">No effects added</p>
          <p class="text-xs opacity-75">Add effects from above to process audio</p>
        </div>
      </div>

      <!-- No Track Selected -->
      <div v-else class="p-8 text-center text-gray-400">
        <svg class="w-16 h-16 mx-auto mb-4 opacity-30" fill="currentColor" viewBox="0 0 20 20">
          <path d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3"/>
        </svg>
        <p class="text-lg">Select a track</p>
        <p class="text-sm opacity-75">Choose a track to manage its effects</p>
      </div>
    </div>
  </div>
</template>

<script>
import { computed, ref } from 'vue'
import { useProjectStore } from '../stores/project'
import { usePluginsStore } from '../stores/plugins'
import { useAudioStore } from '../stores/audio'
import { usePresetsStore } from '../stores/presets'

export default {
  name: 'EffectsPanel',
  setup() {
    const projectStore = useProjectStore()
    const pluginsStore = usePluginsStore()
    const audioStore = useAudioStore()
    const presetsStore = usePresetsStore()
    
    const loadingEffect = ref(null)

    const selectedTrack = computed(() => {
      if (!projectStore.selectedTrackId) return null
      return projectStore.tracks.find(t => t.id === projectStore.selectedTrackId)
    })

    const availableEffects = computed(() => pluginsStore.availableEffects)

    const trackEffects = computed(() => {
      if (!projectStore.selectedTrackId) return []
      return pluginsStore.getTrackEffects(projectStore.selectedTrackId)
    })

    const builtInEffects = computed(() => {
      const effects = new Map()
      availableEffects.value.forEach((effectInfo, effectId) => {
        if (!effectInfo.isWAM) {
          effects.set(effectId, effectInfo)
        }
      })
      return effects
    })

    const wamEffects = computed(() => {
      const effects = []
      availableEffects.value.forEach((effectInfo, effectId) => {
        if (effectInfo.isWAM) {
          effects.push([effectId, effectInfo])
        }
      })
      return effects
    })

    async function addEffect(effectType) {
      if (!projectStore.selectedTrackId) return
      
      try {
        loadingEffect.value = effectType
        const effect = await pluginsStore.addEffectToTrack(projectStore.selectedTrackId, effectType)
        if (effect) {
          // Add to audio chain
          audioStore.addEffectToTrack(projectStore.selectedTrackId, effect)
          
          // Update project store
          const track = projectStore.tracks.find(t => t.id === projectStore.selectedTrackId)
          if (track) {
            const effects = [...(track.effects || []), {
              id: effect.id,
              type: effectType,
              enabled: true,
              parameters: {}
            }]
            projectStore.updateTrack(projectStore.selectedTrackId, { effects })
          }
        }
      } catch (error) {
        console.error('Failed to add effect:', error)
        // Show user-friendly error
        alert(`Failed to load ${effectType} effect: ${error.message}`)
      } finally {
        loadingEffect.value = null
      }
    }

    function removeEffect(effectId) {
      if (!projectStore.selectedTrackId) return
      
      // Remove from plugins store
      pluginsStore.removeEffectFromTrack(projectStore.selectedTrackId, effectId)
      
      // Remove from audio chain
      audioStore.removeEffectFromTrack(projectStore.selectedTrackId, effectId)
      
      // Update project store
      const track = projectStore.tracks.find(t => t.id === projectStore.selectedTrackId)
      if (track && track.effects) {
        const effects = track.effects.filter(e => e.id !== effectId)
        projectStore.updateTrack(projectStore.selectedTrackId, { effects })
      }
    }

    function toggleBypass(effectId) {
      // Find effect and toggle bypass
      const effects = trackEffects.value
      const effect = effects.find(e => e.id === effectId)
      if (effect) {
        effect.bypass = !effect.bypass
        // TODO: Implement bypass in audio chain
        console.log(`${effect.bypass ? 'Bypassed' : 'Activated'} effect:`, effectId)
      }
    }

    function updateParameter(effectId, paramName, value) {
      pluginsStore.updateEffectParameter(projectStore.selectedTrackId, effectId, paramName, value)
    }

    function getParameterValue(effect, paramName) {
      const param = effect.parameters[paramName]
      if (!param) return 0
      
      if (typeof param.value !== 'undefined') {
        return param.value
      } else if (typeof param === 'object' && param.value !== undefined) {
        return param.value
      } else {
        return effect.info?.parameters[paramName]?.default || 0
      }
    }

    function getParameterStep(paramInfo) {
      const range = paramInfo.max - paramInfo.min
      if (range <= 1) return 0.01
      if (range <= 10) return 0.1
      if (range <= 100) return 1
      return 10
    }

    function formatParameterValue(value, paramInfo) {
      const formatted = typeof value === 'number' ? value.toFixed(2) : value
      return `${formatted}${paramInfo.unit || ''}`
    }

    function getPresetsForEffect(effectType) {
      return presetsStore.getPresetsForEffect(effectType)
    }

    function applyPresetToEffect(effect, presetKey) {
      if (!projectStore.selectedTrackId) return

      // Create update function for this specific effect
      const updateFunction = (paramName, value) => {
        updateParameter(effect.id, paramName, value)
      }

      // Apply the preset
      presetsStore.applyPreset(effect.type, presetKey, updateFunction)
    }

    return {
      selectedTrack,
      availableEffects,
      trackEffects,
      builtInEffects,
      wamEffects,
      loadingEffect,
      addEffect,
      removeEffect,
      toggleBypass,
      updateParameter,
      getParameterValue,
      getParameterStep,
      formatParameterValue,
      getPresetsForEffect,
      applyPresetToEffect
    }
  }
}
</script>

<style scoped>
/* Custom range slider styling */
input[type="range"] {
  -webkit-appearance: none;
  appearance: none;
  height: 4px;
  background: #374151;
  border-radius: 2px;
  outline: none;
}

input[type="range"]::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 16px;
  height: 16px;
  background: #8b5cf6;
  border-radius: 50%;
  cursor: pointer;
  transition: background 0.15s ease;
}

input[type="range"]::-webkit-slider-thumb:hover {
  background: #a78bfa;
}

input[type="range"]::-moz-range-thumb {
  width: 16px;
  height: 16px;
  background: #8b5cf6;
  border-radius: 50%;
  cursor: pointer;
  border: none;
  transition: background 0.15s ease;
}

input[type="range"]::-moz-range-thumb:hover {
  background: #a78bfa;
}
</style> 