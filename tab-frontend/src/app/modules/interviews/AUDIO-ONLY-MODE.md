# Audio-Only Mode Feature

## Overview

The video chat now supports **audio-only mode** when the camera is in use by another application (Zoom, Teams, etc.) or unavailable.

## How It Works

### Automatic Fallback

When you join a video chat:

1. **First attempt**: Request camera + microphone
2. **If camera fails** (NotReadableError - camera in use):
   - Automatically fallback to audio-only mode
   - User is notified via alert
   - Connection continues with microphone only
3. **If no camera detected** (NotFoundError):
   - Automatically fallback to audio-only mode
   - Connection continues with microphone only

### Visual Indicators

**Banner Notification:**
- Orange banner at top: "Audio-only mode: Camera is in use by another application"

**Participant Display:**
- Shows person icon instead of video
- Green microphone indicator
- Label shows "(Audio Only)"

**Controls:**
- Video toggle button is **disabled** and grayed out
- Audio and screen share buttons remain functional

## User Experience

### Joining With Camera In Use

```
User clicks "Join Call"
  ↓
Camera busy detected
  ↓
Alert: "Camera is in use by another application. Continuing with audio only."
  ↓
Joins call with audio only
  ↓
Orange banner shows status
```

### Remote Participants

Remote users see:
- Your audio indicator with person icon
- "(Audio Only)" label
- Can still hear you clearly
- Your screen shares work normally

## Technical Details

### Service Changes (`RTC-advanced.service.ts`)

```typescript
async initLocalCamera() {
  try {
    // Try video + audio
    stream = getUserMedia({ video: true, audio: true });
  } catch (err) {
    if (err.name === 'NotReadableError' || err.name === 'NotFoundError') {
      // Fallback to audio only
      stream = getUserMedia({ video: false, audio: true });
    }
  }
}
```

### Component Changes (`video-chat.component.ts`)

- Added `isAudioOnlyMode` flag
- Detects video tracks on stream initialization
- Disables video toggle in audio-only mode
- Updates grid to show audio avatar

### Template Changes (`video-chat.component.html`)

- Audio-only banner (conditional)
- Person icon avatar for audio-only participants
- Disabled video button styling
- "(Audio Only)" labels

### Styling (`video-chat.component.scss`)

- `.audio-only-banner` - Orange notification
- `.audio-only-avatar` - Person icon display
- `.audio-indicator` - Green microphone badge
- `.control-btn.disabled` - Grayed out button

## Browser Compatibility

| Browser | Audio-Only Support | Notes |
|---------|-------------------|-------|
| Chrome 90+ | ✅ Full | Recommended |
| Firefox 88+ | ✅ Full | Works well |
| Safari 14+ | ✅ Full | Requires HTTPS |
| Edge 90+ | ✅ Full | Chromium-based |

## Testing Scenarios

### Test 1: Camera In Use
1. Open Zoom/Teams with camera enabled
2. Join video chat
3. **Expected**: Audio-only mode activates automatically

### Test 2: No Camera
1. Disconnect/disable camera
2. Join video chat
3. **Expected**: Audio-only mode with notification

### Test 3: Camera Becomes Available
1. Join in audio-only mode
2. Close blocking application
3. **Current**: Remains audio-only (by design)
4. **Future**: Could add "Retry Camera" button

### Test 4: Multiple Participants
1. User A joins with video
2. User B joins audio-only (camera busy)
3. **Expected**: 
   - User A sees User B's audio avatar
   - User B sees User A's video
   - Both can communicate

## Known Limitations

1. **No automatic retry**: Once in audio-only mode, camera doesn't auto-enable if it becomes available
2. **Manual refresh needed**: To enable camera, must leave and rejoin call
3. **Screen share still works**: Even in audio-only mode, screen sharing is functional

## Future Enhancements

### Planned Features

1. **Retry Camera Button**
   ```html
   <button *ngIf="isAudioOnlyMode" (click)="retryCamera()">
     <mat-icon>videocam</mat-icon> Try Camera Again
   </button>
   ```

2. **Camera Status Monitoring**
   ```typescript
   navigator.mediaDevices.ondevicechange = () => {
     // Detect when camera becomes available
     this.checkCameraAvailability();
   };
   ```

3. **Visual Audio Levels**
   - Show speaking indicator
   - Animate microphone icon
   - Audio waveform visualization

4. **Better Error Messaging**
   - Specific app name if detectable
   - Instructions to free camera
   - Link to help documentation

## Troubleshooting

### "Still shows video button disabled"
- This is expected in audio-only mode
- Close blocking applications and refresh

### "No audio either"
- Check microphone permissions
- Verify microphone not in use
- Check browser console for errors

### "Want to switch to video"
1. Close applications using camera
2. Leave the call
3. Rejoin - will attempt video again

### "Screen share not working"
- Screen share is independent of camera
- Should work even in audio-only mode
- Check display permissions

## API Reference

### Component Properties

```typescript
isAudioOnlyMode: boolean  // True when running audio-only
videoOn: boolean          // False in audio-only mode
```

### Service Methods

```typescript
async initLocalCamera(): Promise<MediaStream | null>
// Returns null if both video and audio fail
// Returns audio-only stream if camera fails
```

### CSS Classes

```scss
.audio-only-banner    // Top notification
.audio-only-avatar    // Person icon display
.audio-indicator      // Microphone badge
.video-container.audio-only  // Container styling
.control-btn.disabled // Disabled button
```

## Best Practices

### For Users

1. **Close unnecessary apps** before joining
2. **Use headphones** to prevent echo
3. **Test audio** before important calls
4. **Use screen share** to compensate for no video

### For Developers

1. **Always handle camera failures gracefully**
2. **Provide clear user feedback**
3. **Test on various devices**
4. **Monitor connection quality**
5. **Log errors for debugging**

## Examples

### Detect Audio-Only in Remote Stream

```typescript
remoteStreams.forEach(stream => {
  const hasVideo = stream.getVideoTracks().length > 0;
  const hasAudio = stream.getAudioTracks().length > 0;
  
  if (hasAudio && !hasVideo) {
    console.log('Remote user is in audio-only mode');
    // Show audio avatar
  }
});
```

### Custom Retry Logic

```typescript
async retryCamera() {
  this.isAudioOnlyMode = false;
  const stream = await this.rtcAdvanced.initLocalCamera();
  
  if (stream && stream.getVideoTracks().length > 0) {
    this.videoOn = true;
    this.isAudioOnlyMode = false;
    alert('Camera enabled successfully!');
  } else {
    this.isAudioOnlyMode = true;
    alert('Camera still unavailable');
  }
}
```

## Summary

✅ **Seamless fallback** to audio when camera unavailable  
✅ **Clear visual indicators** for audio-only mode  
✅ **Disabled video controls** prevent confusion  
✅ **Full functionality** for audio and screen sharing  
✅ **Works with multiple participants** simultaneously  

The video chat now gracefully handles camera conflicts, ensuring users can always connect even when their camera is in use by another application!
