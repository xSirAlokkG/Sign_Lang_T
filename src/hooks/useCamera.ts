import { useCallback, useEffect, useRef, useState } from 'react';

export type CameraState = {
  active: boolean;
  error: string | null;
  facingMode: 'user' | 'environment';
  switchCamera: () => void;
  start: () => Promise<void>;
  stop: () => void;
  videoRef: React.RefObject<HTMLVideoElement | null>;
};

export function useCamera(): CameraState {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [active, setActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
  const startingRef = useRef(false);
  const facingModeRef = useRef(facingMode);
  facingModeRef.current = facingMode;

  const stop = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) videoRef.current.srcObject = null;
    setActive(false);
  }, []);

  const start = useCallback(async () => {
    if (startingRef.current) return;
    if (streamRef.current) {
      setActive(true);
      return;
    }
    startingRef.current = true;
    setError(null);
    if (!navigator.mediaDevices?.getUserMedia) {
      setError('Camera not supported in this browser.');
      startingRef.current = false;
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: facingModeRef.current,
          width: { ideal: 1280 },
          height: { ideal: 720 },
          frameRate: { ideal: 30 },
        },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play().catch(() => {});
      }
      setActive(true);
    } catch (e) {
      const err = e as DOMException;
      if (err.name === 'NotAllowedError') setError('Camera permission denied.');
      else if (err.name === 'NotFoundError') setError('No camera found.');
      else setError(err.message || 'Could not start camera.');
    } finally {
      startingRef.current = false;
    }
  }, []);

  const switchCamera = useCallback(() => {
    setFacingMode((m) => (m === 'user' ? 'environment' : 'user'));
  }, []);

  useEffect(() => {
    if (!active) return;
    stop();
    start();
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [facingMode]);

  return { active, error, facingMode, switchCamera, start, stop, videoRef };
}
