import { useMemo, useState } from 'react';
import { FlatList, Pressable } from 'react-native';
import { router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { BookOpen, Clock3, Eye, Play, Search, Sparkles, XStack, YStack, SizableText, ScrollView, Button, Spinner } from '@blinkdotnew/mobile-ui';
import { blink } from '@/lib/blink';
import type { AuthorsRow, CategoriesRow, LectureCategoriesRow, LecturesRow } from '@/lib/db-types';

const BG = '#e8f3ef';
const CARD = '#F8F9FA';
const TEAL = '#3a8378';
type Lecture = LecturesRow & { author: AuthorsRow; categoryIds: string[] };
type Catalog = { lectures: Lecture[]; categories: CategoriesRow[] };

async function fetchCatalog(): Promise<Catalog> {
  const [lectures, authors, categories, links] = await Promise.all([
    blink.db.table<LecturesRow>('lectures').list({ orderBy: { title: 'asc' } }),
    blink.db.table<AuthorsRow>('authors').list(),
    blink.db.table<CategoriesRow>('categories').list(),
    blink.db.table<LectureCategoriesRow>('lecture_categories').list(),
  ]);
  return {
    categories,
    lectures: lectures.map((lecture) => ({
      ...lecture,
      author: authors.find((author) => author.id === lecture.authorId) ?? { id: '', name: 'Лекторий', avatarUrl: null, bio: null },
      categoryIds: links.filter((link) => link.lectureId === lecture.id).map((link) => link.categoryId),
    })),
  };
}

function Cover({ size = 88 }: { size?: number }) {
  return <YStack width={size} height={size} borderRadius={16} backgroundColor={TEAL} alignItems="center" justifyContent="center">
    <Eye color="white" size={size * 0.32} strokeWidth={1.6} />
    <SizableText color="white" fontSize={size * 0.09} fontWeight="700" letterSpacing={1.6} marginTop="$1">NOESIS</SizableText>
  </YStack>;
}

function Header() {
  return <YStack backgroundColor={TEAL} paddingHorizontal="$5" paddingTop="$4" paddingBottom="$5">
    <XStack alignItems="center" justifyContent="space-between">
      <YStack>
        <SizableText color="#d4e8e2" fontSize={10} letterSpacing={2.2} fontWeight="700">АУДИОЛЕКЦИИ И ПОДКАСТЫ</SizableText>
        <SizableText color="white" fontSize={21} fontWeight="800" letterSpacing={0.5} marginTop="$1">НОЭЗИС.ЛЕКТОРИЙ</SizableText>
      </YStack>
      <YStack width={42} height={42} borderRadius={14} backgroundColor="rgba(255,255,255,0.16)" alignItems="center" justifyContent="center"><BookOpen color="white" size={21} /></YStack>
    </XStack>
  </YStack>;
}

function CategoryStrip({ categories, selected, onSelect }: { categories: CategoriesRow[]; selected: string; onSelect: (value: string) => void }) {
  return <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingVertical: 2 }}>
    {[{ id: 'all', name: 'Все темы' }, ...categories].map((category) => {
      const active = selected === category.id;
      return <Pressable key={category.id} onPress={() => onSelect(category.id)} style={{ minHeight: 40, justifyContent: 'center', paddingHorizontal: 16, borderRadius: 22, backgroundColor: active ? TEAL : CARD }}>
        <SizableText color={active ? 'white' : '#47625c'} fontSize={13} fontWeight={active ? '700' : '500'}>{category.name}</SizableText>
      </Pressable>;
    })}
  </ScrollView>;
}

