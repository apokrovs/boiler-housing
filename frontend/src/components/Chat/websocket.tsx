// Global WebSocket instance
export let socket: WebSocket | null = null;

/**
 * Creates a WebSocket connection with authentication token
 */
export const createWebSocketConnection = (): WebSocket | null => {
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
    }

    // Create new connection
    const newSocket = new WebSocket(wsUrl);

    // Set a connection timeout
    const connectionTimeout = setTimeout(() => {
        if (newSocket.readyState !== WebSocket.OPEN) {
            console.error('WebSocket connection timed out');
            newSocket.close();
        }
    }, 10000); // 10 second timeout

    newSocket.onopen = () => {
        console.log('WebSocket connection established');
        clearTimeout(connectionTimeout);

        // Set up ping interval to keep connection alive
        const pingInterval = setInterval(() => {
            if (newSocket.readyState === WebSocket.OPEN) {
                newSocket.send(JSON.stringify({type: 'ping'}));
            } else {
                clearInterval(pingInterval);
            }
        }, 30000); // Every 30 seconds

        // Clear ping interval when socket closes
        newSocket.addEventListener('close', () => {
            clearInterval(pingInterval);
        });
    };

    socket = newSocket;
    return newSocket;
};

/**
 * Sends a message via WebSocket
 */
export const sendWebSocketMessage = (messageData: any): void => {
    if (!socket || socket.readyState !== WebSocket.OPEN) {
        console.error('WebSocket is not connected');
        return;
    }

    socket.send(JSON.stringify(messageData));
};