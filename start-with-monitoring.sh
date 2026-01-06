#!/bin/bash

echo "🚀 Démarrage BSIC Application avec Monitoring"
echo "=============================================="
echo ""

# Vérifier Docker
if ! command -v docker &> /dev/null; then
    echo "❌ Docker n'est pas installé"
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose n'est pas installé"
    exit 1
fi

# Démarrer les services Docker
echo "📦 Démarrage Redis, Prometheus et Grafana..."
docker-compose up -d

# Attendre que les services soient prêts
echo "⏳ Attente démarrage services..."
sleep 5

# Vérifier Redis
echo -n "🔍 Vérification Redis... "
if docker exec bsic-redis redis-cli ping &> /dev/null; then
    echo "✅ OK"
else
    echo "❌ ERREUR"
fi

# Vérifier Prometheus
echo -n "🔍 Vérification Prometheus... "
if curl -s http://localhost:9090/-/healthy &> /dev/null; then
    echo "✅ OK"
else
    echo "❌ ERREUR"
fi

# Vérifier Grafana
echo -n "🔍 Vérification Grafana... "
if curl -s http://localhost:3000/api/health &> /dev/null; then
    echo "✅ OK"
else
    echo "❌ ERREUR"
fi

echo ""
echo "✅ Tous les services sont démarrés !"
echo ""
echo "📊 Accès aux services :"
echo "   - Backend: http://localhost:8080"
echo "   - Prometheus: http://localhost:9090"
echo "   - Grafana: http://localhost:3000 (admin/admin)"
echo "   - Redis: localhost:6379"
echo ""
echo "🎯 Prochaines étapes :"
echo "   1. Démarrer le backend : cd backend-java && mvn spring-boot:run"
echo "   2. Démarrer le frontend : npm run dev"
echo "   3. Ouvrir Grafana et explorer les dashboards"
echo ""
echo "📖 Documentation complète : GUIDE_MONITORING_REDIS.md"
echo ""
