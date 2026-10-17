import { useEffect, useRef, useState } from 'react';
import { Pressable } from 'react-native';
import { Audio } from 'expo-av';
import { router, useLocalSearchParams } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Eye, Pause, Play, YStack, XStack, SizableText, Spinner } from '@blinkdotnew/mobile-ui';
import { blink } from '@/lib/blink';
import type { LecturesRow, PurchasesRow } from '@/lib/db-types';

const TEAL = '#3a8378';
const PLAYBACK_RATES = [0.5, 1, 1.5, 2] as const;
type PlayerLecture = LecturesRow;
function clock(milliseconds: number) {
  const seconds = Math.floor(milliseconds / 1000);
  return `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;
}

export default function AudioPlayer() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const sound = useRef<Audio.Sound | null>(null);
  const [user, setUser] = useState<{ id: string } | null>(null);
  const [playing, setPlaying] = useState(false);
  const [ready, setReady] = useState(false);
  const [position, setPosition] = useState(0);
  const [duration, setDuration] = useState(2556000);
  const [playbackRate, setPlaybackRate] = useState<(typeof PLAYBACK_RATES)[number]>(1);
  const [showSpeedOptions, setShowSpeedOptions] = useState(false);
  const [playError, setPlayError] = useState('');
  const { data: lecture, isLoading } = useQuery({ queryKey: ['player-lecture', id], enabled: !!id, queryFn: () => blink.db.table<PlayerLecture>('lectures').get(id) });
  useEffect(() => blink.auth.onAuthStateChanged((state) => setUser(state.user as { id: string } | null)), []);
  const { data: purchases = [] } = useQuery({ queryKey: ['purchases', user?.id], enabled: !!user, queryFn: () => blink.db.table<PurchasesRow>('purchases').list({ where: { userId: user!.id } }) });
  const canListen = !!lecture && (lecture.isFree || purchases.some((item) => item.lectureId === lecture.id));

  useEffect(() => {
    if (!lecture || !canListen) return;
    let mounted = true;
    setReady(false);
    Audio.setAudioModeAsync({ playsInSilentModeIOS: true }).catch(() => undefined);
    Audio.Sound.createAsync({ uri: lecture.audioUrl }, { shouldPlay: false }, (status) => {
      if (!mounted || !status.isLoaded) return;
      setPosition(status.positionMillis);
      if (status.durationMillis) setDuration(status.durationMillis);
      setPlaying(status.isPlaying);
    }).then(({ sound: created }) => {
      if (!mounted) { void created.unloadAsync(); return; }
      sound.current = created;
      setReady(true);
    }).catch((error: unknown) => setPlayError(error instanceof Error ? error.message : 'Не удалось загрузить аудио.'));
    return () => { mounted = false; const active = sound.current; sound.current = null; if (active) void active.unloadAsync(); };
  }, [lecture?.id, canListen]);

  async function togglePlayback() {
    if (!sound.current || !ready) return;
    try { setPlayError(''); if (playing) await sound.current.pauseAsync(); else await sound.current.playAsync(); }
    catch (error) { setPlayError(error instanceof Error ? error.message : 'Ошибка воспроизведения.'); }
  }

  async function seekBy(seconds: number) {
    if (!sound.current || !ready) return;
    const nextPosition = Math.max(0, Math.min(duration, position + seconds * 1000));
    try { await sound.current.setPositionAsync(nextPosition); setPosition(nextPosition); }
    catch (error) { setPlayError(error instanceof Error ? error.message : 'Не удалось изменить позицию.'); }
  }

  async function changePlaybackRate(rate: (typeof PLAYBACK_RATES)[number]) {
    if (!sound.current || !ready) return;
    try {
      await sound.current.setRateAsync(rate, true);
      setPlaybackRate(rate);
      setShowSpeedOptions(false);
      setPlayError('');
    } catch (error) {
      setPlayError(error instanceof Error ? error.message : 'Не удалось изменить скорость.');
    }
  }

  if (isLoading || !lecture) return <YStack flex={1} backgroundColor={TEAL} alignItems="center" justifyContent="center"><Spinner color="white" /></YStack>;
  if (!canListen) return <YStack flex={1} backgroundColor={TEAL} padding="$5" justifyContent="center" alignItems="center" gap="$3"><SizableText color="white" fontSize={18} fontWeight="700" textAlign="center">Лекция пока закрыта</SizableText><SizableText color="#d5e8e3" textAlign="center">Оформите доступ на странице лекции.</SizableText><Pressable onPress={() => router.replace({ pathname: '/lecture/[id]', params: { id } })} style={{ minHeight: 48, justifyContent: 'center' }}><YStack backgroundColor="#ffffff22" paddingHorizontal="$4" paddingVertical="$3" borderRadius={14}><SizableText color="white" fontWeight="700">К описанию</SizableText></YStack></Pressable></YStack>;
  const progress = Math.min(100, (position / duration) * 100);
  return <YStack flex={1} backgroundColor={TEAL} paddingTop="$3" paddingHorizontal="$5" paddingBottom="$6" justifyContent="space-between">
    <XStack alignItems="center" height={48}><Pressable onPress={() => router.back()} style={{ width: 48, height: 48, justifyContent: 'center' }}><ArrowLeft color="white" size={23} /></Pressable><SizableText color="#e1efeb" fontSize={12} letterSpacing={1.3} fontWeight="700" marginLeft="$2">СЕЙЧАС ИГРАЕТ</SizableText></XStack>
    <YStack alignItems="center" gap="$5">
      <YStack width={260} height={260} borderRadius={30} backgroundColor="#31766c" alignItems="center" justifyContent="center" borderWidth={1} borderColor="#ffffff30"><Eye color="white" size={84} strokeWidth={1.4} /><SizableText color="#eaf5f1" fontSize={11} fontWeight="700" letterSpacing={3} marginTop="$3">NOESIS · LECTURES</SizableText></YStack>
      <YStack alignItems="center" gap="$1"><SizableText color="white" fontSize={23} fontWeight="800" textAlign="center" lineHeight={29}>{lecture.title}</SizableText><SizableText color="#d8ebe5" fontSize={15}>НОЭЗИС.ЛЕКТОРИЙ</SizableText></YStack>
    </YStack>
    <YStack gap="$4">
      <YStack gap="$2"><YStack height={5} borderRadius={5} backgroundColor="#ffffff55" overflow="hidden"><YStack height={5} width={`${progress}%`} backgroundColor="white" borderRadius={5} /></YStack><XStack justifyContent="space-between"><SizableText color="#e4f0ed" fontSize={12}>{clock(position)}</SizableText><SizableText color="#e4f0ed" fontSize={12}>{clock(duration)}</SizableText></XStack></YStack>
      <XStack alignItems="center" justifyContent="center" gap="$4">
        <Pressable onPress={() => seekBy(-15)} disabled={!ready} accessibilityLabel="Перемотать на 15 секунд назад" style={{ minWidth: 64, minHeight: 52, alignItems: 'center', justifyContent: 'center', opacity: ready ? 1 : 0.6 }}>
          <SizableText color="#eaf5f1" fontSize={14} fontWeight="700">−15 сек</SizableText>
        </Pressable>
        <Pressable onPress={togglePlayback} disabled={!ready} accessibilityLabel={playing ? 'Пауза' : 'Воспроизвести'} style={({ pressed }) => ({ width: 72, height: 72, borderRadius: 36, backgroundColor: 'white', alignItems: 'center', justifyContent: 'center', transform: [{ scale: pressed ? 0.95 : 1 }], opacity: ready ? 1 : 0.7 })}>
          {ready ? playing ? <Pause color={TEAL} size={29} fill={TEAL} /> : <Play color={TEAL} size={29} fill={TEAL} /> : <Spinner color={TEAL} />}
        </Pressable>
        <Pressable onPress={() => seekBy(15)} disabled={!ready} accessibilityLabel="Перемотать на 15 секунд вперёд" style={{ minWidth: 64, minHeight: 52, alignItems: 'center', justifyContent: 'center', opacity: ready ? 1 : 0.6 }}>
          <SizableText color="#eaf5f1" fontSize={14} fontWeight="700">+15 сек</SizableText>
        </Pressable>
      </XStack>
      <YStack alignItems="center" gap="$2">
        <Pressable onPress={() => setShowSpeedOptions((shown) => !shown)} disabled={!ready} accessibilityRole="button" accessibilityLabel={`Скорость воспроизведения ${playbackRate}x`} style={{ minHeight: 42, minWidth: 132, borderRadius: 21, borderWidth: 1, borderColor: '#ffffff70', paddingHorizontal: 16, justifyContent: 'center', alignItems: 'center', opacity: ready ? 1 : 0.65 }}>
          <SizableText color="white" fontSize={13} fontWeight="700">Скорость · {playbackRate}x</SizableText>
        </Pressable>
        {showSpeedOptions ? <XStack gap="$2" paddingTop="$1">
          {PLAYBACK_RATES.map((rate) => {
            const active = playbackRate === rate;
            return <Pressable key={rate} onPress={() => changePlaybackRate(rate)} accessibilityRole="button" accessibilityState={{ selected: active }} style={{ minWidth: 54, minHeight: 42, borderRadius: 14, backgroundColor: active ? 'white' : '#ffffff25', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 10 }}>
              <SizableText color={active ? TEAL : 'white'} fontSize={13} fontWeight="700">{rate}x</SizableText>
            </Pressable>;
          })}
        </XStack> : null}
      </YStack>
      {playError ? <SizableText color="#ffe5dd" fontSize={12} textAlign="center">{playError}</SizableText> : null}
      <SizableText color="#cde2dc" fontSize={12} textAlign="center">Лекторий знаний и идей</SizableText>
    </YStack>
  </YStack>;
}
