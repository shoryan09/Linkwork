import React, { createContext, useContext, useEffect, useState } from "react";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User as FirebaseUser,
} from "firebase/auth";
import { auth } from "@/lib/firebase";
import api from "@/lib/api";
import { socket } from "@/lib/socket";

interface User {
  id: string;
  email: string;
  displayName: string;
  role: "client" | "freelancer" | "both";
  profile?: any;
  rating?: {
    average: number;
    count: number;
  };
}

interface AuthContextType {
  user: User | null;
  firebaseUser: FirebaseUser | null;
  loading: boolean;
  signup: (
    email: string,
    password: string,
    displayName: string,
    role: string
  ) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          // Only fetch profile if user is not already set
          // This prevents refetching during login
          if (!user) {
            const token = await firebaseUser.getIdToken();
            const response = await api.get("/auth/profile", {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            });
            setUser(response.data);
            setFirebaseUser(firebaseUser);
          }
        } catch (error: any) {
          console.error("Error fetching user profile:", error);
          setUser(null);
          setFirebaseUser(null);
        }
      } else {
        setUser(null);
        setFirebaseUser(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  // Listen for real-time rating updates
  useEffect(() => {
    if (!user) return;

    const handleRatingUpdate = (data: { userId: string; rating: { average: number; count: number } }) => {
      if (data.userId === user.id) {
        setUser((prevUser) => {
          if (!prevUser) return null;
          return {
            ...prevUser,
            rating: data.rating,
          };
        });
      }
    };

    socket.on("rating:updated", handleRatingUpdate);

    return () => {
      socket.off("rating:updated", handleRatingUpdate);
    };
  }, [user?.id]);

  const signup = async (
    email: string,
    password: string,
    displayName: string,
    role: string
  ) => {
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      email,
      password
    );

    await api.post("/auth/signup", {
      firebaseUid: userCredential.user.uid,
      email,
      displayName,
      role,
    });

    const response = await api.get("/auth/profile");
    setUser(response.data);
  };

  const login = async (email: string, password: string) => {
    try {
      // Sign in with Firebase
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      
      // Get token immediately
      const token = await userCredential.user.getIdToken(true);
      
      // Fetch profile directly with the token
      const response = await api.get("/auth/profile", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      
      setUser(response.data);
      setFirebaseUser(userCredential.user);
    } catch (error: any) {
      // Handle errors
      console.error("Login error:", error);
      throw error;
    }
  };

  const logout = async () => {
    await signOut(auth);
    setUser(null);
    setFirebaseUser(null);
  };

  return (
    <AuthContext.Provider
      value={{ user, firebaseUser, loading, signup, login, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
};
