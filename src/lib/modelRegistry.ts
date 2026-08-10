import type { Landmark } from './handLandmarker';
import { classifyGesture, gestureDisplay, type Classification } from './gestures';
import { supabase } from './supabase';

export type ModelSource = 'builtin' | 'custom';

export type ModelMetadata = {
  labels: string[];
  source: ModelSource;
  name: string;
};

export interface GestureClassifier {
  classify(landmarks: Landmark[], video?: HTMLVideoElement): Classification | null;
  labels: string[];
  source: ModelSource;
  name: string;
}

export function createBuiltinClassifier(): GestureClassifier {
  return {
    classify: (lm) => classifyGesture(lm),
    labels: [],
    source: 'builtin',
    name: 'Built-in Rule-based',
  };
}

export function labelToName(label: string): string {
  return label.toUpperCase().replace(/\s+/g, '_').replace(/[^A-Z0-9_]/g, '');
}

export function displayFromName(name: string): string {
  return gestureDisplay(name);
}

export type TMLoadProgress = {
  stage: 'reading' | 'loading' | 'ready' | 'error';
  message: string;
  percent: number;
};

export type TMModelFiles = {
  modelJson: File;
  metadataJson?: File;
  weightsBin?: File;
};

export function validateTMFiles(files: TMModelFiles): string | null {
  if (!files.modelJson) return 'model.json file is required.';
  if (!files.modelJson.name.endsWith('.json')) return 'The model file must be a .json file.';
  if (files.weightsBin && !files.weightsBin.name.endsWith('.bin')) return 'The weights file must be a .bin file.';
  if (files.metadataJson && !files.metadataJson.name.endsWith('.json')) return 'The metadata file must be a .json file.';
  return null;
}

type TFOutput = {
  dataSync(): Float32Array | Int32Array | Uint8Array;
  dispose(): void;
};

type TFModel = {
  predict(input: unknown): TFOutput | TFOutput[];
  dispose(): void;
};

