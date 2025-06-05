<template>
  <div class="min-h-screen bg-gray-900 flex flex-col">
    <!-- Header with collaboration status -->
    <header class="bg-gray-800 border-b border-gray-700 px-6 py-3">
      <div class="flex items-center justify-between">
        <div class="flex items-center space-x-4">
          <router-link to="/" class="flex items-center space-x-2 text-white hover:text-purple-400 transition-colors">
            <div class="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
              <span class="text-white font-bold">♪</span>
            </div>
            <span class="font-semibold">CollabDAW</span>
          </router-link>
          
          <div class="text-white">
            <span class="text-lg font-medium">{{ projectStore.projectName }}</span>
          </div>
        </div>

        <div class="flex items-center space-x-6">
          <!-- Collaboration Status -->
          <div class="flex items-center space-x-2">
            <div class="flex items-center space-x-1">
              <div 
                class="w-3 h-3 rounded-full"
                :class="collaborationStore.isConnected ? 'bg-green-500' : 'bg-red-500'"
              ></div>
              <span class="text-sm text-gray-300">
                {{ collaborationStore.isConnected ? 'Connected' : 'Disconnected' }}
              </span>
            </div>
            
            <div class="text-sm text-gray-400">
              {{ collaborationStore.userCount }} users
            </div>
          </div>

          <!-- Audio Status -->
          <div class="flex items-center space-x-2">
            <div 
              class="w-3 h-3 rounded-full"
              :class="audioStore.isInitialized ? 'bg-green-500' : 'bg-yellow-500'"
            ></div>
            <span class="text-sm text-gray-300">
              {{ audioStore.audioContextState }}
            </span>
          </div>
        </div>
      </div>
    </header>

    <!-- Transport Bar -->
    <div class="bg-gray-800 border-b border-gray-700 px-6 py-4">
      <div class="flex items-center justify-between">
        <div class="flex items-center space-x-4">
          <!-- Transport Controls -->
          <div class="flex items-center space-x-2">
            <button 
              @click="initializeAndPlay"
              class="transport-button play"
              :disabled="audioStore.isPlaying"
            >
              <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path d="M8 5v10l8-5-8-5z"/>
              </svg>
            </button>
            
            <button 
              @click="audioStore.pause"
              class="transport-button pause"
              :disabled="!audioStore.isPlaying"
            >
              <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path d="M6 4h2v12H6V4zm6 0h2v12h-2V4z"/>
              </svg>
            </button>
            
            <button 
              @click="audioStore.stop"
              class="transport-button stop"
            >
              <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path d="M4 4h12v12H4V4z"/>
              </svg>
            </button>
          </div>

          <!-- BPM Control -->
          <div class="flex items-center space-x-2">
            <label class="text-sm text-gray-300">BPM:</label>
            <input 
              type="number" 
              v-model.number="bpmInput"
              @change="updateBPM"
              min="60" 
              max="200" 
              class="w-20 px-2 py-1 bg-gray-700 text-white rounded border border-gray-600 text-center"
            >
          </div>

          <!-- Position Display -->
          <div class="text-white font-mono text-lg">
            {{ audioStore.formattedPosition }}
          </div>
        </div>

        <div class="flex items-center space-x-4">
          <!-- Metronome -->
          <button 
            @click="audioStore.metronomeEnabled = !audioStore.metronomeEnabled"
            class="px-3 py-1 rounded text-sm transition-colors"
            :class="audioStore.metronomeEnabled ? 'bg-green-600 text-white' : 'bg-gray-600 text-gray-300 hover:bg-gray-500'"
          >
            Metronome
          </button>

          <!-- Master Volume -->
          <div class="flex items-center space-x-2">
            <span class="text-sm text-gray-300">Master</span>
            <input 
              type="range" 
              min="0" 
              max="1" 
              step="0.01" 
              value="0.7"
              class="w-20"
            >
          </div>
        </div>
      </div>
    </div>

    <!-- Main Content -->
    <div class="flex-1 flex">
      <!-- Track Panel -->
      <div class="w-80 bg-gray-800 border-r border-gray-700 flex flex-col">
        <div class="p-4 border-b border-gray-700">
          <div class="flex items-center justify-between mb-4">
            <h2 class="text-lg font-semibold text-white">Tracks</h2>
            <div class="flex space-x-2">
              <button 
                @click="addTrack('midi')"
                class="px-3 py-1 bg-purple-600 hover:bg-purple-700 text-white text-sm rounded transition-colors"
              >
                + MIDI
              </button>
              <button 
                @click="addTrack('drums')"
                class="px-3 py-1 bg-orange-600 hover:bg-orange-700 text-white text-sm rounded transition-colors"
              >
                + Drums
              </button>
            </div>
          </div>
        </div>

        <!-- Track List -->
        <div class="flex-1 overflow-y-auto">
          <div 
            v-for="track in projectStore.tracks" 
            :key="track.id"
            class="track-container p-4 m-2 bg-gray-700 hover:bg-gray-650 transition-colors"
            :class="{ 'ring-2 ring-purple-500': projectStore.selectedTrackId === track.id }"
            @click="projectStore.selectedTrackId = track.id"
          >
            <div class="flex items-center justify-between mb-3">
              <div class="flex items-center space-x-2">
                <div 
                  class="w-4 h-4 rounded-full"
                  :style="{ backgroundColor: track.color }"
                ></div>
                <input 
                  v-model="track.name"
                  @blur="updateTrack(track.id, { name: track.name })"
                  class="bg-transparent text-white font-medium focus:outline-none focus:ring-1 focus:ring-purple-500 rounded px-1"
                >
              </div>
              
              <button 
                @click.stop="removeTrack(track.id)"
                class="text-gray-400 hover:text-red-400 transition-colors"
              >
                <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M6 2l2-2h4l2 2h4v2H2V2h4zM3 6v12a2 2 0 002 2h10a2 2 0 002-2V6H3z"/>
                </svg>
              </button>
            </div>

            <div class="space-y-2">
              <!-- Volume -->
              <div class="flex items-center space-x-2">
                <span class="text-xs text-gray-300 w-12">Vol</span>
                <input 
                  type="range" 
                  min="0" 
                  max="1" 
                  step="0.01"
                  :value="track.volume"
                  @input="updateTrackVolume(track.id, $event.target.value)"
                  class="flex-1"
                >
                <span class="text-xs text-gray-300 w-8">{{ Math.round(track.volume * 100) }}</span>
              </div>

              <!-- Mute/Solo -->
              <div class="flex items-center space-x-2">
                <button 
                  @click="toggleMute(track.id)"
                  class="px-2 py-1 text-xs rounded transition-colors"
                  :class="track.muted ? 'bg-red-600 text-white' : 'bg-gray-600 text-gray-300 hover:bg-gray-500'"
                >
                  MUTE
                </button>
                <button 
                  @click="toggleSolo(track.id)"
                  class="px-2 py-1 text-xs rounded transition-colors"
                  :class="track.solo ? 'bg-yellow-600 text-white' : 'bg-gray-600 text-gray-300 hover:bg-gray-500'"
                >
                  SOLO
                </button>
                <button 
                  @click="testTrackSound(track.id)"
                  class="px-2 py-1 text-xs bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors"
                >
                  TEST
                </button>
              </div>
            </div>
          </div>

          <!-- Empty State -->
          <div v-if="projectStore.tracks.length === 0" class="p-8 text-center text-gray-400">
            <svg class="w-16 h-16 mx-auto mb-4 opacity-50" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3"/>
            </svg>
            <p class="text-lg mb-2">No tracks yet</p>
            <p class="text-sm">Add a MIDI or Drums track to get started</p>
          </div>
        </div>
      </div>

      <!-- Timeline Panel -->
      <div class="flex-1 bg-gray-900 flex flex-col">
        <div class="p-4 border-b border-gray-700">
          <div class="flex items-center justify-between">
            <h2 class="text-lg font-semibold text-white">Timeline</h2>
            <div class="flex items-center space-x-4">
              <div class="text-sm text-gray-400">
                Clips: {{ projectStore.clipCount }}
              </div>
            </div>
          </div>
        </div>

        <!-- Timeline Ruler -->
        <div class="bg-gray-800 border-b border-gray-700 p-2">
          <div class="flex items-center space-x-4 text-sm text-gray-300">
            <div class="w-4">1</div>
            <div class="w-4">2</div>
            <div class="w-4">3</div>
            <div class="w-4">4</div>
            <div class="w-4">5</div>
            <div class="w-4">6</div>
            <div class="w-4">7</div>
            <div class="w-4">8</div>
          </div>
        </div>

        <!-- Timeline Content -->
        <div class="flex-1 p-4">
          <div v-if="projectStore.tracks.length > 0" class="space-y-4">
            <div 
              v-for="track in projectStore.tracks" 
              :key="track.id"
              class="h-16 bg-gray-800 rounded-lg relative border border-gray-700"
            >
              <!-- Track clips would go here -->
              <div class="absolute inset-0 flex items-center px-4">
                <span class="text-sm text-gray-400">{{ track.name }}</span>
              </div>
            </div>
          </div>

          <div v-else class="flex-1 flex items-center justify-center text-gray-400">
            <div class="text-center">
              <svg class="w-24 h-24 mx-auto mb-4 opacity-30" fill="currentColor" viewBox="0 0 20 20">
                <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z"/>
              </svg>
              <p class="text-xl">Timeline is ready</p>
              <p class="text-sm opacity-75">Add tracks to start composing</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted, watch } from 'vue'
