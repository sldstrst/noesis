import { useEffect, useState } from 'react';
import { Modal, Pressable } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Image } from 'expo-image';
import { Camera, XStack, YStack, SizableText, Button, Input } from '@blinkdotnew/mobile-ui';
import { blink } from '@/lib/blink';

const TEAL = '#3a8378';
const PALE = '#e8f3ef';

type Props = {
  visible: boolean;
  userId: string;
  initialName: string;
  avatarUrl?: string | null;
  onClose: () => void;
  onSaved: () => void;
};

export default function ProfileEditorModal({ visible, userId, initialName, avatarUrl, onClose, onSaved }: Props) {
  const [name, setName] = useState(initialName);
  const [imageUri, setImageUri] = useState<string | null>(avatarUrl ?? null);
  const [pendingAsset, setPendingAsset] = useState<ImagePicker.ImagePickerAsset | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (visible) { setName(initialName); setImageUri(avatarUrl ?? null); setPendingAsset(null); setError(''); }
  }, [visible, initialName, avatarUrl]);

  async function chooseAvatar() {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) { setError('Разрешите доступ к фотографиям, чтобы выбрать аватар.'); return; }
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsEditing: true, aspect: [1, 1], quality: 0.85 });
    if (!result.canceled && result.assets[0]) {
      setPendingAsset(result.assets[0]);
      setImageUri(result.assets[0].uri);
    }
  }

  async function save() {
    if (!name.trim()) { setError('Введите имя профиля.'); return; }
    setBusy(true); setError('');
    try {
      let avatar = avatarUrl ?? undefined;
      if (pendingAsset) {
        const response = await fetch(pendingAsset.uri);
        if (!response.ok) throw new Error('Не удалось прочитать выбранное изображение.');
        const imageBlob = await response.blob();
        const extension = pendingAsset.mimeType?.split('/')[1]?.split('+')[0] || 'jpg';
        const uploaded = await blink.storage.upload(imageBlob, `avatars/${userId}-${Date.now()}.${extension}`);
        avatar = uploaded.publicUrl;
      }
      await blink.auth.updateMe({ displayName: name.trim(), ...(avatar ? { avatar } : {}) });
      onSaved();
      onClose();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Не удалось сохранить профиль.');
    } finally { setBusy(false); }
  }

  return <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
    <YStack flex={1} backgroundColor="#00000088" justifyContent="flex-end">
      <Pressable accessibilityLabel="Закрыть редактирование профиля" onPress={onClose} style={{ flex: 1 }} />
      <YStack backgroundColor="#F8F9FA" borderTopLeftRadius={24} borderTopRightRadius={24} padding="$5" gap="$4">
        <XStack alignItems="center" justifyContent="space-between"><SizableText color="#203b35" fontSize={20} fontWeight="800">Редактировать профиль</SizableText><Pressable onPress={onClose} style={{ width: 44, height: 44, alignItems: 'center', justifyContent: 'center' }}><XStack><SizableText color={TEAL} fontSize={18}>×</SizableText></XStack></Pressable></XStack>
        <YStack alignItems="center"><Pressable onPress={chooseAvatar} accessibilityRole="button" accessibilityLabel="Загрузить аватар" style={{ width: 92, height: 92, borderRadius: 46, backgroundColor: PALE, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' }}>{imageUri ? <Image source={{ uri: imageUri }} contentFit="cover" style={{ width: 92, height: 92 }} /> : <Camera color={TEAL} size={28} />}</Pressable><SizableText color={TEAL} fontSize={12} fontWeight="700" marginTop="$2">Изменить аватар</SizableText></YStack>
        <YStack gap="$2"><SizableText color="#45635d" fontSize={12} fontWeight="700">Имя</SizableText><Input value={name} onChangeText={setName} height={48} backgroundColor={PALE} borderWidth={0} borderRadius={13} color="#203b35" placeholder="Ваше имя" /></YStack>
        {error ? <SizableText color="#b44242" fontSize={12} lineHeight={18}>{error}</SizableText> : null}
        <Button height={50} borderRadius={14} backgroundColor={TEAL} color="white" fontWeight="700" disabled={busy} onPress={save}>{busy ? 'Сохраняем…' : 'Сохранить профиль'}</Button>
      </YStack>
    </YStack>
  </Modal>;
}
