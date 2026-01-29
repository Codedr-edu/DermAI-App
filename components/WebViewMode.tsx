import React from 'react';
import {
  StyleSheet,
  View,
  ActivityIndicator,
  SafeAreaView,
  Platform,
  StatusBar,
  Alert,
} from 'react-native';
import { WebView, WebViewNavigation } from 'react-native-webview';

// ----------------------------------------------------
// Cấu Hình
// ----------------------------------------------------
const EXTERNAL_URL: string = 'https://dermai-7xjv.onrender.com/';

/**
 * Component hiển thị biểu tượng loading khi WebView đang tải nội dung.
 */
const LoadingIndicator = () => (
  <View style={styles.loadingContainer}>
    <ActivityIndicator size="large" color="#007bff" />
  </View>
);

export default function WebViewMode() {
  /**
   * Xử lý lỗi tải trang của WebView.
   */
  const handleWebViewError = (syntheticEvent: any) => {
    const { nativeEvent } = syntheticEvent;
    console.error('WebView Error:', nativeEvent);

    Alert.alert(
      'Lỗi Tải Trang',
      `Không thể tải trang: ${nativeEvent.description}. Vui lòng kiểm tra kết nối mạng hoặc URL.`,
      [{ text: 'OK' }],
      { cancelable: true }
    );
  };
  
  /**
   * Xử lý điều hướng bên trong WebView.
   */
  const onShouldStartLoadWithRequest = (request: WebViewNavigation): boolean => {
    const url = request.url;
    if (url.includes('facebook.com/login')) {
      return false; // Chặn Facebook login
    }
    return true; 
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <WebView
          source={{ uri: EXTERNAL_URL }}
          style={styles.webview}
          renderLoading={LoadingIndicator} 
          startInLoadingState={true}
          
          // Các cấu hình quan trọng mà bạn đã sửa
          userAgent={
            Platform.OS === 'android'
              ? 'Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/116.0.0.0 Mobile Safari/537.36'
              : 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1'
          }
          allowsInlineMediaPlayback={true}
          mediaPlaybackRequiresUserAction={false}
          originWhitelist={['*']}
          javaScriptEnabled={true} 
          domStorageEnabled={true} 
          allowsBackForwardNavigationGestures={true} 
          
          onLoadStart={() => console.log('Bắt đầu tải trang:', EXTERNAL_URL)}
          onLoadEnd={() => console.log('Tải trang hoàn tất.')}
          onError={handleWebViewError}
          onShouldStartLoadWithRequest={onShouldStartLoadWithRequest}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fff',
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5', 
  },
  webview: {
    flex: 1,
  },
  loadingContainer: {
    position: 'absolute', 
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    backgroundColor: '#ffffffcc',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10, 
  },
});
