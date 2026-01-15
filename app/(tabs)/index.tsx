import { useColorScheme } from '@/hooks/use-color-scheme';
import vocaProcessed from '@/words/voca_processed.json';
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Platform, Pressable, StyleSheet, Text, View } from 'react-native';

type VocaItem = { word: string; meaning: string };
const RAW_VOCAB = (vocaProcessed as VocaItem[]).filter(v => v && v.word);
const STORAGE_KEY = 'VOCA_CARD_STATES_V1';

type CardState = { N: number; EF: number; I: number; lastReviewed: number | null };
type Grade = 'again' | 'hard' | 'good' | 'easy' | null;

/** 헬퍼: 배열 셔플 */
function shuffleArray<T>(arr: T[]) {
    return [...arr].sort(() => Math.random() - 0.5);
}

/** 헬퍼: 오답 선택지 생성 */
function pickDistractors(all: VocaItem[], excludeIndex: number, count: number) {
    const pool = all.filter((_, idx) => idx !== excludeIndex).map(v => v.meaning);
    return shuffleArray(pool).slice(0, count);
}

/** 헬퍼: SM-2 기반 스마트 큐 생성 */
function generateSmartQueue(cardStates: CardState[]) {
    const now = Date.now();
    const oneDayMs = 24 * 60 * 60 * 1000;

    const indexed = cardStates.map((state, index) => {
        const dueDate = (state.lastReviewed || 0) + (state.I * oneDayMs);
        return { index, state, overdue: now - dueDate, isDue: state.lastReviewed === null || now >= dueDate };
    });

    const dueItems = indexed.filter(i => i.isDue).sort((a, b) => b.overdue - a.overdue);
    const pendingItems = indexed.filter(i => !i.isDue).sort((a, b) => a.state.EF - b.state.EF);

    return [...dueItems.map(i => i.index), ...pendingItems.map(i => i.index)];
}

