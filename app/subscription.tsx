import { useEffect, useMemo, useState } from 'react';
import { Pressable } from 'react-native';
import { router } from 'expo-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Check, Headphones, LockKeyhole, Sparkles, YStack, XStack, SizableText, Button, Spinner } from '@blinkdotnew/mobile-ui';
import { blink } from '@/lib/blink';
import type { SubscriptionsRow } from '@/lib/db-types';

const BG = '#e8f3ef';
const TEAL = '#3a8378';
type SignedInUser = { id: string; email?: string };

export default function SubscriptionScreen() {
  const [user, setUser] = useState<SignedInUser | null>(null);
  const [notice, setNotice] = useState('');
  const queryClient = useQueryClient();
  useEffect(() => blink.auth.onAuthStateChanged((state) => setUser(state.user as SignedInUser | null)), []);
  const { data: subscriptions = [], isLoading } = useQuery({
    queryKey: ['subscriptions', user?.id],
    enabled: !!user,
    queryFn: () => blink.db.table<SubscriptionsRow>('subscriptions').list({ where: { userId: user!.id }, orderBy: { startedAt: 'desc' } }),
  });
  const activeSubscription = useMemo(() => subscriptions.find((item) => item.status === 'active' && Date.parse(item.expiresAt) > Date.now()), [subscriptions]);
  const activate = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error('Войдите в аккаунт, чтобы оформить подписку.');
      if (activeSubscription) return activeSubscription;
      const startedAt = new Date();
      const expiresAt = new Date(startedAt);
      expiresAt.setMonth(expiresAt.getMonth() + 1);
      return blink.db.table<SubscriptionsRow>('subscriptions').create({
        userId: user.id,
        status: 'active',
        planType: 'monthly',
        startedAt: startedAt.toISOString(),
        expiresAt: expiresAt.toISOString(),
      });
    },
    onSuccess: async () => {
      setNotice('Подписка активирована. Все платные лекции доступны в течение месяца.');
      await queryClient.invalidateQueries({ queryKey: ['subscriptions', user?.id] });
      await queryClient.invalidateQueries({ queryKey: ['lecture'] });
      await queryClient.invalidateQueries({ queryKey: ['player-lecture'] });
    },
  });

  return <YStack flex={1} backgroundColor={BG}>
    <XStack height={62} backgroundColor={TEAL} paddingHorizontal="$4" alignItems="center" gap="$2"><Pressable onPress={() => router.back()} style={{ width: 44, height: 48, justifyContent: 'center' }}><ArrowLeft color="white" size={22} /></Pressable><SizableText color="white" fontSize={18} fontWeight="800">Подписка</SizableText></XStack>
    <YStack flex={1} padding="$5" justifyContent="center" gap="$4">
      <YStack backgroundColor="#F8F9FA" borderRadius={24} padding="$5" gap="$4" borderWidth={1} borderColor="#dceae3">
        <YStack width={54} height={54} borderRadius={18} backgroundColor="#dbece5" alignItems="center" justifyContent="center"><Sparkles color={TEAL} size={27} /></YStack>
        <YStack gap="$2"><SizableText color="#203b35" fontSize={26} fontWeight="800">Лекторий целиком</SizableText><SizableText color="#71847f" fontSize={15} lineHeight={23}>Одна подписка — неограниченный доступ ко всем лекциям и новым материалам.</SizableText></YStack>
        <XStack alignItems="flex-end" gap="$2"><SizableText color={TEAL} fontSize={33} fontWeight="800">990 ₽</SizableText><SizableText color="#71847f" fontSize={14} paddingBottom="$2">/мес</SizableText></XStack>
        <YStack gap="$3">{['Все платные лекции без отдельных покупок', 'Новые материалы в течение срока подписки', 'Доступ на месяц с даты оформления'].map((label) => <XStack key={label} alignItems="center" gap="$2"><Check color={TEAL} size={17} /><SizableText color="#45635d" fontSize={14}>{label}</SizableText></XStack>)}</YStack>
        {isLoading ? <Spinner color={TEAL} /> : null}
        {activeSubscription ? <YStack backgroundColor="#e2eee9" borderRadius={14} padding="$3"><XStack alignItems="center" gap="$2"><Headphones color={TEAL} size={18} /><SizableText color={TEAL} fontSize={14} fontWeight="800">Подписка активна</SizableText></XStack><SizableText color="#5d7971" fontSize={12} marginTop="$1">Действует до {new Date(activeSubscription.expiresAt).toLocaleDateString('ru-RU')}</SizableText></YStack> : null}
        {activate.isError ? <SizableText color="#b44242" fontSize={13}>{activate.error instanceof Error ? activate.error.message : 'Не удалось оформить подписку.'}</SizableText> : null}
        {notice ? <SizableText color={TEAL} fontSize={13} lineHeight={19}>{notice}</SizableText> : null}
        <Button height={52} borderRadius={15} backgroundColor={TEAL} color="white" fontWeight="700" disabled={activate.isPending || isLoading || !!activeSubscription} onPress={() => { if (!user) router.push('/login'); else activate.mutate(); }}>{activate.isPending ? 'Оформляем…' : activeSubscription ? 'Подписка активна' : user ? 'Оформить подписку' : 'Войти и оформить'}</Button>
        <XStack alignItems="center" gap="$2" justifyContent="center"><LockKeyhole color="#78918c" size={14} /><SizableText color="#78918c" fontSize={12} textAlign="center">Оформление записывает месячный доступ в аккаунт.</SizableText></XStack>
      </YStack>
      <SizableText color="#78918c" fontSize={12} lineHeight={18} textAlign="center">Сейчас кнопка активирует доступ в приложении; списание денег и обработка платежей не подключены.</SizableText>
    </YStack>
  </YStack>;
}
