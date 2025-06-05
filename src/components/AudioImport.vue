<template>
  <div class="audio-import">
    <!-- File Upload Area -->
    <div 
      class="border-2 border-dashed border-gray-600 rounded-lg p-8 text-center transition-colors"
      :class="{ 'border-purple-500 bg-purple-500 bg-opacity-10': isDragOver }"
      @drop="handleDrop"
      @dragover.prevent="isDragOver = true"
      @dragleave="isDragOver = false"
      @click="triggerFileInput"
    >
      <div class="space-y-4">
        <svg class="w-16 h-16 mx-auto text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"/>
        </svg>
        
        <div>
          <h3 class="text-lg font-medium text-white mb-2">Import Audio Files</h3>
          <p class="text-sm text-gray-400 mb-4">
            Drag and drop audio files here or click to browse
          </p>
          <p class="text-xs text-gray-500">
            Supported: WAV, MP3, AAC, FLAC, OGG (Max 50MB)
          </p>
        </div>
        
        <button 
          class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
        >
          Choose Files
        </button>
      </div>
    </div>
    
    <!-- File Input (Hidden) -->
    <input 
      ref="fileInput"
      type="file" 
      multiple
      accept="audio/*,.wav,.mp3,.aac,.flac,.ogg"
      class="hidden"
      @change="handleFileSelect"
    >
    
    <!-- Upload Progress -->
    <div v-if="uploadingFiles.length > 0" class="mt-6 space-y-3">
      <h4 class="text-sm font-medium text-white">Processing Files</h4>
      
      <div 
        v-for="file in uploadingFiles" 
        :key="file.id"
        class="bg-gray-800 rounded-lg p-4"
      >
        <div class="flex items-center justify-between mb-2">
          <span class="text-sm text-white font-medium">{{ file.name }}</span>
          <span class="text-xs text-gray-400">{{ formatFileSize(file.size) }}</span>
        </div>
        
        <div class="w-full bg-gray-700 rounded-full h-2">
          <div 
            class="bg-blue-600 h-2 rounded-full transition-all duration-300"
            :style="{ width: `${file.progress}%` }"
          ></div>
        </div>
        
        <div class="flex items-center justify-between mt-2">
          <span class="text-xs text-gray-400">{{ file.status }}</span>
          <span v-if="file.progress < 100" class="text-xs text-gray-400">{{ file.progress }}%</span>
          <span v-else-if="file.error" class="text-xs text-red-400">{{ file.error }}</span>
          <span v-else class="text-xs text-green-400">✓ Complete</span>
        </div>
      </div>
    </div>
    
    <!-- Recent Imports -->
    <div v-if="recentImports.length > 0" class="mt-6">
      <h4 class="text-sm font-medium text-white mb-3">Recent Imports</h4>
      
      <div class="space-y-2">
        <div 
          v-for="audioFile in recentImports" 
          :key="audioFile.id"
          class="bg-gray-800 rounded-lg p-3 flex items-center justify-between hover:bg-gray-750 transition-colors cursor-pointer"
          @click="addToTimeline(audioFile)"
        >
          <div class="flex items-center space-x-3">
            <div class="w-8 h-8 bg-blue-600 rounded flex items-center justify-center">
              <svg class="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path d="M18 3a1 1 0 00-1.196-.98l-10 2A1 1 0 006 5v9.114A4.369 4.369 0 005 14c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V7.82l8-1.6v5.894A4.369 4.369 0 0015 12c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V3z"/>
              </svg>
            </div>
            
            <div>
              <p class="text-sm font-medium text-white">{{ audioFile.name }}</p>
              <p class="text-xs text-gray-400">{{ formatDuration(audioFile.duration) }} • {{ formatFileSize(audioFile.size) }}</p>
            </div>
          </div>
          
          <div class="flex items-center space-x-2">
            <button 
              @click.stop="playPreview(audioFile)"
              class="p-1 text-gray-400 hover:text-white transition-colors"
            >
              <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path d="M8 5v10l8-5-8-5z"/>
              </svg>
            </button>
            
            <button 
              @click.stop="removeImport(audioFile.id)"
              class="p-1 text-gray-400 hover:text-red-400 transition-colors"
            >
              <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path d="M6 2l2-2h4l2 2h4v2H2V2h4zM3 6v12a2 2 0 002 2h10a2 2 0 002-2V6H3z"/>
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed } from 'vue'
import { useProjectStore } from '../stores/project'
import { useAudioStore } from '../stores/audio'

