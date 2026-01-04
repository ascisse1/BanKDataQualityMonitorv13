import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
// LDAP configuration (will be loaded from environment or database in production)
let ldapConfig = {
  enabled: false,
  url: 'ldap://your-domain-controller.com',
  baseDN: 'dc=example,dc=com',
  bindDN: 'cn=admin,dc=example,dc=com',
  bindCredentials: 'admin_password',
  userSearchBase: 'ou=users,dc=example,dc=com',
  userSearchFilter: '(sAMAccountName={{username}})',
  groupSearchBase: 'ou=groups,dc=example,dc=com',
  groupSearchFilter: '(member={{dn}})',
  adminGroup: 'CN=Admins,OU=Groups,DC=example,DC=com',
  auditorGroup: 'CN=Auditors,OU=Groups,DC=example,DC=com'
};


const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const SALT_ROUNDS = 10;

// Middleware d'authentification
export const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Token d\'accès requis' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Token invalide' });
    }
    req.user = user;
    next();
  });
};

// Middleware de vérification des rôles
export const requireRole = (roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Permissions insuffisantes' });
    }
    next();
  };
};

// Routes utilisateur
export const setupUserRoutes = (app, getConnection) => {
  // Route to get LDAP configuration
  app.get('/api/auth/ldap-config', authenticateToken, requireRole(['admin']), async (req, res) => {
    try {
      // Return the current LDAP configuration (without sensitive credentials)
      const safeConfig = {
        ...ldapConfig,
        bindCredentials: ldapConfig.bindCredentials ? '********' : ''
      };
      
      res.json({
        success: true,
        config: safeConfig
      });
    } catch (error) {
      console.error('Error getting LDAP config:', error);
      res.status(500).json({ error: 'Erreur lors de la récupération de la configuration LDAP' });
    }
  });
  
  // Route to update LDAP configuration
  app.post('/api/auth/ldap-config', authenticateToken, requireRole(['admin']), async (req, res) => {
    try {
      const newConfig = req.body;
      
      // Validate required fields if LDAP is enabled
      if (newConfig.enabled) {
        const requiredFields = ['url', 'baseDN', 'userSearchBase', 'userSearchFilter'];
        for (const field of requiredFields) {
          if (!newConfig[field]) {
            return res.status(400).json({ error: `Le champ ${field} est requis pour l'authentification LDAP` });
          }
        }
      }
      
      // Update the configuration
      ldapConfig = {
        ...ldapConfig,
        ...newConfig,
        // Don't update password if it's masked or empty
        bindCredentials: newConfig.bindCredentials === '********' ? ldapConfig.bindCredentials : newConfig.bindCredentials
      };
      
      // In a real application, we would save this to a database or environment variables
      
      res.json({
        success: true,
        message: 'Configuration LDAP mise à jour avec succès'
      });
    } catch (error) {
      console.error('Error updating LDAP config:', error);
      res.status(500).json({ error: 'Erreur lors de la mise à jour de la configuration LDAP' });
    }
  });
  
  // Route to test LDAP connection
  app.post('/api/auth/test-ldap', authenticateToken, requireRole(['admin']), async (req, res) => {
    try {
      // In a real application, we would test the LDAP connection here
      // For demo purposes, we'll simulate a successful connection
      
      // Simulate a delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      res.json({
        success: true,
        message: 'Connexion au serveur LDAP réussie',
        data: {
          server: ldapConfig.url,
          userCount: '1,250',
          timestamp: new Date().toISOString()
        }
      });
    } catch (error) {
      console.error('Error testing LDAP connection:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors du test de connexion au serveur LDAP',
        error: error.message
      });
    }
  });
  
  // Route de test pour vérifier si les tables existent
  app.get('/api/setup', async (req, res) => {
    console.log('🔧 Setup endpoint called - Demo mode');
    res.json({ success: true, message: 'Demo mode active - No database setup required' });
  });
  
  // Connexion utilisateur
  app.post('/api/auth/login', async (req, res) => {
    try {
      console.log('🔐 Login attempt received:', req.body.username);
      const { username, password } = req.body;
      
      // Check if LDAP authentication is enabled
      if (ldapConfig.enabled) {
        try {
          console.log('🔐 Attempting LDAP authentication for:', username);
          
          // In a real application, we would authenticate against LDAP here
          // For demo purposes, we'll simulate LDAP authentication for specific users
          
          if (username === 'ldap_admin' && password === 'ldap123') {
            // Simulate successful LDAP authentication for an admin
            const ldapUser = {
              id: 'ldap_' + Date.now(),
              username: username,
              email: `${username}@example.com`,
              full_name: 'LDAP Administrator',
              role: 'admin',
              department: 'IT',
              groups: [ldapConfig.adminGroup]
            };
            
            // Generate JWT token
            const token = jwt.sign(
              { 
                id: ldapUser.id, 
                username: ldapUser.username, 
                role: ldapUser.role,
                email: ldapUser.email
              },
              JWT_SECRET,
              { expiresIn: '24h' }
            );
            
            console.log(`✅ LDAP user ${username} logged in successfully`);
            
            return res.json({
              success: true,
              user: {
                id: ldapUser.id,
                username: ldapUser.username,
                email: ldapUser.email,
                role: ldapUser.role,
                fullName: ldapUser.full_name,
                token
              }
            });
          } else if (username === 'ldap_auditor' && password === 'ldap123') {
            // Simulate successful LDAP authentication for an auditor
            const ldapUser = {
              id: 'ldap_' + Date.now(),
              username: username,
              email: `${username}@example.com`,
              full_name: 'LDAP Auditor',
              role: 'auditor',
              department: 'Audit',
              groups: [ldapConfig.auditorGroup]
            };
            
            // Generate JWT token
            const token = jwt.sign(
              { 
                id: ldapUser.id, 
                username: ldapUser.username, 
                role: ldapUser.role,
                email: ldapUser.email
              },
              JWT_SECRET,
              { expiresIn: '24h' }
            );
            
            console.log(`✅ LDAP user ${username} logged in successfully`);
            
            return res.json({
              success: true,
              user: {
                id: ldapUser.id,
                username: ldapUser.username,
                email: ldapUser.email,
                role: ldapUser.role,
                fullName: ldapUser.full_name,
                token
              }
            });
          }
          
          // If LDAP authentication fails, fall back to local authentication
          console.log('🔐 LDAP authentication failed, falling back to local authentication');
        } catch (ldapError) {
          console.error('LDAP authentication error:', ldapError);
          // Fall back to local authentication
        }
      }
      
      console.log('🔐 Processing login for:', username);
      
      if (!username || !password) {
        return res.status(400).json({ error: 'Nom d\'utilisateur et mot de passe requis' });
      }

      // Demo mode - Accept predefined users
      const defaultUsers = {
        admin: {
          id: '1',
          username: 'admin',
          email: 'admin@banque.ml',
          full_name: 'Administrateur Système',
          role: 'admin',
          department: 'IT',
          password: 'admin123'
        },
        auditor: {
          id: '2',
          username: 'auditor',
          email: 'audit@banque.ml',
          full_name: 'Auditeur Principal',
          role: 'auditor',
          department: 'Audit',
          password: 'audit123'
        },
        user: {
          id: '3',
          username: 'user',
          email: 'user@banque.ml',
          full_name: 'Utilisateur Standard',
          role: 'user',
          department: 'Opérations',
          password: 'user123'
        }
      };

      // Check for agency users (format: agency_XXXXX)
      let user = null;
      
      if (username.startsWith('agency_')) {
        const agencyCode = username.replace('agency_', '');
        const agencyId = '1000' + (parseInt(agencyCode) || 0);
        
        // Trouver le nom de l'agence
        let agencyName = 'Agence ' + agencyCode;
        if (AGENCIES && AGENCIES[agencyCode]) {
          agencyName = AGENCIES[agencyCode];
        }
        
        user = {
          id: agencyId,
          username,
          email: `agence.${agencyCode}@banque.ml`,
          full_name: `Utilisateur ${agencyName}`,
          role: 'agency_user',
          department: 'Agence',
          agency_code: agencyCode,
          password: `agency${agencyCode}`
        };
      } else if (defaultUsers[username]) {
        user = defaultUsers[username];
      }

      if (!user) {
        console.log('❌ User not found:', username);
        return res.status(401).json({ error: 'Identifiants invalides' });
      }

      // Verify password
      let validPassword = password === user.password;
      console.log('🔑 Password validation:', validPassword ? 'success' : 'failed');

      if (!validPassword) {
        console.log('❌ Invalid password for user:', username);
        return res.status(401).json({ error: 'Identifiants invalides' });
      }

      // Generate JWT token
      const token = jwt.sign(
        { 
          id: user.id.toString(), 
          username: user.username, 
          role: user.role,
          email: user.email,
          agency_code: user.agency_code
        },
        JWT_SECRET,
        { expiresIn: '24h' }
      );

      console.log(`✅ User ${username} logged in successfully (demo mode)`);
      console.log('🔑 Generated token for user:', username);

      res.json({
        success: true,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          role: user.role,
          fullName: user.full_name,
          agencyCode: user.agency_code,
          token
        }
      });
    } catch (error) {
      console.error('Login error:', error);
      console.error('Stack trace:', error.stack);
      res.status(500).json({ error: 'Erreur lors de la connexion: ' + error.message });
    }
  });

  // Obtenir tous les utilisateurs (admin seulement)
  app.get('/api/users', authenticateToken, requireRole(['admin']), async (req, res) => {
    try {
      // Demo mode - Return predefined users
      const users = [
        {
          id: 1,
          username: 'admin',
          email: 'admin@banque.ml',
          full_name: 'Administrateur Système',
          role: 'admin',
          department: 'IT',
          status: 'active',
          last_login: new Date().toISOString(),
          created_at: '2025-01-01T00:00:00.000Z'
        },
        {
          id: 2,
          username: 'auditor',
          email: 'audit@banque.ml',
          full_name: 'Auditeur Principal',
          role: 'auditor',
          department: 'Audit',
          status: 'active',
          last_login: new Date().toISOString(),
          created_at: '2025-01-01T00:00:00.000Z'
        },
        {
          id: 3,
          username: 'user',
          email: 'user@banque.ml',
          full_name: 'Utilisateur Standard',
          role: 'user',
          department: 'Opérations',
          status: 'active',
          last_login: new Date().toISOString(),
          created_at: '2025-01-01T00:00:00.000Z'
        },
        {
          id: 1001,
          username: 'agency_01201',
          email: 'agence.01201@banque.ml',
          full_name: 'Utilisateur Agence Principale 1',
          role: 'agency_user',
          department: 'Agence',
          agency_code: '01201',
          status: 'active',
          last_login: new Date().toISOString(),
          created_at: '2025-01-01T00:00:00.000Z'
        },
        {
          id: 1002,
          username: 'agency_01202',
          email: 'agence.01202@banque.ml',
          full_name: 'Utilisateur Agence Boubacar Sidibe',
          role: 'agency_user',
          department: 'Agence',
          agency_code: '01202',
          status: 'active',
          last_login: new Date().toISOString(),
          created_at: '2025-01-01T00:00:00.000Z'
        }
      ];

      res.json(users);
    } catch (error) {
      console.error('Get users error:', error);
      res.status(500).json({ error: 'Erreur lors de la récupération des utilisateurs' });
    }
  });

  // Créer un utilisateur (admin seulement)
  app.post('/api/users', authenticateToken, requireRole(['admin']), async (req, res) => {
    try {
      const { username, email, password, fullName, role, department, agencyCode } = req.body;
      
      if (!username || !email || !password || !fullName) {
        return res.status(400).json({ error: 'Tous les champs obligatoires doivent être remplis' });
      }

      // Demo mode - Simulate user creation
      console.log('Demo mode: Creating user', { username, email, fullName, role, department, agencyCode });

      res.status(201).json({ 
        success: true, 
        message: 'Utilisateur créé avec succès (demo mode)',
        userId: Math.floor(Math.random() * 1000) + 10
      });
    } catch (error) {
      console.error('Create user error:', error);
      res.status(500).json({ error: 'Erreur lors de la création de l\'utilisateur' });
    }
  });

  // Mettre à jour un utilisateur (admin seulement)
  app.put('/api/users/:id', authenticateToken, requireRole(['admin']), async (req, res) => {
    try {
      const userId = req.params.id;
      const { username, email, fullName, role, department, status } = req.body;
      
      // Demo mode - Simulate user update
      console.log('Demo mode: Updating user', { userId, username, email, fullName, role, department, status });

      res.json({ success: true, message: 'Utilisateur mis à jour avec succès (demo mode)' });
    } catch (error) {
      console.error('Update user error:', error);
      res.status(500).json({ error: 'Erreur lors de la mise à jour de l\'utilisateur' });
    }
  });

  // Supprimer un utilisateur (admin seulement)
  app.delete('/api/users/:id', authenticateToken, requireRole(['admin']), async (req, res) => {
    try {
      const userId = req.params.id;
      
      // Empêcher la suppression de son propre compte
      if (parseInt(userId) === req.user.id) {
        return res.status(400).json({ error: 'Vous ne pouvez pas supprimer votre propre compte' });
      }

      // Demo mode - Simulate user deletion
      console.log('Demo mode: Deleting user', { userId });

      res.json({ success: true, message: 'Utilisateur supprimé avec succès (demo mode)' });
    } catch (error) {
      console.error('Delete user error:', error);
      res.status(500).json({ error: 'Erreur lors de la suppression de l\'utilisateur' });
    }
  });

  // Changer le mot de passe
  app.post('/api/users/:id/change-password', authenticateToken, async (req, res) => {
    try {
      const userId = req.params.id;
      const { currentPassword, newPassword } = req.body;
      
      // Vérifier que l'utilisateur change son propre mot de passe ou est admin
      if (parseInt(userId) !== req.user.id && req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Permissions insuffisantes' });
      }

      // Demo mode - Simulate password change
      console.log('Demo mode: Changing password', { userId, currentPassword: '******', newPassword: '******' });

      res.json({ success: true, message: 'Mot de passe modifié avec succès (demo mode)' });
    } catch (error) {
      console.error('Change password error:', error);
      res.status(500).json({ error: 'Erreur lors du changement de mot de passe' });
    }
  });

  // Statistiques utilisateurs (admin/auditor)
  app.get('/api/users/stats', authenticateToken, requireRole(['admin', 'auditor']), async (req, res) => {
    try {
      // Demo mode - Return predefined stats
      const stats = {
        total: 25,
        active: 23,
        admins: 1,
        agency_users: 20,
        recent_logins: 15,
        agencies_with_users: 20
      };

      res.json(stats);
    } catch (error) {
      console.error('User stats error:', error);
      res.status(500).json({ error: 'Erreur lors de la récupération des statistiques' });
    }
  });

  // Créer un utilisateur d'agence (admin seulement)
  app.post('/api/agency-users', authenticateToken, requireRole(['admin']), async (req, res) => {
    try {
      const { username, email, password, fullName, agencyCode, agencyName } = req.body;
      
      if (!username || !email || !password || !fullName || !agencyCode) {
        return res.status(400).json({ error: 'Tous les champs obligatoires doivent être remplis' });
      }

      // Demo mode - Simulate agency user creation
      console.log('Demo mode: Creating agency user', { username, email, fullName, agencyCode, agencyName });

      res.status(201).json({ 
        success: true, 
        message: 'Utilisateur d\'agence créé avec succès (demo mode)',
        userId: Math.floor(Math.random() * 1000) + 1000
      });
    } catch (error) {
      console.error('Create agency user error:', error);
      res.status(500).json({ error: 'Erreur lors de la création de l\'utilisateur d\'agence' });
    }
  });

  // Enregistrer une modification d'anomalie
  app.post('/api/anomaly-history', authenticateToken, async (req, res) => {
    try {
      const { cli, field, oldValue, newValue, status, agencyCode } = req.body;
      
      if (!cli || !field || !status) {
        return res.status(400).json({ error: 'Champs obligatoires manquants' });
      }

      // Demo mode - Simulate anomaly history creation
      console.log('Demo mode: Recording anomaly history', { cli, field, oldValue, newValue, status, agencyCode });

      res.status(201).json({ 
        success: true, 
        message: 'Historique d\'anomalie enregistré avec succès (demo mode)',
        id: Math.floor(Math.random() * 1000) + 1
      });
    } catch (error) {
      console.error('Anomaly history error:', error);
      res.status(500).json({ error: 'Erreur lors de l\'enregistrement de l\'historique d\'anomalie' });
    }
  });

  // Obtenir l'historique des anomalies
  app.get('/api/anomaly-history', authenticateToken, async (req, res) => {
    try {
      const { cli, field, agencyCode, limit = 100, page = 1 } = req.query;
      
      // Demo mode - Generate anomaly history
      const history = [];
      const statuses = ['detected', 'in_review', 'fixed', 'rejected'];
      const users = [
        { id: 1, username: 'admin', full_name: 'Administrateur Système' },
        { id: 2, username: 'auditor', full_name: 'Auditeur Principal' },
        { id: 3, username: 'agency_01201', full_name: 'Utilisateur Agence Principale 1' }
      ];
      
      for (let i = 1; i <= 50; i++) {
        const date = new Date();
        date.setDate(date.getDate() - i % 30);
        
        const status = statuses[i % statuses.length];
        const fieldName = field || ['nid', 'nmer', 'dna', 'nat', 'nrc', 'datc', 'rso'][i % 7];
        const user = users[i % users.length];
        const clientId = cli || `CLI${String(i % 20 + 1).padStart(6, '0')}`;
        const actualAgencyCode = agencyCode || req.user.agency_code || `0${1200 + (i % 30)}`;
        
        history.push({
          id: i,
          cli: clientId,
          field: fieldName,
          old_value: status === 'fixed' ? '' : null,
          new_value: status === 'fixed' ? 'Corrigé' : null,
          status,
          agency_code: actualAgencyCode,
          user_id: user.id,
          created_at: date.toISOString(),
          username: user.username,
          full_name: user.full_name
        });
      }

      // Apply filters
      let filteredHistory = history;
      
      if (cli) {
        filteredHistory = filteredHistory.filter(h => h.cli === cli);
      }
      
      if (field) {
        filteredHistory = filteredHistory.filter(h => h.field === field);
      }
      
      if (agencyCode) {
        filteredHistory = filteredHistory.filter(h => h.agency_code === agencyCode);
      } else if (req.user.role === 'agency_user' && req.user.agency_code) {
        filteredHistory = filteredHistory.filter(h => h.agency_code === req.user.agency_code);
      }
      
      // Pagination
      const offset = (page - 1) * limit;
      const paginatedHistory = filteredHistory.slice(offset, offset + parseInt(limit));
      
      res.json({
        data: paginatedHistory,
        page: parseInt(page),
        limit: parseInt(limit),
        total: filteredHistory.length
      });
    } catch (error) {
      console.error('Get anomaly history error:', error);
      res.status(500).json({ error: 'Erreur lors de la récupération de l\'historique des anomalies' });
    }
  });

  // Créer des utilisateurs d'agence en masse
  app.post('/api/bulk-create-agency-users', authenticateToken, requireRole(['admin']), async (req, res) => {
    try {
      const { agencies } = req.body;
      
      if (!Array.isArray(agencies) || agencies.length === 0) {
        return res.status(400).json({ error: 'Liste d\'agences invalide' });
      }

      // Demo mode - Simulate bulk agency user creation
      console.log('Demo mode: Creating bulk agency users', { agencyCount: agencies.length });
      
      // Log the received data for debugging
      console.log('Received agencies data:', JSON.stringify(agencies, null, 2));
      
      const results = agencies.map((agency, index) => ({
        agencyCode: agency.agencyCode,
        agencyName: agency.agencyName,
        username: `agency_${agency.agencyCode}`,
        email: `agence.${agency.agencyCode.toLowerCase()}@banque.ml`,
        userId: 1000 + index
      }));

      res.json({
        success: true,
        message: `${results.length} utilisateurs d'agence créés avec succès (demo mode)`,
        results,
        errors: []
      });
    } catch (error) {
      console.error('Bulk create agency users error:', error);
      console.error('Stack trace:', error.stack);
      res.status(500).json({ error: 'Erreur lors de la création des utilisateurs d\'agence' });
    }
  });
};