export async function loadTeachableMachineModel(
  files: TMModelFiles,
  onProgress: (p: TMLoadProgress) => void,
): Promise<GestureClassifier> {
  onProgress({ stage: 'reading', message: 'Reading model files…', percent: 10 });
  const modelJsonText = await files.modelJson.text();
  let modelJson: Record<string, unknown>;
  try {
    modelJson = JSON.parse(modelJsonText);
  } catch {
    onProgress({ stage: 'error', message: 'model.json is not valid JSON.', percent: 0 });
    throw new Error('model.json is not valid JSON.');
  }

  if (!modelJson.modelTopology && !modelJson.format) {
    onProgress({ stage: 'error', message: 'model.json does not look like a TensorFlow.js model.', percent: 0 });
    throw new Error('Invalid model.json format.');
  }

  const manifest = modelJson.weightsManifest;
  if (Array.isArray(manifest) && manifest.length > 0 && !files.weightsBin) {
    onProgress({ stage: 'error', message: 'This model needs its weights.bin file.', percent: 0 });
    throw new Error('This model needs its weights.bin file. Select the matching weights.bin before loading.');
  }

  onProgress({ stage: 'reading', message: 'Reading metadata…', percent: 25 });
  let labels: string[] = [];
  if (files.metadataJson) {
    try {
      const meta = JSON.parse(await files.metadataJson.text()) as Record<string, unknown>;
      if (Array.isArray(meta.labels)) labels = meta.labels as string[];
      else if (meta.labels && typeof meta.labels === 'object') labels = Object.values(meta.labels) as string[];
    } catch {
      // metadata optional
    }
  }
  if (labels.length === 0 && Array.isArray(modelJson.labels)) {
    labels = modelJson.labels as string[];
  }

  onProgress({ stage: 'loading', message: 'Loading TensorFlow.js runtime…', percent: 45 });
  const tf = await import('@tensorflow/tfjs');

  onProgress({ stage: 'loading', message: 'Building model from files…', percent: 60 });

  let model: TFModel | null = null;

  try {
    if (files.weightsBin) {
      onProgress({ stage: 'loading', message: 'Reading model weights…', percent: 55 });
      const browserFiles = tf.io.browserFiles([files.modelJson, files.weightsBin]);
      try {
        model = (await tf.loadGraphModel(browserFiles)) as unknown as TFModel;
      } catch {
        model = (await tf.loadLayersModel(browserFiles)) as unknown as TFModel;
      }
    } else {
      const modelUrl = URL.createObjectURL(files.modelJson);
      try {
        model = (await tf.loadGraphModel(modelUrl)) as unknown as TFModel;
      } catch {
        model = (await tf.loadLayersModel(modelUrl)) as unknown as TFModel;
      }
      URL.revokeObjectURL(modelUrl);
    }
  } catch (e) {
    const reason = e instanceof Error ? e.message : 'The selected files are not a supported TensorFlow.js model.';
    onProgress({ stage: 'error', message: 'Failed to load model: ' + reason, percent: 0 });
    throw new Error('Failed to load model: ' + reason);
  }

  onProgress({ stage: 'loading', message: 'Warming up model…', percent: 85 });

  const normalizedLabels = labels.map((l) => labelToName(l));

  // Warm up with a dummy input
  try {
    const dummy = tf.zeros([1, 224, 224, 3]);
    const out = model!.predict(dummy) as { dataSync: () => Float32Array; dispose: () => void };
    dummy.dispose();
    out.dispose();
  } catch {
    // warmup may fail for non-image models
  }

  onProgress({ stage: 'ready', message: 'Model loaded successfully.', percent: 100 });

  const modelName = files.modelJson.name.replace(/\.json$/, '');

  return {
    classify: (_landmarks: Landmark[], video?: HTMLVideoElement): Classification | null => {
      if (!video || video.readyState < 2) return null;
      try {
        const input = tf.tidy(() =>
          tf.browser.fromPixels(video)
            .resizeBilinear([224, 224])
            .toFloat()
            .reverse(1)
            .expandDims(0),
        );
        const prediction = model!.predict(input);
        const output = Array.isArray(prediction) ? prediction[0] : prediction;
        const arr = Array.from(output.dataSync() as Float32Array);
        input.dispose();
        output.dispose();
        let maxIdx = 0;
        let maxVal = -Infinity;
        for (let i = 0; i < arr.length; i++) {
          if (arr[i] > maxVal) { maxVal = arr[i]; maxIdx = i; }
        }
        const name = normalizedLabels[maxIdx] || `CLASS_${maxIdx}`;
        return { name, confidence: maxVal };
      } catch {
        return null;
      }
    },
    labels: normalizedLabels,
    source: 'custom',
    name: modelName,
  };
}

export type SavedModelMeta = {
  id: string;
  name: string;
  labels: string[];
  has_weights: boolean;
  has_metadata: boolean;
  created_at: string;
};

export async function saveCustomModel(
  files: TMModelFiles,
  labels: string[],
): Promise<SavedModelMeta | null> {
  const name = files.modelJson.name.replace(/\.json$/, '');
  const { data, error } = await supabase
    .from('custom_models')
    .insert({
      name,
      labels,
      has_weights: !!files.weightsBin,
      has_metadata: !!files.metadataJson,
    })
    .select()
    .single();
  if (error || !data) return null;

  const id = data.id;
  const modelPath = `${id}/model.json`;
  const { error: mErr } = await supabase.storage
    .from('custom-models')
    .upload(modelPath, files.modelJson, { contentType: 'application/json', upsert: true });
  if (mErr) {
    await supabase.from('custom_models').delete().eq('id', id);
    return null;
  }

  if (files.metadataJson) {
    await supabase.storage
      .from('custom-models')
      .upload(`${id}/metadata.json`, files.metadataJson, { contentType: 'application/json', upsert: true });
  }
  if (files.weightsBin) {
    await supabase.storage
      .from('custom-models')
      .upload(`${id}/weights.bin`, files.weightsBin, { contentType: 'application/octet-stream', upsert: true });
  }

  return data as SavedModelMeta;
}

export async function getSavedModel(): Promise<SavedModelMeta | null> {
  const { data } = await supabase
    .from('custom_models')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  return data as SavedModelMeta | null;
}

