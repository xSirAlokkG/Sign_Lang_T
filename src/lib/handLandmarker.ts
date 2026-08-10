import { FilesetResolver, HandLandmarker } from '@mediapipe/tasks-vision';

let landmarkerPromise: Promise<HandLandmarker> | null = null;

export async function getHandLandmarker(): Promise<HandLandmarker> {
  if (landmarkerPromise) return landmarkerPromise;
  landmarkerPromise = (async () => {
    const vision = await FilesetResolver.forVisionTasks(
      '/wasm',
    );
    return HandLandmarker.createFromOptions(vision, {
      baseOptions: {
        modelAssetPath: '/models/hand_landmarker.task',
        delegate: 'GPU',
      },
      runningMode: 'VIDEO',
      numHands: 2,
    });
  })();
  return landmarkerPromise;
}

export type Landmark = { x: number; y: number; z: number };
export type HandResult = {
  landmarks: Landmark[];
  worldLandmarks: Landmark[];
  handedness: string;
  score: number;
};

export type DetectionResult = {
  hands: HandResult[];
};

export function detect(
  landmarker: HandLandmarker,
  video: HTMLVideoElement,
  timestampMs: number,
): DetectionResult {
  const res = landmarker.detectForVideo(video, timestampMs);
  const hands: HandResult[] = [];
  for (let i = 0; i < (res.landmarks?.length || 0); i++) {
    hands.push({
      landmarks: res.landmarks[i].map((l) => ({ x: l.x, y: l.y, z: l.z })),
      worldLandmarks: (res.worldLandmarks[i] || []).map((l) => ({
        x: l.x,
        y: l.y,
        z: l.z,
      })),
      handedness: res.handednesses[i]?.[0]?.categoryName || 'Unknown',
      score: res.handednesses[i]?.[0]?.score || 0,
    });
  }
  return { hands };
}

export const HAND_CONNECTIONS: [number, number][] = [
  [0, 1], [1, 2], [2, 3], [3, 4],
  [0, 5], [5, 6], [6, 7], [7, 8],
  [5, 9], [9, 10], [10, 11], [11, 12],
  [9, 13], [13, 14], [14, 15], [15, 16],
  [13, 17], [17, 18], [18, 19], [19, 20],
  [0, 17],
];
