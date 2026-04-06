import React, { useState, useEffect } from 'react';
import { FileText, Download, CheckCircle, XCircle, FileSignature, Send, Plus, Clock, Eye, AlertTriangle, RefreshCw } from 'lucide-react';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { db } from '@/services/db';
import { useToast } from '@/components/ui/Toaster';
import { useAuth } from '@/context/AuthContext';
import { log } from '@/services/log';

type DeclarationType = 'ORIGINAL' | 'CORRECTED' | 'VOID';
type DeclarationStatus = 'DRAFT' | 'PENDING_VALIDATION' | 'VALIDATED' | 'SIGNED' | 'SUBMITTED' | 'ACKNOWLEDGED' | 'REJECTED';

interface FatcaDeclaration {
  id: number;
  reportingYear: number;
  declarationType: DeclarationType;
  status: DeclarationStatus;
  generatedBy: string;
  generatedAt: string;
  validatedBy: string | null;
  validatedAt: string | null;
  validationNotes: string | null;
  signedBy: string | null;
  signedAt: string | null;
  submittedAt: string | null;
  messageRefId: string;
  correctedMessageRefId: string | null;
  totalAccounts: number;
  notes: string | null;
}

const STATUS_CONFIG: Record<DeclarationStatus, { label: string; color: string; icon: React.ReactNode }> = {
  DRAFT: { label: 'Brouillon', color: 'bg-gray-100 text-gray-800', icon: <FileText className="h-3.5 w-3.5" /> },
  PENDING_VALIDATION: { label: 'En validation', color: 'bg-yellow-100 text-yellow-800', icon: <Clock className="h-3.5 w-3.5" /> },
  VALIDATED: { label: 'Validée', color: 'bg-blue-100 text-blue-800', icon: <CheckCircle className="h-3.5 w-3.5" /> },
  SIGNED: { label: 'Signée', color: 'bg-purple-100 text-purple-800', icon: <FileSignature className="h-3.5 w-3.5" /> },
  SUBMITTED: { label: 'Soumise', color: 'bg-green-100 text-green-800', icon: <Send className="h-3.5 w-3.5" /> },
  ACKNOWLEDGED: { label: 'Confirmée', color: 'bg-emerald-100 text-emerald-800', icon: <CheckCircle className="h-3.5 w-3.5" /> },
  REJECTED: { label: 'Rejetée', color: 'bg-red-100 text-red-800', icon: <XCircle className="h-3.5 w-3.5" /> },
};

const TYPE_LABELS: Record<DeclarationType, string> = {
  ORIGINAL: 'Originale',
  CORRECTED: 'Corrective',
  VOID: 'Annulation',
};

