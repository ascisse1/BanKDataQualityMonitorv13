# Guide de déploiement sur Netlify - BSIC Bank

## Configuration automatique (Mode Démo)

L'application est configurée pour fonctionner automatiquement en mode démo sur Netlify sans configuration supplémentaire. Le fichier `netlify.toml` définit `VITE_DEMO_MODE=true` par défaut.

## Redéploiement

Pour redéployer l'application et appliquer les changements (nouveau logo BSIC Bank, etc.) :

1. **Via Git** : Poussez vos modifications vers votre dépôt Git
   ```bash
   git add .
   git commit -m "Mise à jour pour BSIC Bank"
   git push
   ```
   Netlify détectera automatiquement les changements et redéploiera.

2. **Via l'interface Netlify** :
   - Connectez-vous à https://app.netlify.com
   - Sélectionnez votre site
   - Cliquez sur "Deploys" > "Trigger deploy" > "Deploy site"

## Configuration avancée (optionnelle)

Si vous souhaitez utiliser Supabase au lieu du mode démo :

1. Connectez-vous à votre tableau de bord Netlify
2. Allez dans "Site settings" > "Environment variables"
3. Supprimez ou modifiez `VITE_DEMO_MODE` à `false`
4. Ajoutez les variables suivantes :
   - `VITE_SUPABASE_URL` : Votre URL Supabase
   - `VITE_SUPABASE_ANON_KEY` : Votre clé anonyme Supabase

## Vérification du déploiement

Après le déploiement, vérifiez que :
- ✅ Le logo BSIC Bank s'affiche correctement
- ✅ L'application charge sans erreurs
- ✅ Vous pouvez vous connecter avec les comptes de démonstration
- ✅ Les données de démonstration s'affichent dans tous les écrans

## Comptes de démonstration disponibles

### Authentification locale
- **Administrateur** : `admin` / `admin123`
- **Auditeur** : `auditor` / `audit123`
- **Utilisateur** : `user` / `user123`
- **Agence 01001** : `agency_01001` / `agency01001`
- **Agence 01002** : `agency_01002` / `agency01002`
- **Agence 01003** : `agency_01003` / `agency01003`

### Authentification LDAP
- **Admin LDAP** : `ldap_admin` / `ldap123`
- **Auditeur LDAP** : `ldap_auditor` / `ldap123`

## Support

En cas de problème :
1. Vérifiez les logs de build dans Netlify
2. Assurez-vous que `VITE_DEMO_MODE=true` est bien configuré
3. Videz le cache et redéployez si nécessaire ("Deploys" > "Trigger deploy" > "Clear cache and deploy site")
