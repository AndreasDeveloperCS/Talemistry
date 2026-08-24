# Video Chat - Multi-Participant WebRTC Implementation

## Features

✅ **Multiple Participants** - Support for unlimited participants with auto-responsive grid layout  
✅ **Screen Sharing** - Each participant can share their screen independently  
✅ **Custom STUN/TURN** - Configurable ICE servers for your infrastructure  
✅ **Responsive Grid** - Auto-adjusts based on participant count  
✅ **Connection Monitoring** - Real-time ICE and connection state logging  

---

## Architecture Overview

### Frontend (`RTCAdvancedService`)
- Manages WebRTC peer connections
- Handles local media (camera + screen)
- Coordinates with signaling server via Socket.IO
- Supports custom STUN/TURN server configuration

### Backend (`RTCGateway`)
- WebSocket signaling server
- Routes SDP offers/answers between peers
- Manages ICE candidate exchange
- Tracks room participants

---

## Using Custom STUN/TURN Servers

### Option 1: Configure in Service (Static)

```typescript
// In your component or app initialization
import { RTCAdvancedService } from './services/RTC-advanced.service';

constructor(private rtcService: RTCAdvancedService) {
  // Set custom servers before connecting
  this.rtcService.setIceServers([
    { urls: 'stun:stun.yourdomain.com:3478' },
    {
      urls: ['turn:turn.yourdomain.com:3478?transport=udp'],
      username: 'your-username',
      credential: 'your-password'
    }
  ]);
}
```

### Option 2: Use Configuration File

```typescript
import { DEFAULT_ICE_SERVERS } from '../config/ice-servers.config';

this.rtcService.setIceServers(DEFAULT_ICE_SERVERS);
```

### Option 3: Fetch from Backend (Dynamic, Recommended)

```typescript
// Backend returns time-limited TURN credentials
async ngOnInit() {
  const config = await this.socket.emit('get-ice-servers');
  this.rtcService.setIceServers(config.iceServers);
}
```

---

## Grid Layout Behavior

| Participants | Layout |
|--------------|--------|
| 1 | Full screen |
| 2 | 2 columns |
| 3-4 | 2x2 grid |
| 5-6 | 3x2 grid |
| 7+ | 3 columns, auto rows |

**With Screen Share:** Screen takes 75% width, participants in sidebar (25%)

---

## Setting Up Your Own STUN/TURN Server (coturn)

### 1. Install coturn

```bash
# Ubuntu/Debian
sudo apt update
sudo apt install coturn

# Enable at startup
sudo systemctl enable coturn
```

### 2. Configure `/etc/turnserver.conf`

```ini
# Listening ports
listening-port=3478
tls-listening-port=5349

# Your server's public IP
external-ip=YOUR_PUBLIC_IP/PRIVATE_IP

# Realm (domain)
realm=yourdomain.com
server-name=turn.yourdomain.com

# Authentication mode
lt-cred-mech
user=myuser:mypassword

# Security
fingerprint
no-multicast-peers

# Relay IP range (optional)
min-port=49152
max-port=65535

# Logging
log-file=/var/log/turnserver.log
verbose
```

### 3. Open Firewall Ports

```bash
sudo ufw allow 3478/tcp
sudo ufw allow 3478/udp
sudo ufw allow 5349/tcp
sudo ufw allow 5349/udp
sudo ufw allow 49152:65535/udp  # For media relay
```

### 4. Start Service

```bash
sudo systemctl start coturn
sudo systemctl status coturn

# Check logs
sudo tail -f /var/log/turnserver.log
```

### 5. Test Your STUN/TURN Server

Use online testers:
- https://webrtc.github.io/samples/src/content/peerconnection/trickle-ice/
- https://icetest.info/

Or test from browser console:
```javascript
const pc = new RTCPeerConnection({
  iceServers: [
    { urls: 'stun:your-server.com:3478' },
    { 
      urls: 'turn:your-server.com:3478',
      username: 'myuser',
      credential: 'mypassword'
    }
  ]
});

pc.createDataChannel('test');
pc.createOffer().then(offer => pc.setLocalDescription(offer));
pc.onicecandidate = (e) => console.log('ICE:', e.candidate);
```

---

## Dynamic TURN Credentials (Recommended for Production)

Instead of hardcoding credentials, generate time-limited ones:

### Backend (Node.js example)

```typescript
import * as crypto from 'crypto';

function generateTurnCredentials(username: string, secret: string, ttl: number = 86400) {
  const timestamp = Math.floor(Date.now() / 1000) + ttl;
  const turnUsername = `${timestamp}:${username}`;
  const hmac = crypto.createHmac('sha1', secret);
  hmac.update(turnUsername);
  const turnPassword = hmac.digest('base64');

  return {
    username: turnUsername,
    credential: turnPassword,
    ttl: ttl
  };
}

// In your RTCGateway
@SubscribeMessage('get-ice-servers')
onGetIceServers(@ConnectedSocket() client: Socket) {
  const { username, credential } = generateTurnCredentials(
    client.id, 
    'your-shared-secret',  // Same as in turnserver.conf
    3600  // 1 hour
  );

  return {
    ok: true,
    iceServers: [
      { urls: 'stun:stun.yourdomain.com:3478' },
      {
        urls: 'turn:turn.yourdomain.com:3478',
        username,
        credential
      }
    ]
  };
}
```

