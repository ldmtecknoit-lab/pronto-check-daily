import { useEffect, useState } from 'react'
import { User } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import { useToast } from '@/hooks/use-toast'

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null)
        setLoading(false)
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password
      })
      
      if (error) {
        toast({
          variant: "destructive",
          title: "Errore di accesso",
          description: error.message
        })
        return false
      }
      
      toast({
        title: "Accesso effettuato",
        description: "Benvenuto!"
      })
      return true
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Errore",
        description: "Si è verificato un errore durante l'accesso"
      })
      return false
    }
  }

  const signUp = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password
      })
      
      if (error) {
        toast({
          variant: "destructive",
          title: "Errore di registrazione",
          description: error.message
        })
        return false
      }
      
      toast({
        title: "Registrazione completata",
        description: "Controlla la tua email per confermare l'account"
      })
      return true
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Errore",
        description: "Si è verificato un errore durante la registrazione"
      })
      return false
    }
  }

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut()
      
      if (error) {
        toast({
          variant: "destructive",
          title: "Errore",
          description: error.message
        })
        return false
      }
      
      toast({
        title: "Disconnesso",
        description: "A presto!"
      })
      return true
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Errore",
        description: "Si è verificato un errore durante la disconnessione"
      })
      return false
    }
  }

  return {
    user,
    loading,
    signIn,
    signUp,
    signOut
  }
}