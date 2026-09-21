'use client';

import React from 'react';

interface CodeViewProps {
  code: string;
  language?: string;
  editable?: boolean;
  onChange?: (val: string) => void;
  className?: string;
}

export const CodeView: React.FC<CodeViewProps> = ({
  code,
  language = 'python',
  editable = false,
  onChange,
  className = ''
}) => {
  return (
    <div className={`relative rounded-lg border border-slate-800 bg-[#0d1117] font-mono text-sm overflow-hidden ${className}`}>
      <div className="flex items-center justify-between px-4 py-1.5 border-b border-slate-800 bg-slate-900/50 text-xs text-slate-400">
        <span>{language.toUpperCase()}</span>
        <span className="text-[10px] text-slate-500">{editable ? 'Interactive Editor' : 'Verified Solution'}</span>
      </div>
      {editable ? (
        <textarea
          value={code}
          onChange={(e) => onChange && onChange(e.target.value)}
          className="w-full h-48 p-4 bg-transparent text-emerald-300 focus:outline-none resize-y font-mono text-sm leading-relaxed"
          spellCheck={false}
        />
      ) : (
        <pre className="p-4 overflow-x-auto text-emerald-300 font-mono text-sm leading-relaxed">
          <code>{code}</code>
        </pre>
      )}
    </div>
  );
};
