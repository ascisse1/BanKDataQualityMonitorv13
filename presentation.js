import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import fs from 'fs';
import path from 'path';

// Créer un nouveau document PDF
const doc = new jsPDF({
  orientation: 'landscape',
  unit: 'mm',
  format: 'a4'
});

// Fonction pour ajouter un titre de page
function addPageTitle(title, y = 20) {
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  doc.setTextColor(26, 54, 93); // Couleur primaire
  doc.text(title, 15, y);
  doc.setDrawColor(26, 54, 93);
  doc.setLineWidth(0.5);
  doc.line(15, y + 3, 280, y + 3);
}

// Fonction pour ajouter du texte
function addText(text, x, y, options = {}) {
  const { fontSize = 12, fontStyle = 'normal', color = [0, 0, 0] } = options;
  doc.setFont('helvetica', fontStyle);
  doc.setFontSize(fontSize);
  doc.setTextColor(color[0], color[1], color[2]);
  doc.text(text, x, y);
}

// Fonction pour ajouter une liste à puces
function addBulletList(items, x, y, options = {}) {
  const { fontSize = 11, lineHeight = 7 } = options;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(fontSize);
  doc.setTextColor(0, 0, 0);
  
  let currentY = y;
  items.forEach(item => {
    doc.text('• ' + item, x, currentY);
    currentY += lineHeight;
  });
  
  return currentY;
}

// Fonction pour ajouter une image (simulée)
function addImage(name, x, y, width, height) {
  // Simuler une image avec un rectangle
  doc.setDrawColor(200, 200, 200);
  doc.setFillColor(240, 240, 240);
  doc.roundedRect(x, y, width, height, 3, 3, 'FD');
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  doc.text(`[Image: ${name}]`, x + width/2, y + height/2, { align: 'center' });
}

// Fonction pour ajouter un graphique (simulé)
function addChart(title, x, y, width, height) {
  // Simuler un graphique avec un rectangle
  doc.setDrawColor(200, 200, 200);
  doc.setFillColor(245, 245, 245);
  doc.roundedRect(x, y, width, height, 3, 3, 'FD');
  
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(80, 80, 80);
  doc.text(title, x + width/2, y + 10, { align: 'center' });
  
  // Simuler des barres de graphique
  doc.setFillColor(26, 54, 93); // Couleur primaire
  doc.rect(x + 20, y + 30, 30, 10, 'F');
  doc.rect(x + 20, y + 45, 50, 10, 'F');
  doc.rect(x + 20, y + 60, 40, 10, 'F');
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(50, 50, 50);
  doc.text('Données', x + 10, y + 35);
  doc.text('Qualité', x + 10, y + 50);
  doc.text('FATCA', x + 10, y + 65);
}

// Ajouter un pied de page à chaque page
function addFooter(pageNumber) {
  const totalPages = doc.getNumberOfPages();
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(8);
  doc.setTextColor(100, 100, 100);
  doc.text(`Bank Data Quality Monitor - Page ${pageNumber} sur ${totalPages}`, 15, 200);
  doc.text('Confidentiel - 2025', 250, 200);
}

// Page 1: Page de titre
addPageTitle('Bank Data Quality Monitor', 30);
addText('Solution de surveillance et d\'amélioration de la qualité des données clients', 15, 45, { fontSize: 16 });
addText('FATCA Compliance Made Easy', 15, 55, { fontSize: 14, color: [52, 187, 128] });

// Ajouter une image de logo (simulée)
addImage('Logo', 200, 25, 70, 40);

// Ajouter des informations de présentation
addText('Présentation commerciale', 15, 80, { fontSize: 14, fontStyle: 'bold' });
addText('Juin 2025', 15, 90);

// Ajouter des points clés
const keyPoints = [
  'Fiabilisation automatisée des données clients',
  'Détection et correction des anomalies',
  'Conformité FATCA/CRS simplifiée',
  'Réduction des risques réglementaires',
  'ROI rapide et mesurable'
];

