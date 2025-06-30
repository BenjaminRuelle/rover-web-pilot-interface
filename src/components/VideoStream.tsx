
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

  const convertRosImageToDataUrl = (rosImage: any) => {
    try {
      const { width, height, encoding, data } = rosImage;
      
      console.log('ROS Image info:', { width, height, encoding, dataLength: data?.length });
      
      // Create a canvas to convert the raw image data
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      if (!ctx || !data) {
        throw new Error('No image data or canvas context');
      }
      
      canvas.width = width;
      canvas.height = height;
      
      // Create ImageData object
      const imageData = ctx.createImageData(width, height);
      
      // Handle different encodings
      if (encoding === 'rgb8') {
        // RGB8: 3 bytes per pixel (R, G, B)
        for (let i = 0; i < width * height; i++) {
          const pixelIndex = i * 4; // RGBA
          const dataIndex = i * 3;   // RGB
          
          imageData.data[pixelIndex] = data[dataIndex];       // R
          imageData.data[pixelIndex + 1] = data[dataIndex + 1]; // G
          imageData.data[pixelIndex + 2] = data[dataIndex + 2]; // B
          imageData.data[pixelIndex + 3] = 255;               // A (fully opaque)
        }
      } else if (encoding === 'bgr8') {
        // BGR8: 3 bytes per pixel (B, G, R) - swap R and B
        for (let i = 0; i < width * height; i++) {
          const pixelIndex = i * 4; // RGBA
          const dataIndex = i * 3;   // BGR
          
          imageData.data[pixelIndex] = data[dataIndex + 2];     // R (from B)
          imageData.data[pixelIndex + 1] = data[dataIndex + 1]; // G
          imageData.data[pixelIndex + 2] = data[dataIndex];     // B (from R)
          imageData.data[pixelIndex + 3] = 255;                 // A
        }
      } else {
        throw new Error(`Unsupported image encoding: ${encoding}`);
      }
      
      // Put the image data on canvas
      ctx.putImageData(imageData, 0, 0);
      
      // Convert canvas to data URL
      return canvas.toDataURL('image/jpeg', 0.8);
    } catch (error) {
      console.error('Error converting ROS image:', error);
      throw error;
    }
  };

  useEffect(() => {
    setIsLoading(true);
    setHasError(false);

    const unsubscribe = subscribe('/camera/image_raw', 'sensor_msgs/msg/Image', (data: any) => {
      try {
        console.log('Received ROS image message:', data);
        
        if (data && data.width && data.height && data.data) {
          const imageUrl = convertRosImageToDataUrl(data);
          setImageData(imageUrl);
          setIsLoading(false);
          setHasError(false);
        } else {
          console.error('Invalid ROS image message structure:', data);
          setHasError(true);
          setIsLoading(false);
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