Update `/etc/turnserver.conf`:
```ini
use-auth-secret
static-auth-secret=your-shared-secret
```

---

## Connection State Monitoring

The service now logs detailed connection states:

```
🔗 Creating peer connection to abc123 (initiator: true)
   ICE Servers: stun:stun.l.google.com:19302
🧊 ICE candidate for abc123: host
🧊 ICE candidate for abc123: srflx
✅ ICE gathering complete for abc123
🔌 ICE connection state for abc123: checking
🔌 ICE connection state for abc123: connected
📡 Connection state for abc123: connected
```

If you see `failed` states, you likely need a TURN server.

---

## Troubleshooting

### Camera/Screen not working
- Check browser permissions
- Ensure HTTPS (required for getUserMedia)
- Close other apps using camera (Zoom, Teams)

### Peers can't connect
- **Symptom:** ICE state stays in "checking" or "failed"
- **Solution:** You need a TURN server (peers behind symmetric NAT)
- Check firewall/security groups allow UDP 49152-65535

### Screen share layout issues
- Clear browser cache
- Check console for errors
- Verify `allStreams` array is updating

### Backend not receiving events
- Check Socket.IO namespace matches: `/ws/rtc`
- Verify CORS settings
- Check backend logs for connection

---

## How STUN Works (Detailed)

```
┌─────────┐                ┌──────────┐                ┌─────────┐
│ Browser │                │   STUN   │                │ Browser │
│    A    │                │  Server  │                │    B    │
└────┬────┘                └────┬─────┘                └────┬────┘
     │                          │                          │
     │  1. Binding Request      │                          │
     ├─────────────────────────>│                          │
     │  "What's my public IP?"  │                          │
     │                          │                          │
     │  2. Binding Response     │                          │
     │<─────────────────────────┤                          │
     │  "You're 203.0.113.5:54321"                        │
     │                          │                          │
     │  3. Share via Signaling  │                          │
     ├──────────────────────────┼─────────────────────────>│
     │  "Connect to 203.0.113.5:54321"                    │
     │                          │                          │
     │  4. Direct P2P Connection                          │
     │<───────────────────────────────────────────────────>│
     │         Media flows directly (no server!)          │
     └────────────────────────────────────────────────────┘
```

**Key Points:**
- STUN only helps with address discovery
- Once connected, media flows peer-to-peer
- If NAT is symmetric or strict, TURN is needed
- TURN relays all media (bandwidth intensive)

---

## API Reference

### RTCAdvancedService

#### Methods

```typescript
// Set custom ICE servers
setIceServers(servers: IceServerConfig[]): void

// Get current ICE server config
getIceServers(): IceServerConfig[]

// Connect to signaling server
connect(token?: string): Promise<void>

// Initialize local camera
initLocalCamera(): Promise<MediaStream>

// Initialize screen sharing
initLocalScreen(): Promise<MediaStream>

// Join a room
joinRoom(roomId: string): void

// Leave room and cleanup
leaveRoom(): void

// Toggle audio/video
toggleAudio(enabled: boolean): void
toggleVideo(enabled: boolean): void

// Start screen sharing alongside camera
startScreenShareSimultaneously(): Promise<MediaStream>

// Stop screen sharing
stopScreenShare(): void

// Get remote streams as observable
getRemoteStreams$(): Observable<MediaStream[]>

// Get current snapshot of remote streams
getRemoteStreamsSnapshot(): MediaStream[]
```

---

## Performance Tips

1. **Limit video resolution** for many participants:
   ```typescript
   const stream = await navigator.mediaDevices.getUserMedia({
     video: { width: 640, height: 480 },
     audio: true
   });
   ```

2. **Use simulcast** for scalable video (advanced):
   ```typescript
   sender.setParameters({
     encodings: [
       { rid: 'h', maxBitrate: 900000 },
       { rid: 'm', maxBitrate: 300000, scaleResolutionDownBy: 2 },
       { rid: 'l', maxBitrate: 100000, scaleResolutionDownBy: 4 }
     ]
   });
   ```

3. **Monitor bandwidth:**
   ```typescript
   setInterval(async () => {
     const stats = await pc.getStats();
     stats.forEach(report => {
       if (report.type === 'inbound-rtp' && report.mediaType === 'video') {
         console.log('Bitrate:', report.bytesReceived);
       }
     });
   }, 1000);
   ```

---

## License

MIT

## Support

For issues, check:
- Browser console for errors
- Backend logs for signaling issues
- coturn logs for TURN problems
