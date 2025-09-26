import Dashboard from "../components/Dashboard";
import AuthLayout from "../components/AuthLayout";
import SupabaseConfig from "../components/SupabaseConfig";

const Index = () => {
  // Controlla se Supabase è configurato
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
  
  const isConfigured = supabaseUrl && 
                      supabaseAnonKey && 
                      supabaseUrl !== 'https://your-project-ref.supabase.co' && 
                      supabaseAnonKey !== 'your-anon-key';

  if (!isConfigured) {
    return <SupabaseConfig />;
  }

  return (
    <AuthLayout>
      <Dashboard />
    </AuthLayout>
  );
};

export default Index;