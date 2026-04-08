import { create } from 'zustand';

type UserStore = {
  userRole: string;
  userId: string;
  userInfo: any;
  setUserId: (id: string) => void;
  setUserRole: (role: string) => void;
  setUserInfo: (info: any) => void;
};

export const userData = create<UserStore>((set) => ({
  userId: "",
  userRole: "",
  userInfo: null,
  setUserId: (id) => set((state) => {
    return { userId: id }
  }),
  setUserRole: (role) => set((state) => {
    return { userRole: role }
  }),
  setUserInfo: (info) => set((state) => {
    return { userInfo: info }
  }),
}));