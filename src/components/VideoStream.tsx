
import React, { useState, useRef, useEffect } from 'react';
import { AlertCircle } from 'lucide-react';

interface VideoStreamProps {
  streamUrl?: string;
  title?: string;
}

const VideoStream: React.FC<VideoStreamProps> = ({ 
  streamUrl = 'http://localhost:8081/stream?topic=/camera/image_raw',
  title = 'Robot Camera Feed'
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    setIsLoading(true);
    setHasError(false);

    const img = imgRef.current;
    if (!img) return;

    const handleLoad = () => {
      setIsLoading(false);
      setHasError(false);
    };

    const handleError = () => {
      setHasError(true);
      setIsLoading(false);
    };

    img.addEventListener('load', handleLoad);
    img.addEventListener('error', handleError);

    // Set the source to trigger loading
    img.src = streamUrl;

    return () => {
      img.removeEventListener('load', handleLoad);
      img.removeEventListener('error', handleError);
    };
  }, [streamUrl]);

  return (
    <div className="w-full h-full relative">
      {hasError ? (
        <div className="w-full h-full bg-slate-900 flex items-center justify-center">
          <div className="text-center text-slate-400">
            <AlertCircle className="w-16 h-16 mx-auto mb-4 opacity-50" />
            <p className="text-lg mb-2">Flux caméra indisponible</p>
            <p className="text-sm opacity-75">{streamUrl}</p>
          </div>
        </div>
      ) : (
        <>
          <img
            ref={imgRef}
            alt={title}
            className="w-full h-full object-cover"
            style={{ display: isLoading ? 'none' : 'block' }}
          />
          
          {isLoading && (
            <div className="w-full h-full bg-slate-900 flex items-center justify-center">
              <div className="text-center text-slate-400">
                <div className="w-16 h-16 mx-auto mb-4 border-4 border-slate-600 border-t-slate-400 rounded-full animate-spin"></div>
                <p className="text-lg">Connexion à la caméra...</p>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default VideoStream;
