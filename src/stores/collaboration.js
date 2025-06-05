import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { WebsocketProvider } from 'y-websocket';
import { Doc } from 'yjs';

export const useCollaborationStore = defineStore('collaboration', () => {
  // Connection state
  const isConnected = ref(false);
  const connectionStatus = ref('disconnected');
  const users = ref(new Map());
  const currentUser = ref(null);
  
  // Yjs document and provider
  let doc = null;
  let provider = null;
  
  // Initialize collaboration
  function initializeCollaboration(roomId = 'daw-room') {
    try {
      // Create Yjs document
      doc = new Doc();
      
      // Create WebSocket provider
      provider = new WebsocketProvider('ws://localhost:1234', roomId, doc);
      
      // Set up connection listeners
      provider.on('status', (event) => {
        connectionStatus.value = event.status;
        isConnected.value = event.status === 'connected';
        console.log('WebSocket status:', event.status);
      });
      
      // Handle awareness (user presence)
      if (provider.awareness) {
        provider.awareness.on('change', () => {
          updateUserPresence();
        });
        
        // Set local user info
        setLocalUser({
          id: Math.random().toString(36).substr(2, 9),
          name: `User ${Math.floor(Math.random() * 1000)}`,
          color: `hsl(${Math.floor(Math.random() * 360)}, 70%, 50%)`
        });
      }
      
      console.log('Collaboration initialized');
      return doc;
    } catch (error) {
      console.error('Failed to initialize collaboration:', error);
      connectionStatus.value = 'error';
      return null;
    }
  }
  
  function setLocalUser(user) {
    currentUser.value = user;
    if (provider && provider.awareness) {
      provider.awareness.setLocalStateField('user', user);
    }
  }
  
  function updateUserPresence() {
    if (!provider || !provider.awareness) return;
    
    const states = provider.awareness.getStates();
    const newUsers = new Map();
    
    states.forEach((state, clientId) => {
      if (state.user) {
        newUsers.set(clientId, state.user);
      }
    });
    
    users.value = newUsers;
  }
  
  function disconnect() {
    if (provider) {
      provider.destroy();
      provider = null;
    }
    if (doc) {
      doc.destroy();
      doc = null;
    }
    isConnected.value = false;
    connectionStatus.value = 'disconnected';
    users.value.clear();
  }
  
  // Computed properties
  const userCount = computed(() => users.value.size);
  const usersList = computed(() => Array.from(users.value.values()));
  
  return {
    // State
    isConnected,
    connectionStatus,
    users,
    currentUser,
    userCount,
    usersList,
    
    // Actions
    initializeCollaboration,
    setLocalUser,
    disconnect,
    
    // Getters for Yjs objects
    getDoc: () => doc,
    getProvider: () => provider
  };
}); 