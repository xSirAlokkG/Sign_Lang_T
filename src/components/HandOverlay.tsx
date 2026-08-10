import { useEffect, useRef } from 'react';
import { HAND_CONNECTIONS, type HandResult } from '@/lib/handLandmarker';

type Props = {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  hands: HandResult[];
  width?: number;
  height?: number;
  showLabels?: boolean;
  colorMode?: 'default' | 'feedback';
  feedbackColor?: string;
};

const FINGER_NAMES: Record<number, string> = {
  4: 'Thumb', 8: 'Index', 12: 'Middle', 16: 'Ring', 20: 'Pinky', 0: 'Wrist',
};

export default function HandOverlay({
  videoRef,
  hands,
  width = 1280,
  height = 720,
  showLabels = false,
  colorMode = 'default',
  feedbackColor,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const video = videoRef.current;
    const vw = video?.videoWidth || width;
    const vh = video?.videoHeight || height;
    canvas.width = vw;
    canvas.height = vh;

    hands.forEach((hand, idx) => {
      const color = feedbackColor ?? (idx === 0 ? '#38bdf8' : '#34d399');
      ctx.strokeStyle = color;
      ctx.lineWidth = colorMode === 'feedback' ? 4 : 3;
      ctx.fillStyle = color;

      for (const [a, b] of HAND_CONNECTIONS) {
        const p1 = hand.landmarks[a];
        const p2 = hand.landmarks[b];
        if (!p1 || !p2) continue;
        ctx.beginPath();
        ctx.moveTo(p1.x * vw, p1.y * vh);
        ctx.lineTo(p2.x * vw, p2.y * vh);
        ctx.stroke();
      }

      for (let i = 0; i < hand.landmarks.length; i++) {
        const lm = hand.landmarks[i];
        const isTip = [4, 8, 12, 16, 20].includes(i);
        ctx.beginPath();
        ctx.arc(lm.x * vw, lm.y * vh, isTip ? 6 : 3.5, 0, Math.PI * 2);
        ctx.fill();
      }

      const minX = Math.min(...hand.landmarks.map((l) => l.x)) * vw;
      const minY = Math.min(...hand.landmarks.map((l) => l.y)) * vh;
      const maxX = Math.max(...hand.landmarks.map((l) => l.x)) * vw;
      const maxY = Math.max(...hand.landmarks.map((l) => l.y)) * vh;
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.strokeRect(minX - 8, minY - 8, maxX - minX + 16, maxY - minY + 16);

      if (showLabels) {
        ctx.fillStyle = color;
        ctx.font = 'bold 16px sans-serif';
        ctx.fillText(hand.handedness, minX - 8, minY - 14);
        for (const [tipIdx, name] of Object.entries(FINGER_NAMES)) {
          const lm = hand.landmarks[Number(tipIdx)];
          if (lm) {
            ctx.font = '11px sans-serif';
            ctx.fillText(name, lm.x * vw + 8, lm.y * vh - 4);
          }
        }
      }
    });
  }, [hands, width, height, videoRef, showLabels, colorMode, feedbackColor]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 h-full w-full object-contain"
      style={{ transform: 'scaleX(-1)' }}
    />
  );
}
