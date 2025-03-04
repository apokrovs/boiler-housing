// Global WebSocket instance
export let socket: WebSocket | null = null;
let pingInterval: number | null = null;
let isReconnecting = false;
let reconnectionTimeout: number | null = null;

/**
 * Creates a WebSocket connection with authentication token
 */
export const createWebSocketConnection = (): WebSocket | null => {
    // First, clear any existing reconnection timeout
    if (reconnectionTimeout) {
        clearTimeout(reconnectionTimeout);
        reconnectionTimeout = null;
    }

   if (isReconnecting) {
       console.log('Already attempting to reconnect. Skipping this attempt.');
        return null;
   }

    isReconnecting = true;

    const token = localStorage.getItem("access_token");
    if (!token) {
        console.error('No auth token available for WebSocket connection');
        return null;
    }

    // Use the correct backend URL
    const backendUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
    const wsUrl = backendUrl.replace('http', 'ws') + `/api/v1/messages/ws/${token}`;

    console.log('Attempting to connect to WebSocket at:', wsUrl);

    // Close any existing connection
    if (socket && socket.readyState !== WebSocket.CLOSED) {
        socket.close();
        socket = null;
    }

    // Clean up any existing ping interval
    if (pingInterval) {
        clearInterval(pingInterval);
        pingInterval = null;
    }

    // Create new connection
    const newSocket = new WebSocket(wsUrl);

    // Set a connection timeout
    const connectionTimeout = setTimeout(() => {
        if (newSocket && newSocket.readyState !== WebSocket.OPEN) {
            console.error('WebSocket connection timed out');
            newSocket.close();
            // Make sure to reset isReconnecting flag here
            isReconnecting = false;
            socket = null;
        }
    }, 10000); // 10 second timeout

    newSocket.onopen = () => {
        console.log('WebSocket connection established');
        clearTimeout(connectionTimeout);
        isReconnecting = false;

        // Set up ping interval to keep connection alive
        pingInterval = window.setInterval(() => {
            if (newSocket.readyState === WebSocket.OPEN) {
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
                if (pingInterval) {
                    clearInterval(pingInterval);
                    pingInterval = null;
                }
            }
        }, 30000); // Every 30 seconds
    };

    newSocket.onclose = (event) => {
        console.log(`WebSocket closed with code: ${event.code}, reason: ${event.reason}`);

        // Clean up intervals
        if (pingInterval) {
            clearInterval(pingInterval);
            pingInterval = null;
        }

        // Make sure to clean up the socket reference
        if (socket === newSocket) {
            socket = null;
        }

        isReconnecting = false;
    };

    newSocket.onerror = (error) => {
        console.error('WebSocket error occurred:', error);
        // We don't set isReconnecting to false here because
        // the onclose handler will be called after this
    };

    socket = newSocket;
    return newSocket;
};

/**
 * Sends a message via WebSocket
 */
export const sendWebSocketMessage = (messageData: any): boolean => {
    if (!socket || socket.readyState !== WebSocket.OPEN) {
        console.error('WebSocket is not connected');
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
    // If we're already reconnecting, cancel it
    if (reconnectionTimeout) {
        clearTimeout(reconnectionTimeout);
        reconnectionTimeout = null;
    }

    if (attempt >= maxAttempts) {
        console.log(`Maximum reconnection attempts (${maxAttempts}) reached`);
        return;
    }

    const backoffTime = 1000 * Math.min(30, Math.pow(2, attempt));
    console.log(`Scheduling reconnection in ${backoffTime/1000} seconds (attempt ${attempt}/${maxAttempts})`);

    reconnectionTimeout = window.setTimeout(() => {
        reconnectionTimeout = null;
        onReconnect();
    }, backoffTime);
};