/**
 * Example environment configuration for WebRTC
 * Copy values to your actual environment files
 */
export const environment = {
    production: false,

    // WebSocket configuration
    wsBase: 'http://localhost:3000',  // Your backend URL
    wsPath: 'socket.io',               // Socket.IO path

    // WebRTC Configuration
    webrtc: {
        // ICE server mode: 'google' | 'custom' | 'dynamic'
        iceServerMode: 'google',  // Use 'custom' for your own servers

        // Custom STUN/TURN servers (when iceServerMode = 'custom')
        customIceServers: [
            { urls: 'stun:stun.evryka.org:3478' },
            {
                urls: ['turn:turn.evryka.org:3478?transport=udp'],
                username: 'webrtcuser',
                credential: 'strongpasswordZemekiss1207$'
            }
        ],

        // Fetch ICE servers from backend (when iceServerMode = 'dynamic')
        fetchIceServersFromBackend: true,

        // Video constraints
        video: {
            width: { ideal: 1280, max: 1920 },
            height: { ideal: 720, max: 1080 },
            frameRate: { ideal: 30, max: 30 }
        },

        // Audio constraints
        audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true
        },

        // Screen share constraints
        screen: {
            video: {
                cursor: 'always',
                displaySurface: 'monitor',  // 'monitor' | 'window' | 'application'
                frameRate: { ideal: 15, max: 30 }
            }
        }
    },

    // Storage keys
    storage: {
        userId: 'user-id',
        prefixToken: 'auth-token-'
    }
};

/**
 * Production environment example:
 */
export const productionEnvironment = {
    production: true,
    wsBase: 'https://api.yourdomain.com',
    wsPath: 'socket.io',

    webrtc: {
        iceServerMode: 'dynamic',  // Fetch from backend for security
        fetchIceServersFromBackend: true,

        // These won't be used when mode is 'dynamic'
        customIceServers: [],

        video: {
            width: { ideal: 1280, max: 1920 },
            height: { ideal: 720, max: 1080 },
            frameRate: { ideal: 24, max: 30 }
        },

        audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true
        }
    },

    storage: {
        userId: 'user-id',
        prefixToken: 'auth-token-'
    }
};
