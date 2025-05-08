import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Alert,
  SafeAreaView,
  ActivityIndicator,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect, useNavigation } from '@react-navigation/native';

import { QuizQuestion } from '../data/quizData';
import { OneLinerQuestion } from '../data/oneLinerData';

const BOOKMARKED_QUESTIONS_KEY = '@BookmarkedQuestionsKey';

interface BookmarkedQuizItem extends QuizQuestion {
  itemType: 'quiz';
}

interface BookmarkedOneLinerItem extends OneLinerQuestion {
  itemType: 'oneliner';
}

type BookmarkedItem = BookmarkedQuizItem | BookmarkedOneLinerItem;

const BookmarkedScreen = () => {
  const navigation = useNavigation();
  const [bookmarkedItems, setBookmarkedItems] = useState<BookmarkedItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const loadBookmarkedItems = async () => {
    setIsLoading(true);
    console.log('[BookmarkedScreen] Loading bookmarks...');
    try {
      const storedBookmarks = await AsyncStorage.getItem(BOOKMARKED_QUESTIONS_KEY);
      if (storedBookmarks) {
        let parsedItems: any[] = JSON.parse(storedBookmarks);
        console.log('[BookmarkedScreen] Raw items from AsyncStorage:', JSON.stringify(parsedItems, null, 2));

        const processedItems = parsedItems.map(item => {
          if (!item || !item.id) {
            console.log('[BookmarkedScreen] Filtering out invalid item (missing id):', item);
            return null; // अमान्य आइटम को हटाएं
          }

          if (item.itemType) { // यदि itemType पहले से मौजूद है
            return item as BookmarkedItem;
          } else {
            // itemType का अनुमान लगाने का प्रयास करें
            if (item.options && typeof item.correctAnswerIndex === 'number') {
              console.log('[BookmarkedScreen] Inferring itemType as "quiz" for item id:', item.id);
              return { ...item, itemType: 'quiz' } as BookmarkedQuizItem;
            } else if (item.answer && typeof item.question === 'string') {
              console.log('[BookmarkedScreen] Inferring itemType as "oneliner" for item id:', item.id);
              return { ...item, itemType: 'oneliner' } as BookmarkedOneLinerItem;
            } else {
              console.warn('[BookmarkedScreen] Could not infer itemType for item id:', item.id, item);
              return null; // यदि अनुमान नहीं लगाया जा सकता तो आइटम को फ़िल्टर करें
            }
          }
        }).filter(item => item !== null) as BookmarkedItem[]; // null आइटम्स को हटाएं

        console.log('[BookmarkedScreen] Processed items to be set in state:', JSON.stringify(processedItems, null, 2));
        setBookmarkedItems(processedItems);
      } else {
        console.log('[BookmarkedScreen] No bookmarks found in AsyncStorage.');
        setBookmarkedItems([]);
      }
    } catch (e) {
      console.error("[BookmarkedScreen] Failed to load bookmarked items.", e);
      Alert.alert("त्रुटि", "बुकमार्क लोड करने में विफल।");
      setBookmarkedItems([]);
    } finally {
      setIsLoading(false);
      console.log('[BookmarkedScreen] Finished loading bookmarks.');
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadBookmarkedItems();
    }, [])
  );

  const handleRemoveBookmark = async (itemId: string) => {
    // ... (आपका मौजूदा handleRemoveBookmark कोड अपरिवर्तित)
    try {
      const updatedBookmarks = bookmarkedItems.filter(item => item.id !== itemId);
      await AsyncStorage.setItem(BOOKMARKED_QUESTIONS_KEY, JSON.stringify(updatedBookmarks));
      setBookmarkedItems(updatedBookmarks);
    } catch (e) {
      console.error("Failed to remove bookmark.", e);
      Alert.alert("त्रुटि", "बुकमार्क हटाने में विफल।");
    }
  };

  const confirmRemoveBookmark = (item: BookmarkedItem) => {
    // ... (आपका मौजूदा confirmRemoveBookmark कोड अपरिवर्तित)
    Alert.alert(
      "बुकमार्क हटाएं",
      `क्या आप वाकई "${item.question.substring(0, 50)}..." को बुकमार्क से हटाना चाहते हैं?`,
      [
        { text: "नहीं", style: "cancel" },
        { text: "हाँ", onPress: () => handleRemoveBookmark(item.id), style: 'destructive' }
      ]
    );
  };

  const renderItemContent = (item: BookmarkedItem) => {
    // ... (आपका मौजूदा renderItemContent कोड अपरिवर्तित)
    if (item.itemType === 'quiz') {
      return (
        <>
          <Text style={styles.questionText}>{item.question}</Text>
          {item.examName && (
            <Text style={styles.examNameText}>परीक्षा संदर्भ: {item.examName}</Text>
          )}
          <Text style={styles.optionsLabel}>विकल्प:</Text>
          {item.options.map((option, index) => (
            <Text
              key={index}
              style={[
                styles.optionText,
                index === item.correctAnswerIndex && styles.correctAnswerText,
              ]}
            >
              {index + 1}. {option}{' '}
              {index === item.correctAnswerIndex ? '(सही उत्तर)' : ''}
            </Text>
          ))}
        </>
      );
    } else if (item.itemType === 'oneliner') {
      return (
        <>
          <Text style={styles.questionText}>{item.question}</Text>
          <Text style={styles.answerText}>उत्तर: {item.answer}</Text>
        </>
      );
    }
    return null;
  };

  const renderListItem = ({ item }: { item: BookmarkedItem }) => {
    // ... (आपका मौजूदा renderListItem कोड अपरिवर्तित)
     return (
      <View style={styles.itemContainer}>
        <View style={styles.itemHeader}>
          <Text style={styles.itemTypeLabel}>
            {item.itemType === 'quiz' ? 'क्विज़ प्रश्न' : 'वन-लाइनर'}
          </Text>
          <TouchableOpacity
            style={styles.removeButton}
            onPress={() => confirmRemoveBookmark(item)}
          >
            <Text style={styles.removeButtonText}>हटाएँ</Text>
          </TouchableOpacity>
        </View>
        {renderItemContent(item)}
      </View>
    );
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.safeAreaLoading}>
        <ActivityIndicator size="large" color="#2c3e50" />
        <Text style={styles.loadingText}>बुकमार्क्स लोड हो रहे हैं...</Text>
      </SafeAreaView>
    );
  }

  if (bookmarkedItems.length === 0) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>कोई बुकमार्क नहीं मिला।</Text>
          <TouchableOpacity
            style={styles.goBackButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.goBackButtonText}>होम पर वापस जाएं</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <FlatList
        data={bookmarkedItems}
        renderItem={renderListItem}
        keyExtractor={(item) => `${item.itemType}-${item.id}`}
        contentContainerStyle={styles.listContainer}
        ListHeaderComponent={<Text style={styles.screenTitle}>आपके बुकमार्क्स</Text>}
      />
    </SafeAreaView>
  );
};

