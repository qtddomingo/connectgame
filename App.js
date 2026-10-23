import React, { useEffect, useRef, useState } from 'react';
import { Modal, Pressable, ScrollView, StatusBar, StyleSheet, Text, View } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import Board from './src/components/Board';
import { generateBoard } from './src/board';
import { TRIE, WORDS, getInfo } from './src/words';
import { colors } from './src/theme';

const ROUND_SECONDS = 120;
const POINTS = { 3: 1, 4: 2, 5: 4, 6: 7 };
const pointsFor = (len) => POINTS[len] ?? 11;

const newRound = () => generateBoard(WORDS, TRIE);

export default function App() {
  const [round, setRound] = useState(newRound);
  const [found, setFound] = useState([]);
  const [score, setScore] = useState(0);
  const [time, setTime] = useState(ROUND_SECONDS);
  const [preview, setPreview] = useState('');
  const [notice, setNotice] = useState(null);
  const over = time <= 0;
  const noticeTimer = useRef(null);

  useEffect(() => {
    if (over) return undefined;
    const id = setInterval(() => setTime((t) => t - 1), 1000);
    return () => clearInterval(id);
  }, [over]);

  const say = (n) => {
    setNotice(n);
    clearTimeout(noticeTimer.current);
    noticeTimer.current = setTimeout(() => setNotice(null), 2800);
  };

  const submit = (word) => {
    if (word.length < 3) return say({ kind: 'bad', title: 'Masyadong maikli', detail: 'Hindi bababa sa tatlong titik.' });
    if (found.includes(word)) return say({ kind: 'bad', title: 'Nahanap na', detail: getInfo(word)?.word });
    if (!round.solutions.has(word)) return say({ kind: 'bad', title: 'Wala sa listahan', detail: word.toLowerCase() });
    const info = getInfo(word);
    setFound((f) => [...f, word]);
    setScore((s) => s + pointsFor(word.length));
    say({ kind: 'good', title: `${info.word}  +${pointsFor(word.length)}`, detail: info.definition || info.english });
  };

  const restart = () => {
    setRound(newRound());
    setFound([]);
    setScore(0);
    setTime(ROUND_SECONDS);
    setPreview('');
    setNotice(null);
  };

  const previewValid = round.solutions.has(preview) && !found.includes(preview);
  const missed = [...round.solutions].filter((w) => !found.includes(w)).sort((a, b) => b.length - a.length);

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.screen}>
        <StatusBar barStyle="light-content" />
        <View style={styles.header}>
          <View>
            <Text style={styles.label}>Iskor</Text>
            <Text style={styles.big}>{score}</Text>
          </View>
          <View style={styles.center}>
            <Text style={styles.label}>Nahanap</Text>
            <Text style={styles.big}>
              {found.length}/{round.solutions.size}
            </Text>
          </View>
          <View style={styles.right}>
            <Text style={styles.label}>Oras</Text>
            <Text style={[styles.big, time <= 10 && { color: colors.bad }]}>{Math.max(time, 0)}</Text>
          </View>
        </View>

        <View style={styles.previewRow}>
          <Text style={[styles.preview, previewValid && { color: colors.good }]}>{preview || ' '}</Text>
        </View>

        <Board grid={round.grid} onChange={setPreview} onSubmit={submit} disabled={over} />

        <View style={styles.noticeBox}>
          {notice && (
            <>
              <Text style={[styles.noticeTitle, { color: notice.kind === 'good' ? colors.good : colors.bad }]}>
                {notice.title}
              </Text>
              {!!notice.detail && <Text style={styles.noticeDetail}>{notice.detail}</Text>}
            </>
          )}
        </View>

        <ScrollView style={styles.foundList} contentContainerStyle={styles.chips}>
          {found.map((w) => (
            <View key={w} style={styles.chip}>
              <Text style={styles.chipText}>{getInfo(w)?.word ?? w}</Text>
            </View>
          ))}
        </ScrollView>

        <Pressable style={styles.shuffle} onPress={restart}>
          <Text style={styles.shuffleText}>Bagong laro</Text>
        </Pressable>

        <Modal visible={over} transparent animationType="fade">
          <View style={styles.backdrop}>
            <View style={styles.modal}>
              <Text style={styles.modalTitle}>Tapos na ang oras</Text>
              <Text style={styles.modalScore}>
                {score} puntos · {found.length} salita
              </Text>
              {missed.length > 0 && <Text style={styles.label}>Hindi mo nahanap</Text>}
              <ScrollView style={{ maxHeight: 220, alignSelf: 'stretch' }}>
                {missed.slice(0, 12).map((w) => (
                  <Text key={w} style={styles.missed}>
                    <Text style={{ fontWeight: '800' }}>{getInfo(w)?.word ?? w}</Text>
                    {getInfo(w)?.definition ? `  ${getInfo(w).definition}` : ''}
                  </Text>
                ))}
              </ScrollView>
              <Pressable style={styles.shuffle} onPress={restart}>
                <Text style={styles.shuffleText}>Maglaro ulit</Text>
              </Pressable>
            </View>
          </View>
        </Modal>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg, paddingHorizontal: 16 },
  header: { flexDirection: 'row', justifyContent: 'space-between', paddingTop: 12 },
  center: { alignItems: 'center' },
  right: { alignItems: 'flex-end' },
  label: { color: colors.muted, fontSize: 13 },
  big: { color: colors.text, fontSize: 28, fontWeight: '800' },
  previewRow: { height: 56, alignItems: 'center', justifyContent: 'center' },
  preview: { color: colors.text, fontSize: 32, fontWeight: '800', letterSpacing: 2 },
  noticeBox: { minHeight: 64, marginTop: 12, alignItems: 'center', justifyContent: 'center' },
  noticeTitle: { fontSize: 18, fontWeight: '800' },
  noticeDetail: { color: colors.text, fontSize: 14, marginTop: 2, textAlign: 'center' },
  foundList: { flex: 1 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingVertical: 8 },
  chip: { backgroundColor: colors.panel, borderRadius: 14, paddingHorizontal: 12, paddingVertical: 6 },
  chipText: { color: colors.text, fontWeight: '700' },
  shuffle: {
    backgroundColor: colors.active,
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
    marginVertical: 12,
    alignSelf: 'stretch',
  },
  shuffleText: { color: colors.tileText, fontSize: 16, fontWeight: '800' },
  backdrop: { flex: 1, backgroundColor: 'rgba(20,10,40,0.8)', justifyContent: 'center', padding: 24 },
  modal: { backgroundColor: colors.panel, borderRadius: 24, padding: 20, alignItems: 'center' },
  modalTitle: { color: colors.text, fontSize: 24, fontWeight: '800' },
  modalScore: { color: colors.active, fontSize: 18, fontWeight: '700', marginVertical: 8 },
  missed: { color: colors.text, fontSize: 14, paddingVertical: 4 },
});
