/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */

import React, {useState, useEffect} from 'react';
import {
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  StatusBar,
  TextInput,
  Modal,
  ScrollView,
  Platform,
  Dimensions,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Pomodoro geçmişi için tip tanımı
type PomodoroRecord = {
  id: number;
  duration: number;
  date: Date;
  completed: boolean;
  note?: string; // İsteğe bağlı not alanı
};

const App = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isEditing, setIsEditing] = useState(false);
  const [inputMinutes, setInputMinutes] = useState('25');
  const [showMenu, setShowMenu] = useState(false);
  const [currentScreen, setCurrentScreen] = useState('timer');
  const [pomodoroHistory, setPomodoroHistory] = useState<PomodoroRecord[]>([]);
  const [isPortrait, setIsPortrait] = useState(Dimensions.get('window').height > Dimensions.get('window').width);

  // Geçmişi yükle
  useEffect(() => {
    loadHistory();
  }, []);

  // Geçmiş değiştiğinde kaydet
  useEffect(() => {
    saveHistory();
  }, [pomodoroHistory]);

  // Geçmişi AsyncStorage'dan yükle
  const loadHistory = async () => {
    try {
      const savedHistory = await AsyncStorage.getItem('pomodoroHistory');
      if (savedHistory) {
        const parsedHistory = JSON.parse(savedHistory);
        // Tarihleri string'den Date objesine çevir
        const historyWithDates = parsedHistory.map((record: PomodoroRecord) => ({
          ...record,
          date: new Date(record.date)
        }));
        setPomodoroHistory(historyWithDates);
      }
    } catch (error) {
      console.error('Geçmiş yüklenirken hata:', error);
    }
  };

  // Geçmişi AsyncStorage'a kaydet
  const saveHistory = async () => {
    try {
      await AsyncStorage.setItem('pomodoroHistory', JSON.stringify(pomodoroHistory));
    } catch (error) {
      console.error('Geçmiş kaydedilirken hata:', error);
    }
  };

  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (isRunning && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft(time => time - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      setIsRunning(false);
      // Süre bittiğinde yeni bir pomodoro başlat
      const newRecord: PomodoroRecord = {
        id: Date.now(),
        duration: parseInt(inputMinutes, 10),
        date: new Date(),
        completed: true,
      };
      setPomodoroHistory(prev => [newRecord, ...prev]);
      setTimeLeft(parseInt(inputMinutes, 10) * 60);
    }

    return () => clearInterval(interval);
  }, [isRunning, timeLeft, inputMinutes]);

  useEffect(() => {
    const updateOrientation = () => {
      setIsPortrait(Dimensions.get('window').height > Dimensions.get('window').width);
    };

    Dimensions.addEventListener('change', updateOrientation);
    return () => {
      // @ts-ignore
      Dimensions.removeEventListener('change', updateOrientation);
    };
  }, []);

  const dynamicStyles = StyleSheet.create({
    timerContainer: {
      position: 'absolute',
      top: isPortrait ? '35%' : '16%',
      alignItems: 'center',
      justifyContent: 'center',
    },
    timerText: {
      color: '#FFFFFF',
      fontSize: isPortrait ? 148 : 200,
      fontWeight: Platform.select({
        ios: '100',
        android: '100',
      }),
      fontFamily: Platform.select({
        ios: 'Helvetica Neue',
        android: 'sans-serif-thin',
      }),
      opacity: 0.65,
      includeFontPadding: false,
      letterSpacing: 4,
      textShadowColor: 'rgba(255, 255, 255, 0.1)',
      textShadowOffset: {width: 0, height: 0},
      textShadowRadius: 10,
    },
    startButton: {
      position: 'absolute',
      bottom: isPortrait ? 150 : 30,
      paddingHorizontal: 40,
      paddingVertical: 15,
      borderRadius: 30,
      borderWidth: 1,
      borderColor: '#FFFFFF',
    },
  });

  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const handleTimerPress = () => {
    if (!isRunning) {
      setIsEditing(true);
      setInputMinutes(Math.floor(timeLeft / 60).toString());
    }
  };

  const handleInputSubmit = () => {
    const newMinutes = parseInt(inputMinutes, 10);
    if (newMinutes > 0 && newMinutes <= 180) {
      setTimeLeft(newMinutes * 60);
      setIsEditing(false);
    }
  };

  const toggleTimer = () => {
    if (!isRunning) {
      // Başlatırken mevcut süreyi kullan
      setIsRunning(true);
    } else {
      // Durdurulduğunda
      setIsRunning(false);
      
      // Geçmişe ekle
      const totalSeconds = parseInt(inputMinutes, 10) * 60;
      const elapsedSeconds = totalSeconds - timeLeft;
      const elapsedMinutes = Math.floor(elapsedSeconds / 60);
      
      const newRecord: PomodoroRecord = {
        id: Date.now(),
        duration: parseInt(inputMinutes, 10),
        date: new Date(),
        completed: timeLeft === 0,
        note: timeLeft > 0 ? `${elapsedMinutes} dk çalışıldı` : undefined
      };
      setPomodoroHistory(prev => [newRecord, ...prev]);
      
      // Süreyi sıfırla
      setTimeLeft(parseInt(inputMinutes, 10) * 60);
    }
    
    if (isEditing) {
      handleInputSubmit();
    }
  };

  const handleMenuPress = () => {
    setShowMenu(true);
  };

  const handleMenuOption = (screen: string) => {
    setShowMenu(false);
    setCurrentScreen(screen);
  };

  const formatDate = (date: Date): string => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Bugün';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Dün';
    }
    return date.toLocaleDateString('tr-TR', {
      day: 'numeric',
      month: 'long',
    });
  };

  const renderScreen = () => {
    switch (currentScreen) {
      case 'history':
        return (
          <View style={styles.screenContainer}>
            <Text style={styles.historyTitle}>Pomodoro Geçmişi</Text>
            <ScrollView style={styles.historyList}>
              <View style={styles.dateSection}>
                <Text style={styles.dateSectionTitle}>Bugün</Text>
                {pomodoroHistory.map((record) => (
                  <View key={record.id}>
                    <View style={styles.historyItem}>
                      <View style={styles.itemLeft}>
                        <View style={styles.timeContainer}>
                          <Text style={[styles.statusIcon, record.completed ? styles.completedIcon : styles.failedIcon]}>
                            {record.completed ? '✓' : '×'}
                          </Text>
                          <Text style={styles.timeText}>
                            {record.date.toLocaleTimeString('tr-TR', {
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </Text>
                        </View>
                        {record.note && (
                          <Text style={styles.statusNote}>{record.note}</Text>
                        )}
                      </View>
                      <Text style={styles.durationText}>{record.duration} dakika</Text>
                    </View>
                    <View style={styles.separator} />
                  </View>
                ))}
              </View>
            </ScrollView>
          </View>
        );
      case 'settings':
        return (
          <View style={styles.screenContainer}>
            <Text style={styles.screenTitle}>Ayarlar</Text>
            {/* Ayarlar ekranı içeriği buraya gelecek */}
          </View>
        );
      default:
        return (
          <>
            <View style={dynamicStyles.timerContainer}>
              <TouchableOpacity onPress={handleTimerPress}>
                {isEditing ? (
                  <View style={styles.editContainer}>
                    <TextInput
                      style={dynamicStyles.timerText}
                      keyboardType="number-pad"
                      value={inputMinutes}
                      onChangeText={setInputMinutes}
                      onBlur={handleInputSubmit}
                      onSubmitEditing={handleInputSubmit}
                      maxLength={3}
                      autoFocus
                      selectTextOnFocus
                    />
                    <Text style={styles.minuteText}>dakika</Text>
                  </View>
                ) : (
                  <Text style={dynamicStyles.timerText}>{formatTime(timeLeft)}</Text>
                )}
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={dynamicStyles.startButton}
              onPress={toggleTimer}>
              <Text style={styles.buttonText}>{isRunning ? 'Durdur' : 'Başlat'}</Text>
            </TouchableOpacity>
          </>
        );
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000000" />
      
      <TouchableOpacity 
        style={styles.menuButton}
        onPress={handleMenuPress}>
        <Text style={styles.menuDots}>⋮</Text>
      </TouchableOpacity>

      {renderScreen()}

      <Modal
        animationType="fade"
        transparent={true}
        visible={showMenu}
        onRequestClose={() => setShowMenu(false)}>
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowMenu(false)}>
          <View style={styles.menuContainer}>
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => handleMenuOption('timer')}>
              <Text style={styles.menuItemText}>Zamanlayıcı</Text>
            </TouchableOpacity>
            <View style={styles.menuDivider} />
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => handleMenuOption('history')}>
              <Text style={styles.menuItemText}>Geçmiş</Text>
            </TouchableOpacity>
            <View style={styles.menuDivider} />
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => handleMenuOption('settings')}>
              <Text style={styles.menuItemText}>Ayarlar</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
    alignItems: 'center',
  },
  menuButton: {
    position: 'absolute',
    top: 20,
    left: 20,
    padding: 10,
    zIndex: 1,
  },
  menuDots: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  menuContainer: {
    position: 'absolute',
    top: 90,
    left: 20,
    backgroundColor: '#1A1A1A',
    borderRadius: 10,
    padding: 5,
    minWidth: 150,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  menuItem: {
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  menuItemText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '400',
  },
  menuDivider: {
    height: 1,
    backgroundColor: '#333333',
  },
  screenContainer: {
    flex: 1,
    width: '100%',
    backgroundColor: '#000000',
  },
  screenTitle: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '600',
    marginBottom: 20,
  },
  timerContainer: {
    position: 'absolute',
    top: Dimensions.get('window').height > Dimensions.get('window').width ? '35%' : '21%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  editContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  timerText: {
    color: '#FFFFFF',
    fontSize: 148,
    fontWeight: Platform.select({
      ios: '100',
      android: '100',
    }),
    fontFamily: Platform.select({
      ios: 'Helvetica Neue',
      android: 'sans-serif-thin',
    }),
    opacity: 0.65,
    includeFontPadding: false,
    letterSpacing: 4,
    textShadowColor: 'rgba(255, 255, 255, 0.1)',
    textShadowOffset: {width: 0, height: 0},
    textShadowRadius: 10,
  },
  timerInput: {
    fontSize: 148,
    color: '#FFFFFF',
    fontWeight: Platform.select({
      ios: '100',
      android: '100',
    }),
    fontFamily: Platform.select({
      ios: 'Helvetica Neue',
      android: 'sans-serif-thin',
    }),
    textAlign: 'center',
    minWidth: 120,
    padding: 0,
    opacity: 0.65,
    includeFontPadding: false,
    letterSpacing: 4,
    textShadowColor: 'rgba(255, 255, 255, 0.1)',
    textShadowOffset: {width: 0, height: 0},
    textShadowRadius: 10,
  },
  minuteText: {
    fontSize: 20,
    color: '#FFFFFF',
    fontWeight: '200',
    marginLeft: 10,
    opacity: 0.8,
  },
  startButton: {
    position: 'absolute',
    bottom: Dimensions.get('window').height > Dimensions.get('window').width ? 150 : 30,
    paddingHorizontal: 40,
    paddingVertical: 15,
    borderRadius: 30,
    borderWidth: 1,
    borderColor: '#FFFFFF',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '300',
  },
  historyTitle: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '200',
    marginTop: 20,
    marginBottom: 40,
    textAlign: 'center',
    width: '100%',
  },
  historyList: {
    width: '100%',
    flex: 1,
  },
  dateSection: {
    paddingHorizontal: 20,
    borderTopWidth: 0.2,
    borderTopColor: '#333',
  },
  dateSectionTitle: {
    color: '#999999',
    fontSize: 14,
    fontWeight: '300',
    paddingVertical: 15,
    letterSpacing: 1,
    borderBottomWidth: 0.2,
    borderBottomColor: '#333333',
    marginBottom: 5,
  },
  historyItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingVertical: 12,
  },
  separator: {
    width: '100%',
    height: 1,
    backgroundColor: '#333333',
    opacity: 0.3,
  },
  itemLeft: {
    alignItems: 'flex-start',
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusIcon: {
    fontSize: 18,
    marginRight: 8,
    fontWeight: '300',
    includeFontPadding: false,
    lineHeight: 20,
  },
  completedIcon: {
    color: '#4CAF50',
  },
  failedIcon: {
    color: '#FF5252',
  },
  timeText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '300',
  },
  durationText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '300',
  },
  statusNote: {
    color: '#999999',
    fontSize: 12,
    fontWeight: '300',
    marginTop: 2,
    marginLeft: 18,
  },
});

export default App;
