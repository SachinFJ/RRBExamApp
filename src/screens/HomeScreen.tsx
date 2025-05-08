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

const HomeScreen = ({ navigation }) => {
  const [userName, setUserName] = useState<string | null>(null);
  const [nameInput, setNameInput] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isEditingName, setIsEditingName] = useState<boolean>(false);

  const [highScore, setHighScore] = useState<string | null>(null);
  const [lastScore, setLastScore] = useState<string | null>(null);
  const [bookmarkedCount, setBookmarkedCount] = useState<number>(0);

  const loadUserData = useCallback(async () => {
    setIsLoading(true);
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

      if (storedName === null && !isEditingName && !userName) {
        setIsEditingName(true);
      }
    } catch (e) {
      console.error("Failed to load user data.", e);
      setUserName(null);
      setHighScore(null);
      setLastScore(null);
      setBookmarkedCount(0);
      if (!isEditingName && !userName) {
         setIsEditingName(true);
      }
    } finally {
      setIsLoading(false);
    }
  }, [isEditingName, userName]);

  useFocusEffect(loadUserData);

  useEffect(() => {
    // यह useEffect सुनिश्चित करता है कि यदि loadUserData के बाद भी userName null है
    // और isEditingName false है, तो नाम इनपुट दिखाया जाए।
    // यह मुख्य रूप से प्रारंभिक ऐप लोड के लिए है।
    const checkAndSetInitialEditingName = async () => {
      if (!isLoading && userName === null && !isEditingName) {
          setIsEditingName(true);
      }
    };
    checkAndSetInitialEditingName();
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

  const handleShareApp = async () => {
    try {
      const appLink = "https://play.google.com/store/apps/details?id=your.app.id"; // अपनी ऐप का लिंक डालें
      let message = `Check out this Railway Exam Prep app!`; // अंग्रेजी में संदेश
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
        title: 'Railway Exam Prep App', // Android के लिए वैकल्पिक
      });
    } catch (error) {
      Alert.alert("Error", "Could not share the app.");
      console.error("Share error:", error.message);
    }
  };

  // मेनू आइटम्स (शीर्षक और विवरण हिंदी में, जैसा पहले था)
  const menuItems = [
    { id: 'quiz', title: 'क्विज़ प्रैक्टिस', color: '#3498db', navigateTo: 'Quiz', icon: '🎯', description: 'समयबद्ध क्विज़ के साथ अपनी तैयारी का मूल्यांकन करें।' },
    { id: 'oneliner', title: 'वन-लाइनर रिविज़न', color: '#2ecc71', navigateTo: 'OneLiner', icon: '💡', description: 'महत्वपूर्ण तथ्यों और GK को तुरंत याद करें और दोहराएं।' },
    { id: 'bookmarks', title: `बुकमार्क्स (${bookmarkedCount})`, color: '#f39c12', navigateTo: 'BookmarkedScreen', icon: '🔖', description: 'अपने सहेजे गए प्रश्नों और नोट्स तक पहुंचें।' },
    { id: 'share', title: 'ऐप शेयर करें', color: '#9b59b6', onPress: handleShareApp, icon: '📤', description: 'इस ऐप को अपने दोस्तों के साथ साझा करें।' },
  ];

  if (isLoading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007bff" />
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#0056b3" /> {/* नया हेडर रंग */}
      <ScrollView contentContainerStyle={styles.scrollViewContainer}>
        <View style={styles.header}>
          <Text style={styles.headerAppTitle}>Railway Exam Prep</Text> {/* ऐप का टाइटल */}
          {userName && !isEditingName ? (
            <View style={styles.welcomeContainer}>
              <Text style={styles.welcomeText}>Welcome,</Text>
              <Text style={styles.userNameText}>{userName}!</Text>
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
              placeholderTextColor="#a0a0a0"
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
          <View style={styles.statsOuterContainer}>
            <View style={styles.statsSection}>
              {highScore && <Text style={styles.statText}><Text style={styles.statLabel}>High Score:</Text> {highScore}</Text>}
              {lastScore && <Text style={styles.statText}><Text style={styles.statLabel}>Last Score:</Text> {lastScore}</Text>}
            </View>
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
              activeOpacity={0.8}
            >
              <View style={[styles.iconWrapper, { backgroundColor: item.color + '2A' }]}>
                <Text style={[styles.iconText, { color: item.color }]}>{item.icon}</Text>
              </View>
              <Text style={styles.cardTitle} numberOfLines={1} ellipsizeMode="tail">{item.title}</Text>
              <Text style={styles.cardDescription} numberOfLines={2} ellipsizeMode="tail">{item.description}</Text>
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

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f4f7f9', // थोड़ा और साफ बैकग्राउंड
  },
  scrollViewContainer: {
    flexGrow: 1,
    paddingBottom: 30, // नीचे और पैडिंग
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f4f7f9',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 17,
    color: '#007bff', // लोडिंग टेक्स्ट का रंग बदला
  },
  header: {
    backgroundColor: '#007bff', // नया आकर्षक नीला रंग
    paddingTop: StatusBar.currentHeight ? StatusBar.currentHeight + 15 : 45, // स्टेटस बार के लिए सुरक्षित क्षेत्र
    paddingBottom: 25,
    paddingHorizontal: 20,
    alignItems: 'center',
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    marginBottom: 15,
    elevation: 8, // थोड़ा और गहरा शैडो
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
  },
  headerAppTitle: { // ऐप के टाइटल के लिए नया स्टाइल
    fontSize: 26,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 15, // वेलकम टेक्स्ट से थोड़ी दूरी
  },
  welcomeContainer: {
    alignItems: 'center', // कंटेंट को सेंटर करें
  },
  welcomeText: { // "Welcome," के लिए स्टाइल
    fontSize: 18,
    color: '#e0e0e0', // थोड़ा हल्का रंग
    textAlign: 'center',
  },
  userNameText: { // उपयोगकर्ता के नाम के लिए स्टाइल
    fontSize: 28, // बड़ा फ़ॉन्ट साइज़
    fontWeight: 'bold',
    color: '#ffffff', // सफेद रंग ताकि nổi bật हो
    textAlign: 'center',
    marginTop: 4, // "Welcome," से थोड़ी दूरी
    marginBottom: 8, // "Change" लिंक से थोड़ी दूरी
  },
  headerSubtitle: { // जब नाम न हो
    fontSize: 17,
    color: '#bdc3c7',
    textAlign: 'center',
    marginTop: 10,
  },
  changeNameLink: {
    fontSize: 15,
    color: '#cce5ff', // हेडर के रंग से मिलता-जुलता हल्का नीला
    fontWeight: '500',
    textDecorationLine: 'underline', // अंडरलाइन ताकि क्लिकेबल लगे
  },
  nameInputSection: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: cardMargin,
    backgroundColor: '#ffffff',
    marginHorizontal: cardMargin,
    borderRadius: 12,
    elevation: 4,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    marginBottom: 25, // अगले सेक्शन से थोड़ी अधिक दूरी
    marginTop: -30, // हेडर पर थोड़ा और ओवरलैप
    paddingVertical: 6, // थोड़ी कम वर्टिकल पैडिंग
  },
  textInput: {
    flex: 1,
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 16,
    color: '#333333',
    marginRight: 10,
  },
  saveButtonSmall: {
    backgroundColor: '#28a745', // थोड़ा और वाइब्रेंट हरा
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
  },
  saveButtonTextSmall: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: 'bold',
  },
  statsOuterContainer: {
    marginHorizontal: cardMargin,
    marginBottom: 25,
  },
  statsSection: {
    backgroundColor: '#ffffff',
    paddingVertical: 20,
    paddingHorizontal: 20,
    borderRadius: 12,
    elevation: 4,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  statText: {
    fontSize: 17, // थोड़ा बड़ा
    color: '#34495e',
    fontWeight: '500',
    marginVertical: 6,
  },
  statLabel: {
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  menuGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: cardMargin / 2,
    // marginTop: 0, // यदि आँकड़े नहीं हैं तो भी ठीक लगेगा
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 18, // और गोल
    padding: cardPadding,
    marginBottom: cardMargin,
    elevation: 6, // थोड़ा और शैडो
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1, // थोड़ी कम ओपेसिटी
    shadowRadius: 7,
    alignItems: 'center',
  },
  iconWrapper: {
    width: 64, // थोड़ा बड़ा
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
  },
  iconText: {
    fontSize: 30, // थोड़ा बड़ा
  },
  cardTitle: {
    fontSize: 16, // थोड़ा बढ़ाया
    fontWeight: 'bold', // वापस बोल्ड किया
    color: '#34495e',
    marginBottom: 7,
    textAlign: 'center',
  },
  cardDescription: {
    fontSize: 13, // थोड़ा बढ़ाया
    color: '#6c757d', // थोड़ा डार्क ग्रे
    lineHeight: 19,
    textAlign: 'center',
    minHeight: 38,
    marginBottom: 12,
  },
  goArrowContainer: {
    position: 'absolute',
    right: 12,
    bottom: 12,
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  goArrow: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  }
});

export default HomeScreen;
