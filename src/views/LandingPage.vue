<template>
  <div class="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 relative overflow-hidden">
    <!-- Animated background elements -->
    <div class="absolute inset-0">
      <div class="absolute top-20 left-20 w-72 h-72 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
      <div class="absolute top-40 right-20 w-72 h-72 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse animation-delay-2000"></div>
      <div class="absolute -bottom-8 left-1/2 w-72 h-72 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse animation-delay-4000"></div>
    </div>

    <!-- Header -->
    <header class="relative z-10 pt-6">
      <nav class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between items-center">
          <div class="flex items-center space-x-3">
            <div class="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
              <span class="text-white font-bold text-xl">♪</span>
            </div>
            <h1 class="text-2xl font-bold text-white">CollabDAW</h1>
          </div>
          
          <div class="hidden md:flex items-center space-x-8">
            <a href="#features" class="text-gray-300 hover:text-white transition-colors">Features</a>
            <a href="#about" class="text-gray-300 hover:text-white transition-colors">About</a>
            <router-link 
              to="/studio" 
              class="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-6 py-2 rounded-lg hover:from-purple-600 hover:to-pink-600 transition-all"
            >
              Launch Studio
            </router-link>
          </div>
        </div>
      </nav>
    </header>

    <!-- Hero Section -->
    <main class="relative z-10 pt-20 pb-32">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="text-center">
          <h1 class="text-5xl md:text-7xl font-bold text-white mb-8 leading-tight">
            Create Music
            <span class="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent block">
              Together
            </span>
          </h1>
          
          <p class="text-xl md:text-2xl text-gray-300 mb-12 max-w-3xl mx-auto leading-relaxed">
            The first browser-based collaborative Digital Audio Workstation. 
            Create, mix, and produce music in real-time with musicians around the world.
          </p>
          
          <div class="flex flex-col sm:flex-row gap-6 justify-center items-center">
            <router-link 
              to="/studio"
              class="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-12 py-4 rounded-xl text-lg font-semibold hover:from-purple-600 hover:to-pink-600 transform hover:scale-105 transition-all shadow-2xl"
            >
              Start Creating Now
            </router-link>
            
            <button class="flex items-center space-x-3 text-white border border-gray-600 px-8 py-4 rounded-xl hover:border-gray-400 transition-all">
              <svg class="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                <path d="M8 5v10l8-5-8-5z"/>
              </svg>
              <span class="text-lg">Watch Demo</span>
            </button>
          </div>
        </div>

        <!-- DAW Mockup -->
        <div class="mt-20 relative">
          <div class="bg-gray-800 bg-opacity-50 backdrop-blur-lg rounded-2xl p-8 shadow-2xl border border-gray-700">
            <!-- Mock DAW Interface -->
            <div class="grid grid-cols-1 lg:grid-cols-4 gap-6">
              <!-- Transport Controls -->
              <div class="lg:col-span-4 flex justify-center items-center space-x-4 mb-6">
                <div class="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center">
                  <svg class="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M8 5v10l8-5-8-5z"/>
                  </svg>
                </div>
                <div class="w-12 h-12 bg-gray-600 rounded-full flex items-center justify-center">
                  <div class="w-4 h-4 bg-white rounded-sm"></div>
                </div>
                <div class="w-12 h-12 bg-red-500 rounded-full flex items-center justify-center">
                  <div class="w-4 h-4 bg-white rounded-sm"></div>
                </div>
                <div class="text-white text-xl font-mono">120 BPM</div>
              </div>

              <!-- Tracks -->
              <div class="lg:col-span-3 space-y-3">
                <div v-for="i in 4" :key="i" class="bg-gray-700 rounded-lg p-4 flex items-center space-x-4">
                  <div class="w-16 h-8 bg-purple-500 rounded"></div>
                  <div class="flex-1 h-8 bg-gray-600 rounded relative">
                    <div class="absolute left-4 top-0 w-24 h-full bg-blue-500 rounded opacity-75"></div>
                    <div class="absolute left-32 top-0 w-16 h-full bg-green-500 rounded opacity-75"></div>
                  </div>
                </div>
              </div>

              <!-- Controls -->
              <div class="space-y-4">
                <div class="bg-gray-700 rounded-lg p-4">
                  <h3 class="text-white font-semibold mb-3">Master</h3>
                  <div class="space-y-2">
                    <div class="h-2 bg-gray-600 rounded-full">
                      <div class="h-2 bg-purple-500 rounded-full w-3/4"></div>
                    </div>
                    <div class="h-2 bg-gray-600 rounded-full">
                      <div class="h-2 bg-blue-500 rounded-full w-1/2"></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>

    <!-- Features Section -->
    <section id="features" class="relative z-10 py-20 bg-black bg-opacity-30">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="text-center mb-16">
          <h2 class="text-4xl font-bold text-white mb-4">Powerful Features</h2>
          <p class="text-xl text-gray-300">Everything you need to create professional music</p>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div class="bg-gray-800 bg-opacity-50 backdrop-blur-lg rounded-xl p-8 border border-gray-700">
            <div class="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center mb-6">
              <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path>
              </svg>
            </div>
            <h3 class="text-xl font-semibold text-white mb-4">Real-time Collaboration</h3>
            <p class="text-gray-300">Work together with musicians worldwide. See changes instantly and create music in perfect sync.</p>
          </div>

          <div class="bg-gray-800 bg-opacity-50 backdrop-blur-lg rounded-xl p-8 border border-gray-700">
            <div class="w-16 h-16 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center mb-6">
              <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3"></path>
              </svg>
            </div>
            <h3 class="text-xl font-semibold text-white mb-4">Professional Audio Engine</h3>
            <p class="text-gray-300">Built on Tone.js with support for MIDI, virtual instruments, and high-quality audio processing.</p>
          </div>

          <div class="bg-gray-800 bg-opacity-50 backdrop-blur-lg rounded-xl p-8 border border-gray-700">
            <div class="w-16 h-16 bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg flex items-center justify-center mb-6">
              <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9v-9m0-9v9"></path>
              </svg>
            </div>
            <h3 class="text-xl font-semibold text-white mb-4">Browser-Based</h3>
            <p class="text-gray-300">No downloads required. Access your projects from anywhere with just a web browser.</p>
          </div>
        </div>
      </div>
    </section>

    <!-- Footer -->
    <footer class="relative z-10 py-12 border-t border-gray-800">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="text-center">
          <div class="flex items-center justify-center space-x-3 mb-4">
            <div class="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
              <span class="text-white font-bold">♪</span>
            </div>
            <span class="text-xl font-bold text-white">CollabDAW</span>
          </div>
          <p class="text-gray-400">© 2024 CollabDAW. Built with Vue.js, Tone.js, and ❤️</p>
        </div>
      </div>
    </footer>
  </div>
</template>

<script>
export default {
  name: 'LandingPage'
}
</script>

<style scoped>
.animation-delay-2000 {
  animation-delay: 2s;
}

.animation-delay-4000 {
  animation-delay: 4s;
}
</style> 