import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

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
  
  // Route de test pour vérifier si les tables existent
  app.get('/api/setup', async (req, res) => {
    console.log('🔧 Setup endpoint called');
    let connection;
    try {
      connection = await getConnection();
      
      // Vérifier si la table users existe
      const [tables] = await connection.query(`
        SELECT TABLE_NAME 
        FROM information_schema.TABLES 
        WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users'
      `);

      if (tables.length === 0) {
        // Créer la table users
        await connection.query(`
          CREATE TABLE IF NOT EXISTS users (
            id INT AUTO_INCREMENT PRIMARY KEY,
            username VARCHAR(50) NOT NULL UNIQUE,
            email VARCHAR(100) NOT NULL UNIQUE,
            password_hash VARCHAR(255) NOT NULL,
            full_name VARCHAR(100) NOT NULL,
            role ENUM('admin', 'auditor', 'user') NOT NULL DEFAULT 'user',
            department VARCHAR(50),
            status ENUM('active', 'inactive') NOT NULL DEFAULT 'active',
            last_login DATETIME,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            created_by INT,
            INDEX idx_username (username),
            INDEX idx_email (email),
            INDEX idx_role (role),
            INDEX idx_status (status)
          )
        `);

        // Créer la table d'audit
        await connection.query(`
          CREATE TABLE IF NOT EXISTS user_audit_log (
            id INT AUTO_INCREMENT PRIMARY KEY,
            user_id INT,
            action VARCHAR(100) NOT NULL,
            entity_type VARCHAR(50),
            entity_id VARCHAR(50),
            details JSON,
            ip_address VARCHAR(45),
            user_agent TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            INDEX idx_user_id (user_id),
            INDEX idx_action (action),
            INDEX idx_created_at (created_at)
          )
        `);

        console.log('✅ User tables created successfully');
        res.json({ success: true, message: 'Tables créées avec succès' });
      } else {
        console.log('✅ User tables already exist');
        res.json({ success: true, message: 'Tables déjà existantes' });
      }

    } catch (error) {
      console.error('Setup error:', error);
      res.status(500).json({ error: 'Erreur lors de la configuration: ' + error.message });
    } finally {
      if (connection) connection.release();
    }
  });
  
  // Connexion utilisateur
  app.post('/api/auth/login', async (req, res) => {
    let connection;
    try {
      const { username, password } = req.body;
      
      console.log('🔐 Login attempt:', username);
      
      if (!username || !password) {
        return res.status(400).json({ error: 'Nom d\'utilisateur et mot de passe requis' });
      }

      connection = await getConnection();
      
      // Vérifier d'abord si la table users existe, sinon créer les utilisateurs par défaut
      try {
        const [users] = await connection.query(
          'SELECT * FROM users WHERE username = ? AND status = "active"',
          [username]
        );

        let user = users[0];
        
        // Si aucun utilisateur trouvé et que c'est un compte par défaut, le créer
        if (!user && ['admin', 'auditor', 'user'].includes(username)) {
          const defaultUsers = {
            admin: {
              username: 'admin',
              email: 'admin@banque.ml',
              full_name: 'Administrateur Système',
              role: 'admin',
              department: 'IT'
            },
            auditor: {
              username: 'auditor',
              email: 'audit@banque.ml',
              full_name: 'Auditeur Principal',
              role: 'auditor',
              department: 'Audit'
            },
            user: {
              username: 'user',
              email: 'user@banque.ml',
              full_name: 'Utilisateur Standard',
              role: 'user',
              department: 'Opérations'
            }
          };

          if (defaultUsers[username]) {
            const defaultUser = defaultUsers[username];
            const passwordHash = await bcrypt.hash(`${username}123`, SALT_ROUNDS);
            
            const [result] = await connection.query(`
              INSERT INTO users (username, email, password_hash, full_name, role, department, status)
              VALUES (?, ?, ?, ?, ?, ?, 'active')
              ON DUPLICATE KEY UPDATE username = VALUES(username)
            `, [
              defaultUser.username,
              defaultUser.email,
              passwordHash,
              defaultUser.full_name,
              defaultUser.role,
              defaultUser.department
            ]);

            // Récupérer l'utilisateur créé
            const [newUsers] = await connection.query(
              'SELECT * FROM users WHERE username = ?',
              [username]
            );
            user = newUsers[0];
            console.log(`✅ Created default user: ${username}`);
          }
        }

        if (!user) {
          return res.status(401).json({ error: 'Identifiants invalides' });
        }

        // Vérifier le mot de passe
        let validPassword = false;
        
        // Pour les comptes par défaut, accepter les mots de passe simples
        if ((username === 'admin' && password === 'admin123') ||
            (username === 'auditor' && password === 'audit123') ||
            (username === 'user' && password === 'user123')) {
          validPassword = true;
        } else {
          // Pour les autres comptes, vérifier avec bcrypt
          validPassword = await bcrypt.compare(password, user.password_hash);
        }

        if (!validPassword) {
          return res.status(401).json({ error: 'Identifiants invalides' });
        }

        // Mettre à jour la dernière connexion
        await connection.query(
          'UPDATE users SET last_login = NOW() WHERE id = ?',
          [user.id]
        );

        // Générer le token JWT
        const token = jwt.sign(
          { 
            id: user.id, 
            username: user.username, 
            role: user.role,
            email: user.email 
          },
          JWT_SECRET,
          { expiresIn: '24h' }
        );

        // Log de l'audit (optionnel si la table existe)
        try {
          await connection.query(
            'INSERT INTO user_audit_log (user_id, action, details, ip_address) VALUES (?, ?, ?, ?)',
            [user.id, 'login', JSON.stringify({ success: true }), req.ip || '127.0.0.1']
          );
        } catch (auditError) {
          console.log('Audit log not available:', auditError.message);
        }

        console.log(`✅ User ${username} logged in successfully`);

        res.json({
          success: true,
          user: {
            id: user.id.toString(),
            username: user.username,
            email: user.email,
            role: user.role,
            fullName: user.full_name,
            token
          }
        });

      } catch (dbError) {
        console.error('Database error:', dbError);
        return res.status(500).json({ error: 'Erreur de base de données: ' + dbError.message });
      }

    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ error: 'Erreur lors de la connexion: ' + error.message });
    } finally {
      if (connection) connection.release();
    }
  });

  // Obtenir tous les utilisateurs (admin seulement)
  app.get('/api/users', authenticateToken, requireRole(['admin']), async (req, res) => {
    let connection;
    try {
      connection = await getConnection();
      
      const [users] = await connection.query(`
        SELECT 
          id, username, email, full_name, role, department, status, 
          last_login, created_at, created_by
        FROM users 
        ORDER BY created_at DESC
      `);

      res.json(users);
    } catch (error) {
      console.error('Get users error:', error);
      res.status(500).json({ error: 'Erreur lors de la récupération des utilisateurs' });
    } finally {
      if (connection) connection.release();
    }
  });

  // Créer un utilisateur (admin seulement)
  app.post('/api/users', authenticateToken, requireRole(['admin']), async (req, res) => {
    let connection;
    try {
      const { username, email, password, fullName, role, department } = req.body;
      
      if (!username || !email || !password || !fullName) {
        return res.status(400).json({ error: 'Tous les champs obligatoires doivent être remplis' });
      }

      connection = await getConnection();
      
      // Vérifier si l'utilisateur existe déjà
      const [existing] = await connection.query(
        'SELECT id FROM users WHERE username = ? OR email = ?',
        [username, email]
      );

      if (existing.length > 0) {
        return res.status(409).json({ error: 'Nom d\'utilisateur ou email déjà utilisé' });
      }

      // Hasher le mot de passe
      const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

      const [result] = await connection.query(`
        INSERT INTO users (username, email, password_hash, full_name, role, department, created_by)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `, [username, email, passwordHash, fullName, role || 'user', department, req.user.id]);

      // Log de l'audit (optionnel)
      try {
        await connection.query(
          'INSERT INTO user_audit_log (user_id, action, entity_type, entity_id, details) VALUES (?, ?, ?, ?, ?)',
          [req.user.id, 'create_user', 'user', result.insertId, JSON.stringify({ username, email, role })]
        );
      } catch (auditError) {
        console.log('Audit log not available:', auditError.message);
      }

      res.status(201).json({ 
        success: true, 
        message: 'Utilisateur créé avec succès',
        userId: result.insertId 
      });

    } catch (error) {
      console.error('Create user error:', error);
      res.status(500).json({ error: 'Erreur lors de la création de l\'utilisateur' });
    } finally {
      if (connection) connection.release();
    }
  });

  // Mettre à jour un utilisateur (admin seulement)
  app.put('/api/users/:id', authenticateToken, requireRole(['admin']), async (req, res) => {
    let connection;
    try {
      const userId = req.params.id;
      const { username, email, fullName, role, department, status } = req.body;
      
      connection = await getConnection();
      
      // Vérifier si l'utilisateur existe
      const [existing] = await connection.query('SELECT id FROM users WHERE id = ?', [userId]);
      if (existing.length === 0) {
        return res.status(404).json({ error: 'Utilisateur non trouvé' });
      }

      await connection.query(`
        UPDATE users 
        SET username = ?, email = ?, full_name = ?, role = ?, department = ?, status = ?
        WHERE id = ?
      `, [username, email, fullName, role, department, status, userId]);

      // Log de l'audit (optionnel)
      try {
        await connection.query(
          'INSERT INTO user_audit_log (user_id, action, entity_type, entity_id, details) VALUES (?, ?, ?, ?, ?)',
          [req.user.id, 'update_user', 'user', userId, JSON.stringify({ username, email, role, status })]
        );
      } catch (auditError) {
        console.log('Audit log not available:', auditError.message);
      }

      res.json({ success: true, message: 'Utilisateur mis à jour avec succès' });

    } catch (error) {
      console.error('Update user error:', error);
      res.status(500).json({ error: 'Erreur lors de la mise à jour de l\'utilisateur' });
    } finally {
      if (connection) connection.release();
    }
  });

  // Supprimer un utilisateur (admin seulement)
  app.delete('/api/users/:id', authenticateToken, requireRole(['admin']), async (req, res) => {
    let connection;
    try {
      const userId = req.params.id;
      
      // Empêcher la suppression de son propre compte
      if (parseInt(userId) === req.user.id) {
        return res.status(400).json({ error: 'Vous ne pouvez pas supprimer votre propre compte' });
      }

      connection = await getConnection();
      
      const [result] = await connection.query('DELETE FROM users WHERE id = ?', [userId]);
      
      if (result.affectedRows === 0) {
        return res.status(404).json({ error: 'Utilisateur non trouvé' });
      }

      // Log de l'audit (optionnel)
      try {
        await connection.query(
          'INSERT INTO user_audit_log (user_id, action, entity_type, entity_id, details) VALUES (?, ?, ?, ?, ?)',
          [req.user.id, 'delete_user', 'user', userId, JSON.stringify({ deleted_user_id: userId })]
        );
      } catch (auditError) {
        console.log('Audit log not available:', auditError.message);
      }

      res.json({ success: true, message: 'Utilisateur supprimé avec succès' });

    } catch (error) {
      console.error('Delete user error:', error);
      res.status(500).json({ error: 'Erreur lors de la suppression de l\'utilisateur' });
    } finally {
      if (connection) connection.release();
    }
  });

  // Changer le mot de passe
  app.post('/api/users/:id/change-password', authenticateToken, async (req, res) => {
    let connection;
    try {
      const userId = req.params.id;
      const { currentPassword, newPassword } = req.body;
      
      // Vérifier que l'utilisateur change son propre mot de passe ou est admin
      if (parseInt(userId) !== req.user.id && req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Permissions insuffisantes' });
      }

      connection = await getConnection();
      
      const passwordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);
      
      await connection.query(
        'UPDATE users SET password_hash = ? WHERE id = ?',
        [passwordHash, userId]
      );

      // Log de l'audit (optionnel)
      try {
        await connection.query(
          'INSERT INTO user_audit_log (user_id, action, entity_type, entity_id, details) VALUES (?, ?, ?, ?, ?)',
          [req.user.id, 'change_password', 'user', userId, JSON.stringify({ target_user_id: userId })]
        );
      } catch (auditError) {
        console.log('Audit log not available:', auditError.message);
      }

      res.json({ success: true, message: 'Mot de passe modifié avec succès' });

    } catch (error) {
      console.error('Change password error:', error);
      res.status(500).json({ error: 'Erreur lors du changement de mot de passe' });
    } finally {
      if (connection) connection.release();
    }
  });

  // Statistiques utilisateurs (admin/auditor)
  app.get('/api/users/stats', authenticateToken, requireRole(['admin', 'auditor']), async (req, res) => {
    let connection;
    try {
      connection = await getConnection();
      
      const [stats] = await connection.query(`
        SELECT 
          COUNT(*) as total,
          SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as active,
          SUM(CASE WHEN role = 'admin' THEN 1 ELSE 0 END) as admins,
          SUM(CASE WHEN last_login >= DATE_SUB(NOW(), INTERVAL 24 HOUR) THEN 1 ELSE 0 END) as recent_logins
        FROM users
      `);

      res.json(stats[0]);
    } catch (error) {
      console.error('User stats error:', error);
      res.status(500).json({ error: 'Erreur lors de la récupération des statistiques' });
    } finally {
      if (connection) connection.release();
    }
  });
};