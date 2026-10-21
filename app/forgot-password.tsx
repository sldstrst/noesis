import { useState } from 'react';
import { Pressable } from 'react-native';
import { router } from 'expo-router';
import { ArrowLeft, Mail, YStack, XStack, SizableText, Button, Input } from '@blinkdotnew/mobile-ui';
import { blink } from '@/lib/blink';

const BG = '#e8f3ef';
const CARD = '#F8F9FA';
const TEAL = '#3a8378';

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);

  async function sendResetLink() {
    setBusy(true);
    setError('');
    try {
      await blink.auth.sendPasswordResetEmail(email.trim().toLowerCase());
      setSent(true);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Не удалось отправить письмо. Попробуйте ещё раз.');
    } finally {
      setBusy(false);
    }
  }

  return <YStack flex={1} backgroundColor={BG} padding="$5" justifyContent="center" gap="$5">
    <Pressable onPress={() => router.back()} accessibilityLabel="Назад" style={{ position: 'absolute', top: 24, left: 20, width: 48, height: 48, justifyContent: 'center' }}><ArrowLeft color={TEAL} size={22} /></Pressable>
    <YStack gap="$2"><SizableText color="#203b35" fontSize={25} fontWeight="800">Сброс пароля</SizableText><SizableText color="#71847f" fontSize={14} lineHeight={21}>Укажите адрес электронной почты — мы отправим ссылку для создания нового пароля.</SizableText></YStack>
    <YStack backgroundColor={CARD} borderRadius={22} padding="$4" gap="$3">
      <SizableText color="#45635d" fontSize={12} fontWeight="700">Электронная почта</SizableText>
      <XStack alignItems="center" backgroundColor="#f0f5f2" borderRadius={13} paddingHorizontal="$3" gap="$2"><Mail color="#78918c" size={18} /><Input flex={1} height={48} borderWidth={0} backgroundColor="transparent" color="#203b35" placeholder="name@example.com" placeholderTextColor="#90a29d" keyboardType="email-address" autoCapitalize="none" autoCorrect={false} value={email} onChangeText={setEmail} /></XStack>
      {error ? <SizableText color="#b44242" fontSize={12} lineHeight={18}>{error}</SizableText> : null}
      {sent ? <YStack backgroundColor="#e2eee9" borderRadius={12} padding="$3"><SizableText color={TEAL} fontSize={13} lineHeight={20}>Если для этого адреса есть аккаунт, письмо со ссылкой уже отправлено.</SizableText></YStack> : <Button height={50} borderRadius={14} backgroundColor={TEAL} color="white" fontWeight="700" disabled={busy || !email.trim()} onPress={sendResetLink}>{busy ? 'Отправляем…' : 'Отправить ссылку'}</Button>}
    </YStack>
  </YStack>;
}
