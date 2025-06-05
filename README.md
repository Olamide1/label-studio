# CollabDAW - Collaborative Digital Audio Workstation

A browser-based collaborative Digital Audio Workstation built with Vue.js, Tone.js, and Yjs for real-time music production with multiple users.

## ✨ Features

- 🎵 **Professional Audio Engine** - Built on Tone.js with MIDI synthesizers and drum machines
- 🤝 **Real-time Collaboration** - Multiple users can work on the same project simultaneously
- 🎹 **MIDI Editor** - Create and edit MIDI clips with note management
- 🎚️ **Track Management** - Volume controls, mute/solo, and track creation
- 🎯 **Transport Controls** - Play, pause, stop with BPM synchronization
- 🌐 **Browser-based** - No downloads required, works in any modern web browser
- 🎨 **Modern UI** - Professional DAW interface with glassmorphism design

## 🚀 Quick Start

### Prerequisites

- Node.js 16+ 
- npm or yarn
- Modern web browser with Web Audio API support

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/Olamide1/label-studio.git
   cd label-studio
   ```

2. **Install dependencies**
   ```bash
   # Install main project dependencies
   npm install
   
   # Install server dependencies
   cd server && npm install && cd ..
   ```

### Running the Application

**You need to run both the collaboration server and the Vue.js app:**

1. **Start the WebSocket collaboration server** (Terminal 1)
   ```bash
   npm run server
   ```
   
   The server will start on `ws://localhost:1234`
   
   ✅ **Health check**: Visit `http://localhost:1234/health` to verify the server is running

2. **Start the Vue.js application** (Terminal 2)
   ```bash
   npm run dev
   ```
   
   The app will start on `http://localhost:5173`

3. **Open your browser** and navigate to `http://localhost:5173`

## 🎵 How to Use

### Getting Started
1. **Landing Page** - Click "Launch Studio" or "Start Creating Now"
2. **Initialize Audio** - Click the play button to initialize the Web Audio context
3. **Add Tracks** - Use "+ MIDI" or "+ Drums" buttons to create tracks
4. **Test Audio** - Click "TEST" on any track to hear a sample sound
5. **Collaboration** - Share the URL with others to collaborate in real-time

### Track Controls
- **Volume Slider** - Adjust track volume (0-100%)
- **MUTE** - Mute the track (red when active)
- **SOLO** - Solo the track (yellow when active)  
- **TEST** - Play a random note to test the track

### Transport Controls
- **Play** ▶️ - Start playback
- **Pause** ⏸️ - Pause playback
- **Stop** ⏹️ - Stop and reset to beginning
- **BPM** - Set the project tempo (60-200 BPM)
- **Metronome** - Enable/disable click track

### Collaboration Features
- **Connection Status** - Green dot = connected, Red dot = disconnected
- **User Count** - See how many users are currently connected
- **Real-time Sync** - All changes are immediately shared with other users

## 📁 Project Structure

```
label-studio/
├── src/
│   ├── views/
│   │   ├── LandingPage.vue     # Modern landing page
│   │   └── Studio.vue          # Main DAW interface
│   ├── stores/
│   │   ├── audio.js           # Tone.js audio engine
│   │   ├── collaboration.js   # WebSocket/Yjs collaboration
│   │   └── project.js         # Project state management
│   ├── components/
│   │   └── MidiEditor.vue     # MIDI clip editor
│   └── router/
│       └── index.js           # Vue Router configuration
├── server/
│   └── src/
│       └── index.js           # WebSocket collaboration server
├── package.json               # Main dependencies
└── README.md                  # This file
```

## 🛠️ Development

### Available Scripts

```bash
# Development
npm run dev          # Start Vue.js dev server
npm run server       # Start collaboration server
npm run build        # Build for production
npm run preview      # Preview production build

# Server only
cd server
npm run dev          # Start server directly
npm run start        # Start server (production)
```

### Technology Stack

- **Frontend**: Vue.js 3, Vite, Tailwind CSS, Pinia
- **Audio**: Tone.js (Web Audio API)
- **Collaboration**: Yjs, y-websocket
- **Server**: Node.js, WebSocket

## 🐛 Troubleshooting

### Common Issues

**1. "Missing script: server" error**
- Make sure you're running `npm run server` from the **root directory**, not inside the `server/` folder

**2. WebSocket connection failed**
- Ensure the server is running on port 1234
- Check firewall settings
- Verify `http://localhost:1234/health` returns a JSON response

**3. Audio not working**
- Click the play button to initialize Web Audio context
- Check browser permissions for audio
- Ensure you're using HTTPS in production (required for Web Audio)

**4. Import/Export errors**
- If you get module resolution errors, try deleting `node_modules` and reinstalling:
  ```bash
  rm -rf node_modules server/node_modules
  npm install
  cd server && npm install
  ```

### Browser Compatibility

- Chrome 66+
- Firefox 60+
- Safari 11.1+
- Edge 79+

*Web Audio API and WebSocket support required*

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Commit changes: `git commit -am 'Add feature'`
4. Push to branch: `git push origin feature-name`
5. Submit a Pull Request

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

## 🎵 Credits

Built with ❤️ using:
- [Vue.js](https://vuejs.org/) - Progressive JavaScript framework
- [Tone.js](https://tonejs.github.io/) - Web Audio framework
- [Yjs](https://yjs.dev/) - Shared data types for building collaborative software
- [Tailwind CSS](https://tailwindcss.com/) - Utility-first CSS framework

---

**Ready to make music together? Start collaborating now! 🎶**
