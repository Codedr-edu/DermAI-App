import React, { useState, useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet, Text } from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import WebViewMode from './components/WebViewMode';
import OfflineMode from './components/OfflineMode';

class ErrorBoundary extends React.Component<any, { hasError: boolean; error: any }> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: any) {
    return { hasError: true, error };
  }

  componentDidCatch(error: any, errorInfo: any) {
    console.error('🔴 Error caught by ErrorBoundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.errorContainer}>
          <Text style={styles.errorTitle}>😞 Ứng dụng gặp lỗi</Text>
          <Text style={styles.errorText}>{String(this.state.error)}</Text>
          <Text style={styles.errorHint}>Vui lòng khởi động lại ứng dụng</Text>
        </View>
      );
    }
    return this.props.children;
  }
}

export default function App() {
  const [isConnected, setIsConnected] = useState<boolean | null>(true);
  const [isChecking, setIsChecking] = useState<boolean>(true);

  useEffect(() => {
    // Đợi 1.5 giây để NetInfo ổn định trước khi quyết định
    const timer = setTimeout(() => {
      NetInfo.fetch().then(state => {
        console.log('📱 Initial Network state:', state);
        setIsConnected(state.isConnected === true);
        setIsChecking(false);
      });
    }, 1500);

    const unsubscribe = NetInfo.addEventListener(state => {
      console.log('📱 Network state change:', state);
      if (state.isConnected !== null) {
        setIsConnected(state.isConnected === true);
        setIsChecking(false);
      }
    });

    return () => {
      clearTimeout(timer);
      unsubscribe();
    };
  }, []);

  console.log('🔄 App render - isChecking:', isChecking, 'isConnected:', isConnected);

  if (isChecking) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007bff" />
      </View>
    );
  }

  // Có mạng -> WebView, Mất mạng -> Offline Mode
  const appContent = isConnected ? <WebViewMode /> : (
    <ErrorBoundary>
      <OfflineMode />
    </ErrorBoundary>
  );
  
  return (
    <ErrorBoundary>
      {appContent}
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 20,
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#d32f2f',
  },
  errorText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
  },
  errorHint: {
    fontSize: 12,
    color: '#999',
    fontStyle: 'italic',
  },
});
