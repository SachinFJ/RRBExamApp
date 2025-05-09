// src/screens/QuizScreen.tsx
import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, ScrollView } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { quizQuestions, QuizQuestion } from '../data/quizData';

const USER_HIGH_SCORE_KEY = '@UserHighScoreKey';
const USER_LAST_SCORE_KEY = '@UserLastScoreKey';
const BOOKMARKED_QUESTIONS_KEY = '@BookmarkedQuestionsKey';

interface QuizQuestionWithMeta extends QuizQuestion {
  itemType?: 'quiz';
}


const QuizScreen = ({ navigation }) => {
  const [questions, setQuestions] = useState<QuizQuestionWithMeta[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedOptionIndex, setSelectedOptionIndex] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [isAnswerProcessed, setIsAnswerProcessed] = useState(false);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [correctAnswersCount, setCorrectAnswersCount] = useState(0);
  const [wrongAnswersCount, setWrongAnswersCount] = useState(0);
  const [skippedCount, setSkippedCount] = useState(0);
  const [feedbackEmoji, setFeedbackEmoji] = useState<string | null>(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const [bookmarkedItems, setBookmarkedItems] = useState<QuizQuestionWithMeta[]>([]);

  useEffect(() => {
    const loadBookmarks = async () => {
      try {
        const storedBookmarks = await AsyncStorage.getItem(BOOKMARKED_QUESTIONS_KEY);
        if (storedBookmarks) {
          const allBookmarks = JSON.parse(storedBookmarks);
          const quizBookmarks = allBookmarks.filter(item => item.itemType === 'quiz' || !item.itemType);
          setBookmarkedItems(quizBookmarks);
        }
      } catch (e)
      { // Error reading value
        console.error("Failed to load bookmarks.", e);
      }
    };
    loadBookmarks();
  }, []);

  useEffect(() => {
    let isActive = questions.length > 0 && currentQuestionIndex < questions.length;

    if (isActive) {
      timerRef.current = setInterval(() => {
        setElapsedTime((prevTime) => prevTime + 1);
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    }
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [questions.length, currentQuestionIndex]);

  useEffect(() => {
    const shuffledQuestions = [...quizQuestions].sort(() => Math.random() - 0.5);
    // .slice(0, 10) को हटाया गया ताकि सभी प्रश्न लोड हों
    setQuestions(shuffledQuestions.map(q => ({...q}))); 
    setCurrentQuestionIndex(0);
    setSelectedOptionIndex(null);
    setScore(0);
    setIsAnswerProcessed(false);
    setIsCorrect(null);
    setCorrectAnswersCount(0);
    setWrongAnswersCount(0);
    setSkippedCount(0);
    setFeedbackEmoji(null);
    setElapsedTime(0);
  }, []);


  const handleOptionSelect = (index: number) => {
    if (isAnswerProcessed) return;

    setSelectedOptionIndex(index);
    const currentQuestion = questions[currentQuestionIndex];
    const correct = currentQuestion.correctAnswerIndex === index;

    setIsCorrect(correct);
    if (correct) {
      setScore((prevScore) => prevScore + 1);
      setCorrectAnswersCount((prevCount) => prevCount + 1);
      setFeedbackEmoji('😄');
    } else {
      setWrongAnswersCount((prevCount) => prevCount + 1);
      setFeedbackEmoji('😟');
    }
    setIsAnswerProcessed(true);
  };

  const moveToNextQuestionLogic = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex((prevIndex) => prevIndex + 1);
      setSelectedOptionIndex(null);
      setIsAnswerProcessed(false);
      setIsCorrect(null);
      setFeedbackEmoji(null);
    } else {
      finalizeQuiz("Quiz Finished!");
    }
  };

  const handleNextQuestion = () => {
    if (!isAnswerProcessed && questions.length > 0 && selectedOptionIndex === null) {
      setSkippedCount((prevCount) => prevCount + 1);
    }
    moveToNextQuestionLogic();
  };

  const handleSubmitQuiz = () => {
    Alert.alert(
      "Submit Quiz",
      "Are you sure you want to submit the quiz now?",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Submit", onPress: () => finalizeQuiz("Quiz Submitted"), style: 'destructive' }
      ]
    );
  };

  const finalizeQuiz = async (title: string) => {
    if (timerRef.current) clearInterval(timerRef.current);

    const totalQuestionsInSession = questions.length;
    let currentSkipped = skippedCount;

    // स्किप्ड प्रश्नों की गणना को बेहतर बनाने का प्रयास
    if (title === "Quiz Submitted") {
        // वर्तमान प्रश्न का उत्तर दिया गया है या नहीं
        const isCurrentQuestionAttempted = isAnswerProcessed || selectedOptionIndex !== null;
        // उन प्रश्नों की संख्या जो देखे गए लेकिन उत्तर नहीं दिए गए (स्किप किए गए)
        // और जो प्रश्न देखे ही नहीं गए
        let unansweredOrUnseen = 0;
        if (!isCurrentQuestionAttempted && currentQuestionIndex < totalQuestionsInSession) {
            // यदि वर्तमान प्रश्न का उत्तर नहीं दिया गया और सबमिट किया गया
            unansweredOrUnseen++; 
        }
        // currentQuestionIndex के बाद वाले सभी प्रश्न भी स्किप्ड माने जाएंगे
        unansweredOrUnseen += (totalQuestionsInSession - (currentQuestionIndex + 1));
        
        // यह सुनिश्चित करें कि currentSkipped में डुप्लिकेट काउंटिंग न हो
        // skippedCount में वे प्रश्न हैं जिन्हें 'Next' दबाकर स्किप किया गया
        // unansweredOrUnseen में वे हैं जो सबमिट करते समय अनअटेम्प्टेड थे
        // यदि कोई प्रश्न Next दबाकर स्किप किया गया और वह बाद में भी अनअटेम्प्टेड रहा, तो वह दो बार काउंट हो सकता है
        // इसलिए, हम कुल प्रश्नों में से सही और गलत उत्तरों को घटाकर स्किप्ड निकाल सकते हैं
        currentSkipped = totalQuestionsInSession - (correctAnswersCount + wrongAnswersCount);
    }


    const finalScoreString = `${score}/${totalQuestionsInSession}`;

    try {
      await AsyncStorage.setItem(USER_LAST_SCORE_KEY, finalScoreString);
      const storedHighScore = await AsyncStorage.getItem(USER_HIGH_SCORE_KEY);
      if (storedHighScore) {
        const [storedScoreNumStr] = storedHighScore.split('/');
        const storedScoreNum = parseInt(storedScoreNumStr, 10);
        if (score > storedScoreNum) {
          await AsyncStorage.setItem(USER_HIGH_SCORE_KEY, finalScoreString);
        }
      } else {
        await AsyncStorage.setItem(USER_HIGH_SCORE_KEY, finalScoreString);
      }
    } catch (e) {
      console.error("Failed to save scores.", e);
    }
    
    setCurrentQuestionIndex(questions.length); // क्विज़ UI को समाप्त करने के लिए

    Alert.alert(
      title,
      `Total time taken: ${formatTime(elapsedTime)}\nYour final score is: ${finalScoreString}\nCorrect: ${correctAnswersCount}, Wrong: ${wrongAnswersCount}, Skipped: ${currentSkipped}`,
      [{ text: "OK", onPress: () => navigation.goBack() }]
    );
  };

  const toggleBookmark = async () => {
    if (!questions[currentQuestionIndex]) return;

    const currentQ = questions[currentQuestionIndex];
    if (!currentQ.id) {
      console.warn("Question is missing an ID. Cannot bookmark.");
      Alert.alert("Error", "This question cannot be bookmarked (ID missing).");
      return;
    }

    let allStoredBookmarksRaw = await AsyncStorage.getItem(BOOKMARKED_QUESTIONS_KEY);
    let allStoredBookmarks: any[] = allStoredBookmarksRaw ? JSON.parse(allStoredBookmarksRaw) : [];

    const bookmarkQuizItem: QuizQuestionWithMeta = { ...currentQ, itemType: 'quiz' };

    const existingBookmarkIndex = allStoredBookmarks.findIndex(
      (bq) => bq.id === bookmarkQuizItem.id && bq.itemType === 'quiz'
    );

    if (existingBookmarkIndex > -1) {
      allStoredBookmarks.splice(existingBookmarkIndex, 1);
    } else {
      allStoredBookmarks.push(bookmarkQuizItem);
    }

    try {
      await AsyncStorage.setItem(BOOKMARKED_QUESTIONS_KEY, JSON.stringify(allStoredBookmarks));
      const currentQuizBookmarks = allStoredBookmarks.filter(item => item.itemType === 'quiz');
      setBookmarkedItems(currentQuizBookmarks);
    } catch (e) {
      console.error("Failed to update bookmarks.", e);
      Alert.alert("Error", "Failed to update bookmarks.");
    }
  };

  if (questions.length === 0 && currentQuestionIndex >= questions.length) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>
          {questions.length === 0 && currentQuestionIndex === 0 ? "Loading questions..." : "Quiz finished."} 
        </Text>
      </View>
    );
  }

  if (currentQuestionIndex >= questions.length && questions.length > 0) {
    return <View style={styles.container}><Text style={styles.loadingText}>Quiz finished.</Text></View>;
  }
  if (questions.length === 0 ) {
    return <View style={styles.container}><Text style={styles.loadingText}>Loading questions...</Text></View>;
  }

  const currentQuestion = questions[currentQuestionIndex];
  const isCurrentBookmarked = currentQuestion && currentQuestion.id ? 
    bookmarkedItems.some(bq => bq.id === currentQuestion.id) : false;


  return (
    <ScrollView style={styles.scrollView} contentContainerStyle={styles.container}>
      <View style={styles.headerContainer}>
        <View style={styles.dashboard}>
          <Text style={styles.dashboardText}>Score: {score}</Text>
          <Text style={styles.dashboardText}>Correct: {correctAnswersCount}</Text>
          <Text style={styles.dashboardText}>Wrong: {wrongAnswersCount}</Text>
          <Text style={styles.dashboardText}>Skipped: {skippedCount}</Text>
        </View>
        <View style={styles.timerContainer}>
          <Text style={styles.timerText}>Time: {formatTime(elapsedTime)}</Text>
        </View>
      </View>

      {isAnswerProcessed && feedbackEmoji && (
        <View style={styles.mainEmojiContainer}>
          <Text style={styles.mainEmojiText}>{feedbackEmoji}</Text>
        </View>
      )}

      <View style={styles.questionCard}>
        <View style={styles.questionHeader}>
          <Text style={styles.questionNumberText}>
            Question {currentQuestionIndex + 1} / {questions.length}
          </Text>
          <TouchableOpacity onPress={toggleBookmark} style={styles.bookmarkButton}>
            <Text style={[styles.bookmarkIcon, isCurrentBookmarked ? styles.bookmarkedActiveIcon : styles.bookmarkedInactiveIcon]}>
              {isCurrentBookmarked ? '🔖' : '✩'}
            </Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.questionText}>{currentQuestion.question}</Text>

        {currentQuestion.examName && (
          <Text style={styles.examNameText}>
            Exam Reference: {currentQuestion.examName}
          </Text>
        )}
      </View>

      <View style={styles.optionsContainer}>
        {currentQuestion.options.map((option, index) => {
          let optionStyle = styles.optionButton;
          let optionTextStyle = styles.optionText;
          let detailEmoji = '';

          if (isAnswerProcessed) {
            if (index === currentQuestion.correctAnswerIndex) {
              optionStyle = [styles.optionButton, styles.correctOptionButton];
              optionTextStyle = [styles.optionText, styles.correctOptionText];
              detailEmoji = '✅ ';
            } else if (index === selectedOptionIndex && !isCorrect) {
              optionStyle = [styles.optionButton, styles.incorrectOptionButton];
              optionTextStyle = [styles.optionText, styles.incorrectOptionText];
              detailEmoji = '❌ ';
            } else {
              optionStyle = [styles.optionButton, styles.disabledOptionButton];
            }
          } else {
            if (selectedOptionIndex === index) {
              optionStyle = [styles.optionButton, styles.selectedOptionButton];
            }
          }

          return (
            <TouchableOpacity
              key={index}
              style={optionStyle}
              onPress={() => handleOptionSelect(index)}
              disabled={isAnswerProcessed}
            >
              <Text style={optionTextStyle}>{detailEmoji}{option}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <View style={styles.actionButtonsContainer}>
        <TouchableOpacity
            style={[styles.actionButton, styles.submitButton]}
            onPress={handleSubmitQuiz}
            disabled={currentQuestionIndex >= questions.length}
        >
            <Text style={styles.actionButtonText}>Submit Quiz</Text>
        </TouchableOpacity>
        <TouchableOpacity
            style={[
                styles.actionButton,
                styles.nextButton,
                (!isAnswerProcessed && selectedOptionIndex === null && currentQuestionIndex < questions.length -1) ? styles.disabledNextButton : {}
            ]}
            onPress={handleNextQuestion}
        >
            <Text style={styles.actionButtonText}>
                {currentQuestionIndex === questions.length - 1 ? 'Finish Quiz' : 'Next Question'}
            </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const formatTime = (seconds: number) => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins < 10 ? '0' : ''}${mins}:${secs < 10 ? '0' : ''}${secs}`;
};

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  container: {
    flexGrow: 1,
    padding: 15,
    backgroundColor: '#f0f4f8',
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  dashboard: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#e9ecef',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 8,
    flex: 1,
    marginRight: 8,
    elevation: 1,
  },
  dashboardText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#495057',
  },
  timerContainer: {
    backgroundColor: '#ffc107',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    minWidth: 70,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 1,
  },
  timerText: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#212529',
  },
  mainEmojiContainer: {
    alignItems: 'center',
    marginVertical: 10,
  },
  mainEmojiText: {
    fontSize: 48,
  },
  loadingText: {
    fontSize: 18,
    textAlign: 'center',
    marginTop: 50,
    color: '#34495e',
  },
  questionCard: {
    marginBottom: 10,
    padding: 15,
    backgroundColor: '#ffffff',
    borderRadius: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
  },
  questionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  questionNumberText: {
    fontSize: 13,
    color: '#6c757d',
    fontWeight: '500',
  },
  bookmarkButton: {
    padding: 6,
  },
  bookmarkIcon: {
    fontSize: 24,
  },
  bookmarkedActiveIcon: {
    color: '#ffc107',
  },
  bookmarkedInactiveIcon: {
    color: '#adb5bd',
  },
  questionText: {
    fontSize: 17,
    fontWeight: '500',
    color: '#212529',
    lineHeight: 24,
    marginBottom: 8,
  },
  examNameText: {
    fontSize: 12,
    fontStyle: 'italic',
    color: '#007bff',
    marginTop: 5,
    textAlign: 'right',
  },
  optionsContainer: {
    marginBottom: 15,
  },
  optionButton: {
    backgroundColor: '#ffffff',
    paddingVertical: 12,
    paddingHorizontal: 15,
    marginVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#dee2e6',
    elevation: 1,
  },
  optionText: {
    fontSize: 15,
    color: '#212529',
  },
  selectedOptionButton: {
    backgroundColor: '#cfe2ff',
    borderColor: '#007bff',
  },
  correctOptionButton: {
    backgroundColor: '#d1e7dd',
    borderColor: '#198754',
  },
  correctOptionText: {
    color: '#0f5132',
    fontWeight: 'bold',
  },
  incorrectOptionButton: {
    backgroundColor: '#f8d7da',
    borderColor: '#dc3545',
  },
  incorrectOptionText: {
    color: '#721c24',
    fontWeight: 'bold',
  },
  disabledOptionButton: {
    backgroundColor: '#f8f9fa',
    borderColor: '#e9ecef',
  },
  actionButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  actionButton: {
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 8,
    alignItems: 'center',
    elevation: 2,
    flex: 1,
  },
  submitButton: {
    backgroundColor: '#dc3545',
    marginRight: 8,
  },
  nextButton: {
    backgroundColor: '#007bff',
  },
  disabledNextButton: {
    backgroundColor: '#a0cfff',
    opacity: 0.7,
  },
  actionButtonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: 'bold',
  },
});

export default QuizScreen;
