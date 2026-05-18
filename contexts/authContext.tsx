// context/authContext.tsx
import { userData } from '@/app/store/userStore';
import { getUserInfo, getUserRoleById } from '@/hooks/auth';
import { useRouter } from 'expo-router';
import { onAuthStateChanged, User } from 'firebase/auth';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { auth } from '../firebase/firebase';
// Define context type
type AuthContextType = {
  user: User | null;
  loading: boolean;
  error: string | null;
};

// Create context with default `null`
const AuthContext = createContext<AuthContextType | null>(null);

// AuthProvider wraps your entire app
export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState({});
  const { setUserRole, setUserId, setUserInfo } = userData.getState();

  const router = useRouter();
  useEffect(() => {
    let timeoutId = setTimeout(() => {
      // console.log('[authContext] Timeout reached, setting loading to false');
      setLoading(false);
    }, 10000);

    const unsubscribe = onAuthStateChanged(
      auth,
      async (currentUser) => {
        console.log('[authContext] onAuthStateChanged fired. user=', currentUser?.email ?? 'none');
        if (currentUser) {
          try {
            const userInfo: any = await getUserInfo(currentUser.uid);
            if (userInfo) {
              setUserRole(userInfo.role);
              setUserInfo(userInfo);
            } else {
              console.warn('[authContext] No user document for uid:', currentUser.uid);
            }
            setUserId(currentUser.uid);
            setUser(currentUser);
          } catch (e) {
            console.warn('[authContext] Failed to load user info:', e);
          } finally {
            setLoading(false);
            clearTimeout(timeoutId);
            console.log('[authContext] Navigating to /screens/HomeScreen');
            router.replace('/screens/HomeScreen');
          }
        } else {
          setLoading(false);
          clearTimeout(timeoutId);
          router.replace('/screens/SelectRoleScreen');
        }
      },
      (err) => {
        console.error('[authContext] Auth error:', err);
        setError(err.message);
        setLoading(false);
        clearTimeout(timeoutId);
        router.replace('/screens/SelectRoleScreen');
      }
    );

    return () => {
      clearTimeout(timeoutId);
      unsubscribe();
    };
  }, []); // 👈 run only once



  return (
    <AuthContext.Provider value={{ user, loading, error }}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook for using the auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
