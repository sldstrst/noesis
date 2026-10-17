import { useEffect, useState } from 'react';
import { Pressable, Share } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Bookmark, BookmarkCheck, Check, Clock3, Eye, Share2, Play, LockKeyhole, YStack, XStack, SizableText, Button, Spinner, ScrollView } from '@blinkdotnew/mobile-ui';
import { blink } from '@/lib/blink';
import type { AuthorsRow, LecturesRow, PurchasesRow, SavedLecturesRow } from '@/lib/db-types';

const BG = '#e8f3ef'; const CARD = '#F8F9FA'; const TEAL = '#3a8378';
type LectureDetail = LecturesRow & { author: AuthorsRow | undefined };

function Artwork({ large = false }: { large?: boolean }) {
  const size = large ? 236 : 42;
  return <YStack width={size} height={size} borderRadius={large ? 28 : 14} backgroundColor={TEAL} alignItems="center" justifyContent="center">
    <Eye color="white" size={large ? 78 : 23} strokeWidth={1.5} />
    {large ? <SizableText color="white" fontSize={11} fontWeight="700" letterSpacing={3} marginTop="$2">NOESIS · LECTURES</SizableText> : null}
  </YStack>;
}

export default function LectureDetails() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const queryClient = useQueryClient();
  const [user, setUser] = useState<{ id: string; email?: string } | null>(null);
  useEffect(() => blink.auth.onAuthStateChanged((state) => setUser(state.user as { id: string; email?: string } | null)), []);
  const { data: lecture, isLoading, error } = useQuery({
    queryKey: ['lecture', id],
    queryFn: async (): Promise<LectureDetail | null> => {
      const row = await blink.db.table<LecturesRow>('lectures').get(id);
      if (!row) return null;
      const author = await blink.db.table<AuthorsRow>('authors').get(row.authorId);
      return { ...row, author: author ?? undefined };
    }, enabled: !!id,
  });
  const { data: purchases = [] } = useQuery({ queryKey: ['purchases', user?.id], enabled: !!user, queryFn: () => blink.db.table<PurchasesRow>('purchases').list({ where: { userId: user!.id } }) });
  const { data: saved = [] } = useQuery({ queryKey: ['saved', user?.id], enabled: !!user, queryFn: () => blink.db.table<SavedLecturesRow>('saved_lectures').list({ where: { userId: user!.id } }) });
  const bought = purchases.some((purchase) => purchase.lectureId === id);
  const savedRow = saved.find((item) => item.lectureId === id);
  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!user) { router.push('/login'); return; }
      const table = blink.db.table<SavedLecturesRow>('saved_lectures');
      if (savedRow) await table.delete(savedRow.id);
      else await table.create({ id: `${user.id}_${id}`, userId: user.id, lectureId: id });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['saved'] }),
  });
  const buyMutation = useMutation({
    mutationFn: async () => {
      if (!user) { router.push('/login'); return; }
      await blink.db.table<PurchasesRow>('purchases').create({ id: `${user.id}_${id}`, userId: user.id, lectureId: id });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['purchases'] }),
  });
  if (isLoading) return <YStack flex={1} backgroundColor={BG} alignItems="center" justifyContent="center"><Spinner color={TEAL} /></YStack>;
  if (error || !lecture) return <YStack flex={1} backgroundColor={BG} padding="$5" justifyContent="center" gap="$3"><SizableText color="#23443c">Лекция не найдена. {error instanceof Error ? error.message : ''}</SizableText><Button backgroundColor={TEAL} color="white" onPress={() => router.back()}>Назад</Button></YStack>;
  const canListen = lecture.isFree || bought;
  return <YStack flex={1} backgroundColor={BG}>
    <XStack height={58} backgroundColor={TEAL} paddingHorizontal="$4" alignItems="center" justifyContent="space-between">
      <Pressable onPress={() => router.back()} style={{ minWidth: 44, minHeight: 44, justifyContent: 'center' }}><ArrowLeft color="white" size={22} /></Pressable>
      <XStack gap="$2"><Pressable onPress={() => saveMutation.mutate()} style={{ width: 44, height: 44, alignItems: 'center', justifyContent: 'center' }}>{savedRow ? <BookmarkCheck color="white" size={21} /> : <Bookmark color="white" size={21} />}</Pressable>
        <Pressable onPress={() => Share.share({ message: `${lecture.title} — НОЭЗИС.ЛЕКТОРИЙ` })} style={{ width: 44, height: 44, alignItems: 'center', justifyContent: 'center' }}><Share2 color="white" size={20} /></Pressable>
      </XStack>
    </XStack>
    <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 38, gap: 16 }}>
      <YStack alignItems="center" paddingVertical="$2"><Artwork large /></YStack>
      <YStack gap="$2"><XStack alignItems="center" gap="$2"><YStack backgroundColor="#dcece6" paddingHorizontal="$2" paddingVertical="$1" borderRadius={7}><SizableText color={TEAL} fontSize={10} fontWeight="800">ЛЕКЦИЯ</SizableText></YStack><XStack alignItems="center" gap="$1"><Clock3 size={14} color="#78918c" /><SizableText color="#71847f" fontSize={12}>42 минуты</SizableText></XStack></XStack>
        <SizableText color="#203b35" fontSize={25} fontWeight="800" lineHeight={31}>{lecture.title}</SizableText><SizableText color="#71847f" fontSize={14}>Лектор: {lecture.author?.name ?? 'Лекторий'}</SizableText>
      </YStack>
      <YStack backgroundColor={CARD} borderRadius={18} padding="$4" gap="$3">
        <XStack alignItems="center" justifyContent="space-between"><YStack gap="$1"><SizableText color="#71847f" fontSize={12}>Доступ к лекции</SizableText><SizableText color={lecture.isFree ? TEAL : '#203b35'} fontSize={22} fontWeight="800">{lecture.isFree ? 'БЕСПЛАТНО' : `${Number(lecture.price).toLocaleString('ru-RU')} ₽`}</SizableText></YStack>
          {canListen ? <Check color={TEAL} size={22} /> : <LockKeyhole color="#78918c" size={21} />}</XStack>
        <Button height={50} borderRadius={14} backgroundColor={TEAL} color="white" fontWeight="700" onPress={() => canListen ? router.push({ pathname: '/player', params: { id: lecture.id } }) : buyMutation.mutate()} disabled={buyMutation.isPending}>
          {buyMutation.isPending ? 'Открываем доступ…' : canListen ? 'Слушать лекцию' : 'Купить за 700 ₽'}
        </Button>
        {!user && !lecture.isFree ? <SizableText color="#71847f" fontSize={12} textAlign="center">Для тестовой покупки нужно войти в аккаунт.</SizableText> : null}
        {buyMutation.isError ? <SizableText color="#b33e3e" fontSize={12}>{buyMutation.error instanceof Error ? buyMutation.error.message : 'Не удалось оформить доступ.'}</SizableText> : null}
      </YStack>
      <YStack backgroundColor={CARD} borderRadius={18} padding="$4" gap="$2"><SizableText color="#203b35" fontSize={17} fontWeight="800">Описание лекции</SizableText><SizableText color="#61766f" fontSize={14} lineHeight={22}>{lecture.description}</SizableText></YStack>
      <SizableText color="#7b918a" fontSize={12} textAlign="center">Покупка демонстрационная — оплата не списывается.</SizableText>
    </ScrollView>
  </YStack>;
}
