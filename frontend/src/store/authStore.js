import { create } from 'zustand'
import { persist } from 'zustand/middleware'

const useAuthStore = create(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      
      login: (userData, token) => {
        set({ 
          user: userData, 
          token, 
          isAuthenticated: true 
        })
      },
      
      logout: () => {
        set({ 
          user: null, 
          token: null, 
          isAuthenticated: false 
        })
      },
      
      updateUser: (userData) => {
        set({ user: userData })
      },
    }),
    {
      name: 'auth-storage',
      // persist 옵션: 상태가 복원되면 isAuthenticated도 자동으로 설정
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.user !== null && state.token !== null
      }),
    }
  )
)

export default useAuthStore