import { useProjectStore } from '../stores/project'
import { useCollaborationStore } from '../stores/collaboration'
import { useAudioStore } from '../stores/audio'

export default {
  name: 'Studio',
  setup() {
    const projectStore = useProjectStore()
    const collaborationStore = useCollaborationStore()
    const audioStore = useAudioStore()
    
    const bpmInput = ref(120)

    onMounted(async () => {
      // Initialize collaboration
      const doc = collaborationStore.initializeCollaboration()
      if (doc) {
        projectStore.initializeProject()
      }
    })

    async function initializeAndPlay() {
      if (!audioStore.isInitialized) {
        await audioStore.initializeAudio()
      }
      audioStore.play()
    }

    function updateBPM() {
      audioStore.setBPM(bpmInput.value)
      projectStore.setBPM(bpmInput.value)
    }

    function addTrack(type) {
      const track = projectStore.addTrack(type)
      if (audioStore.isInitialized) {
        audioStore.createTrack(track.id, type)
      }
    }

    function removeTrack(trackId) {
      projectStore.removeTrack(trackId)
      audioStore.removeTrack(trackId)
    }

    function updateTrack(trackId, updates) {
      projectStore.updateTrack(trackId, updates)
    }

    function updateTrackVolume(trackId, volume) {
      const vol = parseFloat(volume)
      projectStore.updateTrack(trackId, { volume: vol })
      audioStore.setTrackVolume(trackId, vol)
    }

    function toggleMute(trackId) {
      const track = projectStore.tracks.find(t => t.id === trackId)
      if (track) {
        const muted = !track.muted
        projectStore.updateTrack(trackId, { muted })
        audioStore.setTrackMute(trackId, muted)
      }
    }

    function toggleSolo(trackId) {
      const track = projectStore.tracks.find(t => t.id === trackId)
      if (track) {
        projectStore.updateTrack(trackId, { solo: !track.solo })
      }
    }

    function testTrackSound(trackId) {
      if (audioStore.isInitialized) {
        const notes = ['C4', 'D4', 'E4', 'F4', 'G4']
        const note = notes[Math.floor(Math.random() * notes.length)]
        audioStore.playNote(trackId, note)
      }
    }

    // Sync BPM from project store
    watch(() => projectStore.bpm, (newBpm) => {
      bpmInput.value = newBpm
    }, { immediate: true })

    return {
      projectStore,
      collaborationStore,
      audioStore,
      bpmInput,
      initializeAndPlay,
      updateBPM,
      addTrack,
      removeTrack,
      updateTrack,
      updateTrackVolume,
      toggleMute,
      toggleSolo,
      testTrackSound
    }
  }
}
</script>

<style scoped>
.track-container {
  transition: all 0.2s ease;
}

.track-container:hover {
  transform: translateY(-1px);
}

/* Custom scrollbar */
::-webkit-scrollbar {
  width: 8px;
}

::-webkit-scrollbar-track {
  background: #374151;
}

::-webkit-scrollbar-thumb {
  background: #6b7280;
  border-radius: 4px;
}

::-webkit-scrollbar-thumb:hover {
  background: #9ca3af;
}
</style> 