export default {
  name: 'AudioImport',
  props: {
    targetTrackId: {
      type: String,
      default: null
    }
  },
  emits: ['fileImported', 'close'],
  setup(props, { emit }) {
    const projectStore = useProjectStore()
    const audioStore = useAudioStore()
    
    const fileInput = ref(null)
    const isDragOver = ref(false)
    const uploadingFiles = ref([])
    const recentImports = ref([])
    
    // File handling
    function triggerFileInput() {
      fileInput.value?.click()
    }
    
    function handleFileSelect(event) {
      const files = Array.from(event.target.files)
      processFiles(files)
    }
    
    function handleDrop(event) {
      event.preventDefault()
      isDragOver.value = false
      
      const files = Array.from(event.dataTransfer.files).filter(file => 
        file.type.startsWith('audio/') || 
        /\.(wav|mp3|aac|flac|ogg)$/i.test(file.name)
      )
      
      if (files.length > 0) {
        processFiles(files)
      }
    }
    
    async function processFiles(files) {
      for (const file of files) {
        // Check file size (50MB limit)
        if (file.size > 50 * 1024 * 1024) {
          console.error(`File ${file.name} is too large (max 50MB)`)
          continue
        }
        
        const fileObj = {
          id: `upload-${Date.now()}-${Math.random()}`,
          name: file.name,
          size: file.size,
          progress: 0,
          status: 'Loading...',
          error: null
        }
        
        uploadingFiles.value.push(fileObj)
        
        try {
          // Update progress
          fileObj.progress = 25
          fileObj.status = 'Decoding audio...'
          
          // Load audio buffer
          const audioBuffer = await audioStore.loadAudioFile(file)
          
          fileObj.progress = 75
          fileObj.status = 'Creating clip...'
          
          // Create audio file object
          const audioFile = {
            id: `audio-${Date.now()}-${Math.random()}`,
            name: file.name.replace(/\.[^/.]+$/, ''), // Remove extension
            originalName: file.name,
            size: file.size,
            duration: audioBuffer.duration,
            audioBuffer: audioBuffer,
            url: URL.createObjectURL(file),
            created: Date.now()
          }
          
          // Add to recent imports
          recentImports.value.unshift(audioFile)
          
          // Keep only last 10 imports
          if (recentImports.value.length > 10) {
            recentImports.value = recentImports.value.slice(0, 10)
          }
          
          fileObj.progress = 100
          fileObj.status = 'Complete!'
          
          // Auto-add to timeline if target track specified
          if (props.targetTrackId) {
            await addToTimeline(audioFile, props.targetTrackId)
          }
          
          emit('fileImported', audioFile)
          
        } catch (error) {
          console.error('Failed to process audio file:', error)
          fileObj.error = 'Failed to load audio file'
          fileObj.status = 'Error'
        }
      }
      
      // Clear completed uploads after 3 seconds
      setTimeout(() => {
        uploadingFiles.value = uploadingFiles.value.filter(f => f.progress < 100 && !f.error)
      }, 3000)
    }
    
    async function addToTimeline(audioFile, trackId = null) {
      try {
        // Find audio track or create one
        let targetTrack = null
        
        if (trackId) {
          targetTrack = projectStore.tracks.find(t => t.id === trackId)
        } else {
          // Find first audio track
          targetTrack = projectStore.tracks.find(t => t.type === 'audio')
        }
        
        if (!targetTrack) {
          // Create new audio track
          targetTrack = projectStore.addTrack('audio')
          targetTrack.name = `Audio ${projectStore.tracks.filter(t => t.type === 'audio').length}`
          
          // Initialize audio engine if needed
          if (!audioStore.isInitialized) {
            await audioStore.initializeAudio()
          }
          audioStore.createTrack(targetTrack.id, 'audio')
        }
        
        // Add audio clip to timeline
        const clip = projectStore.addAudioClip(
          targetTrack.id,
          0, // Start time
          audioFile.audioBuffer,
          audioFile.duration,
          audioFile.url
        )
        
        // Update clip name
        projectStore.updateClip(clip.id, { name: audioFile.name })
        
        // Select the new clip
        projectStore.selectedClipId = clip.id
        
        console.log(`Added audio clip "${audioFile.name}" to track "${targetTrack.name}"`)
        
      } catch (error) {
        console.error('Failed to add audio to timeline:', error)
      }
    }
    
    function playPreview(audioFile) {
      // TODO: Implement audio preview playback
      console.log('Playing preview for:', audioFile.name)
    }
    
    function removeImport(fileId) {
      const index = recentImports.value.findIndex(f => f.id === fileId)
      if (index !== -1) {
        // Revoke object URL to free memory
        const file = recentImports.value[index]
        if (file.url) {
          URL.revokeObjectURL(file.url)
        }
        recentImports.value.splice(index, 1)
      }
    }
    
    // Utility functions
    function formatFileSize(bytes) {
      if (bytes === 0) return '0 B'
      const k = 1024
      const sizes = ['B', 'KB', 'MB', 'GB']
      const i = Math.floor(Math.log(bytes) / Math.log(k))
      return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
    }
    
    function formatDuration(seconds) {
      const mins = Math.floor(seconds / 60)
      const secs = Math.floor(seconds % 60)
      return `${mins}:${secs.toString().padStart(2, '0')}`
    }
    
    return {
      fileInput,
      isDragOver,
      uploadingFiles,
      recentImports,
      triggerFileInput,
      handleFileSelect,
      handleDrop,
      addToTimeline,
      playPreview,
      removeImport,
      formatFileSize,
      formatDuration
    }
  }
}
</script>

<style scoped>
.audio-import {
  min-height: 200px;
}

/* Drag and drop hover effects */
.border-dashed {
  border-style: dashed;
}
</style> 