// src/screens/HomeScreen.tsx
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  ScrollView,
  TextInput,
  ActivityIndicator,
  Alert,
  Keyboard,
  Share,
  Dimensions,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';

const USER_NAME_KEY = '@UserNameKey';
const USER_HIGH_SCORE_KEY = '@UserHighScoreKey';
const USER_LAST_SCORE_KEY = '@UserLastScoreKey';
const BOOKMARKED_QUESTIONS_KEY = '@BookmarkedQuestionsKey';

const LAST_QUIZ_CORRECT_KEY = '@LastQuizCorrectKey';
const LAST_QUIZ_WRONG_KEY = '@LastQuizWrongKey';
const LAST_QUIZ_SKIPPED_KEY = '@LastQuizSkippedKey';
const LAST_QUIZ_TIME_KEY = '@LastQuizTimeKey';
const LAST_QUIZ_ATTEMPTED_KEY = '@LastQuizAttemptedKey';

const { width } = Dimensions.get('window');
const cardMargin = 15;
const cardPadding = 15;

const numColumns = 2;
const cardWidth = (width - cardMargin * (numColumns + 1)) / numColumns;

type RootStackParamList = {
  Home: undefined;
  Quiz: undefined;
  OneLiner: undefined;
  BookmarkedScreen: undefined;
};

const getTimeBasedDetails = () => {
  const hour = new Date().getHours();
  let greeting = "Hello";
  let quote = "Embrace the journey of learning.";

  if (hour >= 5 && hour < 12) {
    greeting = "Good Morning";
    quote = "A new day, a new beginning. Make it count!";
  } else if (hour >= 12 && hour < 17) {
    greeting = "Good Afternoon";
    quote = "The afternoon is a time for focused effort. Keep going!";
  } else if (hour >= 17 && hour < 21) {
    greeting = "Good Evening";
    quote = "Reflect on your day and prepare for a peaceful evening.";
  } else {
    greeting = "Good Night";
    quote = "Rest well and recharge for tomorrow's challenges.";
  }
  return { greeting, quote };
};


