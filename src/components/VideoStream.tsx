
import React, { useState, useRef, useEffect } from 'react';
import { AlertCircle } from 'lucide-react';

interface VideoStreamProps {
  streamUrl: string;
  title?: string;
}

const VideoStream: React.FC<VideoStreamProps> = ({ 
  streamUrl = 'rtsp://192.168.1.100:554/stream1',
  title = 'Robot Camera Feed'
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleLoadStart = () => setIsLoading(true);
    const handleCanPlay = () => {
      setIsLoading(false);
      setHasError(false);
    };
    const handleError = () => {
      setIsLoading(false);
      setHasError(true);
      console.error('Erreur flux vidéo RTSP:', streamUrl);
    };

    video.addEventListener('loadstart', handleLoadStart);
    video.addEventListener('canplay', handleCanPlay);
    video.addEventListener('error', handleError);

    return () => {
      video.removeEventListener('loadstart', handleLoadStart);
      video.removeEventListener('canplay', handleCanPlay);
      video.removeEventListener('error', handleError);
    };
  }, [streamUrl]);

  return (
    <div className="w-full h-full relative">
      {hasError ? (
        <div className="w-full h-full bg-slate-900 flex items-center justify-center">
          <div className="text-center text-slate-400">
            <AlertCircle className="w-16 h-16 mx-auto mb-4 opacity-50" />
            <p className="text-lg mb-2">Flux vidéo indisponible</p>
            <p className="text-sm opacity-75">{streamUrl}</p>
          </div>
        </div>
      ) : (
        <video
          ref={videoRef}
          className="w-full h-full object-cover"
          autoPlay
          muted
          playsInline
        >
          <source src={streamUrl} type="video/mp4" />
          {/* Fallback video for demo */}
          <source src="https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4" type="video/mp4" />
          Votre navigateur ne supporte pas la lecture vidéo.
        </video>
      )}
      
      {isLoading && !hasError && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-900/75">
          <div className="text-white text-lg">Chargement du flux vidéo...</div>
        </div>
      )}
    </div>
  );
};

export default VideoStream;