export async function loadSavedModel(
  meta: SavedModelMeta,
  onProgress?: (p: TMLoadProgress) => void,
): Promise<GestureClassifier | null> {
  const id = meta.id;
  onProgress?.({ stage: 'reading', message: 'Downloading saved model…', percent: 20 });

  const modelUrl = await downloadTextFile(`${id}/model.json`);
  if (!modelUrl) return null;

  let metadataUrl: string | null = null;
  if (meta.has_metadata) {
    metadataUrl = await downloadTextFile(`${id}/metadata.json`);
  }

  let weightsUrl: string | null = null;
  if (meta.has_weights) {
    weightsUrl = await downloadBlobFile(`${id}/weights.bin`);
  }

  onProgress?.({ stage: 'loading', message: 'Loading TensorFlow.js runtime…', percent: 50 });
  const tf = await import('@tensorflow/tfjs');

  onProgress?.({ stage: 'loading', message: 'Building saved model…', percent: 70 });
  let model: TFModel | null = null;
  try {
    if (weightsUrl) {
      const modelFile = await fetch(modelUrl).then((r) => r.blob());
      const weightsFile = await fetch(weightsUrl).then((r) => r.blob());
      const modelF = new File([modelFile], 'model.json', { type: 'application/json' });
      const weightsF = new File([weightsFile], 'weights.bin', { type: 'application/octet-stream' });
      const browserFiles = tf.io.browserFiles([modelF, weightsF]);
      try {
        model = (await tf.loadGraphModel(browserFiles)) as unknown as TFModel;
      } catch {
        model = (await tf.loadLayersModel(browserFiles)) as unknown as TFModel;
      }
    } else {
      try {
        model = (await tf.loadGraphModel(modelUrl)) as unknown as TFModel;
      } catch {
        model = (await tf.loadLayersModel(modelUrl)) as unknown as TFModel;
      }
    }
  } catch {
    return null;
  }

  onProgress?.({ stage: 'loading', message: 'Warming up saved model…', percent: 90 });
  let labels = meta.labels || [];
  if (metadataUrl) {
    try {
      const meta2 = JSON.parse(await (await fetch(metadataUrl)).text()) as Record<string, unknown>;
      if (Array.isArray(meta2.labels)) labels = meta2.labels as string[];
      else if (meta2.labels && typeof meta2.labels === 'object') labels = Object.values(meta2.labels) as string[];
    } catch {
      // use DB labels
    }
  }
  const normalizedLabels = labels.map((l) => labelToName(l));

  try {
    const dummy = tf.zeros([1, 224, 224, 3]);
    const out = model!.predict(dummy) as { dataSync: () => Float32Array; dispose: () => void };
    dummy.dispose();
    out.dispose();
  } catch {
    // warmup may fail
  }

  onProgress?.({ stage: 'ready', message: 'Saved model loaded.', percent: 100 });

  return {
    classify: (_landmarks: Landmark[], video?: HTMLVideoElement): Classification | null => {
      if (!video || video.readyState < 2) return null;
      try {
        const input = tf.tidy(() =>
          tf.browser.fromPixels(video)
            .resizeBilinear([224, 224])
            .toFloat()
            .reverse(1)
            .expandDims(0),
        );
        const prediction = model!.predict(input);
        const output = Array.isArray(prediction) ? prediction[0] : prediction;
        const arr = Array.from(output.dataSync() as Float32Array);
        input.dispose();
        output.dispose();
        let maxIdx = 0;
        let maxVal = -Infinity;
        for (let i = 0; i < arr.length; i++) {
          if (arr[i] > maxVal) { maxVal = arr[i]; maxIdx = i; }
        }
        const name = normalizedLabels[maxIdx] || `CLASS_${maxIdx}`;
        return { name, confidence: maxVal };
      } catch {
        return null;
      }
    },
    labels: normalizedLabels,
    source: 'custom',
    name: meta.name,
  };
}

export async function deleteSavedModel(): Promise<boolean> {
  const { data } = await supabase
    .from('custom_models')
    .select('id')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (!data) return false;
  const id = data.id;
  await supabase.storage.from('custom-models').remove([
    `${id}/model.json`,
    `${id}/metadata.json`,
    `${id}/weights.bin`,
  ]);
  const { error } = await supabase.from('custom_models').delete().eq('id', id);
  return !error;
}

async function downloadTextFile(path: string): Promise<string | null> {
  const { data } = await supabase.storage.from('custom-models').download(path);
  if (!data) return null;
  return URL.createObjectURL(data);
}

async function downloadBlobFile(path: string): Promise<string | null> {
  const { data } = await supabase.storage.from('custom-models').download(path);
  if (!data) return null;
  return URL.createObjectURL(data);
}
