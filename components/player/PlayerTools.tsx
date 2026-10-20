import { useState, type ReactNode } from 'react';
import { Modal, Pressable, Platform } from 'react-native';
import { Download, Moon, FileText, Check, Gauge, YStack, XStack, SizableText, ScrollView } from '@blinkdotnew/mobile-ui';
import type { LecturesRow } from '@/lib/db-types';

const TEAL = '#3a8378';
const TIMER_OPTIONS = [15, 30, 45, 60] as const;
const PLAYBACK_RATES = [0.5, 1, 1.5, 2] as const;

type PlayerToolsProps = {
  lecture: LecturesRow;
  downloading: boolean;
  downloaded: boolean;
  sleepRemaining: string | null;
  playbackRate: number;
  ready: boolean;
  playButton: ReactNode;
  onDownload: () => void;
  onSetSleepTimer: (minutes: number | null) => void;
  onChangePlaybackRate: (rate: number) => void;
};

export default function PlayerTools({ lecture, downloading, downloaded, sleepRemaining, playbackRate, ready, playButton, onDownload, onSetSleepTimer, onChangePlaybackRate }: PlayerToolsProps) {
  const [transcriptOpen, setTranscriptOpen] = useState(false);
  const [timerOpen, setTimerOpen] = useState(false);
  const [speedOpen, setSpeedOpen] = useState(false);
  const hasTranscript = !!lecture.transcript?.trim();

  return <>
    <XStack alignItems="center" justifyContent="center" gap="$2" flexWrap="nowrap">
      <Pressable accessibilityRole="button" accessibilityLabel={sleepRemaining ? `Таймер сна: ${sleepRemaining}` : 'Таймер сна'} onPress={() => setTimerOpen(true)} style={({ pressed }) => ({ width: 46, height: 46, borderRadius: 23, borderWidth: 1, borderColor: '#ffffff70', alignItems: 'center', justifyContent: 'center', backgroundColor: pressed ? '#ffffff30' : '#ffffff12', transform: [{ scale: pressed ? 0.94 : 1 }] })}>
        <Moon color="white" size={19} />
      </Pressable>
      <Pressable accessibilityRole="button" accessibilityLabel={`Скорость воспроизведения ${playbackRate}x`} onPress={() => setSpeedOpen((open) => !open)} disabled={!ready} style={({ pressed }) => ({ width: 46, height: 46, borderRadius: 23, borderWidth: 1, borderColor: '#ffffff70', alignItems: 'center', justifyContent: 'center', backgroundColor: pressed ? '#ffffff30' : '#ffffff12', opacity: ready ? 1 : 0.6, transform: [{ scale: pressed ? 0.94 : 1 }] })}>
        <YStack alignItems="center" justifyContent="center" gap={-2}><Gauge color="white" size={17} /><SizableText color="white" fontSize={9} fontWeight="800">{playbackRate}×</SizableText></YStack>
      </Pressable>
      {playButton}
      <Pressable accessibilityRole="button" accessibilityLabel={downloaded ? 'Лекция сохранена' : downloading ? 'Загрузка лекции' : 'Скачать лекцию'} onPress={onDownload} disabled={downloading || downloaded || Platform.OS === 'web'} style={({ pressed }) => ({ width: 46, height: 46, borderRadius: 23, borderWidth: 1, borderColor: '#ffffff70', alignItems: 'center', justifyContent: 'center', backgroundColor: pressed ? '#ffffff30' : '#ffffff12', opacity: downloading || downloaded || Platform.OS === 'web' ? 0.6 : 1, transform: [{ scale: pressed ? 0.94 : 1 }] })}>
        {downloaded ? <Check color="white" size={19} /> : <Download color="white" size={19} />}
      </Pressable>
      <Pressable accessibilityRole="button" accessibilityLabel="Открыть стенограмму лекции" onPress={() => setTranscriptOpen(true)} disabled={!hasTranscript} style={({ pressed }) => ({ width: 46, height: 46, borderRadius: 23, borderWidth: 1, borderColor: '#ffffff70', alignItems: 'center', justifyContent: 'center', backgroundColor: pressed ? '#ffffff30' : '#ffffff12', opacity: hasTranscript ? 1 : 0.5, transform: [{ scale: pressed ? 0.94 : 1 }] })}>
        <FileText color="white" size={19} />
      </Pressable>
    </XStack>
    {speedOpen ? <XStack justifyContent="center" gap="$2">{PLAYBACK_RATES.map((rate) => { const active = playbackRate === rate; return <Pressable key={rate} onPress={() => { onChangePlaybackRate(rate); setSpeedOpen(false); }} accessibilityRole="button" accessibilityState={{ selected: active }} style={{ minWidth: 54, minHeight: 42, borderRadius: 14, backgroundColor: active ? 'white' : '#ffffff25', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 10 }}><SizableText color={active ? TEAL : 'white'} fontSize={13} fontWeight="700">{rate}x</SizableText></Pressable>; })}</XStack> : null}

    <Modal visible={transcriptOpen} animationType="slide" transparent onRequestClose={() => setTranscriptOpen(false)}>
      <YStack flex={1} backgroundColor="#00000088" justifyContent="flex-end">
        <Pressable onPress={() => setTranscriptOpen(false)} style={{ flex: 1 }} accessibilityLabel="Закрыть расшифровку" />
        <YStack height="78%" backgroundColor="#f5f3ed" borderTopLeftRadius={24} borderTopRightRadius={24} padding="$5" gap="$3">
          <XStack alignItems="center" justifyContent="space-between"><SizableText color="#203b35" fontSize={20} fontWeight="800">Расшифровка</SizableText><Pressable onPress={() => setTranscriptOpen(false)} style={{ minWidth: 44, minHeight: 44, alignItems: 'center', justifyContent: 'center' }}><SizableText color={TEAL} fontSize={14} fontWeight="700">Готово</SizableText></Pressable></XStack>
          <SizableText color="#586b65" fontSize={13} fontWeight="600">{lecture.title}</SizableText>
          <ScrollView contentContainerStyle={{ paddingBottom: 32 }}><SizableText color="#30443e" fontSize={15} lineHeight={25}>{lecture.transcript}</SizableText></ScrollView>
        </YStack>
      </YStack>
    </Modal>

    <Modal visible={timerOpen} animationType="fade" transparent onRequestClose={() => setTimerOpen(false)}>
      <YStack flex={1} backgroundColor="#00000088" justifyContent="center" padding="$5">
        <Pressable onPress={() => setTimerOpen(false)} style={{ position: 'absolute', top: 0, bottom: 0, left: 0, right: 0 }} accessibilityLabel="Закрыть таймер" />
        <YStack backgroundColor="#f5f3ed" borderRadius={24} padding="$5" gap="$3">
          <SizableText color="#203b35" fontSize={20} fontWeight="800">Таймер сна</SizableText>
          <SizableText color="#71847f" fontSize={13}>Остановить воспроизведение через</SizableText>
          <XStack flexWrap="wrap" gap="$2">
            {TIMER_OPTIONS.map((minutes) => <Pressable key={minutes} onPress={() => { onSetSleepTimer(minutes); setTimerOpen(false); }} style={{ minWidth: 62, minHeight: 48, borderRadius: 14, backgroundColor: '#e2eee9', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 10 }}><SizableText color={TEAL} fontWeight="700">{minutes} мин</SizableText></Pressable>)}
          </XStack>
          {sleepRemaining ? <Pressable onPress={() => { onSetSleepTimer(null); setTimerOpen(false); }} style={{ minHeight: 44, justifyContent: 'center' }}><SizableText color="#a54444" fontWeight="700">Отключить таймер</SizableText></Pressable> : null}
        </YStack>
      </YStack>
    </Modal>
  </>;
}
