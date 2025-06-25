
import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, Video } from 'lucide-react';

interface VideoStreamProps {
  streamUrl: string;
  title?: string;
}

const VideoStream: React.FC<VideoStreamProps> = ({ 
  streamUrl = 'rtsp://192.168.1.100:554/stream1',
  title = 'Flux Vidéo Robot'
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
    <Card className="bg-slate-800 border-slate-700">
      <CardHeader className="pb-3">
        <CardTitle className="text-white flex items-center">
          <Video className="w-5 h-5 mr-2" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="relative aspect-video bg-slate-900 rounded-lg overflow-hidden">
          {hasError ? (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center text-slate-400">
                <AlertCircle className="w-12 h-12 mx-auto mb-4" />
                <p className="text-sm">Flux vidéo indisponible</p>
                <p className="text-xs mt-1 opacity-75">{streamUrl}</p>
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
              {/* Fallback pour la démo - vous pouvez remplacer par votre flux RTSP */}
              <source src="https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4" type="video/mp4" />
              Votre navigateur ne supporte pas la lecture vidéo.
            </video>
          )}
          
          {isLoading && !hasError && (
            <div className="absolute inset-0 flex items-center justify-center bg-slate-900/50">
              <div className="text-white text-sm">Chargement du flux vidéo...</div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default VideoStream;
