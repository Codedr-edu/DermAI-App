
import { Asset } from 'expo-asset';
// @ts-ignore
import { ExecutorchModule, ScalarType } from 'react-native-executorch';
import * as FileSystem from 'expo-file-system';
import * as ImageManipulator from 'expo-image-manipulator';
import { Buffer } from 'buffer';

export interface Prediction {
  name: string;
  probability: number;
}

// Sử dụng ExecutorchModule cho custom model (không giới hạn số classes)
let modelInstance: any = null;
let classNames: string[] = [];

/**
 * Load Executorch PTE model
 */
export async function loadModel(metadata: any) {
  try {
    if (modelInstance) {
        console.log("⚠️ Model đã load sẵn");
        return;
    }

    console.log('🔄 Đang nạp model ExecuTorch...');
    classNames = metadata.classes;
    console.log('📊 Số classes:', classNames.length);

    const modelAsset = Asset.fromModule(require('../assets/model/skin_convnext_xnnpack.pte'));
    await modelAsset.downloadAsync();

    if (!modelAsset.localUri) {
      throw new Error('Không lấy được URI của model');
    }

    // Khởi tạo ExecutorchModule
    modelInstance = new ExecutorchModule();
    await modelInstance.load(modelAsset.localUri);
    
    console.log('✅ Model ExecuTorch sẵn sàng!');
  } catch (err) {
    console.error('❌ Lỗi load model:', err);
    throw err;
  }
}

/**
 * Chẩn đoán ảnh
 * @param imageUri Đường dẫn file ảnh
 */
export async function runInference(imageUri: string): Promise<Prediction[]> {
  if (!modelInstance) {
    throw new Error('Model chưa được load');
  }

  try {
    const startTime = Date.now();
    console.log('🚀 Bắt đầu chẩn đoán tại:', imageUri);

    // 1. Pre-processing: Resize & Decode
    const inputTensor = await imageToTensor(imageUri);
    console.log(`⏱️ Pre-processing xong: ${Date.now() - startTime}ms`);
    
    // 2. Inference
    const forwardStart = Date.now();
    const outputTensors = await modelInstance.forward([inputTensor]);
    console.log(`⏱️ Model Forward xong: ${Date.now() - forwardStart}ms`);
    
    if (!outputTensors || outputTensors.length === 0) {
      throw new Error('Model không trả về kết quả');
    }

    // Debug output tensor
    const out = outputTensors[0];
    console.log('📊 Output Info:', { 
        sizes: out.sizes, 
        scalarType: out.scalarType,
        dataLength: out.dataPtr ? (out.dataPtr.length || 'N/A') : 'null'
    });

    // 3. Post-processing
    const result = postProcess(out);
    console.log(`✨ Tổng thời gian: ${Date.now() - startTime}ms`);
    
    return result;
  } catch (err) {
    console.error('❌ Lỗi chẩn đoán:', err);
    throw err;
  }
}

import * as jpeg from 'jpeg-js';

/**
 * Chuyển ảnh thành tensor Float32 (NCHW) dùng jpeg-js
 */
