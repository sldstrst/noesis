import { Pressable, Linking } from 'react-native';
import { router } from 'expo-router';
import { useState } from 'react';
import { Image } from 'expo-image';
import { ArrowLeft, Globe2, Send, Users, YStack, XStack, SizableText } from '@blinkdotnew/mobile-ui';

const BG = '#e8f3ef';
const TEAL = '#3a8378';
const LINKS = {
  telegram: 'https://t.me/noesis_lectory',
  vk: 'https://vk.com/noesis_lectory',
  website: 'https://noesis-lectory.ru',
};

export default function AboutScreen() {
  const [error, setError] = useState('');
  async function open(url: string) {
    setError('');
    try { await Linking.openURL(url); }
    catch (reason) { setError(reason instanceof Error ? reason.message : 'Не удалось открыть ссылку.'); }
  }

  return <YStack flex={1} backgroundColor={BG}>
    <XStack height={62} backgroundColor={TEAL} paddingHorizontal="$4" alignItems="center" gap="$2"><Pressable onPress={() => router.back()} style={{ width: 44, height: 48, justifyContent: 'center' }}><ArrowLeft color="white" size={22} /></Pressable><SizableText color="white" fontSize={18} fontWeight="800">О приложении</SizableText></XStack>
    <YStack flex={1} padding="$5" justifyContent="center">
      <YStack backgroundColor="#F8F9FA" borderRadius={24} padding="$5" alignItems="center" gap="$4" borderWidth={1} borderColor="#dceae3">
        <YStack width={132} height={112} borderRadius={18} backgroundColor="#e8f3ef" overflow="hidden" alignItems="center" justifyContent="center"><Image source={require('../assets/images/icon.png')} contentFit="contain" style={{ width: 112, height: 96 }} accessibilityLabel="Логотип НОЭЗИС.ЛЕКТОРИЙ" /></YStack>
        <YStack alignItems="center" gap="$2"><SizableText color={TEAL} fontSize={21} fontWeight="800" textAlign="center">НОЭЗИС.ЛЕКТОРИЙ</SizableText><SizableText color="#5d7971" fontSize={14} lineHeight={22} textAlign="center">Лекторий знаний и идей. Пространство аудиолекций, которые помогают лучше понимать мир и себя.</SizableText></YStack>
        <Pressable onPress={() => open(LINKS.telegram)} style={({ pressed }) => ({ minHeight: 50, width: '100%', backgroundColor: pressed ? '#326f66' : TEAL, borderRadius: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 9, transform: [{ scale: pressed ? 0.98 : 1 }] })}><Send color="white" size={18} /><SizableText color="white" fontSize={14} fontWeight="700">Telegram</SizableText></Pressable>
        <XStack width="100%" gap="$2"><Pressable onPress={() => open(LINKS.vk)} style={({ pressed }) => ({ flex: 1, minHeight: 48, borderRadius: 14, borderWidth: 1, borderColor: TEAL, backgroundColor: pressed ? '#e2eee9' : 'transparent', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7 })}><Users color={TEAL} size={17} /><SizableText color={TEAL} fontSize={14} fontWeight="700">ВКонтакте</SizableText></Pressable><Pressable onPress={() => open(LINKS.website)} style={({ pressed }) => ({ flex: 1, minHeight: 48, borderRadius: 14, borderWidth: 1, borderColor: TEAL, backgroundColor: pressed ? '#e2eee9' : 'transparent', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7 })}><Globe2 color={TEAL} size={17} /><SizableText color={TEAL} fontSize={14} fontWeight="700">Сайт</SizableText></Pressable></XStack>
        {error ? <SizableText color="#b44242" fontSize={12} textAlign="center">{error}</SizableText> : null}
      </YStack>
    </YStack>
  </YStack>;
}
