import { useState } from 'react';
import { router } from 'expo-router';
import { ArrowLeft, Eye, LockKeyhole, Mail, YStack, XStack, SizableText, Button, Input } from '@blinkdotnew/mobile-ui';
import { Pressable } from 'react-native';
import { blink } from '@/lib/blink';
import { registerForPushNotifications } from '@/lib/pushNotifications';

const BG = '#e8f3ef'; const CARD = '#F8F9FA'; const TEAL = '#3a8378';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [creating, setCreating] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  async function submit() {
    setMessage(''); setBusy(true);
    try {
      if (creating) await blink.auth.signUp({ email: email.trim().toLowerCase(), password });
      else await blink.auth.signInWithEmail(email.trim().toLowerCase(), password);
      const user = await blink.auth.me();
      if (user?.id) void registerForPushNotifications(user.id).catch((reason) => console.warn('Push registration failed:', reason));
      router.back();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Не удалось войти. Проверьте данные и попробуйте ещё раз.');
    } finally { setBusy(false); }
  }
  return <YStack flex={1} backgroundColor={BG} padding="$5" justifyContent="center" gap="$5">
    <Pressable onPress={() => router.back()} style={{ position: 'absolute', top: 24, left: 20, width: 48, height: 48, justifyContent: 'center' }}><ArrowLeft color={TEAL} size={22} /></Pressable>
    <YStack alignItems="center" gap="$3"><YStack width={72} height={72} borderRadius={24} backgroundColor={TEAL} alignItems="center" justifyContent="center"><Eye color="white" size={37} /></YStack>
      <SizableText color="#203b35" fontSize={23} fontWeight="800">{creating ? 'Создать аккаунт' : 'Рады вас видеть'}</SizableText><SizableText color="#71847f" fontSize={14} textAlign="center">Ваша библиотека идей всегда под рукой</SizableText>
    </YStack>
    <YStack backgroundColor={CARD} borderRadius={22} padding="$4" gap="$3">
      <YStack gap="$2"><SizableText color="#45635d" fontSize={12} fontWeight="700">Электронная почта</SizableText><XStack alignItems="center" backgroundColor="#f0f5f2" borderRadius={13} paddingHorizontal="$3" gap="$2"><Mail color="#78918c" size={18} /><Input flex={1} height={48} borderWidth={0} backgroundColor="transparent" color="#203b35" placeholder="name@example.com" placeholderTextColor="#90a29d" keyboardType="email-address" autoCapitalize="none" autoCorrect={false} value={email} onChangeText={setEmail} /></XStack></YStack>
      <YStack gap="$2"><SizableText color="#45635d" fontSize={12} fontWeight="700">Пароль</SizableText><XStack alignItems="center" backgroundColor="#f0f5f2" borderRadius={13} paddingHorizontal="$3" gap="$2"><LockKeyhole color="#78918c" size={18} /><Input flex={1} height={48} borderWidth={0} backgroundColor="transparent" color="#203b35" placeholder="Введите пароль" placeholderTextColor="#90a29d" secureTextEntry value={password} onChangeText={setPassword} /></XStack></YStack>
      {message ? <SizableText color="#b44242" fontSize={12} lineHeight={18}>{message}</SizableText> : null}
      <Button height={50} borderRadius={14} backgroundColor={TEAL} color="white" fontWeight="700" marginTop="$1" disabled={busy || !email || !password} onPress={submit}>{busy ? 'Подождите…' : creating ? 'Зарегистрироваться' : 'Войти'}</Button>
      {!creating ? <Button chromeless alignSelf="flex-end" padding="$1" color={TEAL} fontSize={12} fontWeight="700" onPress={() => router.push('/forgot-password')}>Забыли пароль?</Button> : null}
      <XStack alignItems="center" justifyContent="center" gap="$1"><SizableText color="#71847f" fontSize={13}>{creating ? 'Уже есть аккаунт?' : 'Впервые в лектории?'}</SizableText><Button chromeless padding="$1" color={TEAL} fontWeight="700" onPress={() => { setCreating(!creating); setMessage(''); }}>{creating ? 'Войти' : 'Создать аккаунт'}</Button></XStack>
    </YStack>
    <XStack alignItems="center" justifyContent="center" gap="$2"><Eye color="#78918c" size={14} /><SizableText color="#78918c" fontSize={11}>Ваши данные защищены</SizableText></XStack>
  </YStack>;
}
