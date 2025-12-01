import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../firebase/firebaseConfig';

const AuthContext = createContext();

export function useAuth() {
	return useContext(AuthContext);
}

export function AuthProvider({ children }) {
	const [user, setUser] = useState(null);
	const [role, setRole] = useState('guest');
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		const unreg = onAuthStateChanged(auth, async (u) => {
			if (u) {
				setUser(u);
				try {
					const userDoc = await getDoc(doc(db, 'users', u.uid));
					if (userDoc.exists()) {
						const data = userDoc.data();
						setRole(data.role || 'client');
					} else {
						setRole('client');
					}
				} catch (err) {
					console.error('Error reading role from Firestore', err);
					setRole('client');
				}
			} else {
				setUser(null);
				setRole('guest');
			}
			setLoading(false);
		});

		return () => unreg();
	}, []);

	const logout = () => signOut(auth);

	const value = { user, role, loading, logout };
	return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