// --- स्टाइल्स ---
// (आपके मौजूदा स्टाइल्स यहाँ अपरिवर्तित रहेंगे, जैसा कि पिछले उत्तर में दिया गया था)
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f0f4f8',
  },
  safeAreaLoading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0f4f8',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#333',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 18,
    color: '#555',
    marginBottom: 20,
    textAlign: 'center',
  },
  goBackButton: {
    backgroundColor: '#3498db',
    paddingVertical: 12,
    paddingHorizontal: 25,
    borderRadius: 8,
    elevation: 2,
  },
  goBackButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  screenTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#2c3e50',
    paddingHorizontal: 15,
    paddingTop: 15,
    paddingBottom: 10,
  },
  listContainer: {
    paddingBottom: 20,
  },
  itemContainer: {
    backgroundColor: '#ffffff',
    padding: 15,
    borderRadius: 10,
    marginHorizontal: 15,
    marginBottom: 12,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.12,
    shadowRadius: 3,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  itemTypeLabel: {
    fontSize: 13,
    color: '#7f8c8d',
    fontWeight: '600',
    backgroundColor: '#e9ecef',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 4,
  },
  removeButton: {
    backgroundColor: '#e74c3c',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 5,
  },
  removeButtonText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: 'bold',
  },
  questionText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#34495e',
    marginBottom: 8,
    lineHeight: 22,
  },
  examNameText: {
    fontSize: 12,
    fontStyle: 'italic',
    color: '#7f8c8d',
    marginBottom: 8,
    textAlign: 'left',
  },
  optionsLabel: {
    fontSize: 14,
    color: '#2c3e50',
    marginTop: 8,
    marginBottom: 5,
    fontWeight: '500',
  },
  optionText: {
    fontSize: 14,
    color: '#34495e',
    marginLeft: 10,
    marginBottom: 4,
    lineHeight: 20,
  },
  correctAnswerText: {
    color: '#27ae60',
    fontWeight: 'bold',
  },
  answerText: {
    fontSize: 15,
    color: '#27ae60',
    fontWeight: '500',
    marginTop: 8,
    backgroundColor: '#e6ffed',
    padding: 8,
    borderRadius: 4,
  },
});

export default BookmarkedScreen;
