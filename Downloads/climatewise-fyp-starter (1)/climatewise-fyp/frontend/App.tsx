import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';

type Tab = 'Home' | 'Learn' | 'Data' | 'Quiz' | 'Challenge' | 'Profile' | 'LessonDetail';
type Lesson = {
  id: number;
  title: string;
  subtitle: string;
  estimated_minutes: number;
  category: string;
  summary: string;
  sections?: { heading: string; body: string }[];
};
type Question = { id: number; lesson_id: number; prompt: string; options: string[] };
type Progress = {
  learner_id: string;
  lessons_completed: number;
  total_lessons: number;
  lesson_completion_percent: number;
  quiz_attempts: number;
  correct_answers: number;
  quiz_accuracy_percent: number;
};
type QuizResult = {
  is_correct: boolean;
  correct_answer: string;
  explanation: string;
  learner_stats: { attempted: number; correct: number; accuracy_percent: number };
};

const API_BASE_URL = (process.env.EXPO_PUBLIC_API_URL || 'http://127.0.0.1:8000').replace(/\/$/, '');
const LEARNER_ID = 'demo-learner';
const COLORS = {
  background: '#F2FAF5',
  green: '#087F5B',
  greenDark: '#075541',
  greenLight: '#E0F5E8',
  blue: '#2276D2',
  blueLight: '#E6F2FF',
  purple: '#6D63D8',
  purpleLight: '#EFEDFF',
  orange: '#F59B23',
  orangeLight: '#FFF1DA',
  ink: '#173B32',
  muted: '#637A72',
  border: '#DCEBE2',
  white: '#FFFFFF',
  red: '#B42318',
};

const DEMO_LESSONS: Lesson[] = [
  { id: 1, title: 'What Is Climate Change?', subtitle: 'Start with the basics', estimated_minutes: 6, category: 'Basics', summary: 'Understand weather, climate and long-term changes.' },
  { id: 2, title: 'Greenhouse Gases', subtitle: "Earth's heat-trapping gases", estimated_minutes: 7, category: 'Science', summary: 'Learn how greenhouse gases warm our planet.' },
  { id: 3, title: 'Human Activities', subtitle: 'How our choices affect emissions', estimated_minutes: 8, category: 'Causes', summary: 'Explore energy, transport, industry and forests.' },
  { id: 4, title: 'Global Impacts', subtitle: 'Climate change and everyday life', estimated_minutes: 8, category: 'Impacts', summary: 'Discover effects on people, nature and communities.' },
  { id: 5, title: 'Solutions and Hope', subtitle: 'Ways to make a difference', estimated_minutes: 7, category: 'Action', summary: 'Explore how people and communities can respond.' },
];

async function apiRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
  });
  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`API ${response.status}: ${detail || response.statusText}`);
  }
  return response.json() as Promise<T>;
}

