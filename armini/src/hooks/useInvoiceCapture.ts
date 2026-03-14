import * as ImagePicker from 'expo-image-picker';
import { Alert, Platform } from 'react-native';
import { useFinancesStore } from '../stores/useFinancesStore';

export function useInvoiceCapture() {
  const { photoUri, status, referenceId, invoiceData, error, setPhoto, clearPhoto, submitInvoice, reset } =
    useFinancesStore();

  const takePhoto = async () => {
    try {
      if (Platform.OS !== 'web') {
        const { status: permStatus } = await ImagePicker.requestCameraPermissionsAsync();
        if (permStatus !== 'granted') {
          Alert.alert('Permission required', 'Camera access is needed to take a photo.');
          return;
        }
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'],
        quality: 0.85,
        allowsEditing: false,
        base64: true,
      });

      if (!result.canceled && result.assets[0]) {
        setPhoto(result.assets[0].uri, result.assets[0].base64 ?? null);
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Could not open camera.';
      Alert.alert('Error', message);
    }
  };

  const pickFromLibrary = async () => {
    try {
      if (Platform.OS !== 'web') {
        const { status: permStatus } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (permStatus !== 'granted') {
          Alert.alert('Permission required', 'Photo library access is needed to select a photo.');
          return;
        }
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        quality: 0.85,
        allowsEditing: false,
        base64: true,
      });

      if (!result.canceled && result.assets[0]) {
        setPhoto(result.assets[0].uri, result.assets[0].base64 ?? null);
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Could not open photo library.';
      Alert.alert('Error', message);
    }
  };

  return {
    photoUri,
    status,
    referenceId,
    invoiceData,
    error,
    takePhoto,
    pickFromLibrary,
    clearPhoto,
    submitInvoice,
    reset,
    isSubmitting: status === 'submitting',
    isSuccess: status === 'success',
    isError: status === 'error',
  };
}
