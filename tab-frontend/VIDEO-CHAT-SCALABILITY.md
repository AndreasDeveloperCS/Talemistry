# Video Chat Scalability & Architecture Guide

## Current Implementation

The video chat system uses **WebRTC peer-to-peer (mesh) architecture** with Socket.IO signaling.

### Architecture Overview

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  Client A   │────→│  Client B   │────→│  Client C   │
│             │←────│             │←────│             │
└─────────────┘  │  └─────────────┘  │  └─────────────┘
                 │                    │
                 └────────────────────┘
                    Direct P2P Mesh
```

**Backend:** NestJS signaling server (`rtc.gateway.ts`)  
**Frontend:** Angular service (`RTCAdvancedService`)  
**Protocols:** WebRTC (video/audio), Socket.IO (signaling), STUN/TURN (NAT traversal)

---

## Performance Characteristics

### Mesh Architecture (Current)

| Participant Count | Connections Per Client | Network Load | CPU Load | Recommended |
|-------------------|------------------------|--------------|----------|-------------|
| **2-4 users**     | 1-3 connections        | ✅ Low       | ✅ Low   | ✅ Excellent |
| **5-8 users**     | 4-7 connections        | ⚠️ Medium    | ⚠️ Medium | ⚠️ Acceptable |
| **9-15 users**    | 8-14 connections       | ❌ High      | ❌ High  | ❌ Poor      |
| **16-100 users**  | 15-99 connections      | ❌ Very High | ❌ Very High | ❌ Not viable |

**Why mesh doesn't scale:**
- Each participant maintains N-1 peer connections (where N = total participants)
- Bandwidth: O(N²) scaling - exponential growth
- CPU: Each stream must be encoded/decoded N-1 times
- 10 participants = 9 connections × 2 streams (camera + screen) = 18 simultaneous video streams per client

---

## Current Optimizations (Implemented)

✅ **Simultaneous screen share + camera** - Efficient track management  
✅ **Audio echo cancellation** - Local streams always muted for playback  
✅ **Speaking detection** - Web Audio API for real-time audio level analysis  
✅ **Adaptive UI grid** - Responsive layouts for 1-49 participants  
✅ **TURN fallback** - Configured at `evryka.org:3478/5349` for restrictive NAT  
✅ **Audio-only mode** - Graceful fallback when camera unavailable  
✅ **Efficient re-rendering** - ChangeDetection.OnPush + BehaviorSubject streams  

---

## Scalability Solutions

### Option 1: SFU (Selective Forwarding Unit) - **RECOMMENDED**

For **10-100+ participants**, implement an SFU architecture:

```
┌─────────────┐     ┌─────────────────┐     ┌─────────────┐
│  Client A   │────→│   SFU Server    │←────│  Client B   │
│             │←────│  (Mediasoup)    │────→│             │
└─────────────┘     └─────────────────┘     └─────────────┘
                            ↕
                     ┌─────────────┐
                     │  Client C   │
                     └─────────────┘
```

**How it works:**
- Each client sends 1 stream to SFU
- SFU forwards streams to all participants
- Bandwidth: O(N) scaling - linear growth
- CPU: Encoding once, server handles distribution

#### Recommended SFU Solutions

| Solution | Best For | Backend | Complexity |
|----------|----------|---------|------------|
| **Mediasoup** | 50-1000 users | Node.js | Medium |
| **Janus Gateway** | 20-500 users | C (with REST API) | High |
| **LiveKit** | 10-100 users | Go | Low (managed) |
| **Jitsi Videobridge** | 20-200 users | Java | Medium |

### Option 2: MCU (Multipoint Control Unit)

For **100-1000+ participants** (webinar style):
- Server mixes all streams into single composite
- Each client receives 1 stream
- High CPU on server, lowest bandwidth for clients
- Best for one-to-many (presenter + audience)

### Option 3: Hybrid SFU + Simulcast

For **premium experience**:
- Clients send multiple quality tiers (720p, 480p, 180p)
- SFU selects appropriate quality per receiver
- Adaptive bitrate based on network conditions

---

## Implementation Recommendations

### For Your Use Case (2-100 participants)

| Scenario | Recommendation | Implementation |
|----------|----------------|----------------|
| **2-8 users** (meetings) | ✅ Keep current P2P mesh | No changes needed |
| **9-20 users** (team calls) | ⚠️ Add bandwidth warnings | Monitor network stats |
| **21-100 users** (all-hands) | ❌ Migrate to SFU | See migration guide below |

### Migration to SFU (Mediasoup Example)

#### 1. Backend Changes

**Install Mediasoup:**
```bash
cd backend
npm install mediasoup
```

**Create SFU service** (`backend/src/app/modules/communication/services/mediasoup.service.ts`):
```typescript
import * as mediasoup from 'mediasoup';

@Injectable()
export class MediasoupService {
  private worker: mediasoup.types.Worker;
  private routers = new Map<string, mediasoup.types.Router>();

  async init() {
    this.worker = await mediasoup.createWorker({
      rtcMinPort: 40000,
      rtcMaxPort: 49999,
    });
  }

  async createRouter(roomId: string) {
    const router = await this.worker.createRouter({
      mediaCodecs: [
        { kind: 'audio', mimeType: 'audio/opus', clockRate: 48000, channels: 2 },
        { kind: 'video', mimeType: 'video/VP8', clockRate: 90000 },
      ],
    });
    this.routers.set(roomId, router);
    return router;
  }
}
```

#### 2. Frontend Changes

**Update RTCAdvancedService:**
```typescript
// Instead of creating peer connections to each client:
// OLD: createPeerConnection(remoteId, initiator)

