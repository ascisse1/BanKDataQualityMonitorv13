#!/bin/bash

echo "=========================================="
echo "Test de Connexion JDBC Informix"
echo "=========================================="
echo ""

# Couleurs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Vérifier Java
echo "Vérification de Java..."
if ! command -v java &> /dev/null; then
    echo -e "${RED}❌ Java n'est pas installé${NC}"
    echo "Installez Java 17 ou supérieur"
    exit 1
fi

JAVA_VERSION=$(java -version 2>&1 | awk -F '"' '/version/ {print $2}' | cut -d'.' -f1)
if [ "$JAVA_VERSION" -lt 17 ]; then
    echo -e "${RED}❌ Java version trop ancienne: $JAVA_VERSION${NC}"
    echo "Java 17 ou supérieur requis"
    exit 1
fi

echo -e "${GREEN}✅ Java $JAVA_VERSION détecté${NC}"
echo ""

# Vérifier Maven
echo "Vérification de Maven..."
if ! command -v mvn &> /dev/null; then
    echo -e "${RED}❌ Maven n'est pas installé${NC}"
    echo "Installez Maven 3.8 ou supérieur"
    exit 1
fi

echo -e "${GREEN}✅ Maven détecté${NC}"
echo ""

# Charger les variables d'environnement
if [ -f "../.env" ]; then
    echo "Chargement des variables d'environnement depuis .env..."
    export $(grep -v '^#' ../.env | xargs)
    echo -e "${GREEN}✅ Variables chargées${NC}"
else
    echo -e "${YELLOW}⚠️  Fichier .env non trouvé, utilisation des valeurs par défaut${NC}"
fi

echo ""
echo "Configuration Informix:"
echo "  Host: ${INFORMIX_HOST:-10.3.0.66}"
echo "  Port: ${INFORMIX_PORT:-1526}"
echo "  Database: ${INFORMIX_DATABASE:-bdmsa}"
echo "  Server: ${INFORMIX_SERVER:-ol_bdmsa}"
echo "  User: ${INFORMIX_USER:-bank}"
echo ""

# Tester la connexion réseau
echo "Test de connectivité réseau..."
if timeout 5 bash -c "cat < /dev/null > /dev/tcp/${INFORMIX_HOST:-10.3.0.66}/${INFORMIX_PORT:-1526}" 2>/dev/null; then
    echo -e "${GREEN}✅ Serveur Informix accessible${NC}"
else
    echo -e "${RED}❌ Impossible de contacter le serveur Informix${NC}"
    echo "Vérifiez:"
    echo "  - Le serveur est démarré"
    echo "  - L'adresse IP et le port sont corrects"
    echo "  - Le firewall autorise la connexion"
    exit 1
fi

echo ""

# Build du projet
echo "Build du projet Spring Boot..."
if mvn clean package -DskipTests -q; then
    echo -e "${GREEN}✅ Build réussi${NC}"
else
    echo -e "${RED}❌ Échec du build${NC}"
    exit 1
fi

echo ""

# Test de connexion JDBC
echo "Test de la connexion JDBC..."
echo ""

# Créer une classe de test temporaire
cat > src/test/java/JdbcConnectionTest.java << 'EOF'
import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.ResultSet;
import java.sql.Statement;

public class JdbcConnectionTest {
    public static void main(String[] args) {
        String host = System.getenv().getOrDefault("INFORMIX_HOST", "10.3.0.66");
        String port = System.getenv().getOrDefault("INFORMIX_PORT", "1526");
        String database = System.getenv().getOrDefault("INFORMIX_DATABASE", "bdmsa");
        String server = System.getenv().getOrDefault("INFORMIX_SERVER", "ol_bdmsa");
        String user = System.getenv().getOrDefault("INFORMIX_USER", "bank");
        String password = System.getenv().getOrDefault("INFORMIX_PASSWORD", "bank");

        String jdbcUrl = String.format(
            "jdbc:informix-sqli://%s:%s/%s:INFORMIXSERVER=%s;DELIMIDENT=Y;DB_LOCALE=en_US.utf8;CLIENT_LOCALE=en_US.utf8",
            host, port, database, server
        );

        System.out.println("URL JDBC: " + jdbcUrl.replaceAll(password, "****"));
        System.out.println();

        try {
            Class.forName("com.informix.jdbc.IfxDriver");
            System.out.println("✅ Driver JDBC Informix chargé");

            Connection conn = DriverManager.getConnection(jdbcUrl, user, password);
            System.out.println("✅ Connexion établie");

            Statement stmt = conn.createStatement();
            ResultSet rs = stmt.executeQuery("SELECT FIRST 1 1 FROM systables");

            if (rs.next()) {
                System.out.println("✅ Requête test réussie");
            }

            rs.close();

            ResultSet rsCount = stmt.executeQuery("SELECT COUNT(*) as count FROM bkcli");
            if (rsCount.next()) {
                int count = rsCount.getInt("count");
                System.out.println("✅ Nombre de clients dans CBS: " + count);
            }

            rsCount.close();
            stmt.close();
            conn.close();

            System.out.println();
            System.out.println("========================================");
            System.out.println("✅ SUCCÈS - Connexion JDBC fonctionnelle");
            System.out.println("========================================");

        } catch (Exception e) {
            System.err.println("❌ ERREUR: " + e.getMessage());
            e.printStackTrace();
            System.exit(1);
        }
    }
}
EOF

# Compiler et exécuter le test
javac -cp "target/data-quality-backend-1.0.0.jar:$(mvn dependency:build-classpath -q | tail -1)" \
    src/test/java/JdbcConnectionTest.java 2>/dev/null

if [ $? -eq 0 ]; then
    java -cp "target/data-quality-backend-1.0.0.jar:$(mvn dependency:build-classpath -q | tail -1):src/test/java" \
        JdbcConnectionTest
else
    echo -e "${YELLOW}⚠️  Compilation du test échouée, démarrage de l'application...${NC}"
    echo ""
    echo "Démarrage du serveur Spring Boot..."
    java -jar target/data-quality-backend-1.0.0.jar &
    SERVER_PID=$!

    sleep 10

    echo ""
    echo "Test du endpoint health..."
    if curl -s http://localhost:8080/api/reconciliation/health | grep -q "UP"; then
        echo -e "${GREEN}✅ API fonctionnelle${NC}"
    else
        echo -e "${RED}❌ API non accessible${NC}"
    fi

    kill $SERVER_PID
fi

# Nettoyage
rm -f src/test/java/JdbcConnectionTest.java src/test/java/JdbcConnectionTest.class

echo ""
echo "Pour démarrer l'application:"
echo "  mvn spring-boot:run"
echo ""
echo "Ou:"
echo "  java -jar target/data-quality-backend-1.0.0.jar"
