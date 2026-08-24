# Quick Start Guide - Video Chat

## ✅ All Fixed and Ready!

The video chat system is now fully functional with:
- ✅ Multi-participant support with responsive grid layout
- ✅ Screen sharing for all participants
- ✅ Custom STUN/TURN server support
- ✅ Enhanced connection monitoring
- ✅ All TypeScript errors resolved

---

## 🚀 Running the Application

### 1. Install Dependencies

#### Frontend (tab-frontend)
```powershell
cd C:\PROJECTS\Evridis\tab-frontend

# Clean install
Remove-Item -Recurse -Force node_modules -ErrorAction SilentlyContinue
Remove-Item -Force package-lock.json -ErrorAction SilentlyContinue

# Install with legacy peer deps (recommended)
npm install --legacy-peer-deps
```

#### Backend
```powershell
cd C:\PROJECTS\Evridis\backend

npm install
```

---

### 2. Start the Services

#### Terminal 1: Backend (NestJS)
```powershell
cd C:\PROJECTS\Evridis\backend
npm run start:dev
```

Backend will start on: `http://localhost:3000` (or your configured port)
WebSocket namespace: `/ws/rtc`

#### Terminal 2: Frontend (Angular)
```powershell
cd C:\PROJECTS\Evridis\tab-frontend
ng serve
```

Frontend will start on: `http://localhost:4200`

---

### 3. Test the Video Chat

1. **Open browser**: Navigate to `http://localhost:4200`
2. **Login** to your application
3. **Navigate to Video Chat**: `/recruitment/communication/video-chat/:roomId`
4. **Allow permissions**: Camera and microphone access
5. **Test features**:
   - Camera on/off
   - Microphone on/off
   - Screen sharing
   - Multiple participants (open in multiple tabs/browsers)

---

## 🎯 Key Features Implemented

### 1. Responsive Grid Layout
- **1 participant**: Full screen
- **2 participants**: Side-by-side
- **3-4 participants**: 2×2 grid
- **5-6 participants**: 3×2 grid
- **7+ participants**: 3-column auto-grid
- **Screen sharing active**: Screen takes 75%, participants in sidebar

### 2. Screen Sharing
- Each participant can share independently
- Multiple screen shares supported simultaneously
- Automatic detection and layout adjustment
- Manual stop detection

### 3. Custom STUN/TURN Servers

**Configure in component:**
```typescript
import { RTCAdvancedService } from './services/RTC-advanced.service';

constructor(private rtcService: RTCAdvancedService) {
  this.rtcService.setIceServers([
    { urls: 'stun:your-server.com:3478' },
    {
      urls: 'turn:your-server.com:3478',
      username: 'user',
      credential: 'pass'
    }
  ]);
}
```

**Or fetch from backend:**
```typescript
// Backend returns dynamic credentials
this.socket.emit('get-ice-servers', (config) => {
  this.rtcService.setIceServers(config.iceServers);
});
```

### 4. Enhanced Logging
Monitor connection states in browser console:
- 🔗 Peer connection creation
- 🧊 ICE candidate exchange
- 🔌 Connection state changes
- 📡 ICE connection states
- ✅ Successful connections
- ❌ Failed connections (need TURN server)

---

## 🐛 Troubleshooting

### Issue: Camera/Microphone Not Working

**Solution:**
1. Ensure using HTTPS or localhost
2. Check browser permissions (click lock icon in address bar)
3. Close other apps using camera (Zoom, Teams, Skype)
4. Try different browser (Chrome recommended)

### Issue: Screen Share Not Working

**Solution:**
1. Must be triggered by user click (not automatic)
2. Check browser permissions
3. Ensure browser supports `getDisplayMedia` API
4. For Firefox: Enable `media.getdisplaymedia.enabled` in `about:config`

### Issue: Peers Can't Connect

**Symptoms:**
- ICE state stuck in "checking"
- Console shows "failed" connection state

**Solution:**
1. **You need a TURN server** - STUN alone isn't enough for symmetric NAT
2. Set up coturn server (see README-VIDEO-CHAT.md)
3. Configure TURN credentials in backend or frontend

### Issue: Layout Issues

**Solution:**
1. Clear browser cache
2. Check `allStreams` array in component
3. Verify CSS grid styles are loading
4. Check browser console for errors

### Issue: No Remote Video

**Solution:**
1. Check backend is running and WebSocket is connected
2. Verify namespace matches: `/ws/rtc`
3. Check CORS settings in backend
4. Verify both peers are in same room
5. Check browser console for signaling errors

---

## 📊 Connection State Meanings

| State | Meaning | Action |
|-------|---------|--------|
| `new` | Initial state | Normal |
| `checking` | Trying to connect | Wait... |
| `connected` | ✅ Connected! | Success |
| `completed` | ✅ All done | Success |
| `failed` | ❌ Can't connect | Need TURN server |
| `disconnected` | Temporarily lost | May reconnect |
| `closed` | Connection ended | Normal cleanup |

---

## 🔒 Security Recommendations

### Production Checklist

1. **Use HTTPS** - Required for getUserMedia
2. **Dynamic TURN credentials** - Don't hardcode passwords
3. **Rate limiting** - Prevent signaling abuse
4. **Authentication** - Verify users before joining rooms
5. **Room access control** - Check permissions
6. **CORS properly configured** - Only allow your domains

### Example: Dynamic TURN Credentials

Backend generates time-limited credentials:
```typescript
import * as crypto from 'crypto';

function generateTurnCredentials(username: string, secret: string, ttl = 3600) {
  const timestamp = Math.floor(Date.now() / 1000) + ttl;
  const turnUsername = `${timestamp}:${username}`;
  const hmac = crypto.createHmac('sha1', secret);
  hmac.update(turnUsername);
  const turnPassword = hmac.digest('base64');
  
  return { username: turnUsername, credential: turnPassword };
}

// In RTCGateway
@SubscribeMessage('get-ice-servers')
onGetIceServers(@ConnectedSocket() client: Socket) {
  const { username, credential } = generateTurnCredentials(
    client.id,
    process.env.TURN_SECRET, // From environment
    3600
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

---

## 📈 Performance Optimization

### For Many Participants (5+)

1. **Reduce video resolution:**
```typescript
const stream = await navigator.mediaDevices.getUserMedia({
  video: { width: 640, height: 480, frameRate: 24 },
  audio: true
});
```

2. **Implement SFU** (Selective Forwarding Unit)
   - Instead of mesh (peer-to-peer)
   - Server forwards streams to reduce bandwidth
   - Libraries: mediasoup, Janus, Jitsi

3. **Use VP9 codec:**
```typescript
const sender = pc.getSenders().find(s => s.track?.kind === 'video');
const params = sender.getParameters();
params.codecs = params.codecs.filter(c => c.mimeType === 'video/VP9');
await sender.setParameters(params);
```

---

## 📚 Additional Resources

- **Full Documentation**: `README-VIDEO-CHAT.md`
- **ICE Server Config**: `config/ice-servers.config.ts`
- **Environment Example**: `config/environment.example.ts`
- **NPM Install Issues**: `NPM-INSTALL-FIX.md`

---

## 🎉 You're All Set!

The video chat is now fully functional. Start both backend and frontend, navigate to a video chat room, and test all features!

For production deployment:
1. Set up your own STUN/TURN servers
2. Configure dynamic credentials
3. Use HTTPS
4. Test with users behind different NAT types
5. Monitor bandwidth and connection quality

**Need Help?**
- Check browser console for errors
- Check backend logs for signaling issues
- Review `README-VIDEO-CHAT.md` for detailed guides
- Test STUN/TURN servers using online testers
