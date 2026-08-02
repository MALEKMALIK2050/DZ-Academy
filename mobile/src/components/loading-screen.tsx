// src/components/loading-screen.tsx
import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Text } from 'react-native';

const WORDS = [
  { text: "النجاح", color: "#10b981" },
  { text: "المثابرة", color: "#06b6d4" },
  { text: "التفوق", color: "#f97316" },
  { text: "الاجتهاد", color: "#3b82f6" },
  { text: "التميز", color: "#8b5cf6" },
];

const PYRAMID_ROWS = [
  { blocks: 1, width: 44, colors: ['#ef4444', '#dc2626'], centerIndex: 0 },
  { blocks: 2, width: 44, colors: ['#f97316', '#ea580c'], centerIndex: 0 },
  { blocks: 3, width: 44, colors: ['#f59e0b', '#d97706'], centerIndex: 1 },
  { blocks: 4, width: 44, colors: ['#06b6d4', '#0891b2'], centerIndex: 1 },
  { blocks: 5, width: 44, colors: ['#6366f1', '#4f46e5'], centerIndex: 2 },
];

const BLOCK_HEIGHT = 26;
const BLOCK_GAP = 5;
const ROW_GAP = 5;

export function LoadingScreen({ message = "جاري تحميل المحتوى التعليمي..." }: { message?: string }) {
  const [wordIndex, setWordIndex] = useState(0);
  const [activeAscendRow, setActiveAscendRow] = useState(4);

  useEffect(() => {
    const wordInterval = setInterval(() => {
      setWordIndex((prev) => (prev + 1) % WORDS.length);
    }, 2200);

    const ascendInterval = setInterval(() => {
      setActiveAscendRow((prev) => (prev <= -1 ? 4 : prev - 1));
    }, 550);

    return () => {
      clearInterval(wordInterval);
      clearInterval(ascendInterval);
    };
  }, []);

  const currentWord = WORDS[wordIndex];

  const renderPyramid = () => {
    return PYRAMID_ROWS.map((row, rowIdx) => {
      return (
        <View key={rowIdx} style={styles.pyramidRow}>
          {Array.from({ length: row.blocks }).map((_, blockIdx) => {
            const isCenter = blockIdx === row.centerIndex;
            const isAscendActive = isCenter && activeAscendRow === rowIdx;
            const blockBg = isAscendActive ? '#10b981' : row.colors[0];

            return (
              <View
                key={blockIdx}
                style={[
                  styles.block,
                  {
                    width: row.width,
                    height: BLOCK_HEIGHT,
                    backgroundColor: blockBg,
                    shadowColor: isAscendActive ? '#10b981' : '#000',
                    shadowRadius: isAscendActive ? 12 : 4,
                    shadowOpacity: isAscendActive ? 0.9 : 0.1,
                    elevation: isAscendActive ? 8 : 2,
                    transform: [{ scale: isAscendActive ? 1.1 : 1 }],
                  },
                ]}
              >
                {isAscendActive && (
                  <Text style={styles.arrowText}>▲</Text>
                )}
              </View>
            );
          })}
        </View>
      );
    });
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerBox}>
        <Text style={styles.headerTitle}>{message}</Text>
      </View>

      <View style={styles.pyramidContainer}>
        <View
          style={[
            styles.triangleTip,
            {
              borderBottomColor: activeAscendRow === -1 ? '#ffffff' : '#10b981',
              shadowColor: activeAscendRow === -1 ? '#ffffff' : '#10b981',
              shadowRadius: activeAscendRow === -1 ? 20 : 6,
              shadowOpacity: activeAscendRow === -1 ? 1 : 0.4,
              elevation: activeAscendRow === -1 ? 12 : 3,
              transform: [{ scale: activeAscendRow === -1 ? 1.35 : 1 }],
            },
          ]}
        />
        {renderPyramid()}
      </View>

      <View style={styles.textContainer}>
        <Text
          key={wordIndex}
          style={[
            styles.motivatingText,
            { color: currentWord.color },
          ]}
        >
          {currentWord.text}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FAF8F5',
    padding: 20,
  },
  headerBox: {
    marginBottom: 24,
    alignItems: 'center',
  },
  headerTitle: {
    color: '#059669',
    fontWeight: '800',
    fontSize: 18,
    textAlign: 'center',
  },
  pyramidContainer: {
    alignItems: 'center',
    marginBottom: 36,
  },
  triangleTip: {
    width: 0,
    height: 0,
    borderLeftWidth: 18,
    borderRightWidth: 18,
    borderBottomWidth: 24,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    marginBottom: ROW_GAP,
  },
  pyramidRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: BLOCK_GAP,
    marginBottom: ROW_GAP,
  },
  block: {
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  arrowText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: 'bold',
  },
  textContainer: {
    alignItems: 'center',
    height: 40,
    justifyContent: 'center',
  },
  motivatingText: {
    fontWeight: '900',
    fontSize: 24,
    letterSpacing: 1,
    textAlign: 'center',
  },
});

export default LoadingScreen;