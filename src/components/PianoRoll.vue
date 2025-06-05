<template>
  <div class="piano-roll bg-gray-900 rounded-lg border border-gray-700 overflow-hidden">
    <!-- Header -->
    <div class="bg-gray-800 border-b border-gray-700 p-3">
      <div class="flex items-center justify-between">
        <div>
          <h3 class="text-lg font-semibold text-white">Piano Roll</h3>
          <div v-if="clip" class="text-sm text-gray-300">
            {{ trackName }} - {{ clip.duration }}s - {{ notes.length }} notes
          </div>
        </div>
        
        <div class="flex items-center space-x-4">
          <!-- Zoom Controls -->
          <div class="flex items-center space-x-2">
            <button @click="zoomOut" class="px-2 py-1 bg-gray-700 hover:bg-gray-600 text-white text-xs rounded">-</button>
            <span class="text-xs text-gray-400">{{ Math.round(timeZoom * 100) }}%</span>
            <button @click="zoomIn" class="px-2 py-1 bg-gray-700 hover:bg-gray-600 text-white text-xs rounded">+</button>
          </div>
          
          <!-- Snap Grid -->
          <select v-model="snapGrid" class="bg-gray-700 text-white text-xs rounded px-2 py-1 border border-gray-600">
            <option value="0.25">1/16</option>
            <option value="0.5">1/8</option>
            <option value="1">1/4</option>
            <option value="2">1/2</option>
            <option value="4">1/1</option>
          </select>
          
          <!-- Tools -->
          <div class="flex items-center space-x-1">
            <button 
              @click="selectedTool = 'select'"
              :class="selectedTool === 'select' ? 'bg-purple-600' : 'bg-gray-700 hover:bg-gray-600'"
              class="px-2 py-1 text-white text-xs rounded transition-colors"
            >
              Select
            </button>
            <button 
              @click="selectedTool = 'pencil'"
              :class="selectedTool === 'pencil' ? 'bg-purple-600' : 'bg-gray-700 hover:bg-gray-600'"
              class="px-2 py-1 text-white text-xs rounded transition-colors"
            >
              Pencil
            </button>
            <button 
              @click="selectedTool = 'eraser'"
              :class="selectedTool === 'eraser' ? 'bg-purple-600' : 'bg-gray-700 hover:bg-gray-600'"
              class="px-2 py-1 text-white text-xs rounded transition-colors"
            >
              Eraser
            </button>
          </div>
          
          <!-- Actions -->
          <div class="flex items-center space-x-1">
            <button @click="selectAllNotes" class="px-2 py-1 bg-gray-700 hover:bg-gray-600 text-white text-xs rounded">All</button>
            <button @click="deleteSelectedNotes" class="px-2 py-1 bg-red-600 hover:bg-red-700 text-white text-xs rounded">Delete</button>
          </div>
        </div>
      </div>
    </div>

    <!-- Piano Roll Content -->
    <div class="flex h-96">
      <!-- Piano Keyboard -->
      <div class="w-20 bg-gray-800 border-r border-gray-700 flex-shrink-0">
        <div class="h-full overflow-y-auto piano-keys">
          <div 
            v-for="(note, index) in pianoKeys" 
            :key="note.name"
            class="piano-key flex items-center justify-end pr-2 border-b border-gray-600 cursor-pointer transition-colors"
            :class="{
              'bg-gray-200 text-gray-900 hover:bg-gray-100': note.type === 'white',
              'bg-gray-900 text-white hover:bg-gray-800': note.type === 'black',
              'playing': playingNotes.has(note.midi)
            }"
            :style="{ height: `${noteHeight}px` }"
            @click="playPreviewNote(note.midi)"
            @mouseenter="hoveredNote = note.midi"
            @mouseleave="hoveredNote = null"
          >
            <span class="text-xs font-mono">{{ note.name }}</span>
          </div>
        </div>
      </div>

      <!-- Note Grid Area -->
      <div class="flex-1 relative overflow-auto piano-grid" ref="gridContainer">
        <!-- Time Ruler -->
        <div class="sticky top-0 bg-gray-800 border-b border-gray-700 h-8 flex items-center z-10">
          <div 
            v-for="beat in totalBeats" 
            :key="beat"
            class="flex-shrink-0 relative border-r border-gray-600"
            :style="{ width: `${beatWidth}px` }"
          >
            <span class="absolute left-1 top-1 text-xs text-gray-400">{{ beat }}</span>
            <!-- Sub-divisions -->
            <div class="flex h-full">
              <div 
                v-for="subdivision in 4" 
                :key="subdivision"
                class="border-r border-gray-700 flex-1"
                :class="{ 'border-gray-600': subdivision === 1 }"
              ></div>
            </div>
          </div>
        </div>

        <!-- Note Grid -->
        <div 
          class="relative select-none"
          :style="{ width: `${totalBeats * beatWidth}px`, height: `${pianoKeys.length * noteHeight}px` }"
          @mousedown="handleGridMouseDown"
          @mousemove="handleGridMouseMove"
          @mouseup="handleGridMouseUp"
          @mouseleave="handleGridMouseLeave"
          @contextmenu.prevent="handleGridRightClick"
        >
          <!-- Grid Lines -->
          <div class="absolute inset-0 pointer-events-none">
            <!-- Horizontal lines (notes) -->
            <div 
              v-for="(note, index) in pianoKeys" 
              :key="`h-${note.name}`"
              class="absolute border-b border-gray-700 w-full"
              :class="{ 'border-gray-600': note.type === 'white' }"
              :style="{ top: `${index * noteHeight}px`, height: `${noteHeight}px` }"
            ></div>
            
            <!-- Vertical lines (beats) -->
            <div 
              v-for="beat in totalBeats" 
              :key="`v-${beat}`"
              class="absolute border-r border-gray-600 h-full"
              :style="{ left: `${(beat - 1) * beatWidth}px` }"
            >
              <!-- Sub-beat lines -->
              <div 
                v-for="sub in 3" 
                :key="sub"
                class="absolute border-r border-gray-700 h-full"
                :style="{ left: `${sub * (beatWidth / 4)}px` }"
              ></div>
            </div>
          </div>

          <!-- Existing Notes -->
          <div 
            v-for="note in notes" 
            :key="note.id"
            class="absolute piano-note cursor-pointer transition-all"
            :class="{
              'selected': selectedNotes.has(note.id),
              'hover': hoveredNoteId === note.id
            }"
            :style="getNoteStyle(note)"
            @mousedown.stop="handleNoteMouseDown($event, note)"
            @dblclick="deleteNote(note.id)"
          >
            <!-- Note Content -->
            <div class="h-full flex items-center justify-between px-1">
              <span class="text-xs text-white font-medium truncate">{{ getMidiNoteName(note.pitch) }}</span>
              <span class="text-xs text-white opacity-75">{{ note.velocity }}</span>
            </div>
            
            <!-- Resize Handles -->
            <div 
              class="absolute left-0 top-0 w-1 h-full bg-white bg-opacity-30 cursor-w-resize resize-handle opacity-0 hover:opacity-100"
              @mousedown.stop="handleNoteResize($event, note, 'start')"
            ></div>
            <div 
              class="absolute right-0 top-0 w-1 h-full bg-white bg-opacity-30 cursor-e-resize resize-handle opacity-0 hover:opacity-100"
              @mousedown.stop="handleNoteResize($event, note, 'end')"
            ></div>
          </div>

          <!-- Selection Rectangle -->
          <div 
            v-if="selectionRect.active"
            class="absolute border border-purple-400 bg-purple-400 bg-opacity-20 pointer-events-none"
            :style="getSelectionRectStyle()"
          ></div>

          <!-- Preview Note (while dragging) -->
          <div 
            v-if="previewNote.active"
            class="absolute bg-gray-500 bg-opacity-60 border border-gray-400 pointer-events-none"
            :style="getPreviewNoteStyle()"
          ></div>
        </div>
      </div>
    </div>

    <!-- Velocity Editor -->
    <div class="h-24 bg-gray-800 border-t border-gray-700">
      <div class="flex h-full">
        <!-- Velocity Label -->
        <div class="w-20 bg-gray-900 border-r border-gray-700 flex items-center justify-center">
          <span class="text-xs text-gray-400 font-medium">Velocity</span>
        </div>
        
        <!-- Velocity Bars -->
        <div class="flex-1 relative overflow-auto">
          <div 
            class="relative h-full"
            :style="{ width: `${totalBeats * beatWidth}px` }"
          >
            <!-- Velocity bars for each note -->
            <div 
              v-for="note in notes" 
              :key="`vel-${note.id}`"
              class="absolute bg-blue-500 cursor-pointer hover:bg-blue-400 transition-colors"
              :style="getVelocityBarStyle(note)"
              @mousedown="handleVelocityDrag($event, note)"
            ></div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue'
