import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Récupérer les variables d'environnement Supabase
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Vérifier que les variables d'environnement sont définies
const hasSupabaseConfig = supabaseUrl && supabaseAnonKey;

if (!hasSupabaseConfig) {
  console.warn('⚠️ Les variables d\'environnement Supabase ne sont pas définies. Mode démo activé.');
} else {
  console.log('✅ Variables d\'environnement Supabase trouvées');
}

// Créer le client Supabase uniquement si les variables sont définies
// Sinon, créer un client factice qui ne fera rien
export const supabase: SupabaseClient | any = hasSupabaseConfig
  ? createClient(supabaseUrl, supabaseAnonKey)
  : {
      from: () => ({
        select: () => ({ data: null, error: new Error('Mode démo - Supabase non configuré') }),
        insert: () => ({ data: null, error: new Error('Mode démo - Supabase non configuré') }),
        update: () => ({ data: null, error: new Error('Mode démo - Supabase non configuré') }),
        delete: () => ({ data: null, error: new Error('Mode démo - Supabase non configuré') }),
      }),
      auth: {
        signUp: () => Promise.resolve({ data: null, error: new Error('Mode démo - Supabase non configuré') }),
        signInWithPassword: () => Promise.resolve({ data: null, error: new Error('Mode démo - Supabase non configuré') }),
        signOut: () => Promise.resolve({ error: null }),
        getSession: () => Promise.resolve({ data: { session: null }, error: null }),
        onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
      },
    };

// Fonction pour tester la connexion
export const testSupabaseConnection = async () => {
  try {
    // Essayer de se connecter à Supabase
    const { data, error } = await supabase.from('sample_clients').select('*').limit(1);
    
    if (error) throw error;
    
    return {
      success: true,
      message: 'Connexion à Supabase réussie',
      data
    };
  } catch (error) {
    console.error('❌ Erreur de connexion à Supabase:', error);
    return {
      success: false,
      message: 'Mode démo activé - Utilisation des données fictives',
      error
    };
  }
};