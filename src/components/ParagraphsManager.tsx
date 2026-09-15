import React, { useState, useEffect } from 'react';
import { CMSParagraphEntity, Language, Theme } from '../types';
import { fetchCMSParagraphsAPI, updateCMSParagraphAPI } from '../services/api';
import { FileText, Edit3, Check, Loader2, RefreshCw } from 'lucide-react';

interface ParagraphsManagerProps {
  lang: Language;
  theme: Theme;
  onCMSUpdated?: () => void;
}

export const ParagraphsManager: React.FC<ParagraphsManagerProps> = ({ lang, theme, onCMSUpdated }) => {
  const isAr = lang === 'ar';
  const isDark = theme === 'dark';

  const [paragraphs, setParagraphs] = useState<CMSParagraphEntity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [savingSlug, setSavingSlug] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const loadParas = async () => {
    setIsLoading(true);
    try {
      const data = await fetchCMSParagraphsAPI();
      setParagraphs(data);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadParas();
  }, []);

  const handleUpdate = async (p: CMSParagraphEntity) => {
    setSavingSlug(p.slug);
    try {
      await updateCMSParagraphAPI(p.slug, p);
      if (onCMSUpdated) onCMSUpdated();
      setToast(isAr ? `تم حفظ نص [${p.slug}] بنجاح في قاعدة البيانات` : `Saved [${p.slug}] to DB`);
    } finally {
      setSavingSlug(null);
      setTimeout(() => setToast(null), 3000);
    }
  };

  const handleFieldChange = (slug: string, field: 'text_ar' | 'text_en' | 'title_ar' | 'title_en', val: string) => {
    setParagraphs(prev => prev.map(p => p.slug === slug ? { ...p, [field]: val } : p));
  };

  return (
    <div className="space-y-6">
      {toast && (
        <div className="p-3 bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 rounded-xl text-xs font-bold flex items-center gap-2">
          <Check className="w-4 h-4" />
          <span>{toast}</span>
        </div>
      )}

      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-black flex items-center gap-2">
            <FileText className="w-5 h-5 text-amber-500" />
            <span>{isAr ? 'إدارة نصوص ومحتوى الموقع (CMS)' : 'Website Content & CMS Paragraphs'}</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            {isAr ? 'تعديل النصوص الرئيسية، البنرات الإعلانية، ونصوص الخدمات مباشرة وتخزينها في قاعدة البيانات' : 'Live editing of website content saved in PostgreSQL'}
          </p>
        </div>

        <button
          onClick={loadParas}
          className="p-2 rounded-xl border border-slate-700 hover:bg-slate-800 text-slate-300"
          title="Reload"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {isLoading ? (
        <div className="py-16 text-center">
          <Loader2 className="w-8 h-8 animate-spin text-amber-500 mx-auto mb-2" />
          <p className="text-xs text-slate-400">{isAr ? 'جاري تحميل النصوص...' : 'Loading paragraphs...'}</p>
        </div>
      ) : (
        <div className="space-y-4">
          {paragraphs.map((p) => (
            <div
              key={p.slug}
              className={`p-5 rounded-2xl border ${
                isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-1 rounded-lg bg-amber-500/20 text-amber-400 text-xs font-mono font-bold">
                    {p.slug}
                  </span>
                  <span className="text-xs font-bold text-slate-400">
                    {p.section_name || 'قسم عام'}
                  </span>
                </div>
                <button
                  onClick={() => handleUpdate(p)}
                  disabled={savingSlug === p.slug}
                  className="px-4 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {savingSlug === p.slug ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                  <span>{isAr ? 'حفظ النص' : 'Save Text'}</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold mb-1 text-slate-400">النص باللغة العربية (Arabic)</label>
                  <textarea
                    rows={3}
                    value={p.text_ar || ''}
                    onChange={(e) => handleFieldChange(p.slug, 'text_ar', e.target.value)}
                    className={`w-full px-3 py-2 rounded-xl border text-xs leading-relaxed ${
                      isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                    }`}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold mb-1 text-slate-400">النص باللغة الإنجليزية (English)</label>
                  <textarea
                    rows={3}
                    value={p.text_en || ''}
                    onChange={(e) => handleFieldChange(p.slug, 'text_en', e.target.value)}
                    className={`w-full px-3 py-2 rounded-xl border text-xs leading-relaxed ${
                      isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                    }`}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
