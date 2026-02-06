import React, { useState, useEffect, useRef } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  TouchableOpacity, 
  Image,
  ActivityIndicator,
  Alert,
  ScrollView,
  Dimensions,
  Platform,
  Linking
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import { useTranslation } from 'react-i18next';
import { 
  CameraIcon, 
  FlipIcon, 
  GalleryIcon, 
  PhoneIcon, 
  HomeIcon, 
  ChatIcon, 
  MedicineIcon, 
  ProfileIcon,
  WarningIcon,
  LogoIcon
} from './Icons';
import i18n from '../i18n';
import { loadModel, runInference, Prediction } from '../services/ModelService';

const { width } = Dimensions.get('window');

/**
 * OfflineMode Component được thiết kế lại theo phong cách Card UI chuyên nghiệp.
 */
export default function OfflineMode() {
  const { t } = useTranslation();
  const [permission, requestPermission] = useCameraPermissions();
  const [isModelLoading, setIsModelLoading] = useState(true);
  const [modelError, setModelError] = useState<string | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [results, setResults] = useState<Prediction[]>([]);
  const [isInferenceLoading, setIsInferenceLoading] = useState(false);
  const [facing, setFacing] = useState<'back' | 'front'>('back');
  const cameraRef = useRef<any>(null);

  useEffect(() => {
    async function setup() {
      try {
        const metadata = require('../assets/model/model_metadata.json');
        await loadModel(metadata);
        setIsModelLoading(false);
        setModelError(null);
      } catch (err: any) {
        setIsModelLoading(false);
        setModelError(err?.message || i18n.t('errors.model_load'));
      }
    }
    setup();
  }, []);

  const toggleLanguage = () => {
    const nextLang = i18n.language === 'vi' ? 'en' : 'vi';
    i18n.changeLanguage(nextLang);
  };

  const toggleCameraFacing = () => {
    setFacing(current => (current === 'back' ? 'front' : 'back'));
  };

  const processAndSetImage = async (uri: string) => {
    try {
      setIsInferenceLoading(true);
      
      // Crop và resize ảnh về 300x300 pixel trước khi đưa vào AI
      const manipResult = await ImageManipulator.manipulateAsync(
        uri,
        [{ resize: { width: 300, height: 300 } }],
        { compress: 0.8 }
      );
      
      const finalUri = manipResult.uri;
      setCapturedImage(finalUri);
      
      const predictions = await runInference(finalUri);
      setResults(predictions);
      setIsInferenceLoading(false);
    } catch (e) {
      console.error(e);
      Alert.alert(t('errors.error'), t('errors.image_process'));
      setIsInferenceLoading(false);
    }
  };

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        await processAndSetImage(result.assets[0].uri);
      }
    } catch (e) {
      console.error(e);
      Alert.alert(t('errors.error'), t('errors.image_picker'));
    }
  };

  const takePicture = async () => {
    if (cameraRef.current) {
      try {
        const photo = await cameraRef.current.takePictureAsync({
          quality: 0.8,
        });
        await processAndSetImage(photo.uri);
      } catch (e) {
        console.error(e);
        Alert.alert(t('errors.error'), t('errors.image_process'));
      }
    }
  };

  if (!permission) return <View style={styles.container} />;
  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <Text style={{ textAlign: 'center', marginBottom: 20, color: '#333' }}>
          {t('common.camera_permission')}
        </Text>
        <TouchableOpacity style={styles.button} onPress={requestPermission}>
          <Text style={styles.buttonText}>{t('common.grant_permission')}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (isModelLoading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#007bff" />
        <Text style={styles.loadingText}>{t('offline.initializing')}</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.card}>
        {/* Header: Logo và Chọn ngôn ngữ */}
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <View style={styles.logoIcon}>
              <Image 
                source={require('../assets/icon-main.png')} 
                style={{ width: 28, height: 28, borderRadius: 6 }} 
              />
            </View>
            <Text style={styles.logoText}>DermAI</Text>
          </View>
          <TouchableOpacity style={styles.langSelector} onPress={toggleLanguage}>
             <Text style={styles.langSelectorText}>
               {i18n.language === 'vi' ? 'VN ▼' : 'EN ▼'}
             </Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.subTitle}>
          {capturedImage ? t('offline.result_title') : t('offline.capture_instruction')}
        </Text>

        {/* Khu vực hiển thị Media (Camera hoặc Ảnh đã chụp) */}
        <View style={styles.mediaContainer}>
          {capturedImage ? (
             <Image source={{ uri: capturedImage }} style={styles.mainImage} />
          ) : (
            <>
              <CameraView 
                style={styles.camera} 
                ref={cameraRef}
                facing={facing}
              />
              {/* Floating Accuracy Warning */}
              <View style={styles.floatingWarning}>
                <WarningIcon size={12} color="#856404" style={{marginRight: 4}} />
                <Text style={styles.floatingWarningText}>
                  {t('offline.accuracy_warning')}
                </Text>
              </View>
            </>
          )}
          {isInferenceLoading && (
            <View style={styles.mediaOverlay}>
              <ActivityIndicator size="large" color="#007bff" />
              <Text style={[styles.loadingText, {marginTop: 10}]}>{t('offline.analyzing')}</Text>
            </View>
          )}
        </View>

        {/* Bảng kết quả (Chỉ hiện khi đã chẩn đoán xong) */}
        {capturedImage && results.length > 0 && (
          <ScrollView style={styles.resultsScroll} showsVerticalScrollIndicator={false}>
            {results.map((res, index) => (
              <View key={index} style={styles.resultRow}>
                <Text style={styles.diseaseName}>{t(`diseases.${res.name}`, { defaultValue: res.name })}</Text>
                <Text style={styles.probability}>{res.probability.toFixed(1)}%</Text>
              </View>
            ))}

            {/* Detailed Disclaimer inside results */}
            <View style={styles.noticeBox}>
              <Text style={styles.noticeTitle}>{t('offline.important_notices')}</Text>
              <Text style={styles.noticeItem}>{t('offline.notice_reference')}</Text>
              <Text style={styles.noticeItem}>{t('offline.notice_no_replacement')}</Text>
              <Text style={styles.noticeItem}>{t('offline.notice_consult_doctor')}</Text>
            </View>
          </ScrollView>
        )}

        {/* Hàng nút chức năng */}
        {!capturedImage ? (
          <View style={styles.actionRow}>
            <TouchableOpacity style={styles.miniButton} onPress={toggleCameraFacing}>
              <FlipIcon size={20} color="#555" />
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.mainCaptureButton} onPress={takePicture}>
              <View style={styles.captureInner}>
                 <CameraIcon size={32} color="#fff" />
              </View>
            </TouchableOpacity>

            <TouchableOpacity style={styles.miniButton} onPress={pickImage}>
              <GalleryIcon size={20} color="#555" />
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.actionRow}>
             <TouchableOpacity style={styles.secondaryButton} onPress={() => setCapturedImage(null)}>
                <Text style={styles.secondaryButtonText}>{t('common.retry')}</Text>
             </TouchableOpacity>
          </View>
        )}

        <View style={styles.divider} />

        {/* Nút Gọi Cấp Cứu */}
        <TouchableOpacity 
          style={styles.emergencyButton} 
          onPress={() => Linking.openURL('tel:115')}
        >
          <PhoneIcon size={20} color="#fff" style={{marginRight: 8}} />
          <Text style={styles.emergencyText}>{t('offline.call_emergency')}</Text>
        </TouchableOpacity>

        <Text style={styles.disclaimerText}>
          {t('offline.medical_disclaimer_bottom')}
        </Text>
      </View>

      {/* Thanh điều hướng giả phía dưới (Bottom Navigation) */}
      <View style={styles.bottomNav}>
         <TouchableOpacity><HomeIcon size={24} color="#007bff" /></TouchableOpacity>
         <TouchableOpacity style={{opacity: 0.3}}><ChatIcon size={24} color="#333" /></TouchableOpacity>
         <TouchableOpacity style={{opacity: 0.3}}><MedicineIcon size={24} color="#333" /></TouchableOpacity>
         <TouchableOpacity style={{opacity: 0.3}}><PhoneIcon size={24} color="#333" /></TouchableOpacity>
         <TouchableOpacity style={{opacity: 0.3}}><ProfileIcon size={24} color="#333" /></TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f4f7f9', // Màu nền sáng thanh lịch
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: {
    width: width * 0.9,
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 20,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.08,
    shadowRadius: 20,
    marginBottom: 60, // Chừa chỗ cho bottom nav
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoIcon: {
    marginRight: 8,
  },
  logoIconText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 18,
  },
  logoText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#333',
  },
  langSelector: {
    backgroundColor: '#f8f9fa',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#eee',
  },
  langSelectorText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#555',
  },
  subTitle: {
    textAlign: 'center',
    fontSize: 12,
    color: '#888',
    marginBottom: 15,
  },
  mediaContainer: {
    width: 280,
    height: 280,
    alignSelf: 'center',
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: '#222',
    backgroundColor: '#000',
    marginBottom: 20,
    position: 'relative',
  },
  camera: {
    flex: 1,
  },
  mainImage: {
    width: '100%',
    height: '100%',
  },
  mediaOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,255,255,0.85)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  mainCaptureButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#007bff',
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 20,
    shadowColor: '#007bff',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  captureInner: {
    width: 58,
    height: 58,
    borderRadius: 29,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  miniButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#f1f4f8',
    justifyContent: 'center',
    alignItems: 'center',
  },
  emojiIcon: {
    fontSize: 20,
  },
  divider: {
    height: 1,
    backgroundColor: '#f0f0f0',
    width: '100%',
    marginVertical: 15,
  },
  emergencyButton: {
    backgroundColor: '#ef4444',
    flexDirection: 'row',
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  emergencyText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 15,
  },
  disclaimerText: {
    fontSize: 10,
    color: '#aaa',
    textAlign: 'center',
    paddingHorizontal: 10,
  },
  bottomNav: {
    flexDirection: 'row',
    position: 'absolute',
    bottom: 0,
    width: '100%',
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    paddingVertical: 12,
    paddingBottom: Platform.OS === 'ios' ? 30 : 12, // SafeArea cho iOS
    justifyContent: 'space-around',
  },
  navIcon: {
    fontSize: 22,
  },
  resultsScroll: {
    maxHeight: 120,
    marginBottom: 15,
    paddingHorizontal: 5,
  },
  resultRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 7,
    borderBottomWidth: 1,
    borderBottomColor: '#f8f8f8',
  },
  diseaseName: {
    fontSize: 13,
    color: '#444',
    flex: 1,
    fontWeight: '500',
  },
  probability: {
    fontWeight: 'bold',
    color: '#007bff',
    fontSize: 13,
  },
  secondaryButton: {
    paddingVertical: 8,
    paddingHorizontal: 35,
    borderRadius: 20,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  secondaryButtonText: {
    color: '#666',
    fontWeight: 'bold',
    fontSize: 14,
  },
  button: {
    backgroundColor: '#007bff',
    padding: 12,
    borderRadius: 10,
    width: 200,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  loadingText: {
    fontSize: 13,
    color: '#666',
    fontWeight: '500',
  },
  floatingWarning: {
    position: 'absolute',
    bottom: 15,
    left: 10,
    right: 10,
    backgroundColor: 'rgba(255, 193, 7, 0.9)',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  floatingWarningText: {
    color: '#856404',
    fontSize: 10,
    fontWeight: '600',
    textAlign: 'center',
  },
  noticeBox: {
    backgroundColor: '#fff9db',
    borderRadius: 12,
    padding: 12,
    marginTop: 15,
    borderLeftWidth: 4,
    borderLeftColor: '#fcc419',
  },
  noticeTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#856404',
    marginBottom: 5,
  },
  noticeItem: {
    fontSize: 11,
    color: '#856404',
    marginBottom: 2,
    lineHeight: 16,
  }
});
