// src/screens/HomeScreen.tsx
import React, { useState, useEffect, useCallback } from 'react'; // useCallback इम्पोर्ट करें
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
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native'; // useFocusEffect इम्पोर्ट करें

const USER_NAME_KEY = '@UserNameKey';
const USER_HIGH_SCORE_KEY = '@UserHighScoreKey';
const USER_LAST_SCORE_KEY = '@UserLastScoreKey';
const BOOKMARKED_QUESTIONS_KEY = '@BookmarkedQuestionsKey';

const HomeScreen = ({ navigation }) => {
  const [userName, setUserName] = useState<string | null>(null);
  const [nameInput, setNameInput] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true); // प्रारंभिक लोडिंग के लिए true रखें
  const [isEditingName, setIsEditingName] = useState<boolean>(false);

  const [highScore, setHighScore] = useState<string | null>(null);
  const [lastScore, setLastScore] = useState<string | null>(null);
  const [bookmarkedCount, setBookmarkedCount] = useState<number>(0);

  // डेटा लोड करने का फंक्शन
  const loadUserData = useCallback(async () => {
    // setIsLoading(true); // हर बार फोकस पर लोडिंग दिखाने से UI थोड़ा जंपी लग सकता है, चाहें तो रखें
    try {
      const storedName = await AsyncStorage.getItem(USER_NAME_KEY);
      const storedHighScore = await AsyncStorage.getItem(USER_HIGH_SCORE_KEY);
      const storedLastScore = await AsyncStorage.getItem(USER_LAST_SCORE_KEY);
      const storedBookmarks = await AsyncStorage.getItem(BOOKMARKED_QUESTIONS_KEY);

      setUserName(storedName);
      setHighScore(storedHighScore);
      setLastScore(storedLastScore);

      if (storedBookmarks) {
        const bookmarksArray = JSON.parse(storedBookmarks);
        setBookmarkedCount(bookmarksArray.length);
      } else {
        setBookmarkedCount(0);
      }

      // यदि नाम नहीं है और पहले से एडिटिंग मोड में नहीं हैं, तो एडिटिंग मोड शुरू करें
      // यह सुनिश्चित करें कि यह लॉजिक केवल प्रारंभिक लोड पर या विशिष्ट शर्तों के तहत ही चले
      if (storedName === null && !isEditingName && !userName) { // userName की भी जांच करें ताकि बार-बार न खुले
        setIsEditingName(true);
      }
    } catch (e) {
      console.error("Failed to load user data.", e);
      setUserName(null);
      setHighScore(null);
      setLastScore(null);
      setBookmarkedCount(0);
      if (!isEditingName && !userName) { // userName की भी जांच करें
         setIsEditingName(true);
      }
    } finally {
      setIsLoading(false); // लोडिंग समाप्त
    }
  }, [isEditingName, userName]); // isEditingName और userName को निर्भरता में जोड़ा

  // जब भी स्क्रीन फोकस में आए, डेटा लोड करें
  useFocusEffect(
    useCallback(() => {
      setIsLoading(true); // फोकस पर लोडिंग दिखाना शुरू करें
      loadUserData();
      return () => {
        // चाहें तो यहाँ क्लीनअप कर सकते हैं, यदि आवश्यक हो
        // setIsLoading(false); // यह आवश्यक नहीं क्योंकि loadUserData इसे हैंडल करेगा
      };
    }, [loadUserData]) // loadUserData को निर्भरता में जोड़ा
  );


  // प्रारंभिक माउंट पर isEditingName को सेट करने के लिए (केवल एक बार)
  useEffect(() => {
    const checkInitialName = async () => {
        const storedName = await AsyncStorage.getItem(USER_NAME_KEY);
        if (storedName === null) {
            setIsEditingName(true);
        }
        setIsLoading(false); // प्रारंभिक लोडिंग यहाँ समाप्त करें
    };
    checkInitialName();
  }, []);


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

  const handleShareApp = async () => {
    try {
      const appLink = "https://play.google.com/store/apps/details?id=your.app.id"; // अपनी ऐप का लिंक डालें
      let message = `Check out Railway Exam Prep app!`;
      if (userName) {
        message += `\nMy name is ${userName}.`;
      }
      if (highScore) {
        message += `\nMy High Score: ${highScore}`;
      }
      if (lastScore) {
        message += `\nMy Last Score: ${lastScore}`;
      }
      message += `\nGet it here: ${appLink}`;

      await Share.share({
        message: message,
        title: 'Railway Exam Prep App',
      });
    } catch (error) {
      Alert.alert("Error", "Could not share the app.");
      console.error("Share error:", error.message);
    }
  };

  const menuItems = [
    { id: 'quiz', title: 'Quiz Practice', color: '#3498db', navigateTo: 'Quiz', icon: '🎯', description: 'Evaluate your preparation with timed quizzes.' },
    { id: 'oneliner', title: 'One-Liner Revision', color: '#2ecc71', navigateTo: 'OneLiner', icon: '💡', description: 'Quickly recall and revise important facts and GK.' },
    { id: 'bookmarks', title: `Bookmarked (${bookmarkedCount})`, color: '#f39c12', navigateTo: 'BookmarkedScreen', icon: '🔖', description: 'Access your saved questions and notes.' },
    { id: 'share', title: 'Share App', color: '#9b59b6', onPress: handleShareApp, icon: '📤', description: 'Share this app with your friends.' },
  ];

  if (isLoading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2c3e50" />
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#2c3e50" />
      <ScrollView contentContainerStyle={styles.scrollViewContainer}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Railway Exam Prep</Text>
          {userName && !isEditingName ? (
            <View style={styles.welcomeContainer}>
              <Text style={styles.headerSubtitle}>Welcome, {userName}!</Text>
              <TouchableOpacity onPress={handleChangeName}>
                <Text style={styles.changeNameLink}> (Change)</Text>
              </TouchableOpacity>
            </View>
          ) : (
             !isEditingName && <Text style={styles.headerSubtitle}>Your guide towards success</Text>
          )}
        </View>

        {isEditingName && (
          <View style={styles.nameInputSection}>
            <TextInput
              style={styles.textInput}
              placeholder={userName ? "Enter new name" : "Enter your name to personalize"}
              placeholderTextColor="#aaa"
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

        {(highScore || lastScore) && !isEditingName && (
          <View style={styles.statsSection}>
            {highScore && <Text style={styles.statText}>High Score: {highScore}</Text>}
            {lastScore && <Text style={styles.statText}>Last Score: {lastScore}</Text>}
          </View>
        )}

        <View style={styles.menuGrid}>
          {menuItems.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={[styles.card, { borderTopColor: item.color }]}
              onPress={() => {
                if (item.navigateTo) {
                  navigation.navigate(item.navigateTo as keyof RootStackParamList); // टाइप सुरक्षा के लिए
                } else if (item.onPress) {
                  item.onPress();
                }
              }}
              activeOpacity={0.8}
            >
              <View style={[styles.iconWrapper, { backgroundColor: item.color }]}>
                <Text style={styles.iconText}>{item.icon}</Text>
              </View>
              <Text style={styles.cardTitle}>{item.title}</Text>
              <Text style={styles.cardDescription}>{item.description}</Text>
              <View style={[styles.goArrowContainer, {backgroundColor: item.color}]}>
                <Text style={styles.goArrow}>➔</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

// --- स्टाइल्स ---
// (आपके मौजूदा स्टाइल्स यहाँ अपरिवर्तित रहेंगे)
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f4f6f8',
  },
  scrollViewContainer: {
    flexGrow: 1,
    paddingBottom: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f4f6f8',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#2c3e50',
  },
  header: {
    backgroundColor: '#2c3e50',
    paddingVertical: 25,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#bdc3c7',
    textAlign: 'center',
  },
  welcomeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  changeNameLink: {
    fontSize: 14,
    color: '#3498db',
    marginLeft: 5,
  },
  nameInputSection: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 10,
    backgroundColor: '#ffffff',
    marginHorizontal: 15,
    marginTop: -15, // हेडर पर थोड़ा ओवरलैप
    borderRadius: 8,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    marginBottom: 15, // मार्जिन थोड़ा बढ़ाया
  },
  textInput: {
    flex: 1,
    borderBottomWidth: 1,
    borderColor: '#dfe9f5',
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 15,
    color: '#333',
    marginRight: 10,
  },
  saveButtonSmall: {
    backgroundColor: '#16a085', // बदला हुआ रंग
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 6,
  },
  saveButtonTextSmall: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  statsSection: {
    backgroundColor: '#ffffff',
    paddingVertical: 12,
    paddingHorizontal: 20,
    marginHorizontal: 15,
    borderRadius: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    marginBottom: 15, // मेनू ग्रिड से पहले मार्जिन
    alignItems: 'center', // आइटम्स को सेंटर करें
  },
  statText: {
    fontSize: 15,
    color: '#34495e',
    fontWeight: '500',
    marginVertical: 3, // स्कोर के बीच थोड़ी जगह
  },
  menuGrid: {
    paddingHorizontal: 15,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 18, 
    elevation: 3, 
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08, 
    shadowRadius: 3,
    borderTopWidth: 5, 
    position: 'relative',
  },
  iconWrapper: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'flex-start',
    marginBottom: 15,
  },
  iconText: {
    fontSize: 24,
    color: '#fff',
  },
  cardTitle: {
    fontSize: 19,
    fontWeight: 'bold',
    color: '#34495e',
    marginBottom: 8,
    alignSelf: 'flex-start',
  },
  cardDescription: {
    fontSize: 14,
    color: '#7f8c8d',
    lineHeight: 20,
    alignSelf: 'flex-start',
    paddingRight: 30, 
  },
  goArrowContainer: {
    position: 'absolute',
    right: 15,
    top: '50%',
    transform: [{translateY: -15}],
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
  },
  goArrow: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  }
});

// RootStackParamList को AppNavigator से इम्पोर्ट करने की आवश्यकता हो सकती है यदि यह अलग फ़ाइल में है
// या इसे HomeScreen में ही परिभाषित करें यदि केवल यहीं उपयोग हो रहा है
type RootStackParamList = {
  Home: undefined;
  Quiz: undefined;
  OneLiner: undefined;
  BookmarkedScreen: undefined;
};


export default HomeScreen;
