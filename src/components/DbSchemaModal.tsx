import React, { useState } from 'react';
import { SQL_POSTGRES_SCHEMA, ARCHITECTURE_EXPLANATION } from '../data/dbSchema';
import { Database, Copy, Check, Download, Table, Layers, ShieldCheck, Code2, Cpu } from 'lucide-react';

export const DbSchemaModal: React.FC = () => {
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'sql' | 'erd' | 'dicionario'>('sql');

  const handleCopy = () => {
    navigator.clipboard.writeText(SQL_POSTGRES_SCHEMA);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleDownload = () => {
    const blob = new Blob([SQL_POSTGRES_SCHEMA], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'schema_sistema_gc_postgresql.sql';
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-[#18181B] border border-[#27272A] p-5 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] uppercase font-mono tracking-wider text-emerald-400 font-semibold px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20">
              PostgreSQL / Supabase DDL v1.0
            </span>
            <span className="text-zinc-500 text-xs">• 3FN Normalizado</span>
          </div>
          <h2 className="text-xl font-bold text-[#FAFAFA] mt-1 flex items-center gap-2">
            <Database className="w-5 h-5 text-emerald-400" />
            Arquitetura Técnica de Banco de Dados
          </h2>
          <p className="text-xs text-[#A1A1AA] max-w-2xl mt-0.5">
            Esquema relacional projetado para alta escalabilidade com suporte a multi-células, acompanhamento pastoral em tempo real, auditoria e Row Level Security (RLS).
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handleCopy}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold bg-[#27272A] hover:bg-[#3F3F46] text-[#FAFAFA] border border-[#3F3F46] transition-all"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 text-emerald-400" />
                <span className="text-emerald-400">SQL Copiado!</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4 text-zinc-300" />
                <span>Copiar SQL</span>
              </>
            )}
          </button>

          <button
            onClick={handleDownload}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold bg-white text-black hover:bg-zinc-200 transition-all shadow"
          >
            <Download className="w-4 h-4" />
            <span>Baixar .sql</span>
          </button>
        </div>
      </div>

      {/* Tabs Selector with horizontal scroll on mobile */}
      <div className="flex items-center gap-2 border-b border-[#27272A] pb-3 text-xs overflow-x-auto">
        <button
          onClick={() => setActiveTab('sql')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-all ${
            activeTab === 'sql'
              ? 'bg-[#18181B] text-white border border-[#3F3F46]'
              : 'text-[#A1A1AA] hover:text-white'
          }`}
        >
          <Code2 className="w-4 h-4 text-emerald-400" />
          <span>Script SQL Completo (DDL)</span>
        </button>

        <button
          onClick={() => setActiveTab('erd')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-all ${
            activeTab === 'erd'
              ? 'bg-[#18181B] text-white border border-[#3F3F46]'
              : 'text-[#A1A1AA] hover:text-white'
          }`}
        >
          <Layers className="w-4 h-4 text-blue-400" />
          <span>Diagrama Relacional (ERD)</span>
        </button>

        <button
          onClick={() => setActiveTab('dicionario')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-all ${
            activeTab === 'dicionario'
              ? 'bg-[#18181B] text-white border border-[#3F3F46]'
              : 'text-[#A1A1AA] hover:text-white'
          }`}
        >
          <Table className="w-4 h-4 text-amber-400" />
          <span>Dicionário das Tabelas</span>
        </button>
      </div>

      {/* TAB 1: SCRIPT SQL COM HIGHLIGHT */}
      {activeTab === 'sql' && (
        <div className="bg-[#18181B] border border-[#27272A] rounded-2xl overflow-hidden shadow-xl">
          <div className="bg-[#121214] px-4 py-3 border-b border-[#27272A] flex items-center justify-between">
            <div className="flex items-center gap-2 font-mono text-xs text-zinc-400">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500/80 inline-block" />
              <span className="w-2.5 h-2.5 rounded-full bg-yellow-500/80 inline-block" />
              <span className="w-2.5 h-2.5 rounded-full bg-green-500/80 inline-block" />
              <span className="ml-2 text-zinc-300">schema_sistema_gc.sql</span>
            </div>
            <span className="text-[11px] text-zinc-500 font-mono">PostgreSQL 14+</span>
          </div>

          <div className="p-4 overflow-x-auto max-h-[580px] bg-[#09090B]">
            <pre className="font-mono text-xs leading-relaxed text-zinc-300">
              <code>{SQL_POSTGRES_SCHEMA}</code>
            </pre>
          </div>
        </div>
      )}

      {/* TAB 2: DIAGRAMA RELACIONAL VISUAL (ERD) */}
      {activeTab === 'erd' && (
        <div className="bg-[#18181B] border border-[#27272A] rounded-2xl p-6 space-y-6">
          <div className="border-b border-[#27272A] pb-3">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              Mapa de Entidades & Relacionamentos
            </h3>
            <p className="text-xs text-[#A1A1AA]">
              Fluxo relacional direto entre Usuários, Células (GCs), Membros, Reuniões e Presenças.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Box 1: usuarios */}
            <div className="bg-zinc-900 border border-zinc-700 rounded-xl p-4 space-y-2">
              <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
                <span className="font-bold text-white font-mono text-xs">usuarios</span>
                <span className="text-[10px] text-zinc-400 bg-zinc-800 px-1.5 py-0.5 rounded">1</span>
              </div>
              <ul className="text-[11px] space-y-1 font-mono text-zinc-400">
                <li className="text-emerald-400 font-semibold">🔑 id (UUID)</li>
                <li>email (citext)</li>
                <li>nome (VARCHAR)</li>
                <li>role (user_role enum)</li>
                <li>telefone</li>
              </ul>
              <div className="text-[10px] text-zinc-500 pt-2 border-t border-zinc-800 italic">
                1 usuário lidera 1 ou mais GCs
              </div>
            </div>

            {/* Box 2: gcs */}
            <div className="bg-zinc-900 border border-emerald-700/60 rounded-xl p-4 space-y-2">
              <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
                <span className="font-bold text-emerald-300 font-mono text-xs">gcs</span>
                <span className="text-[10px] text-emerald-400 bg-emerald-950 px-1.5 py-0.5 rounded">N</span>
              </div>
              <ul className="text-[11px] space-y-1 font-mono text-zinc-400">
                <li className="text-emerald-400 font-semibold">🔑 id (UUID)</li>
                <li className="text-amber-400">🔗 lider_id ➔ usuarios.id</li>
                <li>nome (VARCHAR)</li>
                <li>dia_semana (1..7)</li>
                <li>horario (TIME)</li>
                <li>localizacao_nome</li>
              </ul>
              <div className="text-[10px] text-emerald-400/80 pt-2 border-t border-zinc-800 italic">
                Coração do sistema; agrega reuniões e membros
              </div>
            </div>

            {/* Box 3: membros */}
            <div className="bg-zinc-900 border border-zinc-700 rounded-xl p-4 space-y-2">
              <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
                <span className="font-bold text-white font-mono text-xs">membros</span>
                <span className="text-[10px] text-zinc-400 bg-zinc-800 px-1.5 py-0.5 rounded">N</span>
              </div>
              <ul className="text-[11px] space-y-1 font-mono text-zinc-400">
                <li className="text-emerald-400 font-semibold">🔑 id (UUID)</li>
                <li className="text-amber-400">🔗 gc_id ➔ gcs.id</li>
                <li>nome (VARCHAR)</li>
                <li>whatsapp (VARCHAR)</li>
                <li className="text-rose-400">faltas_consecutivas (INT)</li>
                <li className="text-rose-400">necessita_follow_up (BOOL)</li>
              </ul>
              <div className="text-[10px] text-zinc-500 pt-2 border-t border-zinc-800 italic">
                Armazena estado pastoral e histórico
              </div>
            </div>

            {/* Box 4: reunioes */}
            <div className="bg-zinc-900 border border-zinc-700 rounded-xl p-4 space-y-2">
              <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
                <span className="font-bold text-white font-mono text-xs">reunioes</span>
                <span className="text-[10px] text-zinc-400 bg-zinc-800 px-1.5 py-0.5 rounded">N</span>
              </div>
              <ul className="text-[11px] space-y-1 font-mono text-zinc-400">
                <li className="text-emerald-400 font-semibold">🔑 id (UUID)</li>
                <li className="text-amber-400">🔗 gc_id ➔ gcs.id</li>
                <li>data_reuniao (DATE)</li>
                <li>tema_palavra</li>
                <li>total_presentes (INT)</li>
                <li>valor_oferta (NUMERIC)</li>
              </ul>
              <div className="text-[10px] text-zinc-500 pt-2 border-t border-zinc-800 italic">
                Encontros realizados semanalmente
              </div>
            </div>

            {/* Box 5: frequencias (M:N) */}
            <div className="bg-zinc-900 border border-blue-700/60 rounded-xl p-4 space-y-2">
              <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
                <span className="font-bold text-blue-300 font-mono text-xs">frequencias (M:N)</span>
                <span className="text-[10px] text-blue-400 bg-blue-950 px-1.5 py-0.5 rounded">Tabela Pivô</span>
              </div>
              <ul className="text-[11px] space-y-1 font-mono text-zinc-400">
                <li className="text-emerald-400 font-semibold">🔑 id (UUID)</li>
                <li className="text-amber-400">🔗 reuniao_id ➔ reunioes.id</li>
                <li className="text-amber-400">🔗 membro_id ➔ membros.id</li>
                <li>status (presente/ausente)</li>
                <li>justificativa (TEXT)</li>
              </ul>
              <div className="text-[10px] text-blue-400/80 pt-2 border-t border-zinc-800 italic">
                Registra a presença individual em cada encontro
              </div>
            </div>

            {/* Box 6: pedidos_oracao */}
            <div className="bg-zinc-900 border border-zinc-700 rounded-xl p-4 space-y-2">
              <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
                <span className="font-bold text-white font-mono text-xs">pedidos_oracao</span>
                <span className="text-[10px] text-zinc-400 bg-zinc-800 px-1.5 py-0.5 rounded">N</span>
              </div>
              <ul className="text-[11px] space-y-1 font-mono text-zinc-400">
                <li className="text-emerald-400 font-semibold">🔑 id (UUID)</li>
                <li className="text-amber-400">🔗 gc_id (FK opcional)</li>
                <li>autor_nome (VARCHAR)</li>
                <li>descricao (TEXT)</li>
                <li>oracoes_count (INT)</li>
                <li>atendido (BOOLEAN)</li>
              </ul>
              <div className="text-[10px] text-zinc-500 pt-2 border-t border-zinc-800 italic">
                Intercessão comunitária e testemunhos
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: DICIONÁRIO DE DADOS */}
      {activeTab === 'dicionario' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {ARCHITECTURE_EXPLANATION.map((item, idx) => (
            <div
              key={idx}
              className="bg-[#18181B] border border-[#27272A] p-5 rounded-2xl space-y-2"
            >
              <h4 className="text-sm font-bold text-white font-mono flex items-center gap-2">
                <Table className="w-4 h-4 text-emerald-400" />
                {item.title}
              </h4>
              <p className="text-xs text-[#A1A1AA] leading-relaxed">
                {item.desc}
              </p>
              <div className="pt-2 border-t border-[#27272A]">
                <span className="text-[10px] uppercase font-mono text-zinc-500 block mb-1">
                  Campos Chave:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {item.keyFields.map((field, fIdx) => (
                    <span
                      key={fIdx}
                      className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-zinc-300"
                    >
                      {field}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
