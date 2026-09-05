'use client';

import React from 'react';
import {
  Bold, Italic, Underline, Strikethrough, Heading2, Heading3,
  List, ListOrdered, Quote, Link2, Unlink, Image as ImageIcon,
  AlignLeft, AlignCenter, AlignRight, AlignJustify, Undo2, Redo2,
  Code, Minus, RemoveFormatting, Loader2,
} from 'lucide-react';
import { uploadToCloudinary } from '@/shared/lib/cloudinary';
import { checkRateLimit, recordUpload } from '@/shared/lib/rate-limiter';
import { cn } from '@/shared/lib/utils';

interface RichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  minHeight?: number;
}

interface Tool {
  key?: string;
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  command?: string;
  arg?: string;
  group: string;
  action?: () => void;
}

export default function RichTextEditor({ value, onChange, placeholder, minHeight = 220 }: RichTextEditorProps) {
  const ref = React.useRef<HTMLDivElement | null>(null);
  const fileRef = React.useRef<HTMLInputElement | null>(null);
  const [uploading, setUploading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [active, setActive] = React.useState<string[]>([]);

  // Synchronise le contenu quand la valeur change depuis l'extérieur (ex. édition)
  React.useEffect(() => {
    const el = ref.current;
    if (el && el.innerHTML !== value) el.innerHTML = value || '';
  }, [value]);

  // Met à jour les boutons actifs selon la sélection courante
  React.useEffect(() => {
    const onSelectionChange = () => {
      const el = ref.current;
      if (!el) return;
      const states: string[] = [];
      const state = (cmd: string) => {
        try { return document.queryCommandState(cmd); } catch { return false; }
      };
      if (state('bold')) states.push('bold');
      if (state('italic')) states.push('italic');
      if (state('underline')) states.push('underline');
      if (state('strikeThrough')) states.push('strike');
      if (state('insertUnorderedList')) states.push('ul');
      if (state('insertOrderedList')) states.push('ol');
      if (state('justifyLeft')) states.push('align-left');
      if (state('justifyCenter')) states.push('align-center');
      if (state('justifyRight')) states.push('align-right');
      if (state('justifyFull')) states.push('align-justify');
      let block = '';
      try { block = (document.queryCommandValue('formatBlock') || '').toLowerCase(); } catch { block = ''; }
      if (block.includes('h2')) states.push('h2');
      if (block.includes('h3')) states.push('h3');
      if (block.includes('blockquote')) states.push('quote');
      setActive(states);
    };
    document.addEventListener('selectionchange', onSelectionChange);
    return () => document.removeEventListener('selectionchange', onSelectionChange);
  }, []);

  const exec = (command: string, arg?: string) => {
    const el = ref.current;
    if (!el) return;
    el.focus();
    document.execCommand(command, false, arg);
    onChange(el.innerHTML);
  };

  const insertHtml = (html: string) => {
    const el = ref.current;
    if (!el) return;
    el.focus();
    document.execCommand('insertHTML', false, html);
    onChange(el.innerHTML);
  };

  const addLink = () => {
    const url = window.prompt('URL du lien (https://…)');
    if (url) exec('createLink', url);
  };

  const addCode = () => {
    const sel = window.getSelection();
    const text = sel ? sel.toString() : '';
    insertHtml(`<code class="editor-code">${text || 'code'}</code>`);
  };

  const addImage = async (file: File) => {
    setError(null);
    if (!file.type.startsWith('image/')) {
      setError('Le fichier doit être une image.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError('Image trop lourde (max 5 Mo).');
      return;
    }
    const userId = localStorage.getItem('userId') || 'anonymous';
    const { allowed, reason } = await checkRateLimit(userId);
    if (!allowed) {
      setError(reason || 'Trop d\u2019uploads, réessayez plus tard.');
      return;
    }
    setUploading(true);
    try {
      const result = await uploadToCloudinary(file, 'gcfi/blog');
      await recordUpload(userId);
      insertHtml(`<img src="${result.secure_url}" alt="" class="editor-img" />`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Échec de l'upload de l'image.");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const tools: Tool[] = [
    // Texte
    { key: 'bold',      icon: Bold,             title: 'Gras (Ctrl+B)',             command: 'bold',                          group: 'text' },
    { key: 'italic',    icon: Italic,           title: 'Italique (Ctrl+I)',         command: 'italic',                        group: 'text' },
    { key: 'underline', icon: Underline,        title: 'Souligné (Ctrl+U)',         command: 'underline',                     group: 'text' },
    { key: 'strike',    icon: Strikethrough,    title: 'Barré',                     command: 'strikeThrough',                 group: 'text' },
    { key: 'code',      icon: Code,             title: 'Code en ligne',             action: addCode,                          group: 'text' },
    // Titres
    { key: 'h2',        icon: Heading2,         title: 'Sous-titre (H2)',           command: 'formatBlock', arg: 'h2',        group: 'headings' },
    { key: 'h3',        icon: Heading3,         title: 'Sous-titre (H3)',           command: 'formatBlock', arg: 'h3',        group: 'headings' },
    // Listes & citation
    { key: 'ul',        icon: List,             title: 'Liste à puces',             command: 'insertUnorderedList',          group: 'blocks' },
    { key: 'ol',        icon: ListOrdered,      title: 'Liste numérotée',           command: 'insertOrderedList',            group: 'blocks' },
    { key: 'quote',     icon: Quote,            title: 'Citation',                  command: 'formatBlock', arg: 'blockquote', group: 'blocks' },
    { key: 'hr',        icon: Minus,            title: 'Séparateur horizontal',     action: () => insertHtml('<hr class="editor-hr" />'), group: 'blocks' },
    // Liens & image
    { icon: Link2,      title: 'Lien (Ctrl+K)', action: addLink,                    group: 'media' },
    { icon: Unlink,     title: 'Retirer le lien', command: 'unlink',                group: 'media' },
    { key: 'image',     icon: ImageIcon,        title: 'Insérer une image',         action: () => !uploading && fileRef.current?.click(), group: 'media' },
    // Alignement
    { key: 'align-left',     icon: AlignLeft,     title: 'Aligner à gauche',   command: 'justifyLeft',  group: 'align' },
    { key: 'align-center',   icon: AlignCenter,   title: 'Centrer',            command: 'justifyCenter', group: 'align' },
    { key: 'align-right',    icon: AlignRight,    title: 'Aligner à droite',   command: 'justifyRight', group: 'align' },
    { key: 'align-justify',  icon: AlignJustify,  title: 'Justifier',          command: 'justifyFull',  group: 'align' },
    // Historique
    { icon: Undo2,      title: 'Annuler (Ctrl+Z)', command: 'undo',                 group: 'history' },
    { icon: Redo2,      title: 'Rétablir (Ctrl+Y)', command: 'redo',                group: 'history' },
    { icon: RemoveFormatting, title: 'Effacer le format', command: 'removeFormat',  group: 'history' },
  ];

  const groups = ['text', 'headings', 'blocks', 'media', 'align', 'history'];

  return (
    <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden bg-white dark:bg-slate-900">
      {/* Barre d'outils */}
      <div className="flex flex-wrap items-center gap-x-1 gap-y-0.5 px-2 py-1.5 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60">
        {groups.map((group, gi) => (
          <React.Fragment key={group}>
            {gi > 0 && <span className="mx-1 w-px self-stretch bg-slate-200 dark:bg-slate-700" />}
            {tools.filter(t => t.group === group).map((tool, i) => (
              <button
                key={`${group}-${i}`}
                type="button"
                title={tool.title}
                onMouseDown={e => e.preventDefault()}
                onClick={() => (tool.action ? tool.action() : exec(tool.command!, tool.arg))}
                className={cn(
                  'p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 hover:text-[#C1272D] transition-colors',
                  tool.key && active.includes(tool.key) && 'bg-[#C1272D]/10 text-[#C1272D] dark:bg-[#C1272D]/20'
                )}
              >
                <tool.icon className="w-4 h-4" />
              </button>
            ))}
          </React.Fragment>
        ))}
        {/* Bouton upload image (état chargement) */}
        {uploading && (
          <span className="inline-flex items-center gap-1.5 px-2 py-1.5 text-xs text-slate-500 dark:text-slate-400 font-semibold">
            <Loader2 className="w-4 h-4 animate-spin text-[#C1272D]" /> Upload…
          </span>
        )}
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={e => { const f = e.target.files?.[0]; if (f) addImage(f); }}
        />
      </div>

      {/* Zone d'édition */}
      <div
        ref={ref}
        contentEditable
        suppressContentEditableWarning
        data-placeholder={placeholder}
        onInput={e => { onChange((e.target as HTMLElement).innerHTML); setError(null); }}
        onBlur={() => { const el = ref.current; if (el) onChange(el.innerHTML); }}
        style={{ minHeight }}
        className="rich-editor-content px-4 py-3 text-sm text-slate-700 dark:text-slate-200 focus:outline-none empty:before:content-[attr(data-placeholder)] empty:before:text-slate-400"
      />

      {/* Erreur */}
      {error && (
        <p className="px-4 py-2 border-t border-red-100 dark:border-red-900/30 bg-red-50 dark:bg-red-900/10 text-xs text-red-600 dark:text-red-400 font-medium">
          ⚠️ {error}
        </p>
      )}
    </div>
  );
}