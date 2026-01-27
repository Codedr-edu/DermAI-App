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
// 1. Cấu Hình
// ----------------------------------------------------
const EXTERNAL_URL: string = 'https://dermai-7xjv.onrender.com/'; // Thay thế bằng URL của bạn

/**
 * Component/Hàm render hiển thị biểu tượng loading khi WebView đang tải nội dung.
 * Được định nghĩa là một hàm trả về JSX để tương thích với prop renderLoading của WebView.
 */
const LoadingIndicator = () => (
  <View style={styles.loadingContainer}>
    <ActivityIndicator
      size="large"
      color="#007bff" // Màu xanh dương
    />
  </View>
);

// ----------------------------------------------------
// 2. Component Chính: App
// ----------------------------------------------------
export default function App() {
  
  /**
   * Xử lý lỗi tải trang của WebView.
   * @param syntheticEvent Thông tin sự kiện lỗi.
   */
  const handleWebViewError = (syntheticEvent: any) => {
    const { nativeEvent } = syntheticEvent;
    
    // Log lỗi để debug
    console.error('WebView Error:', nativeEvent);

    // Hiển thị thông báo lỗi thân thiện với người dùng
    Alert.alert(
      'Lỗi Tải Trang',
      `Không thể tải trang: ${nativeEvent.description}. Vui lòng kiểm tra kết nối mạng hoặc URL.`,
      [{ text: 'OK' }],
      { cancelable: true }
    );
  };
  
  /**
   * Xử lý việc cho phép/ngăn chặn điều hướng (navigation) bên trong WebView.
   * @param request Thông tin về yêu cầu điều hướng.
   * @returns true nếu cho phép tải, false nếu chặn.
   */
  const onShouldStartLoadWithRequest = (request: WebViewNavigation): boolean => {
    const url = request.url;
    
    // Ví dụ: Ngăn chặn mở trang đăng nhập Facebook bên trong WebView
    if (url.includes('facebook.com/login')) {
      console.log('Đã chặn chuyển hướng đến trang đăng nhập Facebook.');
      // Nếu muốn mở trình duyệt ngoài: Linking.openURL(url);
      return false; 
    }
    
    // Cho phép tải các URL khác
    return true; 
  };


  return (
    // SafeAreaView giúp nội dung không bị thanh trạng thái (status bar) hoặc notch che mất.
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <WebView
          // URL nguồn cần tải
          source={{ uri: EXTERNAL_URL }}
          
          // Style của WebView
          style={styles.webview}
          
          // Fix lỗi: renderLoading nhận trực tiếp hàm trả về JSX
          renderLoading={LoadingIndicator} 
          startInLoadingState={true} // Bắt buộc phải là true để renderLoading được kích hoạt
          
          // Giả lập User Agent để bypass Google Auth block
          userAgent={
            Platform.OS === 'android'
              ? 'Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/116.0.0.0 Mobile Safari/537.36'
              : 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1'
          }

          // Cho phép phát video/camera trực tiếp trên trang, không nhảy ra toàn màn hình (iOS)
          allowsInlineMediaPlayback={true}
          // Tự động phát mà không cần người dùng bấm nút Play
          mediaPlaybackRequiresUserAction={false}

          // Xử lý các sự kiện
          onLoadStart={() => console.log('Bắt đầu tải trang:', EXTERNAL_URL)}
          onLoadEnd={() => console.log('Tải trang hoàn tất.')}
          onError={handleWebViewError}
          onShouldStartLoadWithRequest={onShouldStartLoadWithRequest}

          // Cài đặt Android (Tùy chọn)
          javaScriptEnabled={true} 
          domStorageEnabled={true} 
          
          // Cài đặt iOS (Tùy chọn)
          allowsBackForwardNavigationGestures={true} 
        />
      </View>
    </SafeAreaView>
  );
}

// ----------------------------------------------------
// 3. Định nghĩa Styles
// ----------------------------------------------------
const styles = StyleSheet.create({
  // Style cho SafeAreaView để quản lý vùng an toàn
  safeArea: {
    flex: 1,
    backgroundColor: '#fff',
    // Điều chỉnh padding/margin cho Android để tránh StatusBar
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  // Container bao bọc WebView
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5', 
  },
  // Style chính cho WebView
  webview: {
    flex: 1,
  },
  // Container cho biểu tượng loading (đặt chính giữa màn hình)
  loadingContainer: {
    position: 'absolute', 
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    backgroundColor: '#ffffffcc', // Màu trắng trong suốt
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10, 
  },
});