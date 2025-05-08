// src/screens/OneLinerScreen.tsx
import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage'; // AsyncStorage इम्पोर्ट करें
import { oneLinerQuestions, OneLinerQuestion } from '../data/oneLinerData'; // पाथ सुनिश्चित करें

// AsyncStorage Key (HomeScreen और QuizScreen के साथ सिंक में)
const BOOKMARKED_QUESTIONS_KEY = '@BookmarkedQuestionsKey';

// OneLinerQuestion इंटरफ़ेस में id होना चाहिए
// मान लें कि OneLinerQuestion इंटरफ़ेस ऐसा है:
// export interface OneLinerQuestion {
//   id: string; // या number - यह यूनिक होना चाहिए
//   question: string;
//   answer: string;
//   // अन्य प्रॉपर्टीज यदि हों
// }

const OneLinerScreen = ({ navigation }) => {
  const [questions, setQuestions] = useState<OneLinerQuestion[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [isAnswerRevealed, setIsAnswerRevealed] = useState(false);
  const [hasSelfAssessedThisQuestion, setHasSelfAssessedThisQuestion] = useState(false);

  const [revealedCount, setRevealedCount] = useState(0);
  const [userMarkedCorrect, setUserMarkedCorrect] = useState(0);
  const [userMarkedIncorrect, setUserMarkedIncorrect] = useState(0);

  // बुकमार्क के लिए स्टेट (सभी प्रकार के बुकमार्क आइटम स्टोर कर सकता है)
  const [bookmarkedItems, setBookmarkedItems] = useState<(OneLinerQuestion | any)[]>([]);

  // मौजूदा बुकमार्क लोड करें
  useEffect(() => {
    const loadBookmarks = async () => {
      try {
        const storedBookmarks = await AsyncStorage.getItem(BOOKMARKED_QUESTIONS_KEY);
        if (storedBookmarks) {
          setBookmarkedItems(JSON.parse(storedBookmarks));
        }
      } catch (e) {
        console.error("Failed to load bookmarks.", e);
      }
    };
    loadBookmarks();
  }, []);

  useEffect(() => {
    const shuffledQuestions = [...oneLinerQuestions].sort(() => Math.random() - 0.5);
    setQuestions(shuffledQuestions);
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
    setHasSelfAssessedThisQuestion(false);
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
        "वन-लाइनर समाप्त",
        `आपने ${revealedCount} उत्तर देखे।\nसही सोचे: ${userMarkedCorrect}\nगलत सोचे: ${userMarkedIncorrect}`,
        [{ text: "ठीक है", onPress: () => navigation.goBack() }]
      );
    }
  };

  const toggleBookmark = async () => {
    if (!questions[currentQuestionIndex]) return;

    const currentQ = questions[currentQuestionIndex];
    // प्रश्न में यूनिक 'id' प्रॉपर्टी होनी चाहिए
    if (!currentQ.id) {
        console.warn("One-liner is missing an ID. Cannot bookmark.");
        Alert.alert("त्रुटि", "इस वन-लाइनर को बुकमार्क नहीं किया जा सकता (ID नहीं है)।");
        return;
    }

    let updatedBookmarks = [...bookmarkedItems];
    const existingBookmarkIndex = updatedBookmarks.findIndex(bq => bq.id === currentQ.id);

    if (existingBookmarkIndex > -1) {
      // पहले से बुकमार्क है, तो हटाएं
      updatedBookmarks.splice(existingBookmarkIndex, 1);
    } else {
      // बुकमार्क नहीं है, तो जोड़ें (पूरा वन-लाइनर ऑब्जेक्ट)
      updatedBookmarks.push(currentQ);
    }

    try {
      await AsyncStorage.setItem(BOOKMARKED_QUESTIONS_KEY, JSON.stringify(updatedBookmarks));
      setBookmarkedItems(updatedBookmarks); // लोकल स्टेट अपडेट करें
    } catch (e) {
      console.error("Failed to update bookmarks for one-liner.", e);
      Alert.alert("त्रुटि", "बुकमार्क अपडेट करने में विफल।");
    }
  };


  if (questions.length === 0) {
    return <View style={styles.container}><Text style={styles.loadingText}>वन-लाइनर लोड हो रहे हैं...</Text></View>;
  }

  if (currentQuestionIndex >= questions.length && questions.length > 0) {
    return <View style={styles.container}><Text style={styles.loadingText}>सभी वन-लाइनर समाप्त हो चुके हैं।</Text></View>;
  }

  const currentQuestion = questions[currentQuestionIndex];
  // वर्तमान प्रश्न बुकमार्क है या नहीं
  const isCurrentBookmarked = currentQuestion && currentQuestion.id ? bookmarkedItems.some(bq => bq.id === currentQuestion.id) : false;

  return (
    <View style={styles.container}>
      <View style={styles.statsContainer}>
        <Text style={styles.statsText}>प्रश्न: {currentQuestionIndex + 1}/{questions.length}</Text>
        <Text style={styles.statsText}>देखे गए: {revealedCount}</Text>
        <Text style={styles.statsText}>सही सोचे: {userMarkedCorrect}</Text>
        <Text style={styles.statsText}>गलत सोचे: {userMarkedIncorrect}</Text>
      </View>

      <View style={styles.questionCard}>
        <View style={styles.questionHeader}>
            <Text style={styles.questionLabel}>प्रश्न:</Text>
            {currentQuestion && currentQuestion.id && ( // सुनिश्चित करें कि प्रश्न और उसकी id मौजूद है
                <TouchableOpacity onPress={toggleBookmark} style={styles.bookmarkButton}>
                    <Text style={styles.bookmarkIcon}>{isCurrentBookmarked ? '🔖' : ' L '}</Text>
                </TouchableOpacity>
            )}
        </View>
        <Text style={styles.questionText}>{currentQuestion.question}</Text>
      </View>

      {!isAnswerRevealed ? (
        <TouchableOpacity
          style={styles.actionButton}
          onPress={handleRevealAnswer}
        >
          <Text style={styles.actionButtonText}>उत्तर दिखाएँ</Text>
        </TouchableOpacity>
      ) : (
        <>
          <View style={styles.answerCard}>
            <Text style={styles.answerLabel}>उत्तर:</Text>
            <Text style={styles.answerText}>{currentQuestion.answer}</Text>
          </View>

          {!hasSelfAssessedThisQuestion && (
            <View style={styles.selfAssessmentContainer}>
              <Text style={styles.selfAssessmentPrompt}>क्या आपने सही उत्तर सोचा था?</Text>
              <View style={styles.assessmentButtonsRow}>
                <TouchableOpacity
                  style={[styles.assessmentButton, styles.assessmentButtonYes]}
                  onPress={() => handleSelfAssessment(true)}
                >
                  <Text style={styles.assessmentButtonText}>हाँ, सही सोचा था 👍</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.assessmentButton, styles.assessmentButtonNo]}
                  onPress={() => handleSelfAssessment(false)}
                >
                  <Text style={styles.assessmentButtonText}>नहीं, गलत सोचा था 👎</Text>
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
        <Text style={styles.actionButtonText}>अगला वन-लाइनर</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f7f9fc',
  },
  loadingText: {
    fontSize: 18,
    color: '#555',
    textAlign: 'center',
    marginTop: 50,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    marginBottom: 15,
    paddingVertical: 10,
    paddingHorizontal:15,
    backgroundColor: '#e9ecef',
    borderRadius: 8,
  },
  statsText: {
    fontSize: 13,
    color: '#343a40',
    fontWeight: '500',
    marginRight: 10,
    marginBottom: 5,
  },
  questionCard: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 20,
    paddingVertical: 15, // ऊपर-नीचे थोड़ी कम पैडिंग
    borderRadius: 12,
    marginBottom: 15,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
  },
  questionHeader: { // प्रश्न लेबल और बुकमार्क बटन के लिए
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  questionLabel: {
    fontSize: 14,
    color: '#6c757d',
    // marginBottom: 5, // questionHeader में चला गया
  },
  bookmarkButton: {
    padding: 5,
  },
  bookmarkIcon: {
    fontSize: 22,
    color: '#6c757d',
  },
  questionText: {
    fontSize: 18,
    color: '#212529',
    lineHeight: 26,
    fontWeight: '500',
  },
  answerCard: {
    backgroundColor: '#e6ffed',
    padding: 15,
    borderRadius: 12,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#b8f5c9',
  },
  answerLabel: {
    fontSize: 14,
    color: '#155724',
    marginBottom: 5,
  },
  answerText: {
    fontSize: 17,
    color: '#0f5132',
    lineHeight: 24,
    fontWeight: '500',
  },
  actionButton: {
    backgroundColor: '#007bff',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 10,
    elevation: 2,
  },
  actionButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  nextButton: {
    backgroundColor: '#28a745',
    marginTop: 5,
  },
  selfAssessmentContainer: {
    marginVertical: 15,
    padding: 15,
    backgroundColor: '#fff3cd',
    borderRadius: 8,
    alignItems: 'center',
  },
  selfAssessmentPrompt: {
    fontSize: 16,
    color: '#664d03',
    marginBottom: 12,
    fontWeight: '500',
  },
  assessmentButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
  },
  assessmentButton: {
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 8,
    flex: 0.48,
    alignItems: 'center',
    elevation: 1,
  },
  assessmentButtonYes: {
    backgroundColor: '#198754',
  },
  assessmentButtonNo: {
    backgroundColor: '#dc3545',
  },
  assessmentButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: 'bold',
  },
});

export default OneLinerScreen;