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
        <!-- Timeline Header -->
        <div class="p-4 border-b border-gray-700 flex-shrink-0">
          <div class="flex items-center justify-between">
            <h2 class="text-lg font-semibold text-white">Timeline</h2>
            <div class="flex items-center space-x-4">
              <div class="text-sm text-gray-400">
                Clips: {{ projectStore.clipCount }}
              </div>
              <div class="flex items-center space-x-2">
                <button 
                  @click="zoomOut"
                  class="px-2 py-1 bg-gray-700 hover:bg-gray-600 text-white text-xs rounded transition-colors"
                >
                  -
                </button>
                <span class="text-xs text-gray-400">{{ Math.round(timelineScale) }}px/beat</span>
                <button 
                  @click="zoomIn"
                  class="px-2 py-1 bg-gray-700 hover:bg-gray-600 text-white text-xs rounded transition-colors"
                >
                  +
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Timeline Container with Horizontal Scroll -->
        <div class="flex-1 flex flex-col overflow-hidden">
          <!-- Timeline Ruler -->
          <div class="bg-gray-800 border-b border-gray-700 flex-shrink-0 relative">
            <div class="flex">
              <!-- Fixed track name area -->
              <div class="w-40 flex-shrink-0 bg-gray-800 border-r border-gray-700 p-2 flex items-center">
                <span class="text-xs text-gray-400 font-medium">Tracks</span>
              </div>
              
              <!-- Scrollable ruler area -->
              <div class="flex-1 overflow-x-auto timeline-scroll">
                <div class="flex items-center text-sm text-gray-300 p-2" :style="{ minWidth: `${32 * timelineScale}px` }">
                  <!-- Beat markers -->
                  <div 
                    v-for="beat in 64" 
                    :key="beat"
                    class="relative flex items-center justify-center text-xs flex-shrink-0"
                    :style="{ width: `${timelineScale}px` }"
                  >
                    <div class="absolute left-0 top-0 w-px h-4 bg-gray-600"></div>
                    <span v-if="beat % 4 === 1" class="font-medium">{{ Math.ceil(beat / 4) }}</span>
                    <span v-else-if="beat % 4 === 0" class="text-gray-500">{{ beat % 4 || 4 }}</span>
                    <span v-else class="text-gray-500">{{ beat % 4 }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Timeline Content -->
          <div class="flex-1 flex overflow-hidden">
            <!-- Fixed track names -->
            <div class="w-40 flex-shrink-0 bg-gray-900 border-r border-gray-700 overflow-y-auto">
              <div v-if="projectStore.tracks.length > 0" class="p-2 space-y-4">
                <div 
                  v-for="track in projectStore.tracks" 
                  :key="track.id"
                  class="h-16 bg-gray-800 rounded-lg border border-gray-700 flex items-center px-3 transition-colors"
                  :class="{ 'ring-2 ring-purple-500': projectStore.selectedTrackId === track.id }"
                  @click="projectStore.selectedTrackId = track.id"
                >
                  <div class="flex items-center space-x-2 w-full">
                    <div 
                      class="w-3 h-3 rounded-full flex-shrink-0"
                      :style="{ backgroundColor: track.color }"
                    ></div>
                    <span class="text-sm text-white font-medium truncate">{{ track.name }}</span>
                  </div>
                </div>
              </div>
              <div v-else class="p-4 text-center text-gray-400">
                <p class="text-sm">No tracks</p>
              </div>
            </div>
            
            <!-- Scrollable timeline area -->
            <div class="flex-1 overflow-auto timeline-scroll">
              <div class="p-2" :style="{ minWidth: `${64 * timelineScale}px` }">
                <div v-if="projectStore.tracks.length > 0" class="space-y-4">
                  <div 
                    v-for="track in projectStore.tracks" 
                    :key="track.id"
                    class="h-16 bg-gray-800 rounded-lg relative border border-gray-700 cursor-pointer hover:bg-gray-750 transition-colors"
                    @click="createClipOnTimeline($event, track.id)"
                  >
              <!-- Track name label -->
              <div class="absolute left-2 top-2 z-10">
                <span class="text-xs text-gray-400 bg-gray-900 px-2 py-1 rounded">{{ track.name }}</span>
              </div>
              
              <!-- Track clips -->
              <div 
                v-for="clip in getTrackClips(track.id)" 
                :key="clip.id"
                class="timeline-clip absolute top-1 h-14 rounded border-2 cursor-move flex items-center justify-center text-xs font-medium text-white transition-all"
                :style="getClipStyle(clip)"
                :class="{ 
                  'selected': projectStore.selectedClipId === clip.id,
                  'ring-2 ring-purple-400': projectStore.selectedClipId === clip.id 
                }"
                @click.stop="selectClip(clip.id)"
                @mousedown="startDragging($event, clip.id)"
                @dblclick="editClip(clip.id)"
              >
                <div class="text-center">
                  <div class="font-semibold">{{ getClipDisplayName(clip) }}</div>
                  <div class="text-xs opacity-75">{{ clip.duration }}s</div>
                </div>
                
                <!-- Resize handles -->
                <div 
                  class="resize-handle absolute left-0 top-0 w-2 h-full cursor-w-resize bg-white bg-opacity-20 hover:bg-opacity-40 transition-all"
                  @mousedown.stop="startResizing($event, clip.id, 'left')"
                ></div>
                <div 
                  class="resize-handle absolute right-0 top-0 w-2 h-full cursor-e-resize bg-white bg-opacity-20 hover:bg-opacity-40 transition-all"
                  @mousedown.stop="startResizing($event, clip.id, 'right')"
                ></div>
              </div>
            </div>
          </div>
          
          <div v-else class="flex-1 flex items-center justify-center text-gray-400 h-64">
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
    
    // Timeline interaction state
    const isDragging = ref(false)
    const isResizing = ref(false)
    const dragState = ref({
      clipId: null,
      startX: 0,
      startTime: 0,
      resizeDirection: null
    })
    const timelineScale = ref(50) // pixels per beat

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

    // Timeline zoom functions
    function zoomIn() {
      timelineScale.value = Math.min(timelineScale.value * 1.5, 200)
    }

    function zoomOut() {
      timelineScale.value = Math.max(timelineScale.value / 1.5, 20)
    }

    // Timeline clip functions
    function createClipOnTimeline(event, trackId) {
      const rect = event.currentTarget.getBoundingClientRect()
      const clickX = event.clientX - rect.left
      const timePosition = Math.max(0, (clickX - 100) / timelineScale.value) // Account for track name area
      
      // Snap to quarter beats
      const snappedTime = Math.round(timePosition * 4) / 4
      
      const clip = projectStore.addClip(trackId, snappedTime, 4) // 4 beat default duration
      
      // Create audio track if not exists
      if (audioStore.isInitialized && !audioStore.instruments?.has(trackId)) {
        const track = projectStore.tracks.find(t => t.id === trackId)
        audioStore.createTrack(trackId, track?.type || 'midi')
      }
      
      // Select the new clip
      projectStore.selectedClipId = clip.id
    }

    function getClipStyle(clip) {
      const leftPosition = 100 + (clip.startTime * timelineScale.value) // 100px offset for track name
      const width = clip.duration * timelineScale.value
      
      return {
        left: `${leftPosition}px`,
        width: `${Math.max(width, 40)}px`, // Minimum 40px width
        backgroundColor: clip.color || '#6366f1',
        borderColor: clip.color || '#6366f1'
      }
    }

    function getClipDisplayName(clip) {
      if (clip.type === 'midi') {
        const noteCount = clip.data?.notes?.length || 0
        return noteCount > 0 ? `${noteCount} notes` : 'Empty MIDI'
      }
      return clip.type
    }

    function selectClip(clipId) {
      projectStore.selectedClipId = clipId
    }

    function editClip(clipId) {
      // Double-click to edit - could open MIDI editor modal
      projectStore.selectedClipId = clipId
      console.log('Edit clip:', clipId)
    }

    // Drag and drop functionality
    function startDragging(event, clipId) {
      if (event.button !== 0) return // Only left mouse button
      
      isDragging.value = true
      const clip = projectStore.clips.find(c => c.id === clipId)
      
      dragState.value = {
        clipId,
        startX: event.clientX,
        startTime: clip.startTime,
        resizeDirection: null
      }
      
      document.addEventListener('mousemove', handleDragging)
      document.addEventListener('mouseup', stopDragging)
      event.preventDefault()
    }

    function startResizing(event, clipId, direction) {
      if (event.button !== 0) return
      
      isResizing.value = true
      const clip = projectStore.clips.find(c => c.id === clipId)
      
      dragState.value = {
        clipId,
        startX: event.clientX,
        startTime: clip.startTime,
        startDuration: clip.duration,
        resizeDirection: direction
      }
      
      document.addEventListener('mousemove', handleResizing)
      document.addEventListener('mouseup', stopResizing)
      event.preventDefault()
    }

    function handleDragging(event) {
      if (!isDragging.value || !dragState.value.clipId) return
      
      const deltaX = event.clientX - dragState.value.startX
      const deltaTime = deltaX / timelineScale.value
      const newTime = Math.max(0, dragState.value.startTime + deltaTime)
      
      // Snap to quarter beats
      const snappedTime = Math.round(newTime * 4) / 4
      
      projectStore.updateClip(dragState.value.clipId, { startTime: snappedTime })
      
      // Add dragging class to body
      document.body.classList.add('dragging')
    }

    function handleResizing(event) {
      if (!isResizing.value || !dragState.value.clipId) return
      
      const deltaX = event.clientX - dragState.value.startX
      const deltaTime = deltaX / timelineScale.value
      
      if (dragState.value.resizeDirection === 'right') {
        const newDuration = Math.max(0.25, dragState.value.startDuration + deltaTime)
        const snappedDuration = Math.round(newDuration * 4) / 4
        projectStore.updateClip(dragState.value.clipId, { duration: snappedDuration })
      } else if (dragState.value.resizeDirection === 'left') {
        const newStartTime = Math.max(0, dragState.value.startTime + deltaTime)
        const newDuration = Math.max(0.25, dragState.value.startDuration - deltaTime)
        const snappedStartTime = Math.round(newStartTime * 4) / 4
        const snappedDuration = Math.round(newDuration * 4) / 4
        
        projectStore.updateClip(dragState.value.clipId, { 
          startTime: snappedStartTime,
          duration: snappedDuration 
        })
      }
    }

    function stopDragging() {
      isDragging.value = false
      dragState.value = { clipId: null, startX: 0, startTime: 0, resizeDirection: null }
      document.removeEventListener('mousemove', handleDragging)
      document.removeEventListener('mouseup', stopDragging)
      document.body.classList.remove('dragging')
    }

    function stopResizing() {
      isResizing.value = false
      dragState.value = { clipId: null, startX: 0, startTime: 0, resizeDirection: null }
      document.removeEventListener('mousemove', handleResizing)
      document.removeEventListener('mouseup', stopResizing)
      document.body.classList.remove('dragging')
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
      testTrackSound,
      // Timeline functions
      createClipOnTimeline,
      getClipStyle,
      getClipDisplayName,
      selectClip,
      editClip,
      startDragging,
      startResizing,
      getTrackClips: projectStore.getTrackClips,
      zoomIn,
      zoomOut,
      // Timeline state
      isDragging,
      isResizing,
      timelineScale
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

/* Timeline specific styles */
.timeline-track {
  position: relative;
  user-select: none;
}

.timeline-clip {
  user-select: none;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
}

.timeline-clip:hover {
  filter: brightness(110%);
}

.timeline-clip.selected {
  box-shadow: 0 0 0 2px rgba(147, 51, 234, 0.5), 0 2px 12px rgba(0, 0, 0, 0.4);
}

.resize-handle {
  opacity: 0;
  transition: opacity 0.2s ease;
}

.timeline-clip:hover .resize-handle {
  opacity: 1;
}

/* Timeline scrolling */
.timeline-scroll {
  scroll-behavior: smooth;
}

.timeline-scroll::-webkit-scrollbar {
  height: 8px;
  width: 8px;
}

.timeline-scroll::-webkit-scrollbar-track {
  background: #374151;
}

.timeline-scroll::-webkit-scrollbar-thumb {
  background: #6b7280;
  border-radius: 4px;
}

.timeline-scroll::-webkit-scrollbar-thumb:hover {
  background: #9ca3af;
}

/* Prevent text selection during dragging */
.dragging {
  user-select: none;
  cursor: grabbing !important;
}

.dragging * {
  cursor: grabbing !important;
}
</style> 