addText('Points clés :', 15, 110, { fontStyle: 'bold' });
addBulletList(keyPoints, 20, 120);

// Ajouter des statistiques clés
addText('Chiffres clés :', 150, 110, { fontStyle: 'bold' });
addText('✓ Réduction de 40% des erreurs FATCA en 3 mois', 155, 120);
addText('✓ Économie de 200+ heures/an sur les déclarations', 155, 130);
addText('✓ Coût moyen d\'une erreur FATCA : 50 000€', 155, 140);

addFooter(1);

// Page 2: Enjeux actuels
doc.addPage();
addPageTitle('Enjeux actuels', 20);

// Texte d'introduction
addText('Les banques font face à des défis majeurs en matière de qualité des données clients :', 15, 35);

// Colonne de gauche: Problèmes
addText('Problèmes', 15, 50, { fontStyle: 'bold', fontSize: 14 });
const problems = [
  'Données clients fragmentées entre différents systèmes',
  'Informations incomplètes ou obsolètes',
  'Processus manuels coûteux et sujets aux erreurs',
  'Difficultés à identifier les clients soumis à FATCA/CRS',
  'Risques de non-conformité et d\'amendes réglementaires',
  'Perte de confiance des clients due aux erreurs de données'
];
addBulletList(problems, 20, 60);

// Colonne de droite: Conséquences
addText('Conséquences', 150, 50, { fontStyle: 'bold', fontSize: 14 });
const consequences = [
  'Amendes réglementaires (jusqu\'à 50 000€ par erreur FATCA)',
  '200+ heures/an consacrées aux déclarations manuelles',
  'Risques de réputation et de perte de clients',
  'Inefficacité opérationnelle et coûts élevés',
  'Décisions commerciales basées sur des données erronées',
  'Difficultés à se conformer aux nouvelles réglementations'
];
addBulletList(consequences, 155, 60);

// Ajouter un graphique (simulé)
addChart('Augmentation des amendes FATCA (2018-2025)', 80, 120, 140, 70);

addFooter(2);

// Page 3: Notre solution
doc.addPage();
addPageTitle('Notre solution', 20);

// Description de la solution
addText('Bank Data Quality Monitor : une plateforme complète pour la qualité des données clients', 15, 35, { fontSize: 14, fontStyle: 'bold' });
addText('Notre solution permet de détecter, corriger et prévenir les anomalies dans vos données clients, tout en simplifiant la conformité réglementaire.', 15, 45);

// Architecture de la solution (simulée)
addImage('Architecture technique', 15, 55, 120, 70);

// Workflow
addText('Workflow optimisé', 150, 55, { fontStyle: 'bold' });
const workflow = [
  'Collecte des données depuis vos systèmes existants',
  'Détection automatique des anomalies selon 120+ règles',
  'Correction assistée avec suggestions intelligentes',
  'Identification des clients FATCA/CRS',
  'Génération automatique des rapports réglementaires',
  'Tableau de bord de suivi et d\'amélioration continue'
];
addBulletList(workflow, 155, 65);

// Compatibilité
addText('Compatible avec vos systèmes existants', 15, 135, { fontStyle: 'bold' });
const compatibility = [
  'Intégration avec les systèmes bancaires courants',
  'Déploiement sur site ou en cloud',
  'Temps d\'implémentation : 4-6 semaines',
  'Formation utilisateur : 2 jours'
];
addBulletList(compatibility, 20, 145);

// Sécurité
addText('Sécurité et conformité', 150, 135, { fontStyle: 'bold' });
const security = [
  'Chiffrement des données sensibles (AES-256)',
  'Authentification multi-facteurs',
  'Piste d\'audit complète',
  'Conforme RGPD, PCI-DSS et normes bancaires'
];
addBulletList(security, 155, 145);