// NEW: Connect to SFU
async connectToSFU(roomId: string) {
  const device = new mediasoupClient.Device();
  
  // Get router RTP capabilities from server
  const routerRtpCapabilities = await this.socket.emitWithAck('getRouterCapabilities');
  await device.load({ routerRtpCapabilities });

  // Create send transport for local media
  const sendTransport = await this.createSendTransport(device);
  
  // Create receive transport for remote media
  const recvTransport = await this.createReceiveTransport(device);
  
  // Produce local camera/screen tracks
  await this.produceMedia(sendTransport);
  
  // Consume remote tracks as they arrive
  this.consumeRemoteStreams(recvTransport);
}
```

#### 3. Estimated Effort

- **Backend SFU integration:** 2-3 days
- **Frontend refactoring:** 1-2 days
- **Testing & optimization:** 2-3 days
- **Total:** 1-2 weeks

---

## Current System Capabilities

### Audio Features ✅
- ✅ Echo cancellation (local mute)
- ✅ Speaking detection with visual indicators
- ✅ Audio level visualization
- ✅ Mute controls (microphone + speakers)
- ✅ Audio-only fallback mode

### Video Features ✅
- ✅ Camera + screen share simultaneously
- ✅ 3 layout modes (grid, ribbon, overlay)
- ✅ Adaptive UI for 1-49 participants
- ✅ Speaking indicators (purple glowing border)
- ✅ Participant count display
- ✅ Audio-only avatars with animations

### Network Features ✅
- ✅ STUN server (`stun:evryka.org:3478`)
- ✅ TURN UDP (`turn:evryka.org:3478`)
- ✅ TURN TCP (`turn:evryka.org:3478?transport=tcp`)
- ✅ TURN over TLS (`turns:evryka.org:5349`)

---

## Testing Scalability

### Load Testing Commands

**2-5 participants:**
```bash
# Open multiple browser tabs - should work smoothly
```

**6-10 participants:**
```bash
# Use multiple devices or browser profiles
# Monitor CPU (should stay under 50%)
# Monitor network (upload < 10 Mbps per client)
```

**10+ participants:**
```bash
# Expect performance degradation
# Network upload will exceed 15-20 Mbps
# CPU usage > 70%
# Video quality drops
# Freezing/stuttering likely
```

### Browser DevTools Monitoring

```javascript
// Check active peer connections
console.log(Object.keys(rtcService.peers).length);

// Monitor bandwidth (Chrome://webrtc-internals)
// Look for "bytesSent" and "bytesReceived" metrics
```

---

## Production Recommendations

### For 2-10 Users (Current Architecture OK)
- ✅ Use current P2P mesh
- ✅ Enable TURN server for enterprise firewalls
- ✅ Set bitrate limits (max 2.5 Mbps per stream)
- ✅ Monitor network quality with WebRTC stats

### For 11-100 Users (Migrate to SFU)
- ❌ P2P mesh will fail
- ✅ Deploy Mediasoup SFU
- ✅ Use AWS EC2 c5.2xlarge (8 vCPU, 16GB RAM)
- ✅ Allocate 4 Mbps bandwidth per participant
- ✅ Enable simulcast (3 quality tiers)

### For 100-1000 Users (MCU or Commercial Solution)
- ✅ Use managed service: **Agora**, **Twilio**, **Daily.co**
- ✅ Or deploy MCU with Jitsi Videobridge
- ✅ Dedicated servers: 16+ vCPU, 32GB+ RAM
- ✅ 10 Gbps network capacity

---

## Cost Estimates

### Self-Hosted SFU (AWS)

| Participants | EC2 Instance | Monthly Cost |
|--------------|--------------|--------------|
| 10-20        | c5.xlarge    | ~$120        |
| 20-50        | c5.2xlarge   | ~$240        |
| 50-100       | c5.4xlarge   | ~$480        |

### Managed Services

| Provider | Cost Model | 100 participants |
|----------|-----------|------------------|
| **Agora** | $0.99/1000 min | ~$150/month |
| **Twilio** | $0.004/min | ~$240/month |
| **Daily.co** | $99 + usage | ~$200/month |
| **LiveKit** | Self-host or cloud | ~$180/month |

---

## Next Steps

1. **Test current system** with 5-8 real participants
2. **Monitor performance** (CPU, bandwidth, video quality)
3. **If experiencing issues at 8+ users:** Start SFU migration
4. **If staying under 10 users:** Current architecture is optimal

---

## Resources

- **Mediasoup Documentation:** https://mediasoup.org/documentation/
- **WebRTC Stats:** chrome://webrtc-internals
- **TURN Server Setup:** https://github.com/coturn/coturn
- **LiveKit (Managed SFU):** https://livekit.io/
- **Jitsi Videobridge:** https://jitsi.github.io/handbook/

---

## Contact & Support

For questions about scaling video chat:
- File: `backend/src/app/modules/communication/gateways/rtc.gateway.ts`
- Service: `tab-frontend/src/app/modules/interviews/services/RTC-advanced.service.ts`
- Component: `tab-frontend/src/app/modules/interviews/components/video-chat/`
