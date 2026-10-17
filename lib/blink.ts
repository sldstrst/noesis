import * as WebBrowser from 'expo-web-browser'
import * as Linking from 'expo-linking'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { createClient, AsyncStorageAdapter } from '@blinkdotnew/sdk'

export const blink = createClient({
  projectId: process.env.EXPO_PUBLIC_BLINK_PROJECT_ID || 'noesis-lectures-app-vr7oaeah',
  publishableKey: process.env.EXPO_PUBLIC_BLINK_PUBLISHABLE_KEY || 'blnk_pk_390YAsPmQDxM1Qr3ushrJgN2AZzBr0gc',
  authRequired: false,
  auth: { mode: 'headless', webBrowser: WebBrowser, linking: Linking },
  storage: new AsyncStorageAdapter(AsyncStorage),
})