addFooter(3);

// Page 4: Module de Data Cleansing
doc.addPage();
addPageTitle('Module de Data Cleansing', 20);

// Description du module
addText('Fiabilisation automatisée des données clients', 15, 35, { fontSize: 14, fontStyle: 'bold' });
addText('Notre module de nettoyage des données détecte et corrige automatiquement les anomalies dans vos bases clients.', 15, 45);

// Avant/Après (simulé)
addText('Avant', 40, 60, { fontStyle: 'bold' });
addText('Après', 200, 60, { fontStyle: 'bold' });
addImage('Données avant correction', 15, 65, 120, 60);
addImage('Données après correction', 175, 65, 120, 60);

// Fonctionnalités clés
addText('Fonctionnalités clés', 15, 135, { fontStyle: 'bold' });
const features = [
  'Détection de 120+ types d\'anomalies',
  'Traitement de 120 000+ enregistrements en moins de 5 minutes',
  'Normalisation des adresses et vérification des identifiants',
  'Détection des doublons et des incohérences',
  'Tableau de bord en temps réel des corrections',
  'Historique complet des modifications'
];
addBulletList(features, 20, 145);

// Performance
addText('Performance', 150, 135, { fontStyle: 'bold' });
const performance = [
  'Taux de détection des anomalies : 99,8%',
  'Réduction des erreurs de 40% en 3 mois',
  'Amélioration continue via machine learning',
  'Traitement par lots ou en temps réel'
];
addBulletList(performance, 155, 145);

addFooter(4);

// Page 5: Automation FATCA/CRS
doc.addPage();
addPageTitle('Automation FATCA/CRS', 20);

// Description du module
addText('Conformité réglementaire sans effort', 15, 35, { fontSize: 14, fontStyle: 'bold' });
addText('Notre module FATCA/CRS automatise l\'identification des clients concernés et la génération des rapports réglementaires.', 15, 45);

// Capture d'écran (simulée)
addImage('Module FATCA avec rapport généré', 15, 55, 270, 80);

// Fonctionnalités clés
addText('Fonctionnalités clés', 15, 145, { fontStyle: 'bold' });
const fatcaFeatures = [
  'Identification automatique des indices d\'américanité',
  'Génération des formulaires W-8BEN, W-9 et auto-certifications',
  'Suivi des statuts de documentation par client',
  'Rapports de conformité prêts à l\'emploi',
  'Alertes pour les documents manquants ou expirés'
];
addBulletList(fatcaFeatures, 20, 155);

// Bénéfices
addText('Bénéfices', 150, 145, { fontStyle: 'bold' });
const fatcaBenefits = [
  'Réduction du risque d\'amendes réglementaires',
  'Économie de temps sur les déclarations (200+ heures/an)',
  'Amélioration de la précision des déclarations',
  'Adaptable aux évolutions réglementaires'
];
addBulletList(fatcaBenefits, 155, 155);

addFooter(5);

// Page 6: Bénéfices économiques
doc.addPage();
addPageTitle('Bénéfices économiques', 20);

// ROI
addText('ROI mesurable et immédiat', 15, 35, { fontSize: 14, fontStyle: 'bold' });
addText('Notre solution offre un retour sur investissement rapide et quantifiable.', 15, 45);

// Graphique ROI (simulé)
addChart('ROI sur 3 ans', 15, 55, 120, 70);

// Économies réalisées
addText('Économies réalisées', 150, 55, { fontStyle: 'bold' });
const savings = [
  'Réduction de 40% des erreurs FATCA en 3 mois',
  'Économie de 200+ heures/an sur les processus de déclaration',
  'Diminution de 65% du temps de traitement des anomalies',
  'Réduction des risques d\'amendes réglementaires (50 000€ par erreur évitée)',
  'Optimisation des ressources humaines (redéploiement vers des tâches à valeur ajoutée)'
];
addBulletList(savings, 155, 65);

