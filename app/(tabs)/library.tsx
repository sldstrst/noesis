import { useEffect } from 'react';
import { Pressable } from 'react-native';
import { router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { Bookmark, BookOpen, Check, Eye, LogIn, LogOut, Play, YStack, XStack, SizableText, Button, Spinner, ScrollView } from '@blinkdotnew/mobile-ui';
import { useState } from 'react';
import { blink } from '@/lib/blink';
import type { AuthorsRow, LecturesRow, PurchasesRow, SavedLecturesRow } from '@/lib/db-types';

const BG = '#e8f3ef'; const CARD = '#F8F9FA'; const TEAL = '#3a8378';
type LibraryLecture = LecturesRow & { author: AuthorsRow | undefined };

function Artwork() {
  return <YStack width={62} height={62} borderRadius={15} backgroundColor={TEAL} alignItems="center" justifyContent="center"><Eye size={25} color="white" /><SizableText color="white" fontSize={7} fontWeight="700" letterSpacing={1.3} marginTop="$1">NOESIS</SizableText></YStack>;
}

function Header() {
  return <YStack backgroundColor={TEAL} paddingHorizontal="$5" paddingTop="$4" paddingBottom="$5" borderBottomLeftRadius={24} borderBottomRightRadius={24}>
    <SizableText color="#d4e8e2" fontSize={10} letterSpacing={2.2} fontWeight="700">ВАШЕ ПРОСТРАНСТВО</SizableText>
    <SizableText color="white" fontSize={21} fontWeight="800" letterSpacing={0.5} marginTop="$1">НОЭЗИС.ЛЕКТОРИЙ</SizableText>
  </YStack>;
}

function LibraryRow({ item, purchased }: { item: LibraryLecture; purchased: boolean }) {
  return <Pressable onPress={() => router.push({ pathname: '/lecture/[id]', params: { id: item.id } })} style={({ pressed }) => ({ opacity: pressed ? 0.9 : 1 })}>
    <XStack backgroundColor={CARD} borderRadius={17} padding="$3" alignItems="center" gap="$3"><Artwork /><YStack flex={1} gap="$1"><SizableText color="#203b35" fontSize={14} fontWeight="700" numberOfLines={2}>{item.title}</SizableText><SizableText color="#71847f" fontSize={12}>{item.author?.name ?? 'Лекторий'}</SizableText></YStack>
      {purchased ? <Check color={TEAL} size={19} /> : <Play color={TEAL} size={19} />}
    </XStack>
  </Pressable>;
}

export default function LibraryScreen() {
  const [user, setUser] = useState<{ id: string; email?: string } | null>(null);
  useEffect(() => blink.auth.onAuthStateChanged((state) => setUser(state.user as { id: string; email?: string } | null)), []);
  const { data, isLoading, error } = useQuery({
    queryKey: ['library', user?.id], enabled: !!user,
    queryFn: async () => {
      const [purchases, saved, lectures, authors] = await Promise.all([
        blink.db.table<PurchasesRow>('purchases').list({ where: { userId: user!.id }, orderBy: { createdAt: 'desc' } }),
        blink.db.table<SavedLecturesRow>('saved_lectures').list({ where: { userId: user!.id }, orderBy: { createdAt: 'desc' } }),
        blink.db.table<LecturesRow>('lectures').list(),
        blink.db.table<AuthorsRow>('authors').list(),
      ]);
      const findLecture = (id: string) => {
        const row = lectures.find((lecture) => lecture.id === id);
        return row ? { ...row, author: authors.find((author) => author.id === row.authorId) } : null;
      };
      return { purchases: purchases.map((row) => findLecture(row.lectureId)).filter((row): row is LibraryLecture => !!row), saved: saved.map((row) => findLecture(row.lectureId)).filter((row): row is LibraryLecture => !!row) };
    },
  });
  const purchasedIds = new Set(data?.purchases.map((item) => item.id) ?? []);
  return <YStack flex={1} backgroundColor={BG}>
    <Header />
    <ScrollView contentContainerStyle={{ padding: 18, paddingBottom: 32, gap: 18 }}>
      <YStack backgroundColor={CARD} borderRadius={20} padding="$4" gap="$3">
        <XStack alignItems="center" justifyContent="space-between"><XStack alignItems="center" gap="$3"><YStack width={46} height={46} borderRadius={23} backgroundColor="#e2eee9" alignItems="center" justifyContent="center"><BookOpen color={TEAL} size={22} /></YStack>
          <YStack><SizableText color="#203b35" fontSize={15} fontWeight="700">Мой профиль</SizableText><SizableText color="#71847f" fontSize={12} marginTop="$1">{user?.email ?? 'Гость лектория'}</SizableText></YStack></XStack>
          {user ? <Pressable onPress={() => blink.auth.signOut()} style={{ minWidth: 44, minHeight: 44, alignItems: 'center', justifyContent: 'center' }}><LogOut color="#78918c" size={19} /></Pressable> : null}
        </XStack>
        {!user ? <YStack gap="$2"><SizableText color="#71847f" fontSize={13} lineHeight={19}>Войдите, чтобы покупки и сохранённые лекции были доступны в вашей библиотеке.</SizableText><Button backgroundColor={TEAL} color="white" height={46} borderRadius={13} icon={<LogIn size={17} color="white" />} onPress={() => router.push('/login')}>Войти</Button></YStack> : null}
      </YStack>
      {isLoading && user ? <YStack padding="$5" alignItems="center"><Spinner color={TEAL} /></YStack> : null}
      {error ? <SizableText color="#aa4444">{error instanceof Error ? error.message : 'Не удалось загрузить библиотеку.'}</SizableText> : null}
      <YStack gap="$3"><XStack alignItems="center" gap="$2"><Check color={TEAL} size={18} /><SizableText color="#23443c" fontSize={18} fontWeight="800">Купленные</SizableText><SizableText color="#78918c" fontSize={12}>{data?.purchases.length ?? 0}</SizableText></XStack>
        {data?.purchases.length ? data.purchases.map((item) => <LibraryRow key={`buy-${item.id}`} item={item} purchased />) : user ? <YStack backgroundColor={CARD} borderRadius={16} padding="$4"><SizableText color="#71847f" fontSize={13}>Купленные лекции появятся здесь.</SizableText></YStack> : null}
      </YStack>
      <YStack gap="$3"><XStack alignItems="center" gap="$2"><Bookmark color={TEAL} size={18} /><SizableText color="#23443c" fontSize={18} fontWeight="800">Сохранённые</SizableText><SizableText color="#78918c" fontSize={12}>{data?.saved.length ?? 0}</SizableText></XStack>
        {data?.saved.length ? data.saved.map((item) => <LibraryRow key={`save-${item.id}`} item={item} purchased={purchasedIds.has(item.id)} />) : user ? <YStack backgroundColor={CARD} borderRadius={16} padding="$4"><SizableText color="#71847f" fontSize={13}>Сохраняйте интересные лекции, чтобы вернуться к ним позже.</SizableText></YStack> : null}
      </YStack>
      {!user ? <YStack gap="$3"><SizableText color="#23443c" fontSize={18} fontWeight="800">Купленные</SizableText><YStack backgroundColor={CARD} borderRadius={16} padding="$4"><SizableText color="#71847f" fontSize={13}>Войдите, чтобы увидеть ваши лекции.</SizableText></YStack><SizableText color="#23443c" fontSize={18} fontWeight="800">Сохранённые</SizableText><YStack backgroundColor={CARD} borderRadius={16} padding="$4"><SizableText color="#71847f" fontSize={13}>Сохранённые лекции будут собраны здесь.</SizableText></YStack></YStack> : null}
    </ScrollView>
  </YStack>;
}
