export enum WebSocketState {
  CONNECTING = 0,
  OPEN = 1,
  CLOSING = 2,
  CLOSED = 3
}

// Global WebSocket instance
export let socket: WebSocket | null = null;
let pingInterval: number | null = null;
let isReconnecting = false;
let reconnectionTimeout: number | null = null;
let connectionTimeout: number | null = null;

/**
 * Creates a WebSocket connection with authentication token
 */
export const createWebSocketConnection = (): WebSocket | null => {
    // Clear any existing timeouts
    if (reconnectionTimeout) {
        clearTimeout(reconnectionTimeout);
        reconnectionTimeout = null;
    }

    if (connectionTimeout) {
        clearTimeout(connectionTimeout);
        connectionTimeout = null;
    }

    // If already reconnecting, avoid race conditions
    if (isReconnecting) {
        console.log('Already attempting to reconnect. Waiting for completion.');
        return null;
    }

    isReconnecting = true;
    console.log('Starting WebSocket connection attempt');

    const token = localStorage.getItem("access_token");
    if (!token) {
        console.error('No auth token available for WebSocket connection');
        isReconnecting = false;
        return null;
    }

    // Close any existing connection
    if (socket) {
        try {
            if (socket.readyState === WebSocketState.OPEN ||
                socket.readyState === WebSocketState.CONNECTING) {
                console.log('Closing existing socket connection');
                socket.close();
            }
        } catch (err) {
            console.error('Error closing existing socket:', err);
        }
        socket = null;
    }

    // Clean up any existing ping interval
    if (pingInterval) {
        clearInterval(pingInterval);
        pingInterval = null;
    }

    // Determine the WebSocket URL - using the API URL from environment
    // Either connect directly to backend:8000 (development)
    // or through Traefik (production)
    const backendUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';

    // Convert http(s):// to ws(s)://
    let wsProtocol = 'ws://';
    if (backendUrl.startsWith('https')) {
        wsProtocol = 'wss://';
    }

    // Extract hostname and port from backend URL
    const urlObj = new URL(backendUrl);
    const wsUrl = `${wsProtocol}${urlObj.host}/api/v1/messages/ws/${token}`;

    console.log('Attempting to connect to WebSocket at:', wsUrl);

    // Create new connection
    try {
        const newSocket = new WebSocket(wsUrl);

        // Set a connection timeout
        connectionTimeout = window.setTimeout(() => {
            if (newSocket.readyState !== WebSocketState.OPEN) {
                console.error('WebSocket connection timed out');
                try {
                    newSocket.close();
                } catch (err) {
                    // Ignore errors during close
                }
                isReconnecting = false;
                socket = null;
                connectionTimeout = null;
            }
        }, 10000); // 10 second timeout

        newSocket.onopen = () => {
            console.log('WebSocket connection established');
            if (connectionTimeout) {
                clearTimeout(connectionTimeout);
                connectionTimeout = null;
            }

            // Set up ping interval to keep connection alive
            pingInterval = window.setInterval(() => {
                if (newSocket.readyState === WebSocketState.OPEN) {
                    try {
                        newSocket.send(JSON.stringify({type: 'ping'}));
                        console.log('Ping sent to server');
                    } catch (error) {
                        console.error('Failed to send ping:', error);
                        if (pingInterval) {
                            clearInterval(pingInterval);
                            pingInterval = null;
                        }
                    }
                } else {
                    // Socket no longer open, clear interval
                    if (pingInterval) {
                        clearInterval(pingInterval);
                        pingInterval = null;
                    }
                }
            }, 25000); // Every 25 seconds

            isReconnecting = false;
        };

        newSocket.onclose = (event) => {
            console.log(`WebSocket closed with code: ${event.code}, reason: ${event.reason || 'No reason provided'}`);

            // Clean up intervals and timeouts
            if (pingInterval) {
                clearInterval(pingInterval);
                pingInterval = null;
            }

            if (connectionTimeout) {
                clearTimeout(connectionTimeout);
                connectionTimeout = null;
            }

            // Clean up the socket reference
            if (socket === newSocket) {
                socket = null;
            }

            // Reset reconnection flag (with slight delay to prevent immediate reconnections)
            setTimeout(() => {
                isReconnecting = false;
            }, 1000);
        };

        newSocket.onerror = (error) => {
            console.error('WebSocket error:', error);
            // Don't set isReconnecting to false here as onclose will be called
        };

        socket = newSocket;
        return newSocket;
    } catch (error) {
        console.error('Error creating WebSocket:', error);
        isReconnecting = false;
        return null;
    }
};

/**
 * Sends a message via WebSocket
 */
export const sendWebSocketMessage = (messageData: any): boolean => {
    if (!socket || socket.readyState !== WebSocketState.OPEN) {
        console.error('WebSocket is not connected, cannot send message');
        return false;
    }

    try {
        socket.send(JSON.stringify(messageData));
        return true;
    } catch (error) {
        console.error('Failed to send message:', error);
        return false;
    }
};

/**
 * Schedule a reconnection attempt with backoff
 */
export const scheduleReconnection = (attempt: number, maxAttempts: number, onReconnect: () => void): void => {
    // If we're already reconnecting, cancel previous timeout
    if (reconnectionTimeout) {
        clearTimeout(reconnectionTimeout);
        reconnectionTimeout = null;
    }

    if (attempt >= maxAttempts) {
        console.log(`Maximum reconnection attempts (${maxAttempts}) reached`);
        isReconnecting = false;
        return;
    }

    // Exponential backoff with max of 30 seconds
    const backoffTime = Math.min(30000, 1000 * Math.pow(2, attempt));
    console.log(`Scheduling reconnection in ${backoffTime/1000} seconds (attempt ${attempt}/${maxAttempts})`);

    reconnectionTimeout = window.setTimeout(() => {
        reconnectionTimeout = null;
        // Make sure isReconnecting is false before triggering a reconnect
        isReconnecting = false;
        onReconnect();
    }, backoffTime);
};