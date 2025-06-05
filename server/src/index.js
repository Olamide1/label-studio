import { WebSocketServer } from 'ws'
import { setupWSConnection } from 'y-websocket/bin/utils.js'
import http from 'http'
import url from 'url'

const HOST = process.env.HOST || 'localhost'
const PORT = process.env.PORT || 1234

console.log('Starting Collaborative DAW WebSocket Server...')

// Create HTTP server for health checks
const server = http.createServer((req, res) => {
  const parsedUrl = url.parse(req.url, true)
  
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  
  if (req.method === 'OPTIONS') {
    res.writeHead(200)
    res.end()
    return
  }
  
  // Health check endpoint
  if (parsedUrl.pathname === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ 
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime()
    }))
    return
  }
  
  // Default response
  res.writeHead(200, { 'Content-Type': 'text/plain' })
  res.end('Collaborative DAW WebSocket Server is running')
})

// Create WebSocket server
const wss = new WebSocketServer({ server })

// Set up Y.js WebSocket handling
wss.on('connection', (ws, req) => {
  console.log('New WebSocket connection established')
  
  // This is where y-websocket handles the Yjs document synchronization
  setupWSConnection(ws, req)
  
  ws.on('close', () => {
    console.log('WebSocket connection closed')
  })
  
  ws.on('error', (error) => {
    console.error('WebSocket error:', error)
  })
})

wss.on('error', (error) => {
  console.error('WebSocket Server error:', error)
})

// Start the server
server.listen(PORT, HOST, () => {
  console.log(`✅ Collaborative DAW Server running on ws://${HOST}:${PORT}`)
  console.log(`📊 Health check available at http://${HOST}:${PORT}/health`)
  console.log(`🎵 Ready for real-time music collaboration!`)
})

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('Shutting down server...')
  server.close(() => {
    console.log('Server closed')
    process.exit(0)
  })
})

process.on('SIGTERM', () => {
  console.log('Shutting down server...')
  server.close(() => {
    console.log('Server closed')
    process.exit(0)
  })
}) 