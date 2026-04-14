import { create } from "zustand";

export type UserProfile = {
  id: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  avatar_url: string | null;
  aadhaar_verified: boolean | null;
  dl_verified: boolean | null;
};

type UserState = {
  profile: UserProfile | null;

  setProfile: (profile: UserProfile) => void;
  updateProfile: (data: Partial<UserProfile>) => void;
  clearProfile: () => void;
};

const useUser = create<UserState>((set) => ({
  profile: null,

  setProfile: (profile) => set({ profile }),

  updateProfile: (data) =>
    set((state) => ({
      profile: state.profile ? { ...state.profile, ...data } : null,
    })),

  clearProfile: () => set({ profile: null }),
}));

export default useUser;
