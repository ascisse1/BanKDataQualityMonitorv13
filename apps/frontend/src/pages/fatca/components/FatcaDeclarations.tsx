import React, { useState, useEffect, useMemo } from 'react';
import { FileText, Download, CheckCircle, XCircle, FileSignature, Send, Plus, Clock, Eye, AlertTriangle, RefreshCw, Copy, Check } from 'lucide-react';
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

/** Syntax-highlighted XML viewer with line numbers, copy, and collapsible structure */
const XmlViewer: React.FC<{
  xml: string;
  decl: FatcaDeclaration;
  formatDate: (d: string | null) => string;
  onCopy: () => void;
}> = ({ xml, decl, formatDate, onCopy }) => {
  const [copied, setCopied] = useState(false);
  const [expanded, setExpanded] = useState(true);

  const handleCopy = () => {
    navigator.clipboard.writeText(xml);
    setCopied(true);
    onCopy();
    setTimeout(() => setCopied(false), 2000);
  };

  // Format and syntax-highlight XML
  const formattedLines = useMemo(() => {
    // Pretty-print: add indentation
    let indent = 0;
    const raw = xml.replace(/></g, '>\n<');
    return raw.split('\n').map(line => {
      const trimmed = line.trim();
      if (!trimmed) return null;

      // Decrease indent for closing tags
      if (trimmed.startsWith('</')) indent = Math.max(0, indent - 1);

      const indented = '  '.repeat(indent) + trimmed;

      // Increase indent for opening tags (not self-closing, not closing)
      if (trimmed.startsWith('<') && !trimmed.startsWith('</') && !trimmed.startsWith('<?') && !trimmed.endsWith('/>') && !trimmed.includes('</')) {
        indent++;
      }

      return indented;
    }).filter(Boolean) as string[];
  }, [xml]);

  const highlightLine = (line: string) => {
    // XML declaration
    if (line.trim().startsWith('<?')) {
      return <span className="text-gray-500">{line}</span>;
    }

    // Highlight XML structure
    return line.split(/(<[^>]+>)/).map((part, i) => {
      if (part.startsWith('</')) {
        // Closing tag
        const tag = part.match(/<\/([^\s>]+)/)?.[1] || '';
        return <span key={i}><span className="text-gray-500">{'</'}</span><span className="text-red-400">{tag}</span><span className="text-gray-500">{'>'}</span></span>;
      }
      if (part.startsWith('<')) {
        // Opening tag with attributes
        const match = part.match(/^<([^\s/>]+)(.*?)(\/?>)$/s);
        if (match) {
          const [, tag, attrs, close] = match;
          // Highlight attributes
          const highlightedAttrs = attrs.replace(/(\w+)="([^"]*)"/g, (_, name, val) =>
            `<ATTR>${name}</ATTR>="<VAL>${val}</VAL>"`
          );
          return (
            <span key={i}>
              <span className="text-gray-500">{'<'}</span>
              <span className="text-red-400">{tag}</span>
              {highlightedAttrs.split(/(<ATTR>|<\/ATTR>|<VAL>|<\/VAL>)/).map((seg, j) => {
                if (seg === '<ATTR>' || seg === '</ATTR>' || seg === '<VAL>' || seg === '</VAL>') return null;
                // Crude but works: alternate between attr name and value
                if (attrs.includes(seg + '="')) return <span key={j} className="text-yellow-300"> {seg}</span>;
                if (seg.startsWith('=')) return <span key={j} className="text-gray-500">{seg}</span>;
                return <span key={j} className="text-green-300">{seg}</span>;
              })}
              <span className="text-gray-500">{close}</span>
            </span>
          );
        }
        return <span key={i} className="text-red-400">{part}</span>;
      }
      // Text content
      if (part.trim()) {
        return <span key={i} className="text-emerald-300">{part}</span>;
      }
      return <span key={i}>{part}</span>;
    });
  };

  const visibleLines = expanded ? formattedLines : formattedLines.slice(0, 20);
  const accountCount = (xml.match(/<AccountReport>/g) || []).length;

  return (
    <div className="space-y-3">
      {/* Header bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <p className="text-sm font-medium text-gray-900">Apercu XML FATCA</p>
          <span className="text-xs px-2 py-0.5 rounded bg-gray-200 text-gray-600">{decl.messageRefId}</span>
          <span className="text-xs px-2 py-0.5 rounded bg-blue-100 text-blue-700">{accountCount} comptes</span>
          <span className="text-xs px-2 py-0.5 rounded bg-gray-200 text-gray-600">{formattedLines.length} lignes</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex gap-2 text-xs text-gray-500">
            {decl.validatedBy && <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-600">Valide: {decl.validatedBy} ({formatDate(decl.validatedAt)})</span>}
            {decl.signedBy && <span className="px-2 py-0.5 rounded bg-purple-50 text-purple-600">Signe: {decl.signedBy} ({formatDate(decl.signedAt)})</span>}
            {decl.submittedAt && <span className="px-2 py-0.5 rounded bg-green-50 text-green-600">Soumis: {formatDate(decl.submittedAt)}</span>}
          </div>
          <button onClick={handleCopy} className="inline-flex items-center gap-1 px-2 py-1 text-xs rounded bg-gray-700 text-gray-300 hover:bg-gray-600 transition-colors"
            title="Copier le XML">
            {copied ? <><Check className="h-3 w-3 text-green-400" />Copie!</> : <><Copy className="h-3 w-3" />Copier</>}
          </button>
        </div>
      </div>

      {/* XML content with line numbers */}
      <div className="relative rounded-lg overflow-hidden border border-gray-700">
        <div className="bg-gray-800 px-3 py-1.5 flex items-center justify-between border-b border-gray-700">
          <div className="flex items-center gap-2">
            <div className="flex gap-1">
              <div className="w-2.5 h-2.5 rounded-full bg-red-500" />
              <div className="w-2.5 h-2.5 rounded-full bg-yellow-500" />
              <div className="w-2.5 h-2.5 rounded-full bg-green-500" />
            </div>
            <span className="text-xs text-gray-400 font-mono">FATCA_{decl.reportingYear}_{decl.declarationType}.xml</span>
          </div>
          <span className="text-xs text-gray-500">{TYPE_LABELS[decl.declarationType]} - {decl.reportingYear}</span>
        </div>

        <div className="overflow-auto max-h-[500px] bg-gray-900">
          <table className="w-full">
            <tbody>
              {visibleLines.map((line, i) => (
                <tr key={i} className="hover:bg-gray-800/50 group">
                  <td className="px-3 py-0 text-right select-none w-10 text-xs text-gray-600 font-mono border-r border-gray-800 group-hover:text-gray-400">
                    {i + 1}
                  </td>
                  <td className="px-3 py-0 text-xs font-mono whitespace-pre">
                    {highlightLine(line)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {formattedLines.length > 20 && (
          <div className="bg-gray-800 px-3 py-2 border-t border-gray-700 text-center">
            <button onClick={() => setExpanded(!expanded)}
              className="text-xs text-blue-400 hover:text-blue-300 transition-colors">
              {expanded ? `Reduire (${formattedLines.length} lignes)` : `Afficher tout (${formattedLines.length} lignes)`}
            </button>
          </div>
        )}
      </div>
    </div>
  );
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
      await db.clearCache();
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
                          {decl.status === 'DRAFT' && (
                            <Button variant="outline" size="sm" onClick={() => { setValidatingId(decl.id); setValNotes(''); }}
                              className="text-blue-600" leftIcon={<CheckCircle className="h-3.5 w-3.5" />}>Valider</Button>
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
                          <XmlViewer xml={detailXml} decl={decl} formatDate={formatDate} onCopy={() => addToast('XML copie dans le presse-papiers', 'success')} />
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
