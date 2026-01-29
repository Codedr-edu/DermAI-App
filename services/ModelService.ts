
// Sử dụng require để tránh xung đột type với browser/node types
const { Module, Image, torch } = require('react-native-pytorch-core');
import { Asset } from 'expo-asset';

export interface Prediction {
  name: string;
  probability: number;
}

let model: any = null;
let classNames: string[] = [];

/**
 * Load PyTorch mobile model (.ptl)
 */
export async function loadModel(metadata: any) {
  try {
    if (model) return;

    console.log('🔄 Đang nạp model PyTorch Mobile...');
    classNames = metadata.classes;

    // Load asset model
    const modelAsset = Asset.fromModule(require('../assets/model/model.ptl'));
    await modelAsset.downloadAsync();

    if (!modelAsset.localUri) {
      throw new Error('Không thể tải file model asset');
    }

    // Nạp model vào bộ nhớ
    model = await Module.load(modelAsset.localUri);
    console.log('✅ Model PyTorch đã sẵn sàng!');
  } catch (err) {
    console.error('❌ Lỗi load model PyTorch:', err);
    throw err;
  }
}

/**
 * Chạy inference trên ảnh Base64
 */
export async function runInference(imageBase64: string): Promise<Prediction[]> {
  if (!model) {
    throw new Error('Model chưa được nạp');
  }

  try {
    // Đảm bảo base64 có prefix
    let formattedBase64 = imageBase64;
    if (!formattedBase64.startsWith('data:')) {
      formattedBase64 = `data:image/jpeg;base64,${imageBase64}`;
    }

    // 1. Chuyển Base64 thành PyTorch Image
    const image = await Image.fromBase64(formattedBase64);
    
    // 2. Chuyển Image thành Tensor (PyTorch Core tự handle resize và normalize cơ bản)
    const tensor = await image.toTensor(300, 300);

    // 3. Chạy model forward
    const output = await model.forward(tensor);

    // 4. Hậu xử lý kết quả
    const result = postProcess(output);
    
    // Giải phóng bộ nhớ (Cực kỳ quan trọng để tránh memory leak)
    await image.release();
    await tensor.release();
    await output.release();

    return result;
  } catch (err) {
    console.error('❌ Lỗi inference PyTorch:', err);
    throw err;
  }
}

/**
 * Áp dụng Softmax để lấy xác suất %
 */
function postProcess(output: any): Prediction[] {
  // Lấy dữ liệu từ tensor ra array
  const data = output.data();
  // Ép kiểu về Float32Array nếu cần
  const floatData = data instanceof Float32Array ? data : new Float32Array(data);
  
  const probabilities = softmax(floatData);

  return classNames.map((name, i) => ({
    name,
    probability: probabilities[i] * 100
  })).sort((a, b) => b.probability - a.probability).slice(0, 8);
}

function softmax(arr: Float32Array): number[] {
  const maxLogit = Math.max(...Array.from(arr));
  const exps = Array.from(arr).map(v => Math.exp(v - maxLogit));
  const sumExps = exps.reduce((a, b) => a + b, 0);
  return exps.map(v => v / sumExps);
}
