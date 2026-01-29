import React, { useState, useEffect, useRef } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  TouchableOpacity, 
  SafeAreaView, 
  Image,
  ActivityIndicator,
  Alert
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { loadModel, runInference, Prediction } from '../services/ModelService';

export default function OfflineMode() {
  const [permission, requestPermission] = useCameraPermissions();
  const [isModelLoading, setIsModelLoading] = useState(true);
  const [modelError, setModelError] = useState<string | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [results, setResults] = useState<Prediction[]>([]);
  const [isInferenceLoading, setIsInferenceLoading] = useState(false);
  const cameraRef = useRef<any>(null);

  useEffect(() => {
    async function setup() {
      try {
        console.log('📱 OfflineMode mounted, đang load model...');
        // Load model khi màn hình offline mở ra
        const metadata = require('../assets/model/model_metadata.json');
        await loadModel(metadata);
        setIsModelLoading(false);
        setModelError(null);
        console.log('✅ Model loaded thành công!');
      } catch (err: any) {
        console.error('❌ Lỗi load model:', err);
        setIsModelLoading(false);
        setModelError(err?.message || 'Không thể load model');
      }
    }
    setup();
  }, []);

  if (!permission) return <View />;
  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <Text style={{ textAlign: 'center', marginBottom: 20 }}>
          Chúng tôi cần quyền truy cập Camera để chẩn đoán.
        </Text>
        <TouchableOpacity style={styles.button} onPress={requestPermission}>
          <Text style={styles.buttonText}>Cấp quyền Camera</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const takePicture = async () => {
    if (cameraRef.current) {
      try {
        const photo = await cameraRef.current.takePictureAsync({
          quality: 0.5,
          base64: true,
        });
        
        setCapturedImage(photo.uri);
        setIsInferenceLoading(true);

        // Chạy AI
        // Lưu ý: photo.base64 trên một số máy Android có thể rất lớn, 
        // ở bản nâng cao chúng ta sẽ resize nó trước khi truyền vào ModelService
        const predictions = await runInference(photo.base64);
        setResults(predictions);
        setIsInferenceLoading(false);
      } catch (e) {
        console.error(e);
        Alert.alert("Lỗi", "Không thể xử lý ảnh.");
        setIsInferenceLoading(false);
      }
    }
  };

  if (isModelLoading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#007bff" />
        <Text style={styles.loadingText}>Đang khởi tạo AI Offline...</Text>
      </View>
    );
  }

  if (modelError) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorBox}>
          <Text style={styles.errorTitle}>❌ Lỗi khởi tạo AI</Text>
          <Text style={styles.errorMessage}>{modelError}</Text>
          <TouchableOpacity 
            style={styles.retryButton} 
            onPress={() => {
              setModelError(null);
              setIsModelLoading(true);
              // Reload model
              const metadata = require('../assets/model/model_metadata.json');
              loadModel(metadata).then(() => {
                setIsModelLoading(false);
              }).catch((err: any) => {
                setModelError(err?.message || 'Không thể load model');
              });
            }}
          >
            <Text style={styles.buttonText}>Thử lại</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {capturedImage ? (
        // Màn hình kết quả
        <View style={styles.resultContainer}>
          <Image source={{ uri: capturedImage }} style={styles.preview} />
          <View style={styles.resultTable}>
            <Text style={styles.tableTitle}>KẾT QUẢ DỰ ĐOÁN (OFFLINE)</Text>
            {results.map((res, index) => (
              <View key={index} style={styles.row}>
                <Text style={styles.cellLabel}>{res.name}</Text>
                <Text style={styles.cellValue}>{res.probability.toFixed(2)}%</Text>
              </View>
            ))}
          </View>
          <TouchableOpacity 
            style={styles.retryButton} 
            onPress={() => setCapturedImage(null)}
          >
            <Text style={styles.buttonText}>Chụp lại</Text>
          </TouchableOpacity>
        </View>
      ) : (
        // Màn hình Camera
        <View style={styles.cameraWrapper}>
          <CameraView 
            style={styles.camera} 
            ref={cameraRef}
            facing="back"
          >
            <View style={styles.overlay}>
               <View style={styles.focusFrame} />
               <Text style={styles.hintText}>Đưa vùng da vào khung hình</Text>
            </View>
          </CameraView>
          <View style={styles.controls}>
             <TouchableOpacity style={styles.captureBtn} onPress={takePicture}>
                <View style={styles.captureBtnInner} />
             </TouchableOpacity>
          </View>
        </View>
      )}

      {isInferenceLoading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#fff" />
          <Text style={styles.loadingTextWhite}>AI đang phân tích...</Text>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
  },
  cameraWrapper: {
    flex: 1,
  },
  camera: {
    flex: 3,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  focusFrame: {
    width: 250,
    height: 250,
    borderWidth: 2,
    borderColor: '#fff',
    borderRadius: 20,
    backgroundColor: 'transparent',
  },
  hintText: {
    color: '#fff',
    marginTop: 20,
    fontSize: 16,
    fontWeight: 'bold',
  },
  controls: {
    flex: 1,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  captureBtn: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 4,
    borderColor: '#007bff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  captureBtnInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#007bff',
  },
  resultContainer: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 20,
  },
  preview: {
    width: '100%',
    height: 300,
    borderRadius: 15,
    marginBottom: 20,
  },
  resultTable: {
    backgroundColor: '#f8f9fa',
    borderRadius: 10,
    padding: 15,
  },
  tableTitle: {
    fontWeight: 'bold',
    fontSize: 16,
    marginBottom: 10,
    textAlign: 'center',
    color: '#333',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  cellLabel: {
    fontSize: 14,
    color: '#444',
  },
  cellValue: {
    fontWeight: 'bold',
    color: '#007bff',
  },
  retryButton: {
    backgroundColor: '#6c757d',
    padding: 15,
    borderRadius: 10,
    marginTop: 20,
    alignItems: 'center',
  },
  button: {
    backgroundColor: '#007bff',
    padding: 15,
    borderRadius: 10,
    marginHorizontal: 50,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  loadingText: {
    marginTop: 15,
    textAlign: 'center',
    color: '#666',
  },
  loadingTextWhite: {
    marginTop: 15,
    textAlign: 'center',
    color: '#fff',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 999,
  },
  errorBox: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#d32f2f',
    marginBottom: 10,
  },
  errorMessage: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
  },
});

