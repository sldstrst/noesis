// Auto-generated from your database schema — do not edit by hand.
// Regenerates automatically whenever a table is created or altered.

export type AuthorsRow = {
  id: string
  name: string
  avatarUrl: string | null
  bio: string | null
}

export type CategoriesRow = {
  id: string
  name: string
}

export type DownloadsRow = {
  id: string
  userId: string
  lectureId: string
  localUri: string | null
  createdAt: string
}

export type LectureCategoriesRow = {
  lectureId: string
  categoryId: string
}

export type LecturesRow = {
  id: string
  title: string
  description: string
  audioUrl: string
  coverUrl: string | null
  isFree: boolean
  price: number | string
  durationSeconds: number | string
  transcript: string | null
  authorId: string
}

export type PurchasesRow = {
  id: string
  userId: string
  lectureId: string
  createdAt: string
}

export type PushTokensRow = {
  id: string
  userId: string
  token: string
  createdAt: string
}

export type SavedLecturesRow = {
  id: string
  userId: string
  lectureId: string
  createdAt: string
}

export type SubscriptionsRow = {
  id: string
  userId: string
  status: string
  planType: string
  startedAt: string
  expiresAt: string
}

export type UsersRow = {
  id: string
  email: string
  emailVerified: number | string | null
  displayName: string | null
  avatarUrl: string | null
  phone: string | null
  phoneVerified: number | string | null
  role: string | null
  metadata: string | null
  createdAt: string
  updatedAt: string
  lastSignIn: string
}