import { useProjectStore } from '../stores/project'
import { useAudioStore } from '../stores/audio'

export default {
  name: 'PianoRoll',
  props: {
    clipId: {
      type: String,
      required: true
    }
  },
  setup(props) {
    const projectStore = useProjectStore()
    const audioStore = useAudioStore()
    
    // Refs
    const gridContainer = ref(null)
    
    // State
    const timeZoom = ref(1)
    const snapGrid = ref(0.25) // Default to 1/16 notes
    const selectedTool = ref('pencil')
    const selectedNotes = ref(new Set())
    const hoveredNote = ref(null)
    const hoveredNoteId = ref(null)
    const playingNotes = ref(new Set())
    
    // Grid dimensions
    const noteHeight = ref(20)
    const beatWidth = computed(() => 80 * timeZoom.value)
    const totalBeats = computed(() => Math.max(clip.value?.duration || 4, 8))
    
    // Mouse interaction state
    const mouseState = ref({
      isDragging: false,
      isResizing: false,
      isSelecting: false,
      startX: 0,
      startY: 0,
      currentX: 0,
      currentY: 0,
      draggedNote: null,
      resizeHandle: null,
      startTime: 0,
      startPitch: 0
    })
    
    // Selection rectangle
    const selectionRect = ref({
      active: false,
      startX: 0,
      startY: 0,
      endX: 0,
      endY: 0
    })
    
    // Preview note while creating
    const previewNote = ref({
      active: false,
      time: 0,
      pitch: 0,
      duration: 1
    })

    // Piano key definitions (C1 to C8)
    const pianoKeys = computed(() => {
      const keys = []
      const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']
      
      // Generate keys from C8 down to C1 (top to bottom in UI)
      for (let octave = 8; octave >= 1; octave--) {
        for (let noteIndex = 11; noteIndex >= 0; noteIndex--) {
          const noteName = noteNames[noteIndex]
          const midi = (octave * 12) + noteIndex
          const isBlack = noteName.includes('#')
          
          keys.push({
            name: `${noteName}${octave}`,
            midi: midi,
            type: isBlack ? 'black' : 'white'
          })
        }
      }
      
      return keys
    })

    // Computed properties
    const clip = computed(() => {
      return projectStore.clips.find(c => c.id === props.clipId)
    })

    const trackName = computed(() => {
      if (!clip.value) return ''
      const track = projectStore.tracks.find(t => t.id === clip.value.trackId)
      return track ? track.name : 'Unknown Track'
    })

    const notes = computed({
      get() {
        if (!clip.value?.data?.notes) return []
        return clip.value.data.notes.map((note, index) => ({
          ...note,
          id: note.id || `note-${index}`,
          pitch: midiNameToNumber(note.pitch) || 60
        }))
      },
      set(value) {
        if (!clip.value) return
        const updatedNotes = value.map(note => ({
          ...note,
          pitch: getMidiNoteName(note.pitch)
        }))
        projectStore.updateClip(clip.value.id, {
          data: { ...clip.value.data, notes: updatedNotes }
        })
      }
    })

    // Utility functions
    function midiNameToNumber(noteName) {
      const noteMap = { 'C': 0, 'C#': 1, 'D': 2, 'D#': 3, 'E': 4, 'F': 5, 'F#': 6, 'G': 7, 'G#': 8, 'A': 9, 'A#': 10, 'B': 11 }
      const match = noteName.match(/([A-G]#?)(\d)/)
      if (!match) return 60 // Default to middle C
      const [, note, octave] = match
      return (parseInt(octave) * 12) + noteMap[note]
    }

    function getMidiNoteName(midiNumber) {
      const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']
      const octave = Math.floor(midiNumber / 12)
      const note = noteNames[midiNumber % 12]
      return `${note}${octave}`
    }

    function snapToGrid(time) {
      return Math.round(time / snapGrid.value) * snapGrid.value
    }

    function getTimeFromX(x) {
      return Math.max(0, (x / beatWidth.value))
    }

    function getPitchFromY(y) {
      const keyIndex = Math.floor(y / noteHeight.value)
      return Math.max(0, Math.min(pianoKeys.value.length - 1, keyIndex))
    }

    function getXFromTime(time) {
      return time * beatWidth.value
    }

    function getYFromPitch(pitch) {
      const keyIndex = pianoKeys.value.findIndex(key => key.midi === pitch)
      return keyIndex >= 0 ? keyIndex * noteHeight.value : 0
    }

    // Style functions
    function getNoteStyle(note) {
      const left = getXFromTime(note.time)
      const width = Math.max(getXFromTime(note.duration), 10) // Minimum 10px width
      const top = getYFromPitch(note.pitch)
      
      return {
        left: `${left}px`,
        width: `${width}px`,
        top: `${top}px`,
        height: `${noteHeight.value - 2}px`,
        backgroundColor: selectedNotes.value.has(note.id) ? '#8b5cf6' : '#3b82f6',
        border: `1px solid ${selectedNotes.value.has(note.id) ? '#a855f7' : '#2563eb'}`,
        zIndex: selectedNotes.value.has(note.id) ? 10 : 5
      }
    }

    function getSelectionRectStyle() {
      const left = Math.min(selectionRect.value.startX, selectionRect.value.endX)
      const top = Math.min(selectionRect.value.startY, selectionRect.value.endY)
      const width = Math.abs(selectionRect.value.endX - selectionRect.value.startX)
      const height = Math.abs(selectionRect.value.endY - selectionRect.value.startY)
      
      return {
        left: `${left}px`,
        top: `${top}px`,
        width: `${width}px`,
        height: `${height}px`
      }
    }

    function getPreviewNoteStyle() {
      const left = getXFromTime(previewNote.value.time)
      const width = Math.max(getXFromTime(previewNote.value.duration), 10)
      const top = getYFromPitch(previewNote.value.pitch)
      
      return {
        left: `${left}px`,
        width: `${width}px`,
        top: `${top}px`,
        height: `${noteHeight.value - 2}px`
      }
    }

    function getVelocityBarStyle(note) {
      const left = getXFromTime(note.time)
      const width = Math.max(getXFromTime(note.duration), 2)
      const height = (note.velocity / 127) * 80 // Max height 80px
      
      return {
        left: `${left}px`,
        width: `${width}px`,
        bottom: '0px',
        height: `${height}px`
      }
    }

    // Mouse event handlers
    function handleGridMouseDown(event) {
      if (event.button !== 0) return // Only left click
      
      const rect = gridContainer.value.getBoundingClientRect()
      const x = event.clientX - rect.left
      const y = event.clientY - rect.top - 32 // Account for ruler height
      
      mouseState.value.startX = x
      mouseState.value.startY = y
      mouseState.value.currentX = x
      mouseState.value.currentY = y
      
      if (selectedTool.value === 'pencil') {
        createNoteAtPosition(x, y)
      } else if (selectedTool.value === 'select') {
        startSelection(x, y)
      }
    }

    function handleGridMouseMove(event) {
      if (!gridContainer.value) return
      
      const rect = gridContainer.value.getBoundingClientRect()
      const x = event.clientX - rect.left
      const y = event.clientY - rect.top - 32
      
      mouseState.value.currentX = x
      mouseState.value.currentY = y
      
      if (selectionRect.value.active) {
        selectionRect.value.endX = x
        selectionRect.value.endY = y
        updateSelection()
      }
      
      // Update preview for pencil tool
      if (selectedTool.value === 'pencil' && !mouseState.value.isDragging) {
        updatePreview(x, y)
      }
    }

    function handleGridMouseUp(event) {
      if (selectionRect.value.active) {
        selectionRect.value.active = false
      }
      
      mouseState.value.isDragging = false
      mouseState.value.isResizing = false
      mouseState.value.isSelecting = false
      previewNote.value.active = false
    }

    function handleGridMouseLeave() {
      previewNote.value.active = false
    }

    function handleGridRightClick(event) {
      // Right-click context menu could be added here
      console.log('Right click at', event.clientX, event.clientY)
    }

    // Note creation and editing
    function createNoteAtPosition(x, y) {
      const time = snapToGrid(getTimeFromX(x))
      const pitchIndex = getPitchFromY(y)
      const pitch = pianoKeys.value[pitchIndex]?.midi || 60
      
      // Check if there's already a note at this position
      const existingNote = notes.value.find(note => 
        Math.abs(note.time - time) < 0.01 && note.pitch === pitch
      )
      
      if (existingNote) {
        if (selectedTool.value === 'eraser') {
          deleteNote(existingNote.id)
        }
        return
      }
      
      // Create new note
      const newNote = {
        id: `note-${Date.now()}-${Math.random()}`,
        pitch: pitch,
        time: time,
        duration: snapGrid.value,
        velocity: 80
      }
      
      const updatedNotes = [...notes.value, newNote]
      notes.value = updatedNotes
      
      // Select the new note
      selectedNotes.value.clear()
      selectedNotes.value.add(newNote.id)
      
      // Play preview
      playPreviewNote(pitch)
    }

    function deleteNote(noteId) {
      const updatedNotes = notes.value.filter(note => note.id !== noteId)
      notes.value = updatedNotes
      selectedNotes.value.delete(noteId)
    }

    function deleteSelectedNotes() {
      const updatedNotes = notes.value.filter(note => !selectedNotes.value.has(note.id))
      notes.value = updatedNotes
      selectedNotes.value.clear()
    }

    function selectAllNotes() {
      selectedNotes.value.clear()
      notes.value.forEach(note => selectedNotes.value.add(note.id))
    }

    // Selection handling
    function startSelection(x, y) {
      selectionRect.value = {
        active: true,
        startX: x,
        startY: y,
        endX: x,
        endY: y
      }
      
      if (!event.shiftKey) {
        selectedNotes.value.clear()
      }
    }

    function updateSelection() {
      if (!selectionRect.value.active) return
      
      const left = Math.min(selectionRect.value.startX, selectionRect.value.endX)
      const right = Math.max(selectionRect.value.startX, selectionRect.value.endX)
      const top = Math.min(selectionRect.value.startY, selectionRect.value.endY)
      const bottom = Math.max(selectionRect.value.startY, selectionRect.value.endY)
      
      notes.value.forEach(note => {
        const noteLeft = getXFromTime(note.time)
        const noteRight = noteLeft + getXFromTime(note.duration)
        const noteTop = getYFromPitch(note.pitch)
        const noteBottom = noteTop + noteHeight.value
        
        // Check if note intersects with selection rectangle
        if (noteLeft < right && noteRight > left && noteTop < bottom && noteBottom > top) {
          selectedNotes.value.add(note.id)
        }
      })
    }

    function updatePreview(x, y) {
      const time = snapToGrid(getTimeFromX(x))
      const pitchIndex = getPitchFromY(y)
      const pitch = pianoKeys.value[pitchIndex]?.midi || 60
      
      previewNote.value = {
        active: true,
        time: time,
        pitch: pitch,
        duration: snapGrid.value
      }
    }

    // Note interaction handlers
    function handleNoteMouseDown(event, note) {
      event.stopPropagation()
      
      if (selectedTool.value === 'eraser') {
        deleteNote(note.id)
        return
      }
      
      if (!selectedNotes.value.has(note.id)) {
        if (!event.shiftKey) {
          selectedNotes.value.clear()
        }
        selectedNotes.value.add(note.id)
      }
      
      // Start dragging
      mouseState.value.isDragging = true
      mouseState.value.draggedNote = note
      mouseState.value.startTime = note.time
      mouseState.value.startPitch = note.pitch
      
      document.addEventListener('mousemove', handleNoteDrag)
      document.addEventListener('mouseup', handleNoteDragEnd)
    }

    function handleNoteDrag(event) {
      if (!mouseState.value.isDragging || !mouseState.value.draggedNote) return
      
      const rect = gridContainer.value.getBoundingClientRect()
      const x = event.clientX - rect.left
      const y = event.clientY - rect.top - 32
      
      const newTime = snapToGrid(getTimeFromX(x))
      const newPitchIndex = getPitchFromY(y)
      const newPitch = pianoKeys.value[newPitchIndex]?.midi || 60
      
      const timeDelta = newTime - mouseState.value.startTime
      const pitchDelta = newPitch - mouseState.value.startPitch
      
      // Update all selected notes
      const updatedNotes = notes.value.map(note => {
        if (selectedNotes.value.has(note.id)) {
          return {
            ...note,
            time: Math.max(0, note.time + timeDelta),
            pitch: Math.max(0, Math.min(127, note.pitch + pitchDelta))
          }
        }
        return note
      })
      
      notes.value = updatedNotes
      
      // Update start position for next delta calculation
      mouseState.value.startTime = newTime
      mouseState.value.startPitch = newPitch
    }

    function handleNoteDragEnd() {
      mouseState.value.isDragging = false
      mouseState.value.draggedNote = null
      document.removeEventListener('mousemove', handleNoteDrag)
      document.removeEventListener('mouseup', handleNoteDragEnd)
    }

    function handleNoteResize(event, note, handle) {
      event.stopPropagation()
      
      mouseState.value.isResizing = true
      mouseState.value.draggedNote = note
      mouseState.value.resizeHandle = handle
      
      document.addEventListener('mousemove', handleResize)
      document.addEventListener('mouseup', handleResizeEnd)
    }

    function handleResize(event) {
      if (!mouseState.value.isResizing || !mouseState.value.draggedNote) return
      
      const rect = gridContainer.value.getBoundingClientRect()
      const x = event.clientX - rect.left
      const time = snapToGrid(getTimeFromX(x))
      
      const note = mouseState.value.draggedNote
      const handle = mouseState.value.resizeHandle
      
      const updatedNotes = notes.value.map(n => {
        if (n.id === note.id) {
          if (handle === 'start') {
            const newStart = Math.max(0, time)
            const newDuration = Math.max(snapGrid.value, (n.time + n.duration) - newStart)
            return { ...n, time: newStart, duration: newDuration }
          } else {
            const newDuration = Math.max(snapGrid.value, time - n.time)
            return { ...n, duration: newDuration }
          }
        }
        return n
      })
      
      notes.value = updatedNotes
    }

    function handleResizeEnd() {
      mouseState.value.isResizing = false
      mouseState.value.draggedNote = null
      mouseState.value.resizeHandle = null
      document.removeEventListener('mousemove', handleResize)
      document.removeEventListener('mouseup', handleResizeEnd)
    }

    function handleVelocityDrag(event, note) {
      const startY = event.clientY
      const startVelocity = note.velocity
      
      function updateVelocity(event) {
        const deltaY = startY - event.clientY
        const newVelocity = Math.max(1, Math.min(127, startVelocity + Math.round(deltaY / 2)))
        
        const updatedNotes = notes.value.map(n => 
          n.id === note.id ? { ...n, velocity: newVelocity } : n
        )
        notes.value = updatedNotes
      }
      
      function stopVelocityDrag() {
        document.removeEventListener('mousemove', updateVelocity)
        document.removeEventListener('mouseup', stopVelocityDrag)
      }
      
      document.addEventListener('mousemove', updateVelocity)
      document.addEventListener('mouseup', stopVelocityDrag)
    }

    // Audio preview
    function playPreviewNote(midiNote) {
      if (!clip.value) return
      
      const track = projectStore.tracks.find(t => t.id === clip.value.trackId)
      if (track) {
        // Initialize audio if not already done
        if (!audioStore.isInitialized) {
          audioStore.initializeAudio()
        }
        
        // Create track instrument if doesn't exist
        if (audioStore.isInitialized && !audioStore.instruments?.has(track.id)) {
          audioStore.createTrack(track.id, track.type || 'midi')
        }
        
        // Play the note
        if (audioStore.isInitialized) {
          const noteName = getMidiNoteName(midiNote)
          audioStore.playNote(track.id, noteName, '8n')
          
          playingNotes.value.add(midiNote)
          setTimeout(() => {
            playingNotes.value.delete(midiNote)
          }, 200)
        }
      }
    }

    // Zoom functions
    function zoomIn() {
      timeZoom.value = Math.min(timeZoom.value * 1.5, 4)
    }

    function zoomOut() {
      timeZoom.value = Math.max(timeZoom.value / 1.5, 0.25)
    }

    // Keyboard shortcuts
    function handleKeyDown(event) {
      if (event.key === 'Delete' || event.key === 'Backspace') {
        deleteSelectedNotes()
        event.preventDefault()
      } else if (event.key === 'a' && (event.ctrlKey || event.metaKey)) {
        selectAllNotes()
        event.preventDefault()
      } else if (event.key === 'Escape') {
        selectedNotes.value.clear()
        selectedTool.value = 'select'
      }
    }

    // Lifecycle
    onMounted(() => {
      document.addEventListener('keydown', handleKeyDown)
    })

    onUnmounted(() => {
      document.removeEventListener('keydown', handleKeyDown)
      // Clean up any active mouse listeners
      document.removeEventListener('mousemove', handleNoteDrag)
      document.removeEventListener('mouseup', handleNoteDragEnd)
      document.removeEventListener('mousemove', handleResize)
      document.removeEventListener('mouseup', handleResizeEnd)
    })

    return {
      // Template refs
      gridContainer,
      
      // State
      clip,
      trackName,
      notes,
      pianoKeys,
      timeZoom,
      snapGrid,
      selectedTool,
      selectedNotes,
      hoveredNote,
      hoveredNoteId,
      playingNotes,
      noteHeight,
      beatWidth,
      totalBeats,
      selectionRect,
      previewNote,
      
      // Methods
      getNoteStyle,
      getSelectionRectStyle,
      getPreviewNoteStyle,
      getVelocityBarStyle,
      getMidiNoteName,
      handleGridMouseDown,
      handleGridMouseMove,
      handleGridMouseUp,
      handleGridMouseLeave,
      handleGridRightClick,
      handleNoteMouseDown,
      handleNoteResize,
      handleVelocityDrag,
      deleteNote,
      deleteSelectedNotes,
      selectAllNotes,
      playPreviewNote,
      zoomIn,
      zoomOut
    }
  }
}
</script>

<style scoped>
.piano-roll {
  user-select: none;
}

.piano-keys::-webkit-scrollbar {
  width: 8px;
}

.piano-keys::-webkit-scrollbar-track {
  background: #374151;
}

.piano-keys::-webkit-scrollbar-thumb {
  background: #6b7280;
  border-radius: 4px;
}

.piano-key {
  transition: all 0.1s ease;
}

.piano-key.playing {
  background-color: #10b981 !important;
  transform: scale(0.98);
}

.piano-grid::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

.piano-grid::-webkit-scrollbar-track {
  background: #374151;
}

.piano-grid::-webkit-scrollbar-thumb {
  background: #6b7280;
  border-radius: 4px;
}

.piano-note {
  border-radius: 2px;
  transition: all 0.1s ease;
}

.piano-note:hover {
  filter: brightness(110%);
}

.piano-note.selected {
  box-shadow: 0 0 0 2px rgba(139, 92, 246, 0.7);
}

.piano-note:hover .resize-handle {
  opacity: 1 !important;
}

.resize-handle {
  transition: opacity 0.2s ease;
}

/* Grid styling */
.piano-grid {
  background-image: 
    linear-gradient(rgba(156, 163, 175, 0.1) 1px, transparent 1px),
    linear-gradient(90deg, rgba(156, 163, 175, 0.1) 1px, transparent 1px);
  background-size: 20px 20px;
}
</style> 