import { Directory, File, Paths } from 'expo-file-system';
import { blink } from '@/lib/blink';
import type { DownloadsRow } from '@/lib/db-types';

function audioExtension(url: string) {
  const pathname = url.split('?')[0];
  const candidate = pathname.slice(pathname.lastIndexOf('.') + 1).toLowerCase();
  return /^[a-z0-9]{2,5}$/.test(candidate) ? candidate : 'mp3';
}

export async function saveLectureAudio({ lectureId, audioUrl, userId, existing }: {
  lectureId: string;
  audioUrl: string;
  userId: string;
  existing: DownloadsRow[];
}) {
  const saved = existing.find((row) => row.lectureId === lectureId && row.localUri);
  if (saved?.localUri && new File(saved.localUri).exists) return saved.localUri;

  const directory = new Directory(Paths.document, 'noesis-audio');
  directory.create({ idempotent: true, intermediates: true });
  const file = new File(directory, `${lectureId}.${audioExtension(audioUrl)}`);
  const downloaded = await File.downloadFileAsync(audioUrl, file, { idempotent: true });
  if (!downloaded?.exists) throw new Error('Файл лекции не удалось сохранить. Проверьте подключение и попробуйте ещё раз.');

  await blink.db.table<DownloadsRow>('downloads').create({
    userId,
    lectureId,
    localUri: downloaded.uri,
  });
  return downloaded.uri;
}