const FatcaDeclarations: React.FC = () => {
  const [declarations, setDeclarations] = useState<FatcaDeclaration[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [actionLoading, setActionLoading] = useState<number | null>(null);

  // Generation form
  const [showForm, setShowForm] = useState(false);
  const [formYear, setFormYear] = useState(new Date().getFullYear() - 1);
  const [formType, setFormType] = useState<DeclarationType>('ORIGINAL');
  const [formCorrRef, setFormCorrRef] = useState('');
  const [formNotes, setFormNotes] = useState('');

  // Validation modal
  const [validatingId, setValidatingId] = useState<number | null>(null);
  const [valNotes, setValNotes] = useState('');

  // Detail view
  const [detailId, setDetailId] = useState<number | null>(null);
  const [detailXml, setDetailXml] = useState<string | null>(null);

  const { addToast } = useToast();
  const { user } = useAuth();

  useEffect(() => { fetchDeclarations(); }, []);

  const fetchDeclarations = async () => {
    try {
      setLoading(true);
      const result = await db.getFatcaDeclarations(0, 50);
      const page = result?.content || result?.data || result || [];
      setDeclarations(Array.isArray(page) ? page : []);
    } catch (error) {
      log.error('api', 'Failed to fetch declarations', { error });
      addToast('Erreur lors du chargement des déclarations', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerate = async () => {
    if (formType !== 'ORIGINAL' && !formCorrRef.trim()) {
      addToast('Le MessageRefId de référence est requis pour une correction/annulation', 'error');
      return;
    }
    try {
      setGenerating(true);
      await db.generateFatcaDeclaration(formYear, formType, formCorrRef || undefined, formNotes || undefined);
      addToast('Déclaration FATCA générée avec succès', 'success');
      setShowForm(false);
      setFormNotes('');
      setFormCorrRef('');
      await fetchDeclarations();
    } catch (error) {
      log.error('api', 'Failed to generate declaration', { error });
      addToast('Erreur lors de la génération', 'error');
    } finally {
      setGenerating(false);
    }
  };

  const handleDownload = async (decl: FatcaDeclaration) => {
    try {
      const blob = await db.downloadFatcaDeclarationXml(decl.id);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `FATCA_${decl.reportingYear}_${decl.messageRefId}.xml`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      addToast('Erreur lors du téléchargement', 'error');
    }
  };

  const handleValidate = async (id: number, approved: boolean) => {
    try {
      setActionLoading(id);
      await db.validateFatcaDeclaration(id, approved, valNotes || undefined);
      addToast(approved ? 'Déclaration validée' : 'Déclaration rejetée', 'success');
      setValidatingId(null);
      setValNotes('');
      await fetchDeclarations();
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Erreur';
      addToast(msg, 'error');
    } finally {
      setActionLoading(null);
    }
  };

  const handleSign = async (id: number) => {
    try {
      setActionLoading(id);
      await db.signFatcaDeclaration(id);
      addToast('Déclaration signée', 'success');
      await fetchDeclarations();
    } catch (error) {
      addToast('Erreur lors de la signature', 'error');
    } finally {
      setActionLoading(null);
    }
  };

  const handleSubmit = async (id: number) => {
    try {
      setActionLoading(id);
      await db.submitFatcaDeclaration(id);
      addToast('Déclaration soumise à l\'IRS', 'success');
      await fetchDeclarations();
    } catch (error) {
      addToast('Erreur lors de la soumission', 'error');
    } finally {
      setActionLoading(null);
    }
  };

  const handleViewXml = async (decl: FatcaDeclaration) => {
    if (detailId === decl.id) {
      setDetailId(null);
      setDetailXml(null);
      return;
    }
    try {
      const blob = await db.downloadFatcaDeclarationXml(decl.id);
      const text = await blob.text();
      setDetailXml(text);
      setDetailId(decl.id);
    } catch {
      addToast('Erreur lors du chargement du XML', 'error');
    }
  };

  const formatDate = (d: string | null) => {
    if (!d) return '-';
    return new Date(d).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Déclarations IRS (Form 8966)</h3>
          <p className="text-sm text-gray-500">Génération, validation et soumission des déclarations FATCA</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" leftIcon={<RefreshCw className="h-4 w-4" />} onClick={fetchDeclarations} disabled={loading}>
            Actualiser
          </Button>
          <Button variant="primary" size="sm" leftIcon={<Plus className="h-4 w-4" />} onClick={() => setShowForm(!showForm)}>
            Nouvelle déclaration
          </Button>
        </div>
      </div>

      {/* Generation Form */}
      {showForm && (
        <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-4">
          <h4 className="font-medium text-gray-900">Générer une déclaration FATCA</h4>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Année de reporting</label>
              <select value={formYear} onChange={e => setFormYear(Number(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500">
                {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 1 - i).map(y => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
              <select value={formType} onChange={e => setFormType(e.target.value as DeclarationType)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500">
                <option value="ORIGINAL">Originale</option>
                <option value="CORRECTED">Corrective</option>
                <option value="VOID">Annulation</option>
              </select>
            </div>
            {formType !== 'ORIGINAL' && (
              <div>
                <Input label="MessageRefId de référence" value={formCorrRef} onChange={e => setFormCorrRef(e.target.value)} placeholder="ID du message à corriger/annuler" />
              </div>
            )}
            <div>
              <Input label="Notes (optionnel)" value={formNotes} onChange={e => setFormNotes(e.target.value)} placeholder="Notes..." />
            </div>
          </div>
          <div className="flex gap-2 justify-end">
            <Button variant="outline" size="sm" onClick={() => setShowForm(false)}>Annuler</Button>
            <Button variant="primary" size="sm" onClick={handleGenerate} isLoading={generating} leftIcon={<FileText className="h-4 w-4" />}>
              Générer le XML
            </Button>
          </div>
        </div>
      )}

      {/* Declarations Table */}
      {loading ? (
        <div className="animate-pulse space-y-3">
          {[...Array(3)].map((_, i) => <div key={i} className="h-16 bg-gray-200 rounded" />)}
        </div>
      ) : declarations.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
          <FileText className="h-12 w-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-500">Aucune déclaration FATCA générée</p>
          <p className="text-sm text-gray-400 mt-1">Cliquez sur "Nouvelle déclaration" pour commencer</p>
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Année</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Statut</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Comptes</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Généré par</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Workflow</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {declarations.map(decl => {
                const sc = STATUS_CONFIG[decl.status];
                return (
                  <React.Fragment key={decl.id}>
                    <tr className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">{decl.reportingYear}</td>
                      <td className="px-4 py-3 text-sm text-gray-700">{TYPE_LABELS[decl.declarationType]}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${sc.color}`}>
                          {sc.icon}{sc.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700">{decl.totalAccounts}</td>
                      <td className="px-4 py-3 text-sm text-gray-700">{decl.generatedBy}</td>
                      <td className="px-4 py-3 text-sm text-gray-500">{formatDate(decl.generatedAt)}</td>
                      <td className="px-4 py-3">
                        {/* Mini timeline */}
                        <div className="flex items-center gap-1 text-xs">
                          <span className="text-green-600" title="Généré">G</span>
                          <span className={decl.validatedAt ? 'text-blue-600' : 'text-gray-300'} title="Validé">V</span>
                          <span className={decl.signedAt ? 'text-purple-600' : 'text-gray-300'} title="Signé">S</span>
                          <span className={decl.submittedAt ? 'text-green-600' : 'text-gray-300'} title="Soumis">T</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button variant="ghost" size="sm" onClick={() => handleViewXml(decl)} title="Voir XML">
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => handleDownload(decl)} title="Télécharger">
                            <Download className="h-4 w-4" />
                          </Button>
                          {decl.status === 'DRAFT' && decl.generatedBy !== user?.username && (
                            <Button variant="outline" size="sm" onClick={() => { setValidatingId(decl.id); setValNotes(''); }}
                              className="text-blue-600">Valider</Button>
                          )}
                          {decl.status === 'VALIDATED' && (
                            <Button variant="outline" size="sm" onClick={() => handleSign(decl.id)}
                              disabled={actionLoading === decl.id} className="text-purple-600"
                              leftIcon={<FileSignature className="h-3.5 w-3.5" />}>Signer</Button>
                          )}
                          {decl.status === 'SIGNED' && (
                            <Button variant="outline" size="sm" onClick={() => handleSubmit(decl.id)}
                              disabled={actionLoading === decl.id} className="text-green-600"
                              leftIcon={<Send className="h-3.5 w-3.5" />}>Soumettre</Button>
                          )}
                        </div>
                      </td>
                    </tr>

                    {/* Validation modal inline */}
                    {validatingId === decl.id && (
                      <tr className="bg-blue-50">
                        <td colSpan={8} className="px-4 py-4">
                          <div className="space-y-3">
                            <p className="text-sm font-medium text-gray-900">Validation 4 Yeux — Déclaration {decl.reportingYear} ({decl.messageRefId})</p>
                            <textarea value={valNotes} onChange={e => setValNotes(e.target.value)}
                              placeholder="Notes de validation (obligatoire pour rejet)..."
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" rows={2} />
                            <div className="flex gap-2 justify-end">
                              <Button variant="outline" size="sm" onClick={() => setValidatingId(null)}>Annuler</Button>
                              <Button variant="outline" size="sm" onClick={() => handleValidate(decl.id, false)}
                                disabled={actionLoading === decl.id}
                                className="text-red-600" leftIcon={<XCircle className="h-4 w-4" />}>Rejeter</Button>
                              <Button variant="primary" size="sm" onClick={() => handleValidate(decl.id, true)}
                                disabled={actionLoading === decl.id}
                                leftIcon={<CheckCircle className="h-4 w-4" />}>Approuver</Button>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}

                    {/* XML preview */}
                    {detailId === decl.id && detailXml && (
                      <tr className="bg-gray-50">
                        <td colSpan={8} className="px-4 py-4">
                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <p className="text-sm font-medium text-gray-900">Aperçu XML — {decl.messageRefId}</p>
                              <div className="flex gap-2 text-xs text-gray-500">
                                {decl.validatedBy && <span>Validé par {decl.validatedBy} le {formatDate(decl.validatedAt)}</span>}
                                {decl.signedBy && <span>| Signé par {decl.signedBy} le {formatDate(decl.signedAt)}</span>}
                                {decl.submittedAt && <span>| Soumis le {formatDate(decl.submittedAt)}</span>}
                              </div>
                            </div>
                            <pre className="bg-gray-900 text-green-400 text-xs p-4 rounded-lg overflow-auto max-h-96 font-mono">
                              {detailXml}
                            </pre>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default FatcaDeclarations;
