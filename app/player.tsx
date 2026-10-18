import { useEffect, useState } from 'react';
import { Platform, Pressable } from 'react-native';
import { requestNotificationPermissionsAsync, setAudioModeAsync, useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';
import { File } from 'expo-file-system';
import { router, useLocalSearchParams } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Eye, Pause, Play, YStack, XStack, SizableText, Spinner } from '@blinkdotnew/mobile-ui';
import { blink } from '@/lib/blink';
import { saveLectureAudio } from '@/lib/lectureDownloads';
import PlayerTools from '@/components/player/PlayerTools';
import type { DownloadsRow, LecturesRow, PurchasesRow } from '@/lib/db-types';

const TEAL = '#3a8378';
const PLAYBACK_RATES = [0.5, 1, 1.5, 2] as const;
function clock(seconds: number) {
  const safeSeconds = Math.floor(seconds);
  return `${String(Math.floor(safeSeconds / 60)).padStart(2, '0')}:${String(safeSeconds % 60).padStart(2, '0')}`;
}

export default function AudioPlayer() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const player = useAudioPlayer(null);
  const status = useAudioPlayerStatus(player);
  const [user, setUser] = useState<{ id: string } | null>(null);
  const [playbackRate, setPlaybackRate] = useState<(typeof PLAYBACK_RATES)[number]>(1);
  const [showSpeedOptions, setShowSpeedOptions] = useState(false);
  const [playError, setPlayError] = useState('');
  const [downloading, setDownloading] = useState(false);
  const [timerEnd, setTimerEnd] = useState<number | null>(null);
  const [sleepSecondsLeft, setSleepSecondsLeft] = useState(0);
  const { data: lecture, isLoading } = useQuery({ queryKey: ['player-lecture', id], enabled: !!id, queryFn: () => blink.db.table<LecturesRow>('lectures').get(id) });
  useEffect(() => blink.auth.onAuthStateChanged((state) => setUser(state.user as { id: string } | null)), []);
  const { data: purchases = [] } = useQuery({ queryKey: ['purchases', user?.id], enabled: !!user, queryFn: () => blink.db.table<PurchasesRow>('purchases').list({ where: { userId: user!.id } }) });
  const { data: downloads = [] } = useQuery({ queryKey: ['downloads', user?.id], enabled: !!user, queryFn: () => blink.db.table<DownloadsRow>('downloads').list({ where: { userId: user!.id } }) });
  const canListen = !!lecture && (lecture.isFree || purchases.some((item) => item.lectureId === lecture.id));
  const localDownload = Platform.OS !== 'web' ? downloads.find((item) => item.lectureId === lecture?.id && item.localUri && new File(item.localUri).exists) : undefined;
  const audioSource = localDownload?.localUri || lecture?.audioUrl || null;
  const ready = !!status.isLoaded;
  const playing = !!status.playing;
  const position = status.currentTime || 0;
  const duration = status.duration || Number(lecture?.durationSeconds) || 2556;
  const progress = Math.min(100, duration > 0 ? (position / duration) * 100 : 0);

  useEffect(() => {
    if (!audioSource || !canListen) return;
    let mounted = true;
    setPlayError('');
    setAudioModeAsync({ playsInSilentMode: true, shouldPlayInBackground: true, interruptionMode: 'doNotMix' })
      .then(() => { if (mounted) player.replace(audioSource); })
      .catch((error: unknown) => setPlayError(error instanceof Error ? error.message : 'Не удалось настроить аудио.'));
    return () => { mounted = false; player.pause(); player.clearLockScreenControls(); };
  }, [audioSource, canListen, player]);

  useEffect(() => {
    if (!timerEnd) { setSleepSecondsLeft(0); return; }
    const update = () => {
      const remaining = Math.max(0, Math.ceil((timerEnd - Date.now()) / 1000));
      setSleepSecondsLeft(remaining);
      if (remaining === 0) { player.pause(); setTimerEnd(null); }
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [timerEnd, player]);

  function setSleepTimer(minutes: number | null) {
    setTimerEnd(minutes === null ? null : Date.now() + minutes * 60_000);
  }

  async function togglePlayback() {
    if (!ready) return;
    setPlayError('');
    try {
      if (playing) player.pause();
      else {
        if (Platform.OS !== 'web') {
          if (Platform.OS === 'android') await requestNotificationPermissionsAsync();
          player.setActiveForLockScreen(true, {
            title: lecture?.title,
            artist: 'НОЭЗИС.ЛЕКТОРИЙ',
            albumTitle: 'Лекторий знаний и идей',
            ...(lecture?.coverUrl ? { artworkUrl: lecture.coverUrl } : {}),
          }, { showSeekBackward: true, showSeekForward: true });
        }
        player.play();
      }
    } catch (error) { setPlayError(error instanceof Error ? error.message : 'Ошибка воспроизведения.'); }
  }

  function seekBy(seconds: number) {
    if (!ready) return;
    void player.seekTo(Math.max(0, Math.min(duration, position + seconds)));
  }

  function changePlaybackRate(rate: (typeof PLAYBACK_RATES)[number]) {
    if (!ready) return;
    player.playbackRate = rate;
    player.shouldCorrectPitch = true;
    setPlaybackRate(rate);
    setShowSpeedOptions(false);
  }

  async function downloadAudio() {
    if (!lecture) return;
    if (!user) { router.push('/login'); return; }
    if (Platform.OS === 'web') { setPlayError('Загрузка лекций доступна в мобильном приложении.'); return; }
    setDownloading(true);
    setPlayError('');
    try { await saveLectureAudio({ lectureId: lecture.id, audioUrl: lecture.audioUrl, userId: user.id, existing: downloads }); }
    catch (error) { setPlayError(error instanceof Error ? error.message : 'Не удалось скачать лекцию.'); }
    finally { setDownloading(false); }
  }

  if (isLoading || !lecture) return <YStack flex={1} backgroundColor={TEAL} alignItems="center" justifyContent="center"><Spinner color="white" /></YStack>;
  if (!canListen) return <YStack flex={1} backgroundColor={TEAL} padding="$5" justifyContent="center" alignItems="center" gap="$3"><SizableText color="white" fontSize={18} fontWeight="700" textAlign="center">Лекция пока закрыта</SizableText><SizableText color="#d5e8e3" textAlign="center">Оформите доступ на странице лекции.</SizableText><Pressable onPress={() => router.replace({ pathname: '/lecture/[id]', params: { id } })} style={{ minHeight: 48, justifyContent: 'center' }}><YStack backgroundColor="#ffffff22" paddingHorizontal="$4" paddingVertical="$3" borderRadius={14}><SizableText color="white" fontWeight="700">К описанию</SizableText></YStack></Pressable></YStack>;
  const downloaded = downloads.some((item) => item.lectureId === lecture.id && !!item.localUri && (Platform.OS === 'web' || new File(item.localUri).exists));

  return <YStack flex={1} backgroundColor={TEAL} paddingTop="$3" paddingHorizontal="$5" paddingBottom="$4" justifyContent="space-between">
    <XStack alignItems="center" height={48}><Pressable onPress={() => router.back()} style={{ width: 48, height: 48, justifyContent: 'center' }}><ArrowLeft color="white" size={23} /></Pressable><SizableText color="#e1efeb" fontSize={12} letterSpacing={1.3} fontWeight="700" marginLeft="$2">СЕЙЧАС ИГРАЕТ</SizableText></XStack>
    <YStack alignItems="center" gap="$4">
      <YStack width={240} height={240} borderRadius={30} backgroundColor="#31766c" alignItems="center" justifyContent="center" borderWidth={1} borderColor="#ffffff30"><Eye color="white" size={84} strokeWidth={1.4} /><SizableText color="#eaf5f1" fontSize={11} fontWeight="700" letterSpacing={3} marginTop="$3">NOESIS · LECTURES</SizableText></YStack>
      <YStack alignItems="center" gap="$1"><SizableText color="white" fontSize={23} fontWeight="800" textAlign="center" lineHeight={29}>{lecture.title}</SizableText><SizableText color="#d8ebe5" fontSize={15}>НОЭЗИС.ЛЕКТОРИЙ</SizableText></YStack>
    </YStack>
    <YStack gap="$3">
      <YStack gap="$2"><YStack height={5} borderRadius={5} backgroundColor="#ffffff55" overflow="hidden"><YStack height={5} width={`${progress}%`} backgroundColor="white" borderRadius={5} /></YStack><XStack justifyContent="space-between"><SizableText color="#e4f0ed" fontSize={12}>{clock(position)}</SizableText><SizableText color="#e4f0ed" fontSize={12}>{clock(duration)}</SizableText></XStack></YStack>
      <XStack alignItems="center" justifyContent="center" gap="$4">
        <Pressable onPress={() => seekBy(-15)} disabled={!ready} accessibilityLabel="Перемотать на 15 секунд назад" style={{ minWidth: 64, minHeight: 52, alignItems: 'center', justifyContent: 'center', opacity: ready ? 1 : 0.6 }}><SizableText color="#eaf5f1" fontSize={14} fontWeight="700">−15 сек</SizableText></Pressable>
        <Pressable onPress={togglePlayback} disabled={!ready} accessibilityLabel={playing ? 'Пауза' : 'Воспроизвести'} style={({ pressed }) => ({ width: 72, height: 72, borderRadius: 36, backgroundColor: 'white', alignItems: 'center', justifyContent: 'center', transform: [{ scale: pressed ? 0.95 : 1 }], opacity: ready ? 1 : 0.7 })}>{ready ? playing ? <Pause color={TEAL} size={29} fill={TEAL} /> : <Play color={TEAL} size={29} fill={TEAL} /> : <Spinner color={TEAL} />}</Pressable>
        <Pressable onPress={() => seekBy(15)} disabled={!ready} accessibilityLabel="Перемотать на 15 секунд вперёд" style={{ minWidth: 64, minHeight: 52, alignItems: 'center', justifyContent: 'center', opacity: ready ? 1 : 0.6 }}><SizableText color="#eaf5f1" fontSize={14} fontWeight="700">+15 сек</SizableText></Pressable>
      </XStack>
      <YStack alignItems="center" gap="$2">
        <Pressable onPress={() => setShowSpeedOptions((shown) => !shown)} disabled={!ready} accessibilityRole="button" accessibilityLabel={`Скорость воспроизведения ${playbackRate}x`} style={{ minHeight: 42, minWidth: 132, borderRadius: 21, borderWidth: 1, borderColor: '#ffffff70', paddingHorizontal: 16, justifyContent: 'center', alignItems: 'center', opacity: ready ? 1 : 0.65 }}><SizableText color="white" fontSize={13} fontWeight="700">Скорость · {playbackRate}x</SizableText></Pressable>
        {showSpeedOptions ? <XStack gap="$2" paddingTop="$1">{PLAYBACK_RATES.map((rate) => { const active = playbackRate === rate; return <Pressable key={rate} onPress={() => changePlaybackRate(rate)} accessibilityRole="button" accessibilityState={{ selected: active }} style={{ minWidth: 54, minHeight: 42, borderRadius: 14, backgroundColor: active ? 'white' : '#ffffff25', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 10 }}><SizableText color={active ? TEAL : 'white'} fontSize={13} fontWeight="700">{rate}x</SizableText></Pressable>; })}</XStack> : null}
      </YStack>
      <PlayerTools lecture={lecture} downloading={downloading} downloaded={downloaded} sleepRemaining={sleepSecondsLeft ? `Осталось ${Math.ceil(sleepSecondsLeft / 60)} мин` : null} onDownload={downloadAudio} onSetSleepTimer={setSleepTimer} />
      {playError ? <SizableText color="#ffe5dd" fontSize={12} textAlign="center">{playError}</SizableText> : null}
      <SizableText color="#cde2dc" fontSize={12} textAlign="center">Лекторий знаний и идей</SizableText>
    </YStack>
  </YStack>;
}
