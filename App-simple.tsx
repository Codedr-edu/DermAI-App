import React from 'react';
import { View, StyleSheet, Text } from 'react-native';

export default function App() {
  console.log('🚀 Simple App loaded successfully!');

  return (
    <View style={styles.container}>
      <Text style={styles.title}>DermAI App</Text>
      <Text style={styles.text}>App loaded successfully!</Text>
      <Text style={styles.text}>Basic render test</Text>
      <Text style={styles.text}>No complex components loaded</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#007bff',
  },
  text: {
    fontSize: 16,
    marginBottom: 10,
    textAlign: 'center',
  },
});
