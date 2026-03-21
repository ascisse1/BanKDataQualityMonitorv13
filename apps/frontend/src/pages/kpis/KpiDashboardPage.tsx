import React, { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, Target, Clock, CheckCircle, XCircle, RefreshCw } from 'lucide-react';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { kpiService, type DashboardMetrics, type Kpi } from '../../services/kpiService';
import { useAuth } from '../../context/AuthContext';

export const KpiDashboardPage: React.FC = () => {
  const { user } = useAuth();
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [historicalKpis, setHistoricalKpis] = useState<Kpi[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAgency, setSelectedAgency] = useState<string>('');
  const [dateRange, setDateRange] = useState({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    loadDashboard();
  }, [selectedAgency]);

  const loadDashboard = async () => {
    try {
      setLoading(true);
      const agencyCode = selectedAgency || (user?.agencyCode !== 'GLOBAL' ? user?.agencyCode : undefined);

      const dashboardData = await kpiService.getDashboardMetrics(agencyCode);
      setMetrics(dashboardData);

      if (agencyCode) {
        const historical = await kpiService.getKpisByAgencyAndDateRange(
          agencyCode,
          dateRange.startDate,
          dateRange.endDate
        );
        setHistoricalKpis(historical);
      }
    } catch (error) {
      console.error('Failed to load KPI dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const getKpiStatus = (value: number, target: number, isTime: boolean = false) => {
    const threshold = 0.9;
    if (isTime) {
      return value <= target ? 'success' : value <= target * 1.2 ? 'warning' : 'danger';
    }
    return value >= target * threshold ? 'success' : value >= target * 0.7 ? 'warning' : 'danger';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success':
        return 'text-green-600 bg-green-50';
      case 'warning':
        return 'text-yellow-600 bg-yellow-50';
      case 'danger':
        return 'text-red-600 bg-red-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="w-5 h-5" />;
      case 'warning':
        return <Clock className="w-5 h-5" />;
      case 'danger':
        return <XCircle className="w-5 h-5" />;
      default:
        return <Target className="w-5 h-5" />;
    }
  };

  const calculateTrend = (kpiType: string): { value: number; isPositive: boolean } => {
    const relevantKpis = historicalKpis
      .filter(k => k.kpiType === kpiType)
      .sort((a, b) => new Date(a.periodDate).getTime() - new Date(b.periodDate).getTime());

    if (relevantKpis.length < 2) return { value: 0, isPositive: true };

    const recent = relevantKpis.slice(-7);
    const previous = relevantKpis.slice(-14, -7);

    if (recent.length === 0 || previous.length === 0) return { value: 0, isPositive: true };

    const recentAvg = recent.reduce((sum, k) => sum + k.kpiValue, 0) / recent.length;
    const previousAvg = previous.reduce((sum, k) => sum + k.kpiValue, 0) / previous.length;

    const change = ((recentAvg - previousAvg) / previousAvg) * 100;
    const isPositive = kpiType === 'AVG_RESOLUTION_TIME' ? change < 0 : change > 0;

    return { value: Math.abs(change), isPositive };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!metrics) {
    return (
      <div className="flex items-center justify-center h-96">
        <p className="text-gray-600">Aucune donnée disponible</p>
      </div>
    );
  }

  const closureStatus = getKpiStatus(metrics.closureRate, 95);
  const slaStatus = getKpiStatus(metrics.slaCompliance, 90);
  const timeStatus = getKpiStatus(metrics.avgResolutionTime, 48, true);

  const closureTrend = calculateTrend('CLOSURE_RATE');
  const slaTrend = calculateTrend('SLA_COMPLIANCE');
  const timeTrend = calculateTrend('AVG_RESOLUTION_TIME');

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard KPIs</h1>
          <p className="mt-1 text-sm text-gray-600">
            Indicateurs de performance temps réel
          </p>
        </div>
        <div className="flex items-center gap-2">
          {user?.role === 'ADMIN' && (
            <select
              value={selectedAgency}
              onChange={(e) => setSelectedAgency(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Toutes les agences</option>
              <option value="AGE001">Agence 001</option>
              <option value="AGE002">Agence 002</option>
            </select>
          )}
          <Button onClick={loadDashboard} variant="outline">
            <RefreshCw className="w-4 h-4 mr-2" />
            Actualiser
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className={`p-2 rounded-lg ${getStatusColor(closureStatus)}`}>
                  {getStatusIcon(closureStatus)}
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Taux de Clôture</p>
                  <p className="text-xs text-gray-500">Objectif: 95%</p>
                </div>
              </div>
            </div>
            <div className="flex items-end justify-between">
              <div>
                <p className="text-3xl font-bold text-gray-900">
                  {metrics.closureRate.toFixed(1)}%
                </p>
                <div className="flex items-center gap-1 mt-1">
                  {closureTrend.isPositive ? (
                    <TrendingUp className="w-4 h-4 text-green-600" />
                  ) : (
                    <TrendingDown className="w-4 h-4 text-red-600" />
                  )}
                  <span className={`text-xs font-medium ${closureTrend.isPositive ? 'text-green-600' : 'text-red-600'}`}>
                    {closureTrend.value.toFixed(1)}%
                  </span>
                  <span className="text-xs text-gray-500">vs période précédente</span>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-600">{metrics.ticketsClosed}</p>
                <p className="text-xs text-gray-500">/ {metrics.ticketsTotal} tickets</p>
              </div>
            </div>
          </div>
        </Card>

        <Card>
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className={`p-2 rounded-lg ${getStatusColor(slaStatus)}`}>
                  {getStatusIcon(slaStatus)}
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Respect SLA</p>
                  <p className="text-xs text-gray-500">Objectif: 90%</p>
                </div>
              </div>
            </div>
            <div className="flex items-end justify-between">
              <div>
                <p className="text-3xl font-bold text-gray-900">
                  {metrics.slaCompliance.toFixed(1)}%
                </p>
                <div className="flex items-center gap-1 mt-1">
                  {slaTrend.isPositive ? (
                    <TrendingUp className="w-4 h-4 text-green-600" />
                  ) : (
                    <TrendingDown className="w-4 h-4 text-red-600" />
                  )}
                  <span className={`text-xs font-medium ${slaTrend.isPositive ? 'text-green-600' : 'text-red-600'}`}>
                    {slaTrend.value.toFixed(1)}%
                  </span>
                  <span className="text-xs text-gray-500">vs période précédente</span>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm text-red-600">{metrics.ticketsSlaBreached}</p>
                <p className="text-xs text-gray-500">dépassements</p>
              </div>
            </div>
          </div>
        </Card>

        <Card>
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className={`p-2 rounded-lg ${getStatusColor(timeStatus)}`}>
                  {getStatusIcon(timeStatus)}
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Temps Moyen</p>
                  <p className="text-xs text-gray-500">Objectif: 48h</p>
                </div>
              </div>
            </div>
            <div className="flex items-end justify-between">
              <div>
                <p className="text-3xl font-bold text-gray-900">
                  {metrics.avgResolutionTime.toFixed(1)}h
                </p>
                <div className="flex items-center gap-1 mt-1">
                  {timeTrend.isPositive ? (
                    <TrendingDown className="w-4 h-4 text-green-600" />
                  ) : (
                    <TrendingUp className="w-4 h-4 text-red-600" />
                  )}
                  <span className={`text-xs font-medium ${timeTrend.isPositive ? 'text-green-600' : 'text-red-600'}`}>
                    {timeTrend.value.toFixed(1)}%
                  </span>
                  <span className="text-xs text-gray-500">vs période précédente</span>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-600">Résolution</p>
                <p className="text-xs text-gray-500">moyenne</p>
              </div>
            </div>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <div className="p-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Évolution Mensuelle</h3>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {['CLOSURE_RATE', 'SLA_COMPLIANCE', 'AVG_RESOLUTION_TIME'].map((type) => {
                const typeKpis = historicalKpis
                  .filter(k => k.kpiType === type)
                  .sort((a, b) => new Date(b.periodDate).getTime() - new Date(a.periodDate).getTime())
                  .slice(0, 1);

                if (typeKpis.length === 0) return null;

                const kpi = typeKpis[0];
                const label = kpiService.getKpiLabel(kpi.kpiType);
                const unit = kpiService.getKpiUnit(kpi.kpiType);
                const progress = kpi.targetValue
                  ? (kpi.kpiValue / kpi.targetValue) * 100
                  : 0;

                return (
                  <div key={type}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700">{label}</span>
                      <span className="text-sm font-bold text-gray-900">
                        {kpi.kpiValue.toFixed(1)}{unit}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="h-2 rounded-full bg-gradient-to-r from-blue-500 to-blue-600"
                        style={{ width: `${Math.min(progress, 100)}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </Card>

        <Card>
          <div className="p-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Statistiques Détaillées</h3>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between py-2 border-b border-gray-100">
                <span className="text-sm text-gray-600">Tickets Total</span>
                <span className="text-sm font-semibold text-gray-900">{metrics.ticketsTotal}</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-gray-100">
                <span className="text-sm text-gray-600">Tickets Clôturés</span>
                <span className="text-sm font-semibold text-green-600">{metrics.ticketsClosed}</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-gray-100">
                <span className="text-sm text-gray-600">SLA Dépassés</span>
                <span className="text-sm font-semibold text-red-600">{metrics.ticketsSlaBreached}</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-gray-100">
                <span className="text-sm text-gray-600">Taux de Succès</span>
                <span className="text-sm font-semibold text-blue-600">
                  {((metrics.ticketsClosed / metrics.ticketsTotal) * 100).toFixed(1)}%
                </span>
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="text-sm text-gray-600">Performance Globale</span>
                <span className={`text-sm font-semibold ${
                  metrics.slaCompliance >= 90 ? 'text-green-600' : 'text-yellow-600'
                }`}>
                  {metrics.slaCompliance >= 90 ? 'Excellent' : 'À améliorer'}
                </span>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};
