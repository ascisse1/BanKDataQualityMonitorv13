# Solution: Erreur Informix -23101 (Locale Mismatch)

## Résumé du problème

Vous obtenez l'erreur suivante lors de la connexion à Informix :
```
[Informix][Informix ODBC Driver][Informix]Unspecified System Error = -23101
```

Cette erreur indique un problème de configuration des locales entre votre client et le serveur Informix.

## Solution rapide (Recommandée)

### Étape 1 : Définir les variables d'environnement

Exécutez PowerShell **en tant qu'administrateur** et lancez :

```powershell
.\scripts\fix-informix-locales.ps1
```

Ce script configure automatiquement :
- INFORMIXDIR
- INFORMIXSERVER
- DB_LOCALE
- CLIENT_LOCALE
- PATH

### Étape 2 : Redémarrer PowerShell

IMPORTANT : Fermez complètement PowerShell et rouvrez-le pour charger les nouvelles variables.

### Étape 3 : Tester la connexion

```powershell
npm run test:dsn
```

Si cela fonctionne, vous verrez :
```
✅ Connexion réussie!
✅ Requête exécutée avec succès
```

### Étape 4 : Lancer l'application

```powershell
npm run dev:full
```

## Mode dégradé (Contournement temporaire)

Le fichier .env contient maintenant :
```env
ALLOW_DEGRADED_MODE=true
```

Cela permet au serveur de démarrer sans Informix (utilise MySQL uniquement).

Pour tester, lancez simplement :
```powershell
npm run dev:full
```

Le serveur démarrera avec un avertissement mais fonctionnera.

## Pour plus d'informations

Consultez `INFORMIX_ERROR_23101.md` pour le guide complet de résolution.
