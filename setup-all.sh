#!/bin/bash

echo "=========================================="
echo "🚀 BSIC Bank - Setup Complet Application"
echo "=========================================="
echo ""

# Couleurs pour output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Fonction pour afficher des messages colorés
print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

# Vérifier les prérequis
echo "📋 Vérification des prérequis..."
echo ""

# Node.js
if command -v node &> /dev/null; then
    NODE_VERSION=$(node -v)
    print_success "Node.js installé: $NODE_VERSION"
else
    print_error "Node.js n'est pas installé"
    exit 1
fi

# npm
if command -v npm &> /dev/null; then
    NPM_VERSION=$(npm -v)
    print_success "npm installé: $NPM_VERSION"
else
    print_error "npm n'est pas installé"
    exit 1
fi

# Java
if command -v java &> /dev/null; then
    JAVA_VERSION=$(java -version 2>&1 | head -n 1)
    print_success "Java installé: $JAVA_VERSION"
else
    print_warning "Java n'est pas installé (requis pour Spring Boot backend)"
fi

# Maven
if command -v mvn &> /dev/null; then
    MVN_VERSION=$(mvn -v | head -n 1)
    print_success "Maven installé: $MVN_VERSION"
else
    print_warning "Maven n'est pas installé (requis pour Spring Boot backend)"
fi

# MySQL
if command -v mysql &> /dev/null; then
    MYSQL_VERSION=$(mysql --version)
    print_success "MySQL client installé: $MYSQL_VERSION"
else
    print_warning "MySQL client n'est pas installé"
fi

echo ""
echo "=========================================="
echo "📦 Installation des dépendances Node.js"
echo "=========================================="
echo ""

npm install
if [ $? -eq 0 ]; then
    print_success "Dépendances Node.js installées"
else
    print_error "Erreur lors de l'installation des dépendances"
    exit 1
fi

echo ""
echo "=========================================="
echo "🔧 Configuration Environnement"
echo "=========================================="
echo ""

if [ ! -f .env ]; then
    print_info "Création du fichier .env depuis .env.example..."
    cp .env.example .env
    print_success "Fichier .env créé"
    print_warning "ATTENTION: Vous devez éditer .env avec vos paramètres!"
    print_info "Variables importantes à configurer:"
    echo "  - DB_PASSWORD (MySQL)"
    echo "  - INFORMIX_HOST, INFORMIX_USER, INFORMIX_PASSWORD"
    echo "  - JWT_SECRET"
    echo ""
    read -p "Voulez-vous éditer .env maintenant? (y/n) " -n 1 -r
    echo ""
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        ${EDITOR:-nano} .env
    fi
else
    print_info "Fichier .env existe déjà"
fi

echo ""
echo "=========================================="
echo "🗄️  Configuration Base de Données MySQL"
echo "=========================================="
echo ""

# Vérifier si MySQL est accessible
print_info "Test de connexion MySQL..."

# Charger les variables d'environnement
source .env 2>/dev/null || true

DB_HOST=${DB_HOST:-localhost}
DB_PORT=${DB_PORT:-3306}
DB_USER=${DB_USER:-root}
DB_NAME=${DB_NAME:-bank_data_quality}

if command -v mysql &> /dev/null; then
    mysql -h"$DB_HOST" -P"$DB_PORT" -u"$DB_USER" -p"$DB_PASSWORD" -e "SELECT 1" &>/dev/null
    if [ $? -eq 0 ]; then
        print_success "Connexion MySQL réussie"

        read -p "Voulez-vous initialiser la base de données? (y/n) " -n 1 -r
        echo ""
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            print_info "Initialisation de la base de données..."
            npm run setup:mysql

            read -p "Voulez-vous charger les données de démonstration? (y/n) " -n 1 -r
            echo ""
            if [[ $REPLY =~ ^[Yy]$ ]]; then
                print_info "Chargement des données de démo..."
                npm run seed:mysql
            fi

            read -p "Voulez-vous créer les tables de réconciliation? (y/n) " -n 1 -r
            echo ""
            if [[ $REPLY =~ ^[Yy]$ ]]; then
                print_info "Création des tables de réconciliation..."
                npm run db:reconciliation
            fi
        fi
    else
        print_warning "Impossible de se connecter à MySQL"
        print_info "Vous devrez configurer MySQL manuellement"
    fi
else
    print_warning "MySQL client non disponible"
fi

echo ""
echo "=========================================="
echo "☕ Configuration Backend Spring Boot"
echo "=========================================="
echo ""

if [ -d "backend-java" ]; then
    if command -v mvn &> /dev/null; then
        read -p "Voulez-vous compiler le backend Java? (y/n) " -n 1 -r
        echo ""
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            print_info "Compilation du backend Spring Boot..."
            cd backend-java
            mvn clean install -DskipTests
            if [ $? -eq 0 ]; then
                print_success "Backend Java compilé avec succès"
            else
                print_error "Erreur lors de la compilation"
            fi
            cd ..
        fi
    else
        print_warning "Maven non installé, impossible de compiler le backend Java"
    fi
else
    print_warning "Dossier backend-java non trouvé"
fi

echo ""
echo "=========================================="
echo "🏗️  Build de l'application React"
echo "=========================================="
echo ""

read -p "Voulez-vous construire l'application? (y/n) " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Yy]$ ]]; then
    print_info "Build de l'application React..."
    npm run build
    if [ $? -eq 0 ]; then
        print_success "Application construite avec succès"
    else
        print_error "Erreur lors du build"
    fi
fi

echo ""
echo "=========================================="
echo "✅ Setup Complet!"
echo "=========================================="
echo ""

print_success "Configuration terminée avec succès!"
echo ""
print_info "Prochaines étapes:"
echo ""
echo "1️⃣  Démarrer le backend Spring Boot (optionnel):"
echo "   cd backend-java && mvn spring-boot:run"
echo ""
echo "2️⃣  Démarrer le serveur Node.js Express:"
echo "   npm run server"
echo ""
echo "3️⃣  Démarrer le frontend React (nouveau terminal):"
echo "   npm run dev"
echo ""
echo "4️⃣  Accéder à l'application:"
echo "   http://localhost:5173"
echo ""
echo "📚 Documentation:"
echo "   - START_HERE.md - Guide de démarrage"
echo "   - NEXT_STEPS.md - Étapes détaillées"
echo "   - README.md - Documentation complète"
echo ""
print_info "Utilisateurs de démonstration:"
echo "   Admin:       admin@bsic.ci / admin123"
echo "   Auditeur:    auditor@bsic.ci / auditor123"
echo "   Agence:      ag001@bsic.ci / ag001pass"
echo ""
print_warning "N'oubliez pas de configurer vos paramètres dans .env!"
echo ""
