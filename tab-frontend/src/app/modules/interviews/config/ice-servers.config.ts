/**
 * ICE Server Configuration for WebRTC
 * 
 * STUN servers help discover your public IP address
 * TURN servers relay media when direct peer-to-peer fails
 */

export interface IceServerConfig {
    urls: string | string[];
    username?: string;
    credential?: string;
}

/**
 * Default ICE servers configuration
 * Replace with your own STUN/TURN servers for production
 */
export const DEFAULT_ICE_SERVERS: IceServerConfig[] = [
    // Keep empty: ICE servers are provided by backend `get-ice-servers`
    // and should be configured in backend .env only.

    // Add your custom STUN server
    // { urls: 'stun:stun.yourdomain.com:3478' },

    // Add your custom TURN server (with authentication)
    // {
    //     urls: [
    //         'turn:turn.yourdomain.com:3478?transport=udp',
    //         'turn:turn.yourdomain.com:3478?transport=tcp'
    //     ],
    //     username: 'your-turn-username',
    //     credential: 'your-turn-password'
    // },

    // Optional: Add a TURNS server (TLS encrypted)
    // {
    //     urls: 'turns:turn.yourdomain.com:5349',
    //     username: 'your-turn-username',
    //     credential: 'your-turn-password'
    // }
];

/**
 * Environment-specific ICE server configurations
 */
export const ICE_SERVER_CONFIGS = {
    development: DEFAULT_ICE_SERVERS,

    production: [
        // Production STUN servers
        { urls: 'stun:stun.yourdomain.com:3478' },

        // Production TURN servers (with dynamic credentials from backend)
        // These should be fetched from your backend via 'get-ice-servers' socket event
    ] as IceServerConfig[],

    testing: [
        // Test servers or local coturn instance
        { urls: 'stun:localhost:3478' },
    ] as IceServerConfig[]
};

/**
 * Get ICE servers based on environment
 */
export function getIceServersForEnvironment(env: 'development' | 'production' | 'testing' = 'development'): IceServerConfig[] {
    return ICE_SERVER_CONFIGS[env] || DEFAULT_ICE_SERVERS;
}

/**
 * COTURN Server Setup Guide:
 * 
 * 1. Install coturn:
 *    sudo apt-get install coturn
 * 
 * 2. Edit /etc/turnserver.conf:
 *    listening-port=3478
 *    tls-listening-port=5349
 *    external-ip=YOUR_SERVER_PUBLIC_IP
 *    realm=yourdomain.com
 *    server-name=turn.yourdomain.com
 *    
 *    # Authentication
 *    lt-cred-mech
 *    user=username:password
 *    
 *    # Security
 *    fingerprint
 *    no-multicast-peers
 *    
 *    # Logging
 *    log-file=/var/log/turnserver.log
 *    verbose
 * 
 * 3. Start service:
 *    sudo systemctl start coturn
 *    sudo systemctl enable coturn
 * 
 * 4. Test STUN:
 *    From browser console or use online testers
 * 
 * 5. For dynamic credentials (recommended for TURN):
 *    Generate time-limited credentials on your backend
 *    using the TURN REST API pattern
 */
