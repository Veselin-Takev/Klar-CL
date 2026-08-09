import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, signInWithPopup, signInWithRedirect, getRedirectResult, signInAnonymously, GoogleAuthProvider, signOut, signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import type { User } from 'firebase/auth';
import { auth, db } from './firebase';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';

interface AuthContextType {
  user: User | null;
  profileData: any | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signInAsGuest: () => Promise<void>;
  signInWithEmail: (email: string, pass: string) => Promise<void>;
  signUpWithEmail: (email: string, pass: string) => Promise<void>;
  logOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  updateProfileData: (data: any) => Promise<void>;
}

let cachedAccessToken: string | null = null;

export const getAccessToken = async (): Promise<string | null> => {
  return cachedAccessToken;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  profileData: null,
  loading: true,
  signInWithGoogle: async () => {},
  signInAsGuest: async () => {},
  signInWithEmail: async () => {},
  signUpWithEmail: async () => {},
  logOut: async () => {},
  refreshProfile: async () => {},
  updateProfileData: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profileData, setProfileData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async (uid: string) => {
    try {
      const docRef = doc(db, 'users', uid);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const newData = docSnap.data();
        setProfileData((prevData: any) => {
          if (prevData && prevData.updatedAt && newData.updatedAt) {
            if (new Date(prevData.updatedAt) > new Date(newData.updatedAt)) {
              return prevData;
            }
          }
          return newData;
        });
      } else {
        setProfileData(null);
      }
    } catch (error: any) {
      console.warn("Failed to fetch profile during fetchProfile", error);
      setProfileData(null);
    }
  };

  const refreshProfile = async () => {
    if (user) {
      await fetchProfile(user.uid);
    }
  };

  const updateProfileData = async (data: any) => {
    if (user) {
      try {
        const docRef = doc(db, 'users', user.uid);
        const updatePayload = {
          ...data,
          updatedAt: new Date().toISOString()
        };
        await updateDoc(docRef, updatePayload);
        setProfileData((prev: any) => prev ? { ...prev, ...updatePayload } : null);
      } catch (error) {
        console.warn("Failed to update user profile", error);
      }
    }
  };

  useEffect(() => {
    const handleRedirect = async () => {
      try {
        const result = await getRedirectResult(auth);
        if (result) {
          const credential = GoogleAuthProvider.credentialFromResult(result);
          if (credential?.accessToken) {
            cachedAccessToken = credential.accessToken;
          }
        }
      } catch (error) {
        console.error("Redirect login error:", error);
      }
    };
    handleRedirect();

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        try {
          const docRef = doc(db, 'users', currentUser.uid);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            const data = docSnap.data();
            if (data) {
              localStorage.setItem("userInterests", JSON.stringify(data.interests || []));
              localStorage.setItem("userGoal", data.goal || "undecided");
              if (data.bio) {
                  localStorage.setItem("klar_user_bio", data.bio);
              }
              setProfileData((prevData: any) => {
                if (prevData && prevData.updatedAt && data.updatedAt) {
                  if (new Date(prevData.updatedAt) > new Date(data.updatedAt)) {
                    return prevData;
                  }
                }
                return data;
              });
            }
          } else {
            // Create initial profile
            const localInterestsStr = localStorage.getItem("userInterests");
            const localInterests = localInterestsStr ? JSON.parse(localInterestsStr) : [];
            const localGoal = localStorage.getItem("userGoal") || "undecided";
            const localBio = localStorage.getItem("klar_user_bio") || "";
            
            const newUser = {
              uid: currentUser.uid,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
              name: currentUser.displayName || 'Neu',
              bio: localBio,
              interests: localInterests,
              goal: localGoal,
              isAdult: true,
              smartMatchAlerts: true
            };
            await setDoc(docRef, newUser);
            setProfileData(newUser);
          }
        } catch (error: any) {
          console.warn("Failed to fetch/create profile, offline?", error);
          setProfileData(null);
        }
      } else {
        setProfileData(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signInWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    provider.addScope('https://www.googleapis.com/auth/gmail.send');
    try {
      // First try popup
      const result = await signInWithPopup(auth, provider);
      const credential = GoogleAuthProvider.credentialFromResult(result);
      if (credential?.accessToken) {
        cachedAccessToken = credential.accessToken;
      }
    } catch (error: any) {
      console.error("Error signing in with Google", error);
      if (error.code === 'auth/popup-closed-by-user' || error.code === 'auth/popup-blocked') {
        // Fallback to redirect
        await signInWithRedirect(auth, provider);
      } else {
        throw error;
      }
    }
  };

  const signInAsGuest = async () => {
    try {
      await signInAnonymously(auth);
    } catch (error) {
      console.error("Error signing in as guest", error);
      throw error;
    }
  };

  const signInWithEmail = async (email: string, pass: string) => {
    try {
      await signInWithEmailAndPassword(auth, email, pass);
    } catch (error) {
      console.error("Error signing in with email", error);
      throw error;
    }
  };

  const signUpWithEmail = async (email: string, pass: string) => {
    try {
      await createUserWithEmailAndPassword(auth, email, pass);
    } catch (error) {
      console.error("Error signing up with email", error);
      throw error;
    }
  };

  const logOut = async () => {
    try {
      await signOut(auth);
      cachedAccessToken = null;
    } catch (error) {
      console.error("Error signing out", error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, profileData, loading, signInWithGoogle, signInAsGuest, signInWithEmail, signUpWithEmail, logOut, refreshProfile, updateProfileData }}>
      {children}
    </AuthContext.Provider>
  );
};
