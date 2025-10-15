export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          password: string
          emailVerified: boolean
          accountCreatedDate: string
          subscriptionTier: string
          lastLoginDate: string
        }
        Insert: {
          id?: string
          email: string
          password: string
          emailVerified?: boolean
          accountCreatedDate: string
          subscriptionTier: string
          lastLoginDate: string
        }
        Update: {
          id?: string
          email?: string
          password?: string
          emailVerified?: boolean
          accountCreatedDate?: string
          subscriptionTier?: string
          lastLoginDate?: string
        }
      }
      // Add other tables as needed
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}