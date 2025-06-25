
import { useState, useEffect, useRef, useCallback } from 'react';

interface ROSMessage {
  op: string;
  topic?: string;
  type?: string;
  msg?: any;
  id?: string;
}

interface UseWebSocketReturn {
  isConnected: boolean;
  sendMessage: (message: ROSMessage) => void;
  subscribe: (topic: string, type: string, callback: (data: any) => void) => () => void;
  publish: (topic: string, type: string, message: any) => void;
}

export const useWebSocket = (url: string = 'ws://localhost:9090'): UseWebSocketReturn => {
  const [isConnected, setIsConnected] = useState(false);
  const ws = useRef<WebSocket | null>(null);
  const messageId = useRef(0);
  const subscribers = useRef<Map<string, (data: any) => void>>(new Map());

  const connect = useCallback(() => {
    try {
      ws.current = new WebSocket(url);
      
      ws.current.onopen = () => {
        console.log('WebSocket connecté à ROS2');
        setIsConnected(true);
      };

      ws.current.onclose = () => {
        console.log('WebSocket déconnecté');
        setIsConnected(false);
        // Tentative de reconnexion après 3 secondes
        setTimeout(connect, 3000);
      };

      ws.current.onerror = (error) => {
        console.error('Erreur WebSocket:', error);
      };

      ws.current.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.topic && subscribers.current.has(data.topic)) {
            const callback = subscribers.current.get(data.topic);
            callback?.(data.msg);
          }
        } catch (error) {
          console.error('Erreur parsing message:', error);
        }
      };
    } catch (error) {
      console.error('Erreur connexion WebSocket:', error);
      setTimeout(connect, 3000);
    }
  }, [url]);

  useEffect(() => {
    connect();
    
    return () => {
      if (ws.current) {
        ws.current.close();
      }
    };
  }, [connect]);

  const sendMessage = useCallback((message: ROSMessage) => {
    if (ws.current && ws.current.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify(message));
    }
  }, []);

  const subscribe = useCallback((topic: string, type: string, callback: (data: any) => void) => {
    const subscribeMessage: ROSMessage = {
      op: 'subscribe',
      topic,
      type
    };
    
    subscribers.current.set(topic, callback);
    sendMessage(subscribeMessage);

    // Retourner une fonction de désabonnement
    return () => {
      const unsubscribeMessage: ROSMessage = {
        op: 'unsubscribe',
        topic
      };
      sendMessage(unsubscribeMessage);
      subscribers.current.delete(topic);
    };
  }, [sendMessage]);

  const publish = useCallback((topic: string, type: string, message: any) => {
    const publishMessage: ROSMessage = {
      op: 'publish',
      topic,
      type,
      msg: message
    };
    sendMessage(publishMessage);
  }, [sendMessage]);

  return {
    isConnected,
    sendMessage,
    subscribe,
    publish
  };
};
