/**
 * Enhanced React Native Beacon App
 * @format
 */

import React, { useEffect, useState } from 'react';
import type { PropsWithChildren } from 'react';
import {
  PermissionsAndroid,
  Platform,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  useColorScheme,
  View,
  Text,
  TouchableOpacity,
  Alert,
  Dimensions,
} from 'react-native';
import { NativeModules } from 'react-native';
const { BeaconAdvertiser } = NativeModules;
import {
  Colors,
  Header,
} from 'react-native/Libraries/NewAppScreen';
import { PERMISSIONS, requestMultiple } from 'react-native-permissions';
import DeviceInfo from 'react-native-device-info';
import ListeningIndicator from './Listining';

const { width } = Dimensions.get('window');

const startBeacon = async () => {
  try {
    await BeaconAdvertiser.startIBeacon(
      'fda50693-a4e2-4fb1-afcf-c6eb07647825', // UUID
      100,  // major
      1,    // minor
      -59   // Tx power (RSSI at 1m)
    );
    console.log('Beacon started');
    return { success: true, message: 'Programme démarré avec succès' };
  } catch (err: any) {
    console.log('Beacon start failed', err);
    // console.error('Beacon start failed', err);
    return { success: false, message: 'Échec du démarrage du programme', error: err?.message ?? err.toString() };
  }
};

// Composant Header moderne
const ModernHeader = ({ isDarkMode }: any) => (
  <View style={[styles.headerContainer, { backgroundColor: isDarkMode ? '#1a1a1a' : '#ffffff' }]}>
    <View style={styles.headerContent}>
      <View style={styles.iconContainer}>
        <View style={[styles.icon, { backgroundColor: isDarkMode ? '#4a9eff' : '#007AFF' }]}>
          <Text style={styles.iconText}>📱</Text>
        </View>
      </View>
      <Text style={[styles.headerTitle, { color: isDarkMode ? '#ffffff' : '#1a1a1a' }]}>
        Connexion Véhicule
      </Text>
      <Text style={[styles.headerSubtitle, { color: isDarkMode ? '#b0b0b0' : '#666666' }]}>
        Approchez votre téléphone du véhicule
      </Text>
    </View>
  </View>
);

