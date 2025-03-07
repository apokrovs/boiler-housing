import {UsersService} from "../../client";
import {sendEmailNotification} from "../../client/emailService.ts";

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

// Event callbacks for different message types
type MessageCallback = (message: any) => void;
const messageHandlers: Record<string, MessageCallback[]> = {};

/**
 * Subscribe to a specific message type
 * @param type Message type to subscribe to
 * @param callback Function to call when a message of this type is received
 * @returns A function to unsubscribe
 */
export const subscribeToMessageType = (type: string, callback: MessageCallback): () => void => {
  if (!messageHandlers[type]) {
    messageHandlers[type] = [];
  }
  messageHandlers[type].push(callback);

  // Return unsubscribe function
  return () => {
    if (messageHandlers[type]) {
      messageHandlers[type] = messageHandlers[type].filter(cb => cb !== callback);
    }
  };
};

/**
 * Process a received message and call registered handlers
 */
const processMessage = (message: any) => {
  const type = message.type;

  // Call all registered handlers for this message type
  if (messageHandlers[type]) {
    messageHandlers[type].forEach(handler => handler(message));
  }

  // Call all registered handlers for 'all' message type
  if (messageHandlers['all']) {
    messageHandlers['all'].forEach(handler => handler(message));
  }
};

/**
 * Creates a WebSocket connection with the authentication token.
 */
export const createWebSocketConnection = (): WebSocket | null => {
  // If already connected or connecting, return the existing socket
  if (socket && (socket.readyState === WebSocketState.OPEN || socket.readyState === WebSocketState.CONNECTING)) {
    // console.log('WebSocket already connected or connecting');
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

  // console.log('Starting WebSocket connection attempt');

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
  // console.log('Attempting to connect to WebSocket at:', wsUrl);

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
      // console.log('WebSocket connection established');
      if (connectionTimeout) {
        clearTimeout(connectionTimeout);
        connectionTimeout = null;
      }
      // Reset reconnection attempts on a successful connection
      reconnectAttempt = 0;

      // Call all registered handlers for connection open
      if (messageHandlers['connection_open']) {
        messageHandlers['connection_open'].forEach(handler => handler({}));
      }
    };

    newSocket.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);

        // Log all non-ping messages for debugging
        if (message.type !== 'ping') {
          // console.log('Received message:', message);
        } else {
          // console.log('Received server ping');
        }

        // Process the message with registered handlers
        processMessage(message);

      } catch (error) {
        console.error('Error parsing message:', error);
      }
    };

    newSocket.onclose = (event) => {
      // console.log(`WebSocket closed with code: ${event.code}, reason: ${event.reason || 'No reason provided'}`);
      socket = null;

      // Call all registered handlers for connection close
      if (messageHandlers['connection_close']) {
        messageHandlers['connection_close'].forEach(handler => handler({ code: event.code, reason: event.reason }));
      }

      // If the closure wasn't a normal close (code 1000), attempt reconnection
      if (event.code !== 1000) {
        scheduleReconnection();
      }
    };

    newSocket.onerror = (error) => {
      console.error('WebSocket error:', error);

      // Call all registered handlers for connection error
      if (messageHandlers['connection_error']) {
        messageHandlers['connection_error'].forEach(handler => handler(error));
      }

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
    // console.log(`Maximum reconnection attempts (${maxReconnectAttempts}) reached`);
    return;
  }
  reconnectAttempt++;
  const backoffTime = Math.min(30000, 1000 * Math.pow(2, reconnectAttempt));
  // console.log(`Scheduling reconnection in ${backoffTime / 1000} seconds (attempt ${reconnectAttempt}/${maxReconnectAttempts})`);
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

/**
 * Sends a chat message to a conversation.
 * Creates a new conversation if needed.
 */
export const sendChatMessage = async (content: string, conversationId?: string, participants?: string[], isGroup: boolean = false): boolean => {
  if (!content.trim()) return false;

  const messageData = conversationId ?
          {
            type: "message",
            conversation_id: conversationId,
            participants: participants,
            content
          } :
          {
            type: "message",
            new_conversation: true,
            participant_ids: participants,
            is_group: isGroup,
            content
          };

  return sendWebSocketMessage(messageData);
};

/**
 * Marks a message as read.
 */
export const markMessageAsRead = (messageId: string, conversationId: string): boolean => {
  return sendWebSocketMessage({
    type: "read_receipt",
    message_id: messageId,
    conversation_id: conversationId
  });
};

/**
 * Sends a typing indicator for a conversation.
 */
export const sendTypingIndicator = (conversationId: string): boolean => {
  return sendWebSocketMessage({
    type: "typing",
    conversation_id: conversationId
  });
};

/**
 * Opens a conversation in the UI.
 */
export const openConversation = (conversationId: string): boolean => {
  return sendWebSocketMessage({
    type: "open_conversation",
    conversation_id: conversationId
  });
};

/**
 * Closes a conversation in the UI.
 */
export const closeConversation = (conversationId: string): boolean => {
  return sendWebSocketMessage({
    type: "close_conversation",
    conversation_id: conversationId
  });
};

/**
 * Edits a message.
 */
export const editMessage = (messageId: string, content: string): boolean => {
  return sendWebSocketMessage({
    type: "edit_message",
    message_id: messageId,
    content
  });
};

/**
 * Deletes a message.
 */
export const deleteMessage = (messageId: string): boolean => {
  return sendWebSocketMessage({
    type: "delete_message",
    message_id: messageId
  });
};

/**
 * Blocks a user.
 */
export const blockUser = (userId: string): boolean => {
  return sendWebSocketMessage({
    type: "block_user",
    user_id: userId
  });
};

/**
 * Unblocks a user.
 */
export const unblockUser = (userId: string): boolean => {
  return sendWebSocketMessage({
    type: "unblock_user",
    user_id: userId
  });
};

/**
 * Manually close the WebSocket connection
 */
export const closeWebSocketConnection = () => {
  if (socket && socket.readyState === WebSocketState.OPEN) {
    socket.close(1000, "User logged out");
  }
  socket = null;
};