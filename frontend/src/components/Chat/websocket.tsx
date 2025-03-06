export enum WebSocketState {
  CONNECTING = 0,
  OPEN = 1,
  CLOSING = 2,
  CLOSED = 3
}

export let socket: WebSocket | null = null;
let reconnectionTimeout: number | null = null;
let connectionTimeout: number | null = null;
let reconnectAttempt = 0;
const maxReconnectAttempts = 5;

/**
 * Creates a WebSocket connection with the authentication token.
 */
export const createWebSocketConnection = (): WebSocket | null => {
  // If already connected or connecting, return the existing socket
  if (socket && (socket.readyState === WebSocketState.OPEN || socket.readyState === WebSocketState.CONNECTING)) {
    console.log('WebSocket already connected or connecting');
    return socket;
  }

  // Clear any existing timeouts
  if (reconnectionTimeout) {
    clearTimeout(reconnectionTimeout);
    reconnectionTimeout = null;
  }
  if (connectionTimeout) {
    clearTimeout(connectionTimeout);
    connectionTimeout = null;
  }

  console.log('Starting WebSocket connection attempt');

  const token = localStorage.getItem("access_token");
  if (!token) {
    console.error('No auth token available for WebSocket connection');
    return null;
  }

  // Build the WebSocket URL using the backend URL from environment variables
  const backendUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
  const wsProtocol = backendUrl.startsWith('https') ? 'wss://' : 'ws://';
  const urlObj = new URL(backendUrl);
  const wsUrl = `${wsProtocol}${urlObj.host}/api/v1/messages/ws/${token}`;
  console.log('Attempting to connect to WebSocket at:', wsUrl);

  try {
    const newSocket = new WebSocket(wsUrl);

    // Set a connection timeout (10 seconds)
    connectionTimeout = window.setTimeout(() => {
      if (newSocket.readyState !== WebSocketState.OPEN) {
        console.error('WebSocket connection timed out');
        newSocket.close();
      }
    }, 10000);

    newSocket.onopen = () => {
      console.log('WebSocket connection established');
      if (connectionTimeout) {
        clearTimeout(connectionTimeout);
        connectionTimeout = null;
      }
      // Reset reconnection attempts on a successful connection
      reconnectAttempt = 0;
    };

    newSocket.onmessage = (event) => {
      console.log('Received message:', event.data);
      try {
        // TODO: @Arnav Wadhwa this doesnt work dumbass
        const message = JSON.parse(event.data);
        if (message.type === 'ping') {
          console.log('Received server ping');
          return;
        }

        else if (message.type === 'new_message') {
          console.log(`Received new Message from ${message.sender_id}`);
        }

      } catch (error) {
        console.error('Error parsing message:', error);
      }
    };

    newSocket.onclose = (event) => {
      console.log(`WebSocket closed with code: ${event.code}, reason: ${event.reason || 'No reason provided'}`);
      socket = null;
      // If the closure wasn't a normal close (code 1000), attempt reconnection
      if (event.code !== 1000) {
        scheduleReconnection();
      }
    };

    newSocket.onerror = (error) => {
      console.error('WebSocket error:', error);
      // onclose will handle reconnection if necessary
    };

    socket = newSocket;
    return newSocket;
  } catch (error) {
    console.error('Error creating WebSocket:', error);
    return null;
  }
};

/**
 * Schedules a reconnection attempt with exponential backoff.
 */
const scheduleReconnection = () => {
  if (reconnectAttempt >= maxReconnectAttempts) {
    console.log(`Maximum reconnection attempts (${maxReconnectAttempts}) reached`);
    return;
  }
  reconnectAttempt++;
  const backoffTime = Math.min(30000, 1000 * Math.pow(2, reconnectAttempt));
  console.log(`Scheduling reconnection in ${backoffTime / 1000} seconds (attempt ${reconnectAttempt}/${maxReconnectAttempts})`);
  reconnectionTimeout = window.setTimeout(() => {
    createWebSocketConnection();
  }, backoffTime);
};

/**
 * Sends a message via WebSocket.
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
