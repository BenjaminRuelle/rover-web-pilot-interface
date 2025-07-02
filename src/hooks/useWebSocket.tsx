
import { useState, useEffect, useRef, useCallback } from 'react';

interface ROSMessage {
  op: string;
  topic?: string;
  service?: string;
  type?: string;
  msg?: any;
  args?: any;
  id?: string;
}

interface UseWebSocketReturn {
  isConnected: boolean;
  sendMessage: (message: ROSMessage) => void;
  subscribe: (topic: string, type: string, callback: (data: any) => void) => () => void;
  publish: (topic: string, type: string, message: any) => void;
  callService: (service: string, type: string, request?: any) => Promise<any>;
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

  const callService = useCallback((service: string, type: string, request: any = {}) => {
    return new Promise((resolve, reject) => {
      const callId = `call_service_${messageId.current++}`;
      const serviceMessage: ROSMessage = {
        op: 'call_service',
        id: callId,
        service,
        type,
        args: request
      };
      
      const handleResponse = (event: MessageEvent) => {
        try {
          const data = JSON.parse(event.data);
          if (data.op === 'service_response' && data.id === callId) {
            ws.current?.removeEventListener('message', handleResponse);
            if (data.result) {
              resolve(data.values);
            } else {
              reject(new Error(data.values || 'Service call failed'));
            }
          }
        } catch (error) {
          // Ignore parsing errors for other messages
        }
      };
      
      if (ws.current) {
        ws.current.addEventListener('message', handleResponse);
        sendMessage(serviceMessage);
        
        // Timeout after 5 seconds
        setTimeout(() => {
          ws.current?.removeEventListener('message', handleResponse);
          reject(new Error('Service call timeout'));
        }, 5000);
      } else {
        reject(new Error('WebSocket not connected'));
      }
    });
  }, [sendMessage]);

  return {
    isConnected,
    sendMessage,
    subscribe,
    publish,
    callService
  };
};
