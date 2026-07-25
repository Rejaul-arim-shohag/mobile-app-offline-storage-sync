import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import { SUPABSE_PUBLISHABLE_KEY, SUPABSE_URL } from '@env';

export const supabase = createClient(SUPABSE_URL, SUPABSE_PUBLISHABLE_KEY, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
