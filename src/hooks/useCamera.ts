import { useCallback, useEffect, useRef, useState } from 'react';

export type CameraState = {
  active: boolean;
  error: string | null;
  facingMode: 'user' | 'environment';
  switchCamera: () => void;
  start: () => Promise<void>;
  stop: () => void;
  videoRef: React.RefObject<HTMLVideoElement | null>;
  reconnect: () => void;
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

  const attachStream = useCallback(() => {
    if (videoRef.current && streamRef.current) {
      if (videoRef.current.srcObject !== streamRef.current) {
        videoRef.current.srcObject = streamRef.current;
        videoRef.current.play().catch(() => {});
      }
    }
  }, []);

  // Re-attach stream when video element remounts (tab switches)
  useEffect(() => {
    attachStream();
  }, [attachStream]);

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
      attachStream();
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
      attachStream();
      setActive(true);
    } catch (e) {
      const err = e as DOMException;
      if (err.name === 'NotAllowedError') setError('Camera permission denied. Please allow camera access and try again.');
      else if (err.name === 'NotFoundError') setError('No camera found on this device.');
      else if (err.name === 'NotReadableError') setError('Camera is in use by another application.');
      else setError(err.message || 'Could not start camera.');
    } finally {
      startingRef.current = false;
    }
  }, [attachStream]);

  const switchCamera = useCallback(() => {
    setFacingMode((m) => (m === 'user' ? 'environment' : 'user'));
  }, []);

  // Restart stream only when facingMode changes AND camera is active
  useEffect(() => {
    if (!active) return;
    let cancelled = false;
    (async () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
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
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        attachStream();
      } catch {
        if (!cancelled) setError('Could not switch camera.');
      }
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [facingMode]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }
    };
  }, []);

  return { active, error, facingMode, switchCamera, start, stop, videoRef, reconnect: attachStream };
}