function LectureCard({ item }: { item: Lecture }) {
  return <Pressable onPress={() => router.push({ pathname: '/lecture/[id]', params: { id: item.id } })} style={({ pressed }) => ({ transform: [{ scale: pressed ? 0.985 : 1 }], opacity: pressed ? 0.92 : 1 })}>
    <XStack backgroundColor={CARD} borderRadius={20} padding="$3" gap="$3" alignItems="center">
      <Cover />
      <YStack flex={1} gap="$1.5">
        <XStack alignItems="center" gap="$1.5">
          <YStack backgroundColor="#e5f1ed" paddingHorizontal="$2" paddingVertical="$1" borderRadius={6}><SizableText color={TEAL} fontSize={9} fontWeight="800" letterSpacing={0.8}>ЛЕКЦИЯ</SizableText></YStack>
          <XStack alignItems="center" gap="$1"><Clock3 size={12} color="#78918c" /><SizableText color="#78918c" fontSize={11}>42 мин</SizableText></XStack>
        </XStack>
        <SizableText color="#203b35" fontSize={15} fontWeight="700" numberOfLines={2} lineHeight={19}>{item.title}</SizableText>
        <SizableText color="#71847f" fontSize={12}>{item.author.name}</SizableText>
        <XStack alignItems="center" justifyContent="space-between" marginTop="$1">
          <SizableText color={item.isFree ? TEAL : '#45635d'} fontSize={11} fontWeight="800">{item.isFree ? 'БЕСПЛАТНО' : `${Number(item.price).toLocaleString('ru-RU')} ₽`}</SizableText>
          <XStack alignItems="center" gap="$1" backgroundColor={TEAL} paddingHorizontal="$2.5" paddingVertical="$1.5" borderRadius={10}>
            {item.isFree ? <Play color="white" size={12} fill="white" /> : null}
            <SizableText color="white" fontSize={11} fontWeight="700">{item.isFree ? 'Слушать' : 'Купить'}</SizableText>
          </XStack>
        </XStack>
      </YStack>
    </XStack>
  </Pressable>;
}

function ListIntro({ count, categories, selected, onSelect }: { count: number; categories: CategoriesRow[]; selected: string; onSelect: (value: string) => void }) {
  return <YStack gap="$4" marginBottom="$2">
    <XStack backgroundColor="#d7e9e2" padding="$4" borderRadius={20} alignItems="center" justifyContent="space-between">
      <YStack flex={1} gap="$2"><XStack alignItems="center" gap="$1.5"><Sparkles color={TEAL} size={15} /><SizableText color={TEAL} fontSize={11} fontWeight="800" letterSpacing={1}>ИДЕИ ДЛЯ ЖИЗНИ</SizableText></XStack>
        <SizableText color="#21483f" fontSize={19} fontWeight="800" lineHeight={24}>Слушайте. Думайте. Открывайте.</SizableText>
        <SizableText color="#5d7971" fontSize={12}>Знания, к которым хочется возвращаться</SizableText>
      </YStack><YStack width={42} height={42} borderRadius={21} backgroundColor={TEAL} alignItems="center" justifyContent="center"><Search color="white" size={18} /></YStack>
    </XStack>
    <YStack gap="$2"><XStack alignItems="center" justifyContent="space-between"><SizableText color="#23443c" fontSize={18} fontWeight="800">Исследуйте темы</SizableText><SizableText color="#779089" fontSize={12}>{count} лекций</SizableText></XStack>
      <CategoryStrip categories={categories} selected={selected} onSelect={onSelect} />
    </YStack>
    <SizableText color="#23443c" fontSize={18} fontWeight="800">Подборка лектория</SizableText>
  </YStack>;
}

export default function CatalogScreen() {
  const [selected, setSelected] = useState('all');
  const { data, isLoading, isError, error, refetch } = useQuery({ queryKey: ['catalog'], queryFn: fetchCatalog });
  const visible = useMemo(() => (data?.lectures ?? []).filter((item) => selected === 'all' || item.categoryIds.includes(selected)), [data, selected]);
  if (isLoading) return <YStack flex={1} backgroundColor={BG} alignItems="center" justifyContent="center" gap="$3"><Spinner color={TEAL} /><SizableText color="#5d7971">Загружаем лекторий</SizableText></YStack>;
  if (isError) return <YStack flex={1} backgroundColor={BG} padding="$5" alignItems="center" justifyContent="center" gap="$3"><SizableText color="#23443c" fontSize={17} fontWeight="700">Не удалось загрузить каталог</SizableText><SizableText color="#5d7971" textAlign="center">{error instanceof Error ? error.message : 'Попробуйте ещё раз.'}</SizableText><Button backgroundColor={TEAL} color="white" onPress={() => refetch()}>Повторить</Button></YStack>;
  return <YStack flex={1} backgroundColor={BG}>
    <Header />
    <FlatList data={visible} keyExtractor={(item) => item.id} renderItem={({ item }) => <LectureCard item={item} />}
      ListHeaderComponent={<ListIntro count={visible.length} categories={data?.categories ?? []} selected={selected} onSelect={setSelected} />}
      ListEmptyComponent={<YStack backgroundColor={CARD} padding="$4" borderRadius={16}><SizableText color="#58716b">В этой теме пока нет лекций.</SizableText></YStack>}
      contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: 24, gap: 11 }} />
  </YStack>;
}