export default function App() {
    const colorScheme = useColorScheme();
    const isDarkMode = colorScheme === 'dark';

    const [isLoaded, setIsLoaded] = useState(false);
    const [cardStates, setCardStates] = useState<CardState[]>([]);
    const [queue, setQueue] = useState<number[]>([]);

    const [selectedOption, setSelectedOption] = useState<string | null>(null);
    const [isAnswered, setIsAnswered] = useState(false);
    const [currentOptions, setCurrentOptions] = useState<string[]>([]);

    const activeIndex = queue.length > 0 ? queue[0] : null;

    // 초기 데이터 로드
    useEffect(() => {
        const init = async () => {
            try {
                const saved = await AsyncStorage.getItem(STORAGE_KEY);
                let initialStates: CardState[];

                if (saved) {
                    const parsed = JSON.parse(saved);
                    if (parsed.length === RAW_VOCAB.length) {
                        initialStates = parsed;
                    } else {
                        initialStates = RAW_VOCAB.map(() => ({ N: 0, EF: 2.5, I: 0, lastReviewed: null }));
                    }
                } else {
                    initialStates = RAW_VOCAB.map(() => ({ N: 0, EF: 2.5, I: 0, lastReviewed: null }));
                }

                setCardStates(initialStates);
                setQueue(generateSmartQueue(initialStates));
            } catch (e) {
                console.error(e);
            } finally {
                setIsLoaded(true);
            }
        };
        init();
    }, []);

    // 단어가 바뀔 때만 선택지를 생성
    useEffect(() => {
        if (activeIndex !== null) {
            const entry = RAW_VOCAB[activeIndex];
            const distractors = pickDistractors(RAW_VOCAB, activeIndex, 3);
            setCurrentOptions(shuffleArray([entry.meaning, ...distractors]));
        }
    }, [activeIndex]);

    const saveAndSetStates = useCallback((nextStates: CardState[]) => {
        setCardStates(nextStates);
        AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(nextStates));
    }, []);

    const handleReview = useCallback((grade: Grade) => {
        if (activeIndex === null) return;

        const nextStates = [...cardStates];
        const s = { ...nextStates[activeIndex] };
        const EASY_BONUS = 1.3;

        if (grade === 'again') {
            s.EF = Math.max(1.3, +(s.EF - 0.2).toFixed(2));
            s.N = 0;
            s.I = 0;
        } else if (grade === 'hard') {
            s.EF = Math.max(1.3, +(s.EF - 0.15).toFixed(2));
            s.N += 1;
            s.I = s.N === 1 ? 1 : s.N === 2 ? 6 : Math.round(s.I * 1.2);
        } else if (grade === 'good') {
            s.N += 1;
            s.I = s.N === 1 ? 1 : s.N === 2 ? 6 : Math.round(s.I * s.EF);
        } else if (grade === 'easy') {
            s.EF = +(s.EF + 0.15).toFixed(2);
            s.N += 1;
            s.I = s.N === 1 ? 1 : s.N === 2 ? 6 : Math.round(s.I * s.EF * EASY_BONUS);
        }

        s.lastReviewed = Date.now();
        nextStates[activeIndex] = s;
        saveAndSetStates(nextStates);
    }, [activeIndex, cardStates, saveAndSetStates]);

    const nextQuestion = useCallback(() => {
        setQueue(prev => {
            const nextQ = prev.slice(1);
            if (nextQ.length === 0) {
                const newQ = generateSmartQueue(cardStates);
                const finishMsg = "모든 카드를 검토했습니다!";
                if (Platform.OS === 'web') alert(finishMsg);
                else Alert.alert("완료", finishMsg);
                return newQ;
            }
            return nextQ;
        });
        setSelectedOption(null);
        setIsAnswered(false);
    }, [cardStates]);

    const handleOptionPress = useCallback((option: string) => {
        if (isAnswered) return;
        setSelectedOption(option);
        setIsAnswered(true);

        const isCorrect = option === RAW_VOCAB[activeIndex!].meaning;
        if (!isCorrect) {
            handleReview('again');
        }
    }, [isAnswered, activeIndex, handleReview]);

    const handleGradePress = useCallback((grade: 'hard' | 'good' | 'easy') => {
        handleReview(grade);
        nextQuestion();
    }, [handleReview, nextQuestion]);

    // 키보드 조작 로직
    useEffect(() => {
        if (Platform.OS !== 'web') return;

        const handleKeyDown = (e: KeyboardEvent) => {
            // 1. 숫자 1~4: 선택지 선택
            if (['1', '2', '3', '4'].includes(e.key)) {
                const idx = parseInt(e.key) - 1;
                if (!isAnswered && currentOptions[idx]) {
                    handleOptionPress(currentOptions[idx]);
                }
            }

            // 2. 스페이스바: 넘기기 또는 다음
            if (e.code === 'Space') {
                e.preventDefault();
                if (!isAnswered) {
                    handleOptionPress(''); // 넘기기(틀림 처리)
                } else {
                    const isCorrect = selectedOption === RAW_VOCAB[activeIndex!]?.meaning;
                    if (!isCorrect) nextQuestion(); // 틀렸을 땐 스페이스바로 다음
                }
            }

            // 3. 정답 시 난이도 1,2,3
            if (isAnswered && selectedOption === RAW_VOCAB[activeIndex!]?.meaning) {
                if (e.key === '1') handleGradePress('hard');
                if (e.key === '2') handleGradePress('good');
                if (e.key === '3') handleGradePress('easy');
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isAnswered, currentOptions, selectedOption, activeIndex, handleOptionPress, handleGradePress, nextQuestion]);

    const currentQuestion = useMemo(() => {
        if (activeIndex === null) return null;
        return {
            word: RAW_VOCAB[activeIndex].word,
            answer: RAW_VOCAB[activeIndex].meaning,
            options: currentOptions
        };
    }, [activeIndex, currentOptions]);

    const theme = {
        dark: { background: '#141414', surface: '#1f1f1f', onSurface: '#fefbff', onSurfaceVariant: '#e6e1e3', hover: '#303030', border: '#4d4256', nextBackground: '#9f86ff', nextText: '#1b0157', primary: '#9f86ff' },
        light: { background: '#fefbff', surface: '#f2ecee', onSurface: '#1f1f1f', onSurfaceVariant: '#1c1b1d', hover: '#e6e1e3', border: '#e8e0e8', nextBackground: '#6442d6', nextText: '#ffffff', primary: '#6442d6' }
    };
    const colors = isDarkMode ? theme.dark : theme.light;

    if (!isLoaded || activeIndex === null || !currentQuestion) {
        return (
            <View style={[styles.container, { backgroundColor: colors.background }]}>
                <ActivityIndicator size="large" color={colors.primary} />
            </View>
        );
    }

    const cardState = cardStates[activeIndex];
    const isCorrectAnswer = isAnswered && selectedOption === currentQuestion.answer;
    const isWrongAnswer = isAnswered && selectedOption !== currentQuestion.answer;

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <View style={[styles.card, { backgroundColor: colors.surface }]}>
                <View style={{ position: 'absolute', top: 20, right: 20 }}>
                    <Text style={{ color: colors.onSurfaceVariant, fontSize: 12, fontWeight: '700' }}>
                        남은 카드: {queue.length}
                    </Text>
                </View>

                <View style={styles.questionArea}>
                    <Text style={[styles.wordText, { color: colors.onSurface }]}>{currentQuestion.word}</Text>
                    <Text style={[styles.progressText, { color: colors.onSurfaceVariant }]}>
                        {`EF: ${cardState.EF.toFixed(2)}  I: ${cardState.I}일\n`}
                        {cardState.lastReviewed
                            ? `지난 학습: ${Math.floor((Date.now() - cardState.lastReviewed) / (1000 * 60 * 60))}시간 전`
                            : '새 단어'}
                    </Text>
                </View>

                <View style={styles.optionsArea}>
                    {currentQuestion.options.map((option, index) => {
                        const isSelected = option === selectedOption;
                        const isCorrect = option === currentQuestion.answer;
                        const getTextColor = () => {
                            if (isAnswered && isCorrect) return colors.nextText;
                            return colors.onSurface;
                        };

                        return (
                            <View key={`${activeIndex}-${index}`} style={[styles.optionWrapper, isAnswered && isSelected && { borderColor: colors.primary, borderWidth: 2 }]}>
                                <Pressable
                                    style={({ pressed }) => [
                                        styles.optionButton,
                                        { backgroundColor: isAnswered && isCorrect ? colors.nextBackground : colors.hover, opacity: isAnswered && !isCorrect && !isSelected ? 0.5 : 1 },
                                        pressed && !isAnswered && { opacity: 0.8 }
                                    ]}
                                    onPress={() => handleOptionPress(option)}
                                >
                                    <View style={styles.optionContent}>
                                        <Text style={[styles.optionIndex, { color: getTextColor(), opacity: 0.6 }]}>{index + 1}.</Text>
                                        <Text style={[styles.optionText, { color: getTextColor() }, isAnswered && isCorrect && { fontWeight: '700' }]}>{option}</Text>
                                    </View>
                                </Pressable>
                            </View>
                        );
                    })}

                    {isCorrectAnswer ? (
                        <View style={styles.gradeRow}>
                            {(['hard', 'good', 'easy'] as const).map((g, i) => (
                                <Pressable key={g} style={({ pressed }) => [styles.gradeButton, { backgroundColor: colors.primary }, pressed && { opacity: 0.8 }]} onPress={() => handleGradePress(g)}>
                                    <Text style={[styles.gradeButtonText, { color: colors.nextText }]}> {g === 'hard' ? '어려움' : g === 'good' ? '보통' : '쉬움'}</Text>
                                </Pressable>
                            ))}
                        </View>
                    ) : (
                        <Pressable
                            style={({ pressed }) => [styles.inlineNextButton, { backgroundColor: isWrongAnswer ? colors.primary : colors.hover }, pressed && { opacity: 0.9 }]}
                            onPress={() => isAnswered ? nextQuestion() : handleOptionPress('')}
                        >
                            <Text style={[styles.inlineNextButtonText, { color: isWrongAnswer ? colors.nextText : colors.onSurfaceVariant }]}>
                                {!isAnswered ? "넘기기" : "다음"}
                            </Text>
                        </Pressable>
                    )}
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 20 },
    card: { width: '100%', maxWidth: 480, borderRadius: 32, padding: 24, paddingBottom: 32, position: 'relative' },
    progressText: { fontSize: 12, fontWeight: '700', textAlign: 'center', marginBottom: 10, lineHeight: 18 },
    questionArea: { height: 140, justifyContent: 'center', alignItems: 'center' },
    wordText: { fontSize: 44, fontWeight: '400', marginBottom: 8 },
    optionsArea: { gap: 6 },
    optionWrapper: { padding: 4, borderRadius: 22, borderWidth: 2, borderColor: 'transparent' },
    optionButton: { width: '100%', borderRadius: 16, paddingVertical: 16, paddingHorizontal: 20 },
    optionContent: { flexDirection: 'row', alignItems: 'center' },
    optionIndex: { fontSize: 16, marginRight: 12, fontWeight: '700' },
    optionText: { fontSize: 18, fontWeight: '500' },
    inlineNextButton: { marginTop: 12, height: 60, borderRadius: 20, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(150, 150, 150, 0.1)' },
    inlineNextButtonText: { fontSize: 16, fontWeight: '700' },
    gradeRow: { marginTop: 12, height: 60, flexDirection: 'row', gap: 8 },
    gradeButton: { flex: 1, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
    gradeButtonText: { fontSize: 15, fontWeight: '700' },
});