<template>
  <div class="midi-editor bg-gray-900 rounded-lg border border-gray-700 p-4">
    <div class="mb-4">
      <h3 class="text-lg font-semibold text-white mb-2">MIDI Editor</h3>
      <div v-if="clip" class="text-sm text-gray-300">
        Editing: {{ clip.id }} on {{ trackName }}
      </div>
      <div v-else class="text-sm text-gray-400">
        No clip selected
      </div>
    </div>

    <div v-if="clip" class="space-y-4">
      <!-- Clip Properties -->
      <div class="bg-gray-800 rounded-lg p-3">
        <h4 class="text-sm font-medium text-white mb-2">Clip Properties</h4>
        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="block text-xs text-gray-300 mb-1">Start Time</label>
            <input 
              type="number" 
              v-model.number="clipStartTime"
              @change="updateClipProperty('startTime', clipStartTime)"
              min="0" 
              step="0.25"
              class="w-full px-2 py-1 bg-gray-700 text-white rounded border border-gray-600 text-sm"
            >
          </div>
          <div>
            <label class="block text-xs text-gray-300 mb-1">Duration</label>
            <input 
              type="number" 
              v-model.number="clipDuration"
              @change="updateClipProperty('duration', clipDuration)"
              min="0.25" 
              step="0.25"
              class="w-full px-2 py-1 bg-gray-700 text-white rounded border border-gray-600 text-sm"
            >
          </div>
        </div>
      </div>

      <!-- Piano Roll Placeholder -->
      <div class="bg-gray-800 rounded-lg p-4">
        <h4 class="text-sm font-medium text-white mb-3">Piano Roll</h4>
        <div class="h-64 bg-gray-700 rounded border border-gray-600 flex items-center justify-center">
          <div class="text-center text-gray-400">
            <svg class="w-16 h-16 mx-auto mb-2 opacity-50" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3"/>
            </svg>
            <p class="text-sm">Piano Roll Editor</p>
            <p class="text-xs opacity-75">Click and drag to add notes</p>
          </div>
        </div>
      </div>

      <!-- Note List -->
      <div class="bg-gray-800 rounded-lg p-3">
        <div class="flex items-center justify-between mb-3">
          <h4 class="text-sm font-medium text-white">Notes</h4>
          <button 
            @click="addNote"
            class="px-3 py-1 bg-green-600 hover:bg-green-700 text-white text-xs rounded transition-colors"
          >
            + Add Note
          </button>
        </div>
        
        <div v-if="notes.length > 0" class="space-y-2 max-h-32 overflow-y-auto">
          <div 
            v-for="(note, index) in notes" 
            :key="index"
            class="flex items-center justify-between bg-gray-700 rounded p-2 text-sm"
          >
            <div class="flex items-center space-x-3">
              <select 
                v-model="note.pitch"
                @change="updateNotes"
                class="bg-gray-600 text-white rounded px-2 py-1 text-xs border border-gray-500"
              >
                <option v-for="noteName in noteNames" :key="noteName" :value="noteName">
                  {{ noteName }}
                </option>
              </select>
              <input 
                type="number" 
                v-model.number="note.time"
                @change="updateNotes"
                placeholder="Time"
                min="0" 
                step="0.25"
                class="w-16 bg-gray-600 text-white rounded px-2 py-1 text-xs border border-gray-500"
              >
              <input 
                type="number" 
                v-model.number="note.duration"
                @change="updateNotes"
                placeholder="Duration"
                min="0.1" 
                step="0.1"
                class="w-16 bg-gray-600 text-white rounded px-2 py-1 text-xs border border-gray-500"
              >
            </div>
            <button 
              @click="removeNote(index)"
              class="text-red-400 hover:text-red-300 transition-colors"
            >
              <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path d="M6 2l2-2h4l2 2h4v2H2V2h4zM3 6v12a2 2 0 002 2h10a2 2 0 002-2V6H3z"/>
              </svg>
            </button>
          </div>
        </div>
        
        <div v-else class="text-center text-gray-400 py-4">
          <p class="text-sm">No notes in this clip</p>
        </div>
      </div>
    </div>

    <div v-else class="text-center text-gray-400 py-8">
      <svg class="w-16 h-16 mx-auto mb-4 opacity-30" fill="currentColor" viewBox="0 0 20 20">
        <path d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3"/>
      </svg>
      <p class="text-lg">Select a clip to edit</p>
      <p class="text-sm opacity-75">Choose a MIDI clip from the timeline</p>
    </div>
  </div>
</template>

<script>
import { ref, computed, watch } from 'vue'
import { useProjectStore } from '../stores/project'

export default {
  name: 'MidiEditor',
  props: {
    clipId: {
      type: String,
      default: null
    }
  },
  setup(props) {
    const projectStore = useProjectStore()
    
    const clipStartTime = ref(0)
    const clipDuration = ref(4)
    
    // Note names for MIDI
    const noteNames = [
      'C4', 'C#4', 'D4', 'D#4', 'E4', 'F4', 'F#4', 'G4', 'G#4', 'A4', 'A#4', 'B4',
      'C5', 'C#5', 'D5', 'D#5', 'E5', 'F5', 'F#5', 'G5', 'G#5', 'A5', 'A#5', 'B5'
    ]
    
    // Computed properties
    const clip = computed(() => {
      if (!props.clipId) return null
      return projectStore.clips.find(c => c.id === props.clipId)
    })
    
    const trackName = computed(() => {
      if (!clip.value) return ''
      const track = projectStore.tracks.find(t => t.id === clip.value.trackId)
      return track ? track.name : 'Unknown Track'
    })
    
    const notes = computed({
      get() {
        if (!clip.value || !clip.value.data || !clip.value.data.notes) {
          return []
        }
        return clip.value.data.notes
      },
      set(value) {
        if (clip.value) {
          updateClipProperty('data', { ...clip.value.data, notes: value })
        }
      }
    })
    
    // Methods
    function updateClipProperty(property, value) {
      if (!clip.value) return
      
      const updates = { [property]: value }
      projectStore.updateClip(clip.value.id, updates)
    }
    
    function addNote() {
      if (!clip.value) return
      
      const newNote = {
        pitch: 'C4',
        time: 0,
        duration: 0.5,
        velocity: 80
      }
      
      const currentNotes = notes.value ? [...notes.value] : []
      currentNotes.push(newNote)
      notes.value = currentNotes
    }
    
    function removeNote(index) {
      const currentNotes = [...notes.value]
      currentNotes.splice(index, 1)
      notes.value = currentNotes
    }
    
    function updateNotes() {
      // Trigger reactivity update
      notes.value = [...notes.value]
    }
    
    // Watch for clip changes
    watch(clip, (newClip) => {
      if (newClip) {
        clipStartTime.value = newClip.startTime
        clipDuration.value = newClip.duration
      }
    }, { immediate: true })
    
    return {
      clip,
      trackName,
      notes,
      noteNames,
      clipStartTime,
      clipDuration,
      updateClipProperty,
      addNote,
      removeNote,
      updateNotes
    }
  }
}
</script>

<style scoped>
/* Custom scrollbar for note list */
.overflow-y-auto::-webkit-scrollbar {
  width: 6px;
}

.overflow-y-auto::-webkit-scrollbar-track {
  background: #374151;
}

.overflow-y-auto::-webkit-scrollbar-thumb {
  background: #6b7280;
  border-radius: 3px;
}

.overflow-y-auto::-webkit-scrollbar-thumb:hover {
  background: #9ca3af;
}
</style> 