async function imageToTensor(imageUri: string): Promise<any> {
    const H = 300, W = 300;

    // 1. Resize ảnh về 300x300
    const manipResult = await ImageManipulator.manipulateAsync(
        imageUri,
        [{ resize: { width: W, height: H } }],
        { format: ImageManipulator.SaveFormat.JPEG, base64: true }
    );

    // 2. Decode Base64 -> Buffer -> Raw Pixels
    const base64Data = manipResult.base64 || '';
    const buffer = Buffer.from(base64Data, 'base64');
    
    // Decode JPEG
    const rawData = jpeg.decode(buffer, { useTArray: true }); // Returns { width, height, data: Uint8Array }
    
    // 3. Normalize & Convert to NCHW
    // Model ConvNext cần input [1, 3, 300, 300]
    // Values normalized: (pixel/255 - mean) / std
    // Mean = [0.485, 0.456, 0.406]
    // Std = [0.229, 0.224, 0.225]

    const C = 3;
    const float32Data = new Float32Array(C * H * W);
    
    const mean = [0.485, 0.456, 0.406];
    const std = [0.229, 0.224, 0.225];

    // Raw data format is RGBA (or RGB depending on jpeg-js, usually RGBA 4 channels)
    // jpeg-js returns [R, G, B, A, R, G, B, A, ...]
    const pixelData = rawData.data;

    for (let i = 0; i < H * W; i++) {
        // Pixel index in raw buffer (4 channels: R, G, B, A)
        const pin = i * 4;
        
        // Normalize R
        float32Data[i] = (pixelData[pin] / 255.0 - mean[0]) / std[0]; // R
        
        // Normalize G (offset by H*W)
        float32Data[i + H * W] = (pixelData[pin + 1] / 255.0 - mean[1]) / std[1]; // G
        
        // Normalize B (offset by 2*H*W)
        float32Data[i + 2 * H * W] = (pixelData[pin + 2] / 255.0 - mean[2]) / std[2]; // B
    }

    return {
        dataPtr: float32Data,
        sizes: [1, C, H, W],
        scalarType: ScalarType.FLOAT
    };
}



function postProcess(outputTensor: any): Prediction[] {
  console.log("🔍 Inspecting Output Tensor Data...");
  
  let data: number[] = [];
  const rawData = outputTensor.dataPtr;

  // Log raw data type info
  try {
      if (rawData) {
          console.log(`Type: ${rawData.constructor?.name}`);
          console.log(`Keys: ${Object.keys(rawData).slice(0, 5)}...`);
          console.log(`Length: ${rawData.length}`);
          console.log(`ByteLength: ${rawData.byteLength}`);
      } else {
          console.log("rawData is null/undefined");
      }
  } catch (e) {
      console.log("Error inspecting data:", e);
  }

  // Handle various data types
  if (rawData instanceof Float32Array) {
      console.log("Format: Float32Array");
      data = Array.from(rawData);
  } else if (rawData instanceof ArrayBuffer) {
      console.log("Format: ArrayBuffer");
      data = Array.from(new Float32Array(rawData));
  } else if (Array.isArray(rawData)) {
      console.log("Format: Array");
      data = rawData;
  } else if (rawData && typeof rawData === 'object') {
     // Fallback: Try to treat as object/map or converting via Object.values if it looks like an array-like object
     console.log("Format: Object");
      if (rawData.length > 0) {
          // It has length but failed instanceof check? potentially from another context
          data = Array.from(rawData as any);
      } else if (rawData.byteLength > 0) {
          // Has byteLength?
           data = Array.from(new Float32Array(rawData));
      } else {
          // Last resort: Object.values (unlikely to be sorted correctly but worth a try if it's {0: x, 1: y})
          const vals = Object.values(rawData);
          if (vals.length > 0 && typeof vals[0] === 'number') {
              data = vals as number[];
          }
      }
  }

  if (data.length === 0) {
      console.error("❌ Failed to extract data from tensor.");
      return [];
  }

  console.log(`📊 Extracted Data Size: ${data.length}`);
  // Log first few values to verify
  console.log(`Values [0-4]: ${data.slice(0, 5).join(', ')}`);

  // Softmax
  const probabilities = softmax(data);

  return classNames.map((name, i) => ({
    name,
    probability: (probabilities[i] || 0) * 100
  }))
  .filter(p => p.probability > 0.01)
  .sort((a, b) => b.probability - a.probability)
  .slice(0, 8);
}


function softmax(arr: number[]): number[] {
  if (arr.length === 0) return [];
  const maxLogit = Math.max(...arr);
  const exps = arr.map(v => Math.exp(v - maxLogit));
  const sumExps = exps.reduce((a, b) => a + b, 0);
  return exps.map(v => v / (sumExps || 1));
}