// Témoignage client
addText('Témoignage client', 15, 135, { fontStyle: 'bold' });
doc.setDrawColor(200, 200, 200);
doc.setFillColor(250, 250, 250);
doc.roundedRect(15, 140, 270, 40, 3, 3, 'FD');
addText('"Grâce à Bank Data Quality Monitor, nous avons réduit nos erreurs FATCA de 60% en seulement', 20, 150);
addText('3 mois et économisé plus de 180 000€ en amendes évitées. Le ROI a été atteint en moins de 6 mois."', 20, 160);
addText('- Directeur de la Conformité, Banque Régionale X', 20, 175, { fontStyle: 'italic' });

addFooter(6);

// Page 7: Sécurité et conformité
doc.addPage();
addPageTitle('Sécurité et conformité', 20);

// Description
addText('Sécurité intégrée à chaque niveau', 15, 35, { fontSize: 14, fontStyle: 'bold' });
addText('Notre solution respecte les plus hauts standards de sécurité et de conformité du secteur bancaire.', 15, 45);

// Schéma de sécurité (simulé)
addImage('Schéma des couches de sécurité', 15, 55, 270, 80);

// Fonctionnalités de sécurité
addText('Fonctionnalités de sécurité', 15, 145, { fontStyle: 'bold' });
const securityFeatures = [
  'Chiffrement des données sensibles (AES-256)',
  'Authentification multi-facteurs',
  'Piste d\'audit complète de toutes les modifications',
  'Contrôle d\'accès basé sur les rôles (RBAC)',
  'Tests de pénétration réguliers'
];
addBulletList(securityFeatures, 20, 155);

// Conformité
addText('Conformité', 150, 145, { fontStyle: 'bold' });
const compliance = [
  'RGPD (protection des données personnelles)',
  'PCI-DSS (sécurité des données de paiement)',
  'Normes bancaires locales et internationales',
  'Adaptable aux évolutions réglementaires'
];
addBulletList(compliance, 155, 155);

addFooter(7);

// Page 8: Comparaison concurrentielle
doc.addPage();
addPageTitle('Notre différence', 20);

// Description
addText('Comparaison avec les solutions existantes', 15, 35, { fontSize: 14, fontStyle: 'bold' });

// Tableau comparatif
const tableData = [
  ['Critère', 'Bank Data Quality Monitor', 'Solutions traditionnelles', 'Solutions génériques'],
  ['Coût d\'implémentation', 'Moyen', 'Élevé', 'Faible'],
  ['Temps de déploiement', '4-6 semaines', '6-12 mois', '2-4 semaines'],
  ['Précision FATCA', '99.7%', '95%', '85%'],
  ['Intégration bancaire', 'Native', 'Complexe', 'Limitée'],
  ['Support réglementaire', 'Complet', 'Partiel', 'Minimal'],
  ['Facilité d\'utilisation', 'Élevée', 'Moyenne', 'Variable'],
  ['Évolutivité', 'Excellente', 'Limitée', 'Moyenne'],
  ['Support local', 'Dédié', 'Variable', 'Limité']
];

doc.autoTable({
  startY: 45,
  head: [tableData[0]],
  body: tableData.slice(1),
  theme: 'grid',
  headStyles: { fillColor: [26, 54, 93], textColor: [255, 255, 255] },
  columnStyles: {
    0: { cellWidth: 50 },
    1: { cellWidth: 70 },
    2: { cellWidth: 70 },
    3: { cellWidth: 70 }
  },
  styles: { halign: 'center' },
  alternateRowStyles: { fillColor: [240, 240, 240] }
});

// Points forts
addText('Nos points forts', 15, 140, { fontStyle: 'bold' });
const strengths = [
  'Solution spécialisée pour le secteur bancaire',
  'Développée par des experts en conformité réglementaire',
  'Mise à jour régulière selon les évolutions réglementaires',
  'Support technique et réglementaire inclus',
  'Adaptable à vos processus existants'
];
addBulletList(strengths, 20, 150);