function App() {
  const [activeTab, setActiveTab] = useState<Tab>('Home');
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);
  const [progress, setProgress] = useState<Progress | null>(null);
  const [apiStatus, setApiStatus] = useState<'checking' | 'connected' | 'offline'>('checking');
  const [loadingLessons, setLoadingLessons] = useState(true);
  const [message, setMessage] = useState('');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [quizResult, setQuizResult] = useState<QuizResult | null>(null);
  const [quizLoading, setQuizLoading] = useState(false);
  const [quizError, setQuizError] = useState('');
  const [challengeChoice, setChallengeChoice] = useState<string | null>(null);

  const displayedLessons = lessons.length ? lessons : DEMO_LESSONS;
  const currentQuestion = questions[questionIndex];
  const completionPercent = progress?.lesson_completion_percent ?? 0;

  async function refreshData() {
    setLoadingLessons(true);
    try {
      const health = await apiRequest<{ status: string }>('/api/health');
      const [lessonData, progressData] = await Promise.all([
        apiRequest<Lesson[]>('/api/lessons'),
        apiRequest<Progress>(`/api/progress/${LEARNER_ID}`),
      ]);
      setLessons(lessonData);
      setProgress(progressData);
      setApiStatus(health.status === 'ok' ? 'connected' : 'offline');
    } catch (error) {
      setApiStatus('offline');
      setMessage(error instanceof Error ? error.message : 'Unable to connect to the API.');
    } finally {
      setLoadingLessons(false);
    }
  }

  useEffect(() => {
    void refreshData();
  }, []);

  useEffect(() => {
    if (activeTab !== 'Quiz') return;
    let cancelled = false;
    setQuizLoading(true);
    setQuizError('');
    setQuizResult(null);
    setSelectedOption(null);
    setQuestionIndex(0);
    apiRequest<Question[]>('/api/quiz/questions?lesson_id=1')
      .then((items) => {
        if (!cancelled) setQuestions(items);
      })
      .catch((error: unknown) => {
        if (!cancelled) setQuizError(error instanceof Error ? error.message : 'Could not load questions.');
      })
      .finally(() => {
        if (!cancelled) setQuizLoading(false);
      });
    return () => { cancelled = true; };
  }, [activeTab]);

  async function openLesson(lesson: Lesson) {
    setSelectedLesson(lesson);
    setMessage('');
    try {
      const fullLesson = await apiRequest<Lesson>(`/api/lessons/${lesson.id}`);
      setSelectedLesson(fullLesson);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Could not load lesson details.');
    }
    setActiveTab('LessonDetail');
  }

  async function markLessonComplete() {
    if (!selectedLesson || apiStatus !== 'connected') {
      setMessage('Start the backend to save lesson progress.');
      return;
    }
    try {
      await apiRequest(`/api/lessons/${selectedLesson.id}/complete`, {
        method: 'POST',
        body: JSON.stringify({ learner_id: LEARNER_ID }),
      });
      setMessage('Lesson completed and saved to the database.');
      await refreshData();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Could not save progress.');
    }
  }

  async function submitAnswer() {
    if (!currentQuestion || selectedOption === null) return;
    setQuizLoading(true);
    setQuizError('');
    try {
      const result = await apiRequest<QuizResult>('/api/quiz/submit', {
        method: 'POST',
        body: JSON.stringify({ question_id: currentQuestion.id, selected_option: selectedOption, learner_id: LEARNER_ID }),
      });
      setQuizResult(result);
      await refreshData();
    } catch (error) {
      setQuizError(error instanceof Error ? error.message : 'Could not submit your answer.');
    } finally {
      setQuizLoading(false);
    }
  }

  function nextQuestion() {
    if (questionIndex < questions.length - 1) {
      setQuestionIndex((index) => index + 1);
      setSelectedOption(null);
      setQuizResult(null);
    } else {
      setActiveTab('Profile');
    }
  }

  const navItems: { label: Exclude<Tab, 'LessonDetail'>; icon: string }[] = [
    { label: 'Home', icon: '⌂' }, { label: 'Learn', icon: '▤' }, { label: 'Data', icon: '▥' },
    { label: 'Quiz', icon: '☷' }, { label: 'Challenge', icon: '✦' }, { label: 'Profile', icon: '●' },
  ];

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />
      <View style={styles.appShell}>
        <View style={styles.topBar}>
          <Pressable style={styles.brandRow} onPress={() => setActiveTab('Home')}>
            <View style={styles.logoMark}><Text style={styles.logoEmoji}>🌍</Text></View>
            <View>
              <Text style={styles.brandText}>Climate<Text style={{ color: COLORS.green }}>Wise</Text></Text>
              <Text style={styles.brandTagline}>Learn · Understand · Take Action</Text>
            </View>
          </Pressable>
          <View style={[styles.statusPill, apiStatus === 'connected' ? styles.statusGood : apiStatus === 'offline' ? styles.statusBad : styles.statusWaiting]}>
            <View style={[styles.statusDot, apiStatus === 'connected' ? { backgroundColor: COLORS.green } : apiStatus === 'offline' ? { backgroundColor: COLORS.red } : { backgroundColor: COLORS.orange }]} />
            <Text style={styles.statusText}>{apiStatus === 'connected' ? 'API connected' : apiStatus === 'offline' ? 'API offline' : 'Connecting'}</Text>
          </View>
        </View>

        <ScrollView style={styles.contentScroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          {activeTab === 'Home' && (
            <>
              <Text style={styles.eyebrow}>YOUR CLIMATE LEARNING JOURNEY</Text>
              <Text style={styles.pageTitle}>Small steps. Big change.</Text>
              <Text style={styles.pageIntro}>Discover how our changing climate affects the world — and what we can do about it.</Text>
              <View style={styles.heroCard}>
                <View style={styles.heroCopy}>
                  <Text style={styles.heroKicker}>WELCOME TO CLIMATEWISE</Text>
                  <Text style={styles.heroTitle}>A healthier planet starts with understanding.</Text>
                  <Text style={styles.heroBody}>Learn the science, explore the evidence, and discover practical actions.</Text>
                  <PrimaryButton label="Continue learning  →" onPress={() => openLesson(displayedLessons[0])} />
                </View>
                <View style={styles.earthIllustration}><Text style={styles.earthEmoji}>🌎</Text><Text style={styles.leafEmoji}>🌱</Text></View>
              </View>
              <View style={styles.sectionHeader}>
                <View><Text style={styles.sectionTitle}>Your learning progress</Text><Text style={styles.sectionSubtitle}>Every lesson is a step forward.</Text></View>
                <Text style={styles.percentText}>{completionPercent}%</Text>
              </View>
              <View style={styles.progressCard}>
                <View style={styles.progressLine}><View style={[styles.progressFill, { width: `${completionPercent}%` }]} /></View>
                <Text style={styles.smallMuted}>{progress ? `${progress.lessons_completed} of ${progress.total_lessons} lessons completed` : 'Start the backend to save your progress'}</Text>
                <View style={styles.statsRow}>
                  <MiniStat value={String(progress?.quiz_attempts ?? 0)} label="Quiz attempts" icon="🧠" />
                  <MiniStat value={`${progress?.quiz_accuracy_percent ?? 0}%`} label="Quiz accuracy" icon="🎯" />
                </View>
              </View>
              <Text style={styles.sectionTitle}>Explore ClimateWise</Text>
              <View style={styles.featureGrid}>
                <FeatureCard icon="📘" title="Learn" subtitle="Stories and short lessons" color={COLORS.greenLight} onPress={() => setActiveTab('Learn')} />
                <FeatureCard icon="📊" title="Explore data" subtitle="Understand climate evidence" color={COLORS.blueLight} onPress={() => setActiveTab('Data')} />
                <FeatureCard icon="🧩" title="Take a quiz" subtitle="Check what you know" color={COLORS.purpleLight} onPress={() => setActiveTab('Quiz')} />
                <FeatureCard icon="🎮" title="Climate challenge" subtitle="Make choices in a scenario" color={COLORS.orangeLight} onPress={() => setActiveTab('Challenge')} />
              </View>
              <View style={styles.actionStrip}>
                <Text style={styles.actionIcon}>🌿</Text>
                <View style={{ flex: 1 }}><Text style={styles.actionTitle}>What can I do?</Text><Text style={styles.actionBody}>Find practical ways to make a difference.</Text></View>
                <Pressable onPress={() => setActiveTab('Challenge')}><Text style={styles.arrowText}>→</Text></Pressable>
              </View>
              {message ? <InlineMessage text={message} /> : null}
            </>
          )}

          {activeTab === 'Learn' && (
            <>
              <Text style={styles.eyebrow}>LEARN AT YOUR OWN PACE</Text>
              <Text style={styles.pageTitle}>Climate lessons</Text>
              <Text style={styles.pageIntro}>Start with the basics, then explore causes, impacts and solutions.</Text>
              {loadingLessons && lessons.length === 0 ? <ActivityIndicator color={COLORS.green} style={{ margin: 24 }} /> : null}
              {displayedLessons.map((lesson, index) => (
                <Pressable key={lesson.id} onPress={() => void openLesson(lesson)} style={({ pressed }) => [styles.lessonCard, pressed && styles.pressed]}>
                  <View style={[styles.lessonNumber, { backgroundColor: [COLORS.greenLight, COLORS.blueLight, COLORS.orangeLight, COLORS.purpleLight, COLORS.greenLight][index % 5] }]}><Text style={styles.lessonNumberText}>{String(index + 1).padStart(2, '0')}</Text></View>
                  <View style={styles.lessonInfo}><View style={styles.lessonMetaRow}><Text style={styles.categoryChip}>{lesson.category}</Text><Text style={styles.timeText}>{lesson.estimated_minutes} min</Text></View><Text style={styles.lessonTitle}>{lesson.title}</Text><Text style={styles.lessonSubtitle}>{lesson.summary}</Text></View>
                  <Text style={styles.chevron}>›</Text>
                </Pressable>
              ))}
              {message ? <InlineMessage text={message} /> : null}
            </>
          )}

          {activeTab === 'LessonDetail' && selectedLesson && (
            <>
              <Pressable onPress={() => setActiveTab('Learn')} style={styles.backButton}><Text style={styles.backButtonText}>← All lessons</Text></Pressable>
              <Text style={styles.eyebrow}>LESSON {selectedLesson.id} · {selectedLesson.estimated_minutes} MINUTES</Text>
              <Text style={styles.pageTitle}>{selectedLesson.title}</Text>
              <Text style={styles.pageIntro}>{selectedLesson.summary}</Text>
              {(selectedLesson.sections || [{ heading: selectedLesson.subtitle, body: selectedLesson.summary }]).map((section, index) => (
                <View key={`${selectedLesson.id}-${index}`} style={styles.lessonSectionCard}>
                  <View style={styles.lessonSectionIndex}><Text style={styles.lessonSectionIndexText}>{index + 1}</Text></View>
                  <Text style={styles.lessonSectionHeading}>{section.heading}</Text>
                  <Text style={styles.bodyText}>{section.body}</Text>
                </View>
              ))}
              <View style={styles.infoNote}><Text style={styles.infoNoteIcon}>💡</Text><Text style={styles.infoNoteText}>Remember: climate change is a long-term pattern, not just one unusual day of weather.</Text></View>
              <PrimaryButton label="Mark lesson complete ✓" onPress={() => void markLessonComplete()} />
              <SecondaryButton label="Try the climate quiz" onPress={() => setActiveTab('Quiz')} />
              {message ? <InlineMessage text={message} /> : null}
            </>
          )}

          {activeTab === 'Data' && (
            <>
              <Text style={styles.eyebrow}>EVIDENCE, NOT GUESSWORK</Text>
              <Text style={styles.pageTitle}>Explore climate data</Text>
              <Text style={styles.pageIntro}>Graphs can help us spot long-term patterns that are hard to see from a single day.</Text>
              <View style={styles.dataIntroCard}><Text style={styles.dataIntroEmoji}>📈</Text><Text style={styles.cardTitle}>What will this section show?</Text><Text style={styles.bodyText}>We will add trusted, cited datasets and interactive charts in the next build milestone. The first version will focus on global temperature, atmospheric CO₂ and sea-level indicators.</Text></View>
              <View style={styles.dataMetricCard}><View style={styles.metricIconBlue}><Text>🌡️</Text></View><View style={{ flex: 1 }}><Text style={styles.cardTitle}>Global temperature</Text><Text style={styles.bodyText}>Explore how average temperatures change over decades.</Text></View><Text style={styles.chevron}>›</Text></View>
              <View style={styles.dataMetricCard}><View style={styles.metricIconGreen}><Text>💨</Text></View><View style={{ flex: 1 }}><Text style={styles.cardTitle}>Atmospheric CO₂</Text><Text style={styles.bodyText}>Learn why greenhouse-gas concentration matters.</Text></View><Text style={styles.chevron}>›</Text></View>
              <View style={styles.dataMetricCard}><View style={styles.metricIconOrange}><Text>🌊</Text></View><View style={{ flex: 1 }}><Text style={styles.cardTitle}>Sea level</Text><Text style={styles.bodyText}>See how oceans respond to a warming climate.</Text></View><Text style={styles.chevron}>›</Text></View>
              <View style={styles.infoNote}><Text style={styles.infoNoteIcon}>🔎</Text><Text style={styles.infoNoteText}>We will use a documented data source and show its name, units, date range and limitations beside each chart.</Text></View>
            </>
          )}

          {activeTab === 'Quiz' && (
            <>
              <Text style={styles.eyebrow}>CHECK YOUR UNDERSTANDING</Text>
              <Text style={styles.pageTitle}>Climate quiz</Text>
              <Text style={styles.pageIntro}>Your answer is checked by the backend and the attempt is saved in SQLite.</Text>
              {quizLoading && !currentQuestion ? <ActivityIndicator color={COLORS.green} style={{ margin: 28 }} /> : null}
              {quizError ? <InlineMessage text={quizError} /> : null}
              {currentQuestion ? <>
                <View style={styles.quizMetaRow}><Text style={styles.categoryChip}>Lesson 1 · Basics</Text><Text style={styles.timeText}>Question {questionIndex + 1} of {questions.length}</Text></View>
                <View style={styles.quizCard}>
                  <Text style={styles.questionText}>{currentQuestion.prompt}</Text>
                  {currentQuestion.options.map((option, index) => {
                    const isSelected = selectedOption === index;
                    const isCorrectOption = quizResult?.correct_answer === option;
                    return <Pressable key={`${currentQuestion.id}-${index}`} disabled={!!quizResult} onPress={() => setSelectedOption(index)} style={[styles.answerOption, isSelected && !quizResult && styles.answerSelected, quizResult && isCorrectOption && styles.answerCorrect, quizResult && isSelected && !quizResult.is_correct && styles.answerWrong]}>
                      <View style={[styles.optionLetter, isSelected && !quizResult && styles.optionLetterSelected, quizResult && isCorrectOption && styles.optionLetterCorrect]}><Text style={[styles.optionLetterText, (isSelected || isCorrectOption) && { color: COLORS.white }]}>{String.fromCharCode(65 + index)}</Text></View>
                      <Text style={styles.optionText}>{option}</Text>
                    </Pressable>;
                  })}
                  {quizResult ? <View style={[styles.feedbackBox, quizResult.is_correct ? styles.feedbackGood : styles.feedbackTry]}><Text style={styles.feedbackTitle}>{quizResult.is_correct ? 'Correct — well done!' : 'Not quite — keep learning.'}</Text><Text style={styles.bodyText}>{quizResult.explanation}</Text><Text style={styles.smallMuted}>Your overall quiz accuracy: {quizResult.learner_stats.accuracy_percent}%</Text></View> : null}
                  {!quizResult ? <PrimaryButton label={quizLoading ? 'Checking answer…' : 'Check answer'} disabled={selectedOption === null || quizLoading} onPress={() => void submitAnswer()} /> : <PrimaryButton label={questionIndex < questions.length - 1 ? 'Next question →' : 'Finish quiz →'} onPress={nextQuestion} />}
                </View>
              </> : !quizLoading && !quizError ? <View style={styles.emptyCard}><Text style={styles.cardTitle}>No quiz questions yet</Text><Text style={styles.bodyText}>Questions will appear here when the backend is running.</Text></View> : null}
            </>
          )}

          {activeTab === 'Challenge' && (
            <>
              <Text style={styles.eyebrow}>LEARN BY MAKING CHOICES</Text>
              <Text style={styles.pageTitle}>Climate challenge</Text>
              <Text style={styles.pageIntro}>Try a small scenario and think about the trade-offs behind everyday choices.</Text>
              <View style={styles.challengeBanner}><Text style={styles.challengeEmoji}>🚉</Text><Text style={styles.challengeTitle}>Plan a weekend trip</Text><Text style={styles.challengeBody}>Your friends want to travel to a nearby city. Which option would generally produce fewer transport emissions per passenger for a similar journey?</Text></View>
              {[
                { id: 'car', icon: '🚗', title: 'Drive alone', subtitle: 'Convenient, but fuel use is concentrated in one passenger.' },
                { id: 'train', icon: '🚆', title: 'Take a train', subtitle: 'Often lower emissions per passenger on many routes.' },
                { id: 'flight', icon: '✈️', title: 'Take a short flight', subtitle: 'Aviation can have a high climate impact per passenger.' },
                { id: 'bus', icon: '🚌', title: 'Take a bus', subtitle: 'Sharing a vehicle can reduce emissions per passenger.' },
              ].map((item) => <Pressable key={item.id} onPress={() => setChallengeChoice(item.id)} style={[styles.choiceCard, challengeChoice === item.id && styles.choiceSelected]}><Text style={styles.choiceEmoji}>{item.icon}</Text><View style={{ flex: 1 }}><Text style={styles.cardTitle}>{item.title}</Text><Text style={styles.bodyText}>{item.subtitle}</Text></View><View style={[styles.radioOuter, challengeChoice === item.id && styles.radioOuterSelected]}>{challengeChoice === item.id ? <View style={styles.radioInner} /> : null}</View></Pressable>)}
              {challengeChoice ? <View style={styles.infoNote}><Text style={styles.infoNoteIcon}>🌱</Text><Text style={styles.infoNoteText}>{challengeChoice === 'train' || challengeChoice === 'bus' ? 'Good choice to consider! Actual emissions depend on the route, vehicle, occupancy and energy source.' : 'Consider comparing shared transport options. The lowest-emission choice depends on distance, vehicle occupancy and energy source.'}</Text></View> : null}
              <SecondaryButton label="Reset challenge" onPress={() => setChallengeChoice(null)} />
            </>
          )}

          {activeTab === 'Profile' && (
            <>
              <Text style={styles.eyebrow}>YOUR JOURNEY SO FAR</Text>
              <Text style={styles.pageTitle}>Learning profile</Text>
              <View style={styles.profileCard}><View style={styles.avatar}><Text style={{ fontSize: 34 }}>🧑‍🎓</Text></View><View style={{ flex: 1 }}><Text style={styles.cardTitle}>Climate explorer</Text><Text style={styles.bodyText}>Demo learner · progress stored locally in the project database</Text></View></View>
              <View style={styles.statsRow}><MiniStat value={`${progress?.lessons_completed ?? 0}/${progress?.total_lessons ?? 5}`} label="Lessons completed" icon="📚" /><MiniStat value={String(progress?.quiz_attempts ?? 0)} label="Answers submitted" icon="🧠" /></View>
              <View style={styles.profileMetric}><Text style={styles.profileMetricLabel}>Lesson completion</Text><Text style={styles.profileMetricValue}>{progress?.lesson_completion_percent ?? 0}%</Text><View style={styles.progressLine}><View style={[styles.progressFill, { width: `${completionPercent}%` }]} /></View></View>
              <View style={styles.profileMetric}><Text style={styles.profileMetricLabel}>Quiz accuracy</Text><Text style={styles.profileMetricValue}>{progress?.quiz_accuracy_percent ?? 0}%</Text><View style={styles.progressLine}><View style={[styles.progressFillBlue, { width: `${progress?.quiz_accuracy_percent ?? 0}%` }]} /></View></View>
              <SecondaryButton label="Refresh progress from database" onPress={() => void refreshData()} />
              {message ? <InlineMessage text={message} /> : null}
            </>
          )}
          <Text style={styles.footerText}>CLIMATEWISE · Prototype v0.1 · Learn · Understand · Take Action</Text>
        </ScrollView>

        <View style={styles.bottomNav}>
          {navItems.map((item) => {
            const selected = activeTab === item.label || (activeTab === 'LessonDetail' && item.label === 'Learn');
            return <Pressable key={item.label} onPress={() => setActiveTab(item.label)} style={styles.navItem}>
              <View style={[styles.navIconWrap, selected && styles.navIconWrapSelected]}><Text style={[styles.navIcon, selected && styles.navIconSelected]}>{item.icon}</Text></View>
              <Text style={[styles.navLabel, selected && styles.navLabelSelected]}>{item.label}</Text>
            </Pressable>;
          })}
        </View>
      </View>
    </SafeAreaView>
  );
}

