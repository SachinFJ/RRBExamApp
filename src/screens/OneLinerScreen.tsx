// src/screens/OneLinerScreen.tsx
import React, { useState, useEffect, useCallback } from 'react'; // useCallback जोड़ा गया
import { View, Text, TouchableOpacity, StyleSheet, Alert, ScrollView } from 'react-native'; // ScrollView जोड़ा गया
import AsyncStorage from '@react-native-async-storage/async-storage';
import { oneLinerQuestions, OneLinerQuestion } from '../data/oneLinerData'; // पाथ सुनिश्चित करें
import { useFocusEffect, useNavigation } from '@react-navigation/native'; // useFocusEffect और useNavigation जोड़ा गया

const BOOKMARKED_QUESTIONS_KEY = '@BookmarkedQuestionsKey';

// OneLinerQuestion इंटरफ़ेस में id और itemType (वैकल्पिक) होना चाहिए
interface OneLinerQuestionWithMeta extends OneLinerQuestion {
  itemType?: 'oneliner'; // बुकमार्क के लिए
}

const OneLinerScreen = () => {
  const navigation = useNavigation(); // नेविगेशन हुक
  const [questions, setQuestions] = useState<OneLinerQuestionWithMeta[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [isAnswerRevealed, setIsAnswerRevealed] = useState(false);
  const [hasSelfAssessedThisQuestion, setHasSelfAssessedThisQuestion] = useState(false);

  const [revealedCount, setRevealedCount] = useState(0);
  const [userMarkedCorrect, setUserMarkedCorrect] = useState(0);
  const [userMarkedIncorrect, setUserMarkedIncorrect] = useState(0);

  // बुकमार्क के लिए स्टेट (अब OneLinerQuestionWithMeta टाइप का होगा)
  const [bookmarkedItems, setBookmarkedItems] = useState<OneLinerQuestionWithMeta[]>([]);

  // मौजूदा बुकमार्क लोड करें (केवल वन-लाइनर के लिए)
  const loadBookmarks = useCallback(async () => {
    try {
      const storedBookmarks = await AsyncStorage.getItem(BOOKMARKED_QUESTIONS_KEY);
      if (storedBookmarks) {
        const allBookmarks = JSON.parse(storedBookmarks);
        // केवल वन-लाइनर बुकमार्क फ़िल्टर करें या वे जिनमें itemType नहीं है (पुराने डेटा के लिए)
        const oneLinerBookmarks = allBookmarks.filter(
          (item: any) => item.itemType === 'oneliner' || (!item.itemType && item.answer)
        );
        setBookmarkedItems(oneLinerBookmarks);
      } else {
        setBookmarkedItems([]);
      }
    } catch (e) {
      console.error("Failed to load bookmarks for one-liners.", e);
    }
  }, []);

  useFocusEffect(loadBookmarks); // स्क्रीन फोकस होने पर बुकमार्क लोड करें

  useEffect(() => {
    const shuffledQuestions = [...oneLinerQuestions].sort(() => Math.random() - 0.5);
    // सुनिश्चित करें कि प्रश्न OneLinerQuestionWithMeta के अनुरूप हों
    setQuestions(shuffledQuestions.map(q => ({...q})));
    setCurrentQuestionIndex(0);
    setIsAnswerRevealed(false);
    setHasSelfAssessedThisQuestion(false);
    setRevealedCount(0);
    setUserMarkedCorrect(0);
    setUserMarkedIncorrect(0);
  }, []);

  const handleRevealAnswer = () => {
    if (!isAnswerRevealed) {
      setRevealedCount(prevCount => prevCount + 1);
    }
    setIsAnswerRevealed(true);
    setHasSelfAssessedThisQuestion(false); // उत्तर दिखाने पर स्व-मूल्यांकन रीसेट करें
  };

  const handleSelfAssessment = (thoughtCorrectly: boolean) => {
    if (thoughtCorrectly) {
      setUserMarkedCorrect(prevCount => prevCount + 1);
    } else {
      setUserMarkedIncorrect(prevCount => prevCount + 1);
    }
    setHasSelfAssessedThisQuestion(true);
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prevIndex => prevIndex + 1);
      setIsAnswerRevealed(false);
      setHasSelfAssessedThisQuestion(false);
    } else {
      Alert.alert(
        "One-Liners Finished", // अंग्रेजी में
        `You revealed ${revealedCount} answers.\nCorrectly Guessed: ${userMarkedCorrect}\nIncorrectly Guessed: ${userMarkedIncorrect}`, // अंग्रेजी में
        [{ text: "OK", onPress: () => navigation.goBack() }] // अंग्रेजी में
      );
    }
  };

  const toggleBookmark = async () => {
    if (!questions[currentQuestionIndex]) return;

    const currentQ = questions[currentQuestionIndex];
    if (!currentQ.id) {
      console.warn("One-liner is missing an ID. Cannot bookmark.");
      Alert.alert("Error", "This one-liner cannot be bookmarked (ID missing)."); // अंग्रेजी में
      return;
    }

    // AsyncStorage से सभी बुकमार्क लोड करें ताकि अन्य प्रकार के बुकमार्क सुरक्षित रहें
    let allStoredBookmarksRaw = await AsyncStorage.getItem(BOOKMARKED_QUESTIONS_KEY);
    let allStoredBookmarks: any[] = allStoredBookmarksRaw ? JSON.parse(allStoredBookmarksRaw) : [];

    // वर्तमान वन-लाइनर के लिए बुकमार्क आइटम बनाएं
    const bookmarkOneLinerItem: OneLinerQuestionWithMeta = { ...currentQ, itemType: 'oneliner' };

    const existingBookmarkIndex = allStoredBookmarks.findIndex(
      (bq) => bq.id === bookmarkOneLinerItem.id && bq.itemType === 'oneliner'
    );

    if (existingBookmarkIndex > -1) {
      allStoredBookmarks.splice(existingBookmarkIndex, 1); // हटाएं
    } else {
      allStoredBookmarks.push(bookmarkOneLinerItem); // जोड़ें
    }

    try {
      await AsyncStorage.setItem(BOOKMARKED_QUESTIONS_KEY, JSON.stringify(allStoredBookmarks));
      // लोकल स्टेट (bookmarkedItems) को भी अपडेट करें ताकि UI तुरंत रिफ्लेक्ट हो
      // यह केवल वन-लाइनर बुकमार्क दिखाएगा जो इस स्क्रीन के लिए प्रासंगिक हैं
      const currentOneLinerBookmarks = allStoredBookmarks.filter(item => item.itemType === 'oneliner');
      setBookmarkedItems(currentOneLinerBookmarks);
    } catch (e) {
      console.error("Failed to update bookmarks for one-liner.", e);
      Alert.alert("Error", "Failed to update bookmarks."); // अंग्रेजी में
    }
  };


  if (questions.length === 0) {
    return <View style={styles.container}><Text style={styles.loadingText}>Loading one-liners...</Text></View>; // अंग्रेजी में
  }

  if (currentQuestionIndex >= questions.length && questions.length > 0) {
    return <View style={styles.container}><Text style={styles.loadingText}>All one-liners finished.</Text></View>; // अंग्रेजी में
  }

  const currentQuestion = questions[currentQuestionIndex];
  // वर्तमान प्रश्न बुकमार्क है या नहीं (केवल वन-लाइनर बुकमार्क में से जांचें)
  const isCurrentBookmarked = currentQuestion && currentQuestion.id ? 
    bookmarkedItems.some(bq => bq.id === currentQuestion.id) : false;

  return (
    <ScrollView style={styles.scrollView} contentContainerStyle={styles.container}>
      <View style={styles.statsContainer}>
        <Text style={styles.statsText}>Question: {currentQuestionIndex + 1}/{questions.length}</Text>
        <Text style={styles.statsText}>Revealed: {revealedCount}</Text>
        <Text style={styles.statsText}>Guessed Correct: {userMarkedCorrect}</Text>
        <Text style={styles.statsText}>Guessed Incorrect: {userMarkedIncorrect}</Text>
      </View>

      <View style={styles.questionCard}>
        <View style={styles.questionHeader}>
            <Text style={styles.questionLabel}>Question:</Text>
            {currentQuestion && currentQuestion.id && (
                <TouchableOpacity onPress={toggleBookmark} style={styles.bookmarkButton}>
                    <Text style={[
                        styles.bookmarkIcon, 
                        isCurrentBookmarked ? styles.bookmarkedActiveIcon : styles.bookmarkedInactiveIcon
                    ]}>
                        {isCurrentBookmarked ? '🔖' : '☆'}
                    </Text>
                </TouchableOpacity>
            )}
        </View>
        <Text style={styles.questionText}>{currentQuestion.question}</Text>
      </View>

      {!isAnswerRevealed ? (
        <TouchableOpacity
          style={[styles.actionButton, styles.revealButton]}
          onPress={handleRevealAnswer}
        >
          <Text style={styles.actionButtonText}>Reveal Answer</Text>
        </TouchableOpacity>
      ) : (
        <>
          <View style={styles.answerCard}>
            <Text style={styles.answerLabel}>Answer:</Text>
            <Text style={styles.answerText}>{currentQuestion.answer}</Text>
          </View>

          {!hasSelfAssessedThisQuestion && (
            <View style={styles.selfAssessmentContainer}>
              <Text style={styles.selfAssessmentPrompt}>Did you guess the answer correctly?</Text>
              <View style={styles.assessmentButtonsRow}>
                <TouchableOpacity
                  style={[styles.assessmentButton, styles.assessmentButtonYes]}
                  onPress={() => handleSelfAssessment(true)}
                >
                  <Text style={styles.assessmentButtonText}>Yes, I did! 👍</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.assessmentButton, styles.assessmentButtonNo]}
                  onPress={() => handleSelfAssessment(false)}
                >
                  <Text style={styles.assessmentButtonText}>No, I didn't 👎</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </>
      )}

      <TouchableOpacity
        style={[styles.actionButton, styles.nextButton]}
        onPress={handleNextQuestion}
      >
        <Text style={styles.actionButtonText}>Next One-Liner</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scrollView: { // ScrollView के लिए स्टाइल
    flex: 1,
    backgroundColor: '#f4f8fb', // थोड़ा अलग बैकग्राउंड
  },
  container: {
    flexGrow: 1,
    padding: 20,
  },
  loadingText: {
    fontSize: 18,
    color: '#4a5568', // थोड़ा गहरा ग्रे
    textAlign: 'center',
    marginTop: 50,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    marginBottom: 18, // थोड़ा अधिक मार्जिन
    paddingVertical: 12, // थोड़ी अधिक पैडिंग
    paddingHorizontal:15,
    backgroundColor: '#e2e8f0', // हल्का ग्रे
    borderRadius: 10, // गोल कोने
    elevation: 1,
  },
  statsText: {
    fontSize: 13,
    color: '#2d3748', // गहरा ग्रे-नीला
    fontWeight: '500',
    marginRight: 8, // थोड़ा कम मार्जिन
    marginBottom: 5,
  },
  questionCard: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 20,
    paddingVertical: 18, // थोड़ी अधिक पैडिंग
    borderRadius: 12,
    marginBottom: 18,
    elevation: 3, // थोड़ा और शैडो
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  questionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10, // थोड़ा अधिक मार्जिन
  },
  questionLabel: {
    fontSize: 14,
    color: '#718096', // मध्यम ग्रे
    fontWeight: '500',
  },
  bookmarkButton: {
    padding: 8, // क्लिक करने योग्य क्षेत्र बढ़ाएं
    borderRadius: 20, // गोल बटन जैसा फील
    // backgroundColor: '#f0f0f0', // हल्का बैकग्राउंड यदि आवश्यक हो
  },
  bookmarkIcon: {
    fontSize: 28, // आइकन का आकार बढ़ाया
  },
  bookmarkedActiveIcon: {
    color: '#FFC107', // बुकमार्क होने पर पीला (या आपकी थीम का रंग)
  },
  bookmarkedInactiveIcon: {
    color: '#A0AEC0', // बुकमार्क न होने पर हल्का ग्रे
  },
  questionText: {
    fontSize: 19, // थोड़ा बड़ा टेक्स्ट
    color: '#1a202c', // बहुत गहरा ग्रे (लगभग काला)
    lineHeight: 28, // बेहतर पठनीयता
    fontWeight: '500',
  },
  answerCard: {
    backgroundColor: '#E6FFFA', // हल्का टील/सियान बैकग्राउंड
    padding: 18, // अधिक पैडिंग
    borderRadius: 12,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: '#B2F5EA', // हल्का बॉर्डर
    elevation: 2,
  },
  answerLabel: {
    fontSize: 14,
    color: '#2C5282', // गहरा नीला
    marginBottom: 6, // अधिक मार्जिन
    fontWeight: '500',
  },
  answerText: {
    fontSize: 18, // थोड़ा बड़ा उत्तर
    color: '#285E61', // गहरा टील
    lineHeight: 26,
    fontWeight: '500',
  },
  actionButton: {
    paddingVertical: 14, // थोड़ी अधिक पैडिंग
    paddingHorizontal: 20,
    borderRadius: 10, // और गोल कोने
    alignItems: 'center',
    marginBottom: 12, // अधिक मार्जिन
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
  },
  revealButton: {
    backgroundColor: '#4299E1', // नीला रंग
  },
  actionButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  nextButton: {
    backgroundColor: '#48BB78', // हरा रंग
    marginTop: 8, // थोड़ा मार्जिन
  },
  selfAssessmentContainer: {
    marginVertical: 20, // अधिक मार्जिन
    padding: 18, // अधिक पैडिंग
    backgroundColor: '#FFFBEB', // हल्का पीला
    borderRadius: 12,
    alignItems: 'center',
    elevation: 2,
  },
  selfAssessmentPrompt: {
    fontSize: 17, // थोड़ा बड़ा
    color: '#975A16', // गहरा पीला/ब्राउन
    marginBottom: 15, // अधिक मार्जिन
    fontWeight: '500',
    textAlign: 'center',
  },
  assessmentButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
  },
  assessmentButton: {
    paddingVertical: 12, // अधिक पैडिंग
    paddingHorizontal: 15,
    borderRadius: 10,
    flex: 0.48, // थोड़ा स्पेसिंग के साथ
    alignItems: 'center',
    elevation: 1,
  },
  assessmentButtonYes: {
    backgroundColor: '#38A169', // गहरा हरा
  },
  assessmentButtonNo: {
    backgroundColor: '#E53E3E', // गहरा लाल
  },
  assessmentButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: 'bold',
  },
});

export default OneLinerScreen;