addFooter(8);

// Page 9: Étude de cas
doc.addPage();
addPageTitle('Success Story : Banque Régionale X', 20);

// Description
addText('Défis, solution et résultats', 15, 35, { fontSize: 14, fontStyle: 'bold' });

// Défis
addText('Défis', 15, 50, { fontStyle: 'bold' });
const challenges = [
  '350 000 clients, dont 60% avec des données incomplètes',
  '3 amendes FATCA reçues au cours des 2 dernières années',
  'Processus manuel de vérification des données coûteux (4 ETP)',
  'Difficultés à identifier les clients soumis à FATCA/CRS'
];
addBulletList(challenges, 20, 60);

// Solution
addText('Solution', 15, 95, { fontStyle: 'bold' });
const solution = [
  'Déploiement de Bank Data Quality Monitor en 5 semaines',
  'Formation de 2 jours pour l\'équipe conformité',
  'Intégration avec le système bancaire existant',
  'Configuration de règles de validation spécifiques'
];
addBulletList(solution, 20, 105);

// Résultats
addText('Résultats', 150, 50, { fontStyle: 'bold' });
const results = [
  'Réduction de 60% des erreurs de données en 3 mois',
  'Économie de 180 000€ en amendes évitées',
  'Taux de conformité FATCA passé de 82% à 99.5%',
  'Réduction de 75% du temps consacré aux déclarations',
  'ROI atteint en moins de 6 mois',
  'Redéploiement de 3 ETP vers des tâches à valeur ajoutée'
];
addBulletList(results, 155, 60);

// Graphique des résultats (simulé)
addChart('Évolution du taux de conformité FATCA', 150, 105, 120, 70);

addFooter(9);

// Page 10: Prochaines étapes
doc.addPage();
addPageTitle('Commencez votre transformation', 20);

// Description
addText('Prochaines étapes pour implémenter Bank Data Quality Monitor', 15, 35, { fontSize: 14, fontStyle: 'bold' });

// Étapes d'implémentation
addText('1. POC gratuit (2 semaines)', 15, 55, { fontStyle: 'bold', fontSize: 14 });
addText('Nous analysons un échantillon de vos données pour identifier les anomalies et quantifier les gains potentiels.', 15, 65);

addText('2. Intégration complète (4-6 semaines)', 15, 80, { fontStyle: 'bold', fontSize: 14 });
addText('Déploiement de la solution, configuration des règles de validation et intégration avec vos systèmes.', 15, 90);

addText('3. Formation et support', 15, 105, { fontStyle: 'bold', fontSize: 14 });
addText('Formation de vos équipes et support continu pour optimiser l\'utilisation de la solution.', 15, 115);

addText('4. Extension à d\'autres réglementations', 15, 130, { fontStyle: 'bold', fontSize: 14 });
addText('Possibilité d\'étendre la solution à d\'autres réglementations (AML, GDPR, etc.).', 15, 140);

// Call to Action
doc.setDrawColor(26, 54, 93);
doc.setFillColor(26, 54, 93);
doc.roundedRect(80, 155, 140, 30, 3, 3, 'FD');
doc.setTextColor(255, 255, 255);
doc.setFont('helvetica', 'bold');
doc.setFontSize(16);
doc.text('Planifiez votre démonstration personnalisée', 150, 170, { align: 'center' });
doc.setFontSize(12);
doc.text('contact@bank-data-quality-monitor.com | +33 1 23 45 67 89', 150, 180, { align: 'center' });

addFooter(10);

// Enregistrer le PDF
const outputPath = path.join(process.cwd(), 'Bank_Data_Quality_Monitor_Presentation.pdf');
doc.save(outputPath);

console.log(`Présentation PDF créée avec succès: ${outputPath}`);