function PrimaryButton({ label, onPress, disabled = false }: { label: string; onPress: () => void; disabled?: boolean }) {
  return <Pressable accessibilityRole="button" disabled={disabled} onPress={onPress} style={({ pressed }) => [styles.primaryButton, disabled && styles.buttonDisabled, pressed && !disabled && styles.pressed]}><Text style={styles.primaryButtonText}>{label}</Text></Pressable>;
}
function SecondaryButton({ label, onPress }: { label: string; onPress: () => void }) {
  return <Pressable accessibilityRole="button" onPress={onPress} style={({ pressed }) => [styles.secondaryButton, pressed && styles.pressed]}><Text style={styles.secondaryButtonText}>{label}</Text></Pressable>;
}
function FeatureCard({ icon, title, subtitle, color, onPress }: { icon: string; title: string; subtitle: string; color: string; onPress: () => void }) {
  return <Pressable onPress={onPress} style={({ pressed }) => [styles.featureCard, { backgroundColor: color }, pressed && styles.pressed]}><Text style={styles.featureIcon}>{icon}</Text><Text style={styles.featureTitle}>{title}</Text><Text style={styles.featureSubtitle}>{subtitle}</Text><Text style={styles.featureArrow}>→</Text></Pressable>;
}
function MiniStat({ value, label, icon }: { value: string; label: string; icon: string }) {
  return <View style={styles.miniStat}><Text style={styles.miniStatIcon}>{icon}</Text><Text style={styles.miniStatValue}>{value}</Text><Text style={styles.miniStatLabel}>{label}</Text></View>;
}
function InlineMessage({ text }: { text: string }) {
  return <View style={styles.inlineMessage}><Text style={styles.inlineMessageText}>{text}</Text></View>;
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLORS.background },
  appShell: { flex: 1, width: '100%', maxWidth: 760, alignSelf: 'center' },
  topBar: { paddingHorizontal: 18, paddingVertical: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: COLORS.border, backgroundColor: COLORS.white },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: 9 },
  logoMark: { height: 42, width: 42, borderRadius: 14, backgroundColor: COLORS.greenLight, alignItems: 'center', justifyContent: 'center' },
  logoEmoji: { fontSize: 25 }, brandText: { fontSize: 21, fontWeight: '800', color: COLORS.ink, letterSpacing: -0.5 }, brandTagline: { fontSize: 10, color: COLORS.muted, marginTop: 1 },
  statusPill: { flexDirection: 'row', alignItems: 'center', borderRadius: 20, paddingHorizontal: 9, paddingVertical: 6, gap: 5 }, statusGood: { backgroundColor: COLORS.greenLight }, statusBad: { backgroundColor: '#FDE9E7' }, statusWaiting: { backgroundColor: COLORS.orangeLight }, statusDot: { height: 7, width: 7, borderRadius: 5 }, statusText: { fontSize: 10, fontWeight: '700', color: COLORS.ink },
  contentScroll: { flex: 1 }, content: { padding: 18, paddingBottom: 28, gap: 12 },
  eyebrow: { color: COLORS.green, fontSize: 10, letterSpacing: 1.3, fontWeight: '800', marginTop: 4 }, pageTitle: { fontSize: 28, fontWeight: '800', color: COLORS.ink, letterSpacing: -0.6, lineHeight: 33 }, pageIntro: { color: COLORS.muted, fontSize: 14, lineHeight: 21, marginBottom: 4 },
  heroCard: { overflow: 'hidden', minHeight: 216, borderRadius: 22, padding: 19, backgroundColor: '#DDF5E6', flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#C7EBD5', marginTop: 2 }, heroCopy: { flex: 1, gap: 8, zIndex: 1 }, heroKicker: { fontSize: 9, letterSpacing: 1, fontWeight: '800', color: COLORS.green }, heroTitle: { fontSize: 22, lineHeight: 26, color: COLORS.ink, fontWeight: '800', maxWidth: 330 }, heroBody: { color: '#42665A', fontSize: 12, lineHeight: 17, maxWidth: 330, marginBottom: 2 }, earthIllustration: { width: 78, alignItems: 'center', justifyContent: 'center', marginLeft: -4 }, earthEmoji: { fontSize: 67 }, leafEmoji: { fontSize: 25, marginTop: -6 },
  primaryButton: { backgroundColor: COLORS.green, minHeight: 45, paddingHorizontal: 15, paddingVertical: 12, borderRadius: 13, justifyContent: 'center', alignItems: 'center', marginTop: 3 }, primaryButtonText: { color: COLORS.white, fontWeight: '800', fontSize: 13 }, buttonDisabled: { opacity: 0.45 }, secondaryButton: { borderWidth: 1, borderColor: COLORS.green, minHeight: 44, borderRadius: 13, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.white, marginTop: 8, paddingHorizontal: 14 }, secondaryButtonText: { color: COLORS.green, fontSize: 13, fontWeight: '800' }, pressed: { opacity: 0.82, transform: [{ scale: 0.99 }] },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 5 }, sectionTitle: { color: COLORS.ink, fontSize: 17, fontWeight: '800' }, sectionSubtitle: { color: COLORS.muted, fontSize: 12, marginTop: 2 }, percentText: { fontSize: 22, fontWeight: '800', color: COLORS.green }, progressCard: { backgroundColor: COLORS.white, borderRadius: 18, padding: 15, borderWidth: 1, borderColor: COLORS.border, gap: 9 }, progressLine: { backgroundColor: '#E5EFE9', height: 8, borderRadius: 10, overflow: 'hidden' }, progressFill: { backgroundColor: COLORS.green, height: '100%', borderRadius: 10 }, progressFillBlue: { backgroundColor: COLORS.blue, height: '100%', borderRadius: 10 }, smallMuted: { color: COLORS.muted, fontSize: 11, lineHeight: 16 }, statsRow: { flexDirection: 'row', gap: 10, marginTop: 1 }, miniStat: { flex: 1, padding: 12, backgroundColor: '#F8FCF9', borderRadius: 14, alignItems: 'center', borderWidth: 1, borderColor: COLORS.border }, miniStatIcon: { fontSize: 18 }, miniStatValue: { color: COLORS.ink, fontWeight: '800', fontSize: 19, marginTop: 4 }, miniStatLabel: { color: COLORS.muted, fontSize: 10, textAlign: 'center', marginTop: 2 },
  featureGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 }, featureCard: { width: '48%', flexGrow: 1, minHeight: 133, borderRadius: 17, padding: 13, borderWidth: 1, borderColor: '#FFFFFF', gap: 4 }, featureIcon: { fontSize: 23 }, featureTitle: { color: COLORS.ink, fontSize: 14, fontWeight: '800' }, featureSubtitle: { color: '#506C63', fontSize: 11, lineHeight: 15, maxWidth: 150 }, featureArrow: { position: 'absolute', bottom: 10, right: 12, fontSize: 18, fontWeight: '700', color: COLORS.green },
  actionStrip: { marginTop: 2, padding: 13, borderRadius: 15, flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: COLORS.green, borderWidth: 1, borderColor: COLORS.green }, actionIcon: { fontSize: 24 }, actionTitle: { color: COLORS.white, fontWeight: '800', fontSize: 14 }, actionBody: { color: '#E4FFF0', fontSize: 11, marginTop: 2 }, arrowText: { fontSize: 25, color: COLORS.white, paddingHorizontal: 4 },
  lessonCard: { backgroundColor: COLORS.white, borderRadius: 17, padding: 12, borderWidth: 1, borderColor: COLORS.border, flexDirection: 'row', alignItems: 'center', gap: 12 }, lessonNumber: { height: 49, width: 49, borderRadius: 15, alignItems: 'center', justifyContent: 'center' }, lessonNumberText: { color: COLORS.greenDark, fontWeight: '800', fontSize: 15 }, lessonInfo: { flex: 1, gap: 4 }, lessonMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 8 }, categoryChip: { color: COLORS.green, fontSize: 10, fontWeight: '800', backgroundColor: COLORS.greenLight, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 7, overflow: 'hidden' }, timeText: { color: COLORS.muted, fontSize: 10 }, lessonTitle: { color: COLORS.ink, fontSize: 14, fontWeight: '800' }, lessonSubtitle: { color: COLORS.muted, fontSize: 11, lineHeight: 15 }, chevron: { color: COLORS.green, fontSize: 25, paddingHorizontal: 2 },
  backButton: { alignSelf: 'flex-start', paddingVertical: 5, paddingHorizontal: 2 }, backButtonText: { color: COLORS.green, fontSize: 13, fontWeight: '800' }, lessonSectionCard: { padding: 16, borderRadius: 17, backgroundColor: COLORS.white, borderColor: COLORS.border, borderWidth: 1, gap: 9 }, lessonSectionIndex: { height: 28, width: 28, borderRadius: 9, backgroundColor: COLORS.greenLight, alignItems: 'center', justifyContent: 'center' }, lessonSectionIndexText: { color: COLORS.green, fontWeight: '800' }, lessonSectionHeading: { color: COLORS.ink, fontWeight: '800', fontSize: 16 }, bodyText: { color: COLORS.muted, fontSize: 13, lineHeight: 20 }, infoNote: { flexDirection: 'row', gap: 9, padding: 13, backgroundColor: COLORS.blueLight, borderRadius: 14, borderWidth: 1, borderColor: '#D2E6FF' }, infoNoteIcon: { fontSize: 19 }, infoNoteText: { flex: 1, color: '#25517C', fontSize: 12, lineHeight: 18 }, inlineMessage: { padding: 12, borderRadius: 12, backgroundColor: '#FFF2E2', borderWidth: 1, borderColor: '#FFE0B2' }, inlineMessageText: { color: '#805017', fontSize: 12, lineHeight: 17 },
  dataIntroCard: { padding: 17, backgroundColor: COLORS.white, borderWidth: 1, borderColor: COLORS.border, borderRadius: 17, gap: 8 }, dataIntroEmoji: { fontSize: 31 }, cardTitle: { color: COLORS.ink, fontWeight: '800', fontSize: 14 }, dataMetricCard: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: COLORS.white, borderWidth: 1, borderColor: COLORS.border, borderRadius: 16, padding: 13 }, metricIconBlue: { height: 44, width: 44, borderRadius: 13, backgroundColor: COLORS.blueLight, alignItems: 'center', justifyContent: 'center' }, metricIconGreen: { height: 44, width: 44, borderRadius: 13, backgroundColor: COLORS.greenLight, alignItems: 'center', justifyContent: 'center' }, metricIconOrange: { height: 44, width: 44, borderRadius: 13, backgroundColor: COLORS.orangeLight, alignItems: 'center', justifyContent: 'center' },
  quizMetaRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, quizCard: { backgroundColor: COLORS.white, borderRadius: 19, padding: 15, gap: 10, borderWidth: 1, borderColor: COLORS.border }, questionText: { color: COLORS.ink, fontSize: 19, lineHeight: 25, fontWeight: '800', marginBottom: 3 }, answerOption: { flexDirection: 'row', alignItems: 'center', gap: 10, borderWidth: 1, borderColor: COLORS.border, borderRadius: 13, padding: 11, minHeight: 54, backgroundColor: '#FCFEFD' }, answerSelected: { borderColor: COLORS.green, backgroundColor: COLORS.greenLight }, answerCorrect: { borderColor: COLORS.green, backgroundColor: '#DDF7E6' }, answerWrong: { borderColor: '#EBA7A1', backgroundColor: '#FFF0EF' }, optionLetter: { height: 28, width: 28, borderRadius: 10, borderWidth: 1, borderColor: '#BDD8C9', alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.white }, optionLetterSelected: { backgroundColor: COLORS.green, borderColor: COLORS.green }, optionLetterCorrect: { backgroundColor: COLORS.green, borderColor: COLORS.green }, optionLetterText: { fontSize: 12, color: COLORS.green, fontWeight: '800' }, optionText: { flex: 1, color: COLORS.ink, fontSize: 12, lineHeight: 17 }, feedbackBox: { padding: 13, borderRadius: 13, gap: 5 }, feedbackGood: { backgroundColor: COLORS.greenLight }, feedbackTry: { backgroundColor: COLORS.orangeLight }, feedbackTitle: { color: COLORS.ink, fontSize: 14, fontWeight: '800' }, emptyCard: { backgroundColor: COLORS.white, borderRadius: 16, padding: 20, gap: 9 },
  challengeBanner: { backgroundColor: '#FFF0D7', borderColor: '#FFE1AF', borderWidth: 1, borderRadius: 18, padding: 17, gap: 7 }, challengeEmoji: { fontSize: 36 }, challengeTitle: { fontSize: 20, color: COLORS.ink, fontWeight: '800' }, challengeBody: { color: '#715B3F', fontSize: 13, lineHeight: 19 }, choiceCard: { flexDirection: 'row', alignItems: 'center', gap: 11, padding: 12, backgroundColor: COLORS.white, borderWidth: 1, borderColor: COLORS.border, borderRadius: 15 }, choiceSelected: { borderColor: COLORS.green, backgroundColor: COLORS.greenLight }, choiceEmoji: { fontSize: 25, width: 37, textAlign: 'center' }, radioOuter: { width: 20, height: 20, borderRadius: 10, borderWidth: 1.5, borderColor: '#A3BFB2', alignItems: 'center', justifyContent: 'center' }, radioOuterSelected: { borderColor: COLORS.green }, radioInner: { width: 10, height: 10, borderRadius: 5, backgroundColor: COLORS.green },
  profileCard: { backgroundColor: COLORS.white, borderRadius: 18, padding: 15, borderWidth: 1, borderColor: COLORS.border, flexDirection: 'row', alignItems: 'center', gap: 12 }, avatar: { width: 62, height: 62, borderRadius: 20, backgroundColor: COLORS.greenLight, alignItems: 'center', justifyContent: 'center' }, profileMetric: { padding: 15, backgroundColor: COLORS.white, borderRadius: 15, borderWidth: 1, borderColor: COLORS.border, gap: 8 }, profileMetricLabel: { color: COLORS.muted, fontSize: 12 }, profileMetricValue: { color: COLORS.ink, fontSize: 21, fontWeight: '800' },
  footerText: { textAlign: 'center', color: '#8CA198', fontSize: 9, letterSpacing: 0.7, marginTop: 10, marginBottom: 3 }, bottomNav: { flexDirection: 'row', justifyContent: 'space-around', backgroundColor: COLORS.white, borderTopColor: COLORS.border, borderTopWidth: 1, paddingTop: 7, paddingBottom: 5, paddingHorizontal: 4 }, navItem: { alignItems: 'center', gap: 2, flex: 1 }, navIconWrap: { minWidth: 31, height: 26, borderRadius: 9, alignItems: 'center', justifyContent: 'center' }, navIconWrapSelected: { backgroundColor: COLORS.greenLight }, navIcon: { fontSize: 20, color: '#829A90', fontWeight: '700' }, navIconSelected: { color: COLORS.green }, navLabel: { fontSize: 9, color: '#7D9389' }, navLabelSelected: { color: COLORS.green, fontWeight: '800' },
});

export default App;
