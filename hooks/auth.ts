import { 
    auth, 
    createUserWithEmailAndPassword, 
    firestore, 
    signInWithEmailAndPassword, 
    signOut 
} from "../firebase/firebase";
import { 
    doc, 
    getDoc, 
    setDoc 
} from 'firebase/firestore';

import { 
    EmailAuthProvider, 
    reauthenticateWithCredential, 
    updateEmail, 
    updatePassword,
    sendPasswordResetEmail   // ✅ import this
} from "firebase/auth";

// ====================
// Sign Up
// ====================
export const signUp = async (email: string, password: string) => {
    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        return { user: userCredential.user, error: null };
    } catch (error) {
        console.log(error);
        return { user: null, error };
    }
};

// ====================
// Sign In
// ====================
export const signIn = async (email: string, password: string) => {
    try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        return { user: userCredential.user, error: null };
    } catch (error) {
        console.log(error)
        return { user: null, error };
    }
};

// ====================
// Create User Document
// ====================
export const createUserDocument = async (user: any, userRole: string, language: string) => {
    if (!user || !firestore) {
        return;
    }
    try {
        const userRef = doc(firestore, 'users', user.uid);
        const { email } = user;
        await setDoc(userRef, {
            uid: user.uid,
            email,
            role: userRole,
            language: language,
            gps_traking: true,
            createdAt: new Date().getTime(),
        });
    } catch (err) {}
};

// ====================
// Get User Role
// ====================
export const getUserRoleById = async (userId: string) => {
    if (!userId || !firestore) return null;
  
    try {
        const userRef = doc(firestore, "users", userId);
        const userSnap = await getDoc(userRef);
  
        if (userSnap.exists()) {
            const userData = userSnap.data();
            return userData.role || null;
        } else {
            console.warn("No user found with ID:", userId);
            return null;
        }
    } catch (error) {
        console.error("Error getting user role:", error);
        return null;
    }
};

// ====================
// Get User Info
// ====================
export const getUserInfo = async (userId: string) => {
    if (!userId || !firestore) return null;
  
    try {
        const userRef = doc(firestore, "users", userId);
        const userSnap = await getDoc(userRef);
  
        if (userSnap.exists()) {
            return {
                id: userSnap.id,
                ...userSnap.data(),
            };
        } else {
            console.warn("No user found with ID:", userId);
            return null;
        }
    } catch (error) {
        console.error("Error fetching user info:", error);
        return null;
    }
};

// ====================
// 🔑 Reauthentication
// ====================
export const reauthenticateUser = async (currentPassword: string) => {
    try {
        const user = auth.currentUser;
        if (!user || !user.email) throw new Error("No authenticated user");

        const credential = EmailAuthProvider.credential(user.email, currentPassword);
        await reauthenticateWithCredential(user, credential);
        return { success: true, error: null };
    } catch (error) {
        console.error("Reauthentication error:", error);
        return { success: false, error };
    }
};

// ====================
// 🔑 Update Email
// ====================
export const updateUserEmail = async (newEmail: string) => {
    try {
        const user = auth.currentUser;
        if (!user) throw new Error("No authenticated user");

        await updateEmail(user, newEmail);
        return { success: true, error: null };
    } catch (error) {
        console.error("Update email error:", error);
        return { success: false, error };
    }
};

// ====================
// 🔑 Update Password
// ====================
export const updateUserPassword = async (newPassword: string) => {
    try {
        const user = auth.currentUser;
        if (!user) throw new Error("No authenticated user");

        await updatePassword(user, newPassword);
        return { success: true, error: null };
    } catch (error) {
        console.error("Update password error:", error);
        return { success: false, error };
    }
};

// ====================
// 🔄 Update User Info (Firestore)
// ====================
export const updateUserInfo = async (userId: string, data: any) => {
    if (!userId || !firestore) return { success: false, error: "Invalid userId" };

    try {
        const userRef = doc(firestore, "users", userId);

        await setDoc(
            userRef,
            {
                ...data,
                updatedAt: new Date().getTime(),
            },
            { merge: true } // 🔑 prevents overwriting the whole document
        );

        return { success: true, error: null };
    } catch (error) {
        console.error("Error updating user info:", error);
        return { success: false, error };
    }
};

// ====================
// 🔑 Forgot Password
// ====================
export const forgotPassword = async (email: string) => {
    try {
        if (!email) throw new Error("Email is required");

        await sendPasswordResetEmail(auth, email)
        .then(() => console.log("Password reset email sent to:", email))
        .catch(err => console.error("Reset error:", err));

        return { success: true, error: null };
    } catch (error) {
        console.error("Forgot password error:", error);
        return { success: false, error };
    }
};

// ====================
// Sign Out
// ====================
export const signOutUser = async () => {
    try {
        await signOut(auth);
        return { error: null };
    } catch (error) {
        return { error };
    }
};