// Composant Message Status moderne
const StatusMessage = ({ type, message, onRetry, isDarkMode }: any) => {
  const getStatusConfig = () => {
    switch (type) {
      case 'success':
        return {
          backgroundColor: isDarkMode ? '#1a4d3a' : '#d4edda',
          borderColor: '#28a745',
          textColor: isDarkMode ? '#90ee90' : '#155724',
          icon: '✅',
          title: 'Succès'
        };
      case 'error':
        return {
          backgroundColor: isDarkMode ? '#4d1a1a' : '#f8d7da',
          borderColor: '#dc3545',
          textColor: isDarkMode ? '#ff6b6b' : '#721c24',
          icon: '❌',
          title: 'Erreur'
        };
      case 'warning':
        return {
          backgroundColor: isDarkMode ? '#4d3d1a' : '#fff3cd',
          borderColor: '#ffc107',
          textColor: isDarkMode ? '#ffd93d' : '#856404',
          icon: '⚠️',
          title: 'Attention'
        };
      case 'info':
        return {
          backgroundColor: isDarkMode ? '#1a3d4d' : '#d1ecf1',
          borderColor: '#17a2b8',
          textColor: isDarkMode ? '#87ceeb' : '#0c5460',
          icon: 'ℹ️',
          title: 'Information'
        };
      default:
        return {
          backgroundColor: isDarkMode ? '#2a2a2a' : '#f8f9fa',
          borderColor: '#6c757d',
          textColor: isDarkMode ? '#ffffff' : '#495057',
          icon: '📄',
          title: 'Message'
        };
    }
  };

  const config = getStatusConfig();

  return (
    <View style={[styles.statusContainer, {
      backgroundColor: config.backgroundColor,
      borderLeftColor: config.borderColor
    }]}>
      <View style={styles.statusHeader}>
        <Text style={styles.statusIcon}>{config.icon}</Text>
        <Text style={[styles.statusTitle, { color: config.textColor }]}>
          {config.title}
        </Text>
      </View>
      <Text style={[styles.statusMessage, { color: config.textColor }]}>
        {message}
      </Text>
      {onRetry && (
        <TouchableOpacity
          style={[styles.retryButton, { borderColor: config.borderColor }]}
          onPress={onRetry}
        >
          <Text style={[styles.retryButtonText, { color: config.borderColor }]}>
            Réessayer
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

function App(): React.JSX.Element {
  const [status, setStatus] = useState({ type: 'info', message: 'Initialisation en cours...' });
  const [hasPermissions, setHasPermissions] = useState(false);

  const requestPermissions = async (): Promise<boolean> => {
    console.log('requestPermissions');
    try {
      if (Platform.OS === 'android') {
        const apiLevel = await DeviceInfo.getApiLevel();
        console.log('apiLevel', apiLevel);

        if (apiLevel < 31) {
          const granted = await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
            {
              title: 'Permission de localisation requise',
              message: 'Bluetooth Low Energy nécessite l\'accès à la localisation',
              buttonNeutral: 'Plus tard',
              buttonNegative: 'Annuler',
              buttonPositive: 'Autoriser',
            },
          );
          console.log('granted', granted);
          const isGranted = granted === PermissionsAndroid.RESULTS.GRANTED;
          if (isGranted) {
            setStatus({ type: 'success', message: 'Permissions accordées avec succès' });
          } else {
            setStatus({
              type: 'error',
              message: 'Permission de localisation refusée. Veuillez l\'autoriser pour utiliser le Bluetooth.'
            });
          }
          return isGranted;
        } else {
          const result = await requestMultiple([
            PERMISSIONS.ANDROID.BLUETOOTH_ADVERTISE,
            PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION,
          ]);
          console.log('result', result);

          const isGranted =
            result['android.permission.BLUETOOTH_ADVERTISE'] === PermissionsAndroid.RESULTS.GRANTED &&
            result['android.permission.ACCESS_FINE_LOCATION'] === PermissionsAndroid.RESULTS.GRANTED;

          if (isGranted) {
            setStatus({ type: 'success', message: 'Toutes les permissions Bluetooth accordées' });
          } else {
            setStatus({
              type: 'error',
              message: 'Permissions Bluetooth refusées. Veuillez les autoriser dans les paramètres.'
            });
          }
          return isGranted;
        }
      } else {
        setStatus({ type: 'success', message: 'Permissions iOS validées' });
        return true;
      }
    } catch (error: any) {
      setStatus({
        type: 'error',
        message: `Erreur lors de la demande de permissions: ${error?.message}`
      });
      return false;
    }
  };

  const handleStartBeacon = async () => {
    setStatus({ type: 'info', message: 'Démarrage du beacon...' });

    const result = await startBeacon();
    if (result.success) {
      setStatus({ type: 'success', message: result.message });
    } else {
      setStatus({
        type: 'error',
        message: result.message + ' ' + result.error,
      });
    }
  };

  const handleRetryPermissions = async () => {
    console.log('handleRetryPermissions');
    setStatus({ type: 'info', message: 'Demande de permissions...' });
    const granted = await requestPermissions();
    setHasPermissions(granted);

    if (granted) {
      // Démarrer automatiquement le beacon si les permissions sont accordées
      setTimeout(() => {
        handleStartBeacon();
      }, 1000);
    }
  };

  const isDarkMode = useColorScheme() === 'dark';

  const backgroundStyle = {
    backgroundColor: isDarkMode ? Colors.darker : Colors.lighter,
  };

  useEffect(() => {
    // Initialisation des permissions au démarrage
    const initializeApp = async () => {
      const granted = await requestPermissions();
      setHasPermissions(granted);

      if (granted) {
        // Démarrer le beacon automatiquement si les permissions sont accordées
        setTimeout(() => {
          handleStartBeacon();
        }, 1500);
      }
    };

    initializeApp();
  }, []);
  console.log('status', status);
  return (
    <SafeAreaView style={[backgroundStyle, { flex: 1 }]}>
      <StatusBar
        barStyle={isDarkMode ? 'light-content' : 'dark-content'}
        backgroundColor={backgroundStyle.backgroundColor}
      />
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        style={backgroundStyle}
        showsVerticalScrollIndicator={false}
      >
        {/* Header moderne */}
        <ModernHeader isDarkMode={isDarkMode} />

        {/* Zone principale avec ListeningIndicator */}
        <View style={[styles.mainContainer,]}>
          <ListeningIndicator />
        </View>

        {/* Zone des messages de statut */}
        <View style={styles.statusSection}>
          <StatusMessage
            type={status.type}
            message={status.message}
            onRetry={!hasPermissions ? handleRetryPermissions : null}
            isDarkMode={isDarkMode}
          />

          {/* Bouton manuel pour redémarrer le beacon */}
          {hasPermissions && (
            <TouchableOpacity
              style={[styles.actionButton, {
                backgroundColor: isDarkMode ? '#4a9eff' : '#007AFF',
              }]}
              onPress={handleStartBeacon}
            >
              <Text style={styles.actionButtonText}>
                🔄 Redémarrer
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  // Styles pour le header
  headerContainer: {
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 25,
    borderBottomRightRadius: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
  },
  headerContent: {
    alignItems: 'center',
  },
  iconContainer: {
    marginBottom: 15,
  },
  icon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  iconText: {
    fontSize: 24,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: 16,
    fontWeight: '400',
    textAlign: 'center',
    lineHeight: 22,
  },

  // Styles pour le container principal
  mainContainer: {
    height: 300,
    margin: 20,

  },

  // Styles pour la section de statut
  statusSection: {
    paddingHorizontal: 20,
    paddingBottom: 30,
  },
  statusContainer: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 15,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  statusIcon: {
    fontSize: 20,
    marginRight: 10,
  },
  statusTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  statusMessage: {
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 15,
  },
  retryButton: {
    borderWidth: 2,
    borderRadius: 25,
    paddingVertical: 12,
    paddingHorizontal: 24,
    alignSelf: 'flex-start',
  },
  retryButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  actionButton: {
    alignSelf: 'center',
    borderRadius: 25,
    paddingVertical: 10,
    paddingHorizontal: 30,
    maxWidth: 200,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  actionButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },

  // Styles existants (conservés pour compatibilité)
  sectionContainer: {
    marginTop: 32,
    paddingHorizontal: 24,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: '600',
  },
  sectionDescription: {
    marginTop: 8,
    fontSize: 18,
    fontWeight: '400',
  },
  highlight: {
    fontWeight: '700',
  },
});

export default App;