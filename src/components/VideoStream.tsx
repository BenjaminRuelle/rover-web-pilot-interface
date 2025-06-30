
import React, { useState, useRef, useEffect } from 'react';
import { AlertCircle } from 'lucide-react';
import { useWebSocket } from '@/hooks/useWebSocket';

interface VideoStreamProps {
  streamUrl?: string;
  title?: string;
}

const VideoStream: React.FC<VideoStreamProps> = ({ 
  title = 'Robot Camera Feed'
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [imageData, setImageData] = useState<string | null>(null);
  const { isConnected, subscribe } = useWebSocket();

  useEffect(() => {
    setIsLoading(true);
    setHasError(false);

    const unsubscribe = subscribe('/camera/image_raw', 'sensor_msgs/msg/Image', (data: any) => {
      try {
        // Convert ROS image message to base64 data URL
        if (data && data.data) {
          // Assuming the image data comes as base64 or raw bytes
          const base64Data = typeof data.data === 'string' ? data.data : btoa(String.fromCharCode(...data.data));
          const imageUrl = `data:image/jpeg;base64,${base64Data}`;
          setImageData(imageUrl);
          setIsLoading(false);
          setHasError(false);
        }
      } catch (error) {
        console.error('Erreur traitement image ROS:', error);
        setHasError(true);
        setIsLoading(false);
      }
    });

    return () => {
      unsubscribe();
    };
  }, [subscribe]);

  useEffect(() => {
    if (!isConnected) {
      setHasError(true);
      setIsLoading(false);
    }
  }, [isConnected]);

  return (
    <div className="w-full h-full relative">
      {hasError || !isConnected ? (
        <div className="w-full h-full bg-slate-900 flex items-center justify-center">
          <div className="text-center text-slate-400">
            <AlertCircle className="w-16 h-16 mx-auto mb-4 opacity-50" />
            <p className="text-lg mb-2">
              {!isConnected ? 'Connexion ROS indisponible' : 'Flux caméra indisponible'}
            </p>
            <p className="text-sm opacity-75">/camera/image_raw</p>
          </div>
        </div>
      ) : imageData ? (
        <img
          src={imageData}
          alt={title}
          className="w-full h-full object-cover"
        />
      ) : (
        <div className="w-full h-full bg-slate-900 flex items-center justify-center">
          <div className="text-center text-slate-400">
            <div className="w-16 h-16 mx-auto mb-4 border-4 border-slate-600 border-t-slate-400 rounded-full animate-spin"></div>
            <p className="text-lg">Connexion à la caméra...</p>
          </div>
        </div>
      )}
      
      {isLoading && !hasError && isConnected && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-900/75">
          <div className="text-white text-lg">Chargement du flux caméra...</div>
        </div>
      )}
    </div>
  );
};

export default VideoStream;