const HomeScreen = ({ navigation }) => {
  const [userName, setUserName] = useState<string | null>(null);
  const [nameInput, setNameInput] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isEditingName, setIsEditingName] = useState<boolean>(false);

  const [highScore, setHighScore] = useState<string | null>(null);
  const [lastScore, setLastScore] = useState<string | null>(null);
  const [bookmarkedCount, setBookmarkedCount] = useState<number>(0);

  const [lastQuizCorrect, setLastQuizCorrect] = useState<string | null>(null);
  const [lastQuizWrong, setLastQuizWrong] = useState<string | null>(null);
  const [lastQuizSkipped, setLastQuizSkipped] = useState<string | null>(null);
  const [lastQuizTime, setLastQuizTime] = useState<string | null>(null);
  const [lastQuizAttempted, setLastQuizAttempted] = useState<string | null>(null);

  const [timeDetails, setTimeDetails] = useState(getTimeBasedDetails());

  const loadUserData = useCallback(async () => {
    setIsLoading(true);
    try {
      const storedName = await AsyncStorage.getItem(USER_NAME_KEY);
      const storedHighScore = await AsyncStorage.getItem(USER_HIGH_SCORE_KEY);
      const storedLastScore = await AsyncStorage.getItem(USER_LAST_SCORE_KEY);
      const storedBookmarks = await AsyncStorage.getItem(BOOKMARKED_QUESTIONS_KEY);
      const storedLastCorrect = await AsyncStorage.getItem(LAST_QUIZ_CORRECT_KEY);
      const storedLastWrong = await AsyncStorage.getItem(LAST_QUIZ_WRONG_KEY);
      const storedLastSkipped = await AsyncStorage.getItem(LAST_QUIZ_SKIPPED_KEY);
      const storedLastTime = await AsyncStorage.getItem(LAST_QUIZ_TIME_KEY);
      const storedLastAttempted = await AsyncStorage.getItem(LAST_QUIZ_ATTEMPTED_KEY);

      setUserName(storedName);
      setHighScore(storedHighScore);
      setLastScore(storedLastScore);
      setTimeDetails(getTimeBasedDetails());
      setLastQuizCorrect(storedLastCorrect);
      setLastQuizWrong(storedLastWrong);
      setLastQuizSkipped(storedLastSkipped);
      setLastQuizTime(storedLastTime);
      setLastQuizAttempted(storedLastAttempted);

      if (storedBookmarks) {
        const bookmarksArray = JSON.parse(storedBookmarks);
        setBookmarkedCount(bookmarksArray.length);
      } else {
        setBookmarkedCount(0);
      }

      if (storedName === null && userName === null && !isEditingName) {
        setIsEditingName(true);
      }
    } catch (e) {
      console.error("Failed to load user data.", e);
      setUserName(null); setHighScore(null); setLastScore(null); setBookmarkedCount(0);
      setLastQuizCorrect(null); setLastQuizWrong(null); setLastQuizSkipped(null);
      setLastQuizTime(null); setLastQuizAttempted(null);
      if (userName === null && !isEditingName) {
         setIsEditingName(true);
      }
    } finally {
      setIsLoading(false);
    }
  }, [isEditingName, userName]);

  useFocusEffect(
    useCallback(() => {
      loadUserData();
      const intervalId = setInterval(() => {
        setTimeDetails(getTimeBasedDetails());
      }, 60000); 
      return () => clearInterval(intervalId);
    }, [loadUserData])
  );

  useEffect(() => {
    if (!isLoading && userName === null && !isEditingName) {
        setIsEditingName(true);
    }
  }, [isLoading, userName, isEditingName]);

  const saveName = async () => {
    if (!nameInput.trim() && userName) {
      setIsEditingName(false);
      setNameInput(userName);
      Keyboard.dismiss();
      return;
    }
    if (!nameInput.trim() && !userName) {
      setIsEditingName(false);
      Keyboard.dismiss();
      return;
    }
    Keyboard.dismiss();
    try {
      const nameToSave = nameInput.trim();
      await AsyncStorage.setItem(USER_NAME_KEY, nameToSave);
      setUserName(nameToSave);
      setIsEditingName(false);
    } catch (e) {
      console.error("Failed to save user name.", e);
      Alert.alert("Error", "Could not save your name.");
    }
  };

  const handleChangeName = () => {
    setNameInput(userName || '');
    setIsEditingName(true);
  };

  // ऐप को सामान्य रूप से शेयर करने के लिए फंक्शन
  const handleShareAppGeneral = async () => {
    try {
      const appLink = "https://play.google.com/store/apps/details?id=your.app.id"; // अपना वास्तविक ऐप लिंक डालें
      let message = `Hey! I'm using this awesome Railway Exam Prep app. You should check it out!\n\nDownload here: ${appLink}\n\n#RailwayExamPrep #StudyApp`;
      
      await Share.share({
        message: message,
        title: "Railway Exam Prep App", 
      });
    } catch (error) {
      Alert.alert("Error", "Could not share the app. Please try again.");
      console.error("Share app error:", error.message);
    }
  };

  // परफॉरमेंस शेयर करने के लिए फंक्शन
  const handleSharePerformance = async () => {
    try {
      const appLink = "https://play.google.com/store/apps/details?id=your.app.id"; 
      let shareTitle = "My Railway Exam Prep Performance! 🚂💨";
      
      let message = `🏆 My Railway Exam Prep Journey! 🏆\n\n`;
      if (userName) {
        message += `👤 Name: ${userName}\n`;
      }
      
      message += `\n✨ **Overall Stats** ✨\n`;
      message += `🚀 High Score: ${highScore || 'Not set yet'}\n`;
      
      if (lastScore) {
        message += `\n🔔 **Last Quiz Performance** 🔔\n`;
        message += `🎯 Score: ${lastScore}\n`;
        if(lastQuizAttempted) message += `❓ Total Questions: ${lastQuizAttempted}\n`
        if(lastQuizCorrect) message += `✅ Correct: ${lastQuizCorrect}\n`;
        if(lastQuizWrong) message += `❌ Wrong: ${lastQuizWrong}\n`;
        if(lastQuizSkipped) message += `⏭️ Skipped: ${lastQuizSkipped}\n`;
        if(lastQuizTime) message += `⏱️ Time Taken: ${lastQuizTime}\n`;
      } else {
        message += `🎯 Last Score: Not played yet\n`;
      }
      
      message += `\nThink you can do better? 😉`;
      message += `\nDownload the app: ${appLink}`;
      message += `\n\n#RailwayExamPrep #StudyChallenge #QuizStats #ExamReady`;

      await Share.share({
        message: message,
        title: shareTitle,
        url: appLink 
      });
    } catch (error) {
      Alert.alert("Error", "Could not share performance. Please try again.");
      console.error("Share performance error:", error.message);
    }
  };

  const menuItems = [
    { id: 'quiz', title: 'क्विज़ प्रैक्टिस', color: '#5E35B1', navigateTo: 'Quiz', icon: '🎯', description: 'समयबद्ध क्विज़ के साथ अपनी तैयारी का मूल्यांकन करें।' },
    { id: 'oneliner', title: 'वन-लाइनर रिविज़न', color: '#00897B', navigateTo: 'OneLiner', icon: '💡', description: 'महत्वपूर्ण तथ्यों और GK को तुरंत याद करें और दोहराएं।' },
    { id: 'bookmarks', title: `बुकमार्क्स (${bookmarkedCount})`, color: '#FF8F00', navigateTo: 'BookmarkedScreen', icon: '🔖', description: 'अपने सहेजे गए प्रश्नों और नोट्स तक पहुंचें।' },
    { id: 'shareApp', title: 'ऐप शेयर करें', color: '#D81B60', onPress: handleShareAppGeneral, icon: '📲', description: 'इस ऐप को दोस्तों के साथ साझा करें।' }, // ऐप शेयर का विकल्प वापस जोड़ा गया
  ];

  if (isLoading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#512DA8" />
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#1A0E60" />
      <ScrollView contentContainerStyle={styles.scrollViewContainer}>
        <View style={styles.headerContainer}>
          <View style={styles.headerTopSection}>
            <View style={styles.headerDecoration}></View>
            <View style={styles.headerDecoration2}></View>
            <View style={styles.headerContent}>
              <Text style={styles.headerAppTitle}>Railway Exam Prep</Text>
              <View style={styles.headerLine}></View>
              <Text style={styles.headerSubtitle}>Your Path to Success</Text>
            </View>
          </View>

          <View style={styles.headerUserSection}>
            <View style={styles.userSectionDecoration}></View>
            {userName && !isEditingName ? (
              <View style={styles.greetingContainer}>
                <Text style={styles.greetingText}>{timeDetails.greeting},</Text>
                <Text style={styles.userNameText}>{userName}!</Text>
                <TouchableOpacity onPress={handleChangeName} style={styles.changeNameButton}>
                  <Text style={styles.changeNameLink}>Change</Text>
                </TouchableOpacity>
              </View>
            ) : (
              !isEditingName && (
                <Text style={styles.motivationalQuote}>{timeDetails.quote}</Text>
              )
            )}
            {userName && !isEditingName && (
              <Text style={styles.motivationalQuote}>{timeDetails.quote}</Text>
            )}
          </View>
        </View>

        {isEditingName && (
          <View style={styles.nameInputSection}>
            <TextInput
              style={styles.textInput}
              placeholder={userName ? "Enter new name" : "Enter your name to personalize"}
              placeholderTextColor="#9E9E9E"
              value={nameInput}
              onChangeText={setNameInput}
              onSubmitEditing={saveName}
              autoFocus={true}
            />
            <TouchableOpacity
              style={styles.saveButtonSmall}
              onPress={saveName}
              activeOpacity={0.7}
            >
              <Text style={styles.saveButtonTextSmall}>Save</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.menuGrid}>
          {menuItems.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={[styles.card, { width: cardWidth }]}
              onPress={() => {
                if (item.navigateTo) {
                  navigation.navigate(item.navigateTo as keyof RootStackParamList);
                } else if (item.onPress) {
                  item.onPress();
                }
              }}
              activeOpacity={0.85}
            >
              <View style={[styles.cardBorderTop, { backgroundColor: item.color }]} />
              <View style={[styles.iconWrapper, { backgroundColor: item.color + '1A' }]}>
                <Text style={[styles.iconText, { color: item.color }]}>{item.icon}</Text>
              </View>
              <Text style={styles.cardTitle} numberOfLines={1} ellipsizeMode="tail">{item.title}</Text>
              <Text style={styles.cardDescription} numberOfLines={2} ellipsizeMode="tail">{item.description}</Text>
              <View style={styles.goArrowContainer}>
                 <Text style={[styles.goArrow, { color: item.color }]}>❯</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {(!isEditingName && (highScore || lastScore || lastQuizCorrect)) && (
          <View style={styles.performanceSection}>
            <Text style={styles.performanceTitle}>Your Performance</Text>
            
            {highScore && (
              <View style={styles.performanceStatRow}>
                <Text style={styles.performanceStatLabel}>🚀 High Score:</Text>
                <Text style={styles.performanceStatValue}>{highScore}</Text>
              </View>
            )}

            {lastScore && (
              <>
                <View style={styles.separatorLine} />
                <Text style={styles.subPerformanceTitle}>Last Quiz Details</Text>
                <View style={styles.performanceStatRow}>
                  <Text style={styles.performanceStatLabel}>🎯 Score:</Text>
                  <Text style={styles.performanceStatValue}>{lastScore}</Text>
                </View>
                {lastQuizAttempted && (
                  <View style={styles.performanceStatRow}>
                    <Text style={styles.performanceStatLabel}>❓ Questions:</Text>
                    <Text style={styles.performanceStatValue}>{lastQuizAttempted}</Text>
                  </View>
                )}
                {lastQuizCorrect && (
                  <View style={styles.performanceStatRow}>
                    <Text style={styles.performanceStatLabel}>✅ Correct:</Text>
                    <Text style={styles.performanceStatValue}>{lastQuizCorrect}</Text>
                  </View>
                )}
                {lastQuizWrong && (
                  <View style={styles.performanceStatRow}>
                    <Text style={styles.performanceStatLabel}>❌ Wrong:</Text>
                    <Text style={styles.performanceStatValue}>{lastQuizWrong}</Text>
                  </View>
                )}
                {lastQuizSkipped && (
                  <View style={styles.performanceStatRow}>
                    <Text style={styles.performanceStatLabel}>⏭️ Skipped:</Text>
                    <Text style={styles.performanceStatValue}>{lastQuizSkipped}</Text>
                  </View>
                )}
                {lastQuizTime && (
                  <View style={styles.performanceStatRow}>
                    <Text style={styles.performanceStatLabel}>⏱️ Time:</Text>
                    <Text style={styles.performanceStatValue}>{lastQuizTime}</Text>
                  </View>
                )}
              </>
            )}
            
            {(highScore || lastScore) && 
              <TouchableOpacity style={styles.sharePerformanceButton} onPress={handleSharePerformance}>
                <Text style={styles.sharePerformanceButtonText}>Share Performance 📤</Text>
              </TouchableOpacity>
            }
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F5F5F7',
  },
  scrollViewContainer: {
    flexGrow: 1,
    paddingBottom: 25,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F5F7',
  },
  loadingText: {
    marginTop: 15,
    fontSize: 18,
    color: '#512DA8',
    fontWeight: '500',
  },
  headerContainer: {
    position: 'relative',
    marginBottom: 20,
  },
  headerTopSection: { 
    backgroundColor: '#311B92',
    paddingTop: StatusBar.currentHeight ? StatusBar.currentHeight + 25 : 55,
    paddingBottom: 30,
    elevation: 12, 
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    position: 'relative',
    overflow: 'hidden',
  },
  headerDecoration: {
    position: 'absolute',
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: 'rgba(123, 97, 255, 0.3)',
    top: -50,
    right: -50,
    transform: [{rotate: '45deg'}]
  },
  headerDecoration2: {
    position: 'absolute',
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(123, 97, 255, 0.2)',
    bottom: 20,
    left: -30,
    transform: [{rotate: '-30deg'}]
  },
  headerContent: {
    alignItems: 'center',
    paddingHorizontal: 25,
  },
  headerAppTitle: {
    fontSize: 30, 
    fontWeight: 'bold',
    color: '#FFFFFF',
    letterSpacing: 1,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#B39DDB',
    marginTop: 5,
    letterSpacing: 0.8,
  },
  headerLine: {
    width: 60,
    height: 3,
    backgroundColor: '#7C4DFF',
    marginVertical: 10,
    borderRadius: 2,
  },
  headerUserSection: { 
    backgroundColor: '#512DA8',
    paddingVertical: 25,
    paddingHorizontal: 25,
    alignItems: 'center',
    borderBottomLeftRadius: 35,
    borderBottomRightRadius: 35,
    marginTop: 0, 
    paddingTop: 25, 
    marginBottom: 5, 
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    position: 'relative',
    overflow: 'hidden',
  },
  userSectionDecoration: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 6,
    backgroundColor: '#7C4DFF',
  },
  greetingContainer: {
    alignItems: 'center',
    marginBottom: 12, 
  },
  greetingText: {
    fontSize: 20,
    color: '#D1C4E9',
    textAlign: 'center',
    fontWeight: '500',
  },
  userNameText: {
    fontSize: 32, 
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
    marginTop: 6,
    marginBottom: 10,
    textShadowColor: 'rgba(0, 0, 0, 0.25)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 4,
    letterSpacing: 0.5,
  },
  changeNameButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    paddingVertical: 5,
    paddingHorizontal: 12,
    borderRadius: 15,
  },
  changeNameLink: {
    fontSize: 14,
    color: '#B39DDB',
    fontWeight: '600',
  },
  motivationalQuote: {
    fontSize: 16,
    fontStyle: 'italic',
    color: '#EDE7F6',
    textAlign: 'center',
    paddingHorizontal: 15,
    lineHeight: 22,
  },
  nameInputSection: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: cardMargin,
    backgroundColor: '#FFFFFF',
    marginHorizontal: cardMargin,
    borderRadius: 16,
    elevation: 6,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    marginBottom: 25, 
    marginTop: 15, 
    paddingVertical: 8,
  },
  textInput: {
    flex: 1,
    paddingHorizontal: 18,
    paddingVertical: 14,
    fontSize: 16,
    color: '#212121',
    marginRight: 12,
    fontWeight: '500',
  },
  saveButtonSmall: {
    backgroundColor: '#673AB7',
    paddingVertical: 14,
    paddingHorizontal: 22,
    borderRadius: 12,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
  saveButtonTextSmall: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  menuGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: cardMargin - (cardMargin / numColumns / 2),
    marginTop: 15, 
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    paddingTop: cardPadding + 8,
    paddingBottom: cardPadding + 5,
    paddingHorizontal: cardPadding + 2,
    marginBottom: cardMargin + 8,
    elevation: 8,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    alignItems: 'center',
    overflow: 'hidden',
    position: 'relative',
  },
  cardBorderTop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 7,
  },
  iconWrapper: {
    width: 75,
    height: 75,
    borderRadius: 38,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 18,
    marginTop: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  iconText: {
    fontSize: 34,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#212121',
    marginBottom: 10,
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  cardDescription: {
    fontSize: 13,
    color: '#616161',
    lineHeight: 20,
    textAlign: 'center',
    minHeight: 40,
    marginBottom: 15,
  },
  goArrowContainer: {
    padding: 5,
  },
  goArrow: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  performanceSection: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: cardMargin,
    marginTop: 25,
    marginBottom: 15,
    borderRadius: 18,
    padding: 20,
    elevation: 6,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
  },
  performanceTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#512DA8',
    marginBottom: 15,
    textAlign: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    paddingBottom: 10,
  },
  subPerformanceTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#673AB7',
    marginTop: 15,
    marginBottom: 10,
  },
  performanceStatRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  performanceStatLabel: {
    fontSize: 15,
    color: '#424242',
    fontWeight: '500',
  },
  performanceStatValue: {
    fontSize: 15,
    color: '#212121',
    fontWeight: '600',
  },
  separatorLine: {
    height: 1,
    backgroundColor: '#EEEEEE',
    marginVertical: 12,
  },
  sharePerformanceButton: {
    backgroundColor: '#D81B60', 
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 20,
    elevation: 3,
  },
  sharePerformanceButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default HomeScreen;
