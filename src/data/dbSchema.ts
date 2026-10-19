export const SQL_POSTGRES_SCHEMA = `-- ============================================================================
-- SISTEMA DE GESTÃO DE CÉLULAS E GRUPOS CASEIROS (GC)
-- ESQUEMA RELACIONAL COMPLETO PARA POSTGRESQL / SUPABASE
-- ============================================================================

-- Extensões necessárias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "citext";

-- ----------------------------------------------------------------------------
-- 1. TIPOS ENUMERADOS (ENUMS)
-- ----------------------------------------------------------------------------
CREATE TYPE user_role AS ENUM ('super_admin', 'pastor', 'supervisor', 'lider', 'vice_lider');
CREATE TYPE member_role AS ENUM ('lider', 'vice_lider', 'anfitriao', 'membro', 'em_consolidacao', 'visitante');
CREATE TYPE attendance_status AS ENUM ('presente', 'ausente', 'justificado');
CREATE TYPE pipeline_stage AS ENUM ('primeiro_contato', 'em_acompanhamento', 'integrado', 'batizado');

-- ----------------------------------------------------------------------------
-- 2. TABELA: USUÁRIOS DO SISTEMA (Liderança e Administração)
-- ----------------------------------------------------------------------------
CREATE TABLE usuarios (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email citext UNIQUE NOT NULL,
    nome VARCHAR(150) NOT NULL,
    telefone VARCHAR(20),
    role user_role NOT NULL DEFAULT 'lider',
    avatar_url TEXT,
    ativo BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- 3. TABELA: GCs (CÉLULAS / GRUPOS CASEIROS)
-- ----------------------------------------------------------------------------
CREATE TABLE gcs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nome VARCHAR(100) NOT NULL,
    dia_semana SMALLINT NOT NULL CHECK (dia_semana BETWEEN 1 AND 7), -- 1: Domingo, 2: Segunda...
    horario TIME NOT NULL DEFAULT '20:00:00',
    localizacao_nome VARCHAR(100) NOT NULL, -- Ex: "Casa de Ana - Sala 1"
    endereco TEXT,
    lider_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE RESTRICT,
    vice_lider_id UUID REFERENCES usuarios(id) ON DELETE SET NULL,
    ativo BOOLEAN NOT NULL DEFAULT TRUE,
    meta_multiplicacao DATE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- 4. TABELA: MEMBROS DO GC
-- ----------------------------------------------------------------------------
CREATE TABLE membros (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    gc_id UUID NOT NULL REFERENCES gcs(id) ON DELETE CASCADE,
    nome VARCHAR(150) NOT NULL,
    whatsapp VARCHAR(20) NOT NULL,
    data_nascimento DATE,
    funcao member_role NOT NULL DEFAULT 'membro',
    estagio_pipeline pipeline_stage NOT NULL DEFAULT 'integrado',
    faltas_consecutivas INT NOT NULL DEFAULT 0,
    ultimo_comparecimento DATE,
    necessita_follow_up BOOLEAN GENERATED ALWAYS AS (faltas_consecutivas >= 2) STORED,
    observacoes_pastorais TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- 5. TABELA: ESCALAS DA REUNIÃO SEMANAL
-- ----------------------------------------------------------------------------
CREATE TABLE escalas_gc (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    gc_id UUID NOT NULL REFERENCES gcs(id) ON DELETE CASCADE,
    data_reuniao DATE NOT NULL,
    anfitriao VARCHAR(120),
    louvor VARCHAR(120),
    palavra VARCHAR(120),
    lanche VARCHAR(120),
    intercessao VARCHAR(120),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_escala_gc_data UNIQUE (gc_id, data_reuniao)
);

-- ----------------------------------------------------------------------------
-- 6. TABELA: REUNIÕES REALIZADAS
-- ----------------------------------------------------------------------------
CREATE TABLE reunioes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    gc_id UUID NOT NULL REFERENCES gcs(id) ON DELETE CASCADE,
    data_reuniao DATE NOT NULL,
    tema_palavra VARCHAR(200) NOT NULL,
    total_presentes INT NOT NULL DEFAULT 0,
    total_visitantes INT NOT NULL DEFAULT 0,
    valor_oferta NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    observacoes TEXT,
    registrado_por UUID REFERENCES usuarios(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_reuniao_gc_data UNIQUE (gc_id, data_reuniao)
);

-- ----------------------------------------------------------------------------
-- 7. TABELA: FREQUÊNCIA INDIVIDUAL POR MEMBRO
-- ----------------------------------------------------------------------------
CREATE TABLE frequencias (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    reuniao_id UUID NOT NULL REFERENCES reunioes(id) ON DELETE CASCADE,
    membro_id UUID NOT NULL REFERENCES membros(id) ON DELETE CASCADE,
    status attendance_status NOT NULL DEFAULT 'presente',
    justificativa TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_frequencia_reuniao_membro UNIQUE (reuniao_id, membro_id)
);

-- ----------------------------------------------------------------------------
-- 8. TABELA: VISITANTES E PIPELINE DE CONSOLIDAÇÃO
-- ----------------------------------------------------------------------------
CREATE TABLE visitantes_pipeline (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    gc_id UUID NOT NULL REFERENCES gcs(id) ON DELETE CASCADE,
    nome VARCHAR(150) NOT NULL,
    whatsapp VARCHAR(20) NOT NULL,
    estagio pipeline_stage NOT NULL DEFAULT 'primeiro_contato',
    data_primeira_visita DATE NOT NULL DEFAULT CURRENT_DATE,
    convidado_por VARCHAR(120),
    responsavel_followup UUID REFERENCES usuarios(id),
    ultimo_contato TIMESTAMPTZ,
    notas TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- 9. TABELA: PEDIDOS DE ORAÇÃO ATIVOS
-- ----------------------------------------------------------------------------
CREATE TABLE pedidos_oracao (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    gc_id UUID REFERENCES gcs(id) ON DELETE CASCADE,
    autor_nome VARCHAR(150) NOT NULL,
    autor_telefone VARCHAR(20),
    descricao TEXT NOT NULL,
    oracoes_count INT NOT NULL DEFAULT 1,
    atendido BOOLEAN NOT NULL DEFAULT FALSE,
    privado_lideranca BOOLEAN NOT NULL DEFAULT FALSE,
    data_pedido DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- 10. ÍNDICES DE PERFORMANCE (Alta escalabilidade)
-- ----------------------------------------------------------------------------
CREATE INDEX idx_membros_gc ON membros(gc_id);
CREATE INDEX idx_membros_faltas ON membros(faltas_consecutivas) WHERE faltas_consecutivas >= 2;
CREATE INDEX idx_reunioes_gc_data ON reunioes(gc_id, data_reuniao DESC);
CREATE INDEX idx_frequencias_reuniao ON frequencias(reuniao_id);
CREATE INDEX idx_frequencias_membro ON frequencias(membro_id);
CREATE INDEX idx_pedidos_oracao_ativos ON pedidos_oracao(atendido, data_pedido DESC);
CREATE INDEX idx_pipeline_gc_estagio ON visitantes_pipeline(gc_id, estagio);

-- ----------------------------------------------------------------------------
-- 11. VIEW PASTORAL: ALERTAS DE MEMBROS AUSENTES (>= 2 faltas consecutivas)
-- ----------------------------------------------------------------------------
CREATE OR REPLACE VIEW vw_alertas_pastorais AS
SELECT 
    m.id AS membro_id,
    m.nome AS membro_nome,
    m.whatsapp,
    m.faltas_consecutivas,
    m.ultimo_comparecimento,
    g.id AS gc_id,
    g.nome AS gc_nome,
    u.nome AS lider_nome,
    u.telefone AS lider_telefone
FROM membros m
JOIN gcs g ON m.gc_id = g.id
JOIN usuarios u ON g.lider_id = u.id
WHERE m.faltas_consecutivas >= 2
ORDER BY m.faltas_consecutivas DESC, m.nome ASC;

-- ----------------------------------------------------------------------------
-- 12. SEGURANÇA: ROW LEVEL SECURITY (RLS) - Exemplo Supabase
-- ----------------------------------------------------------------------------
ALTER TABLE membros ENABLE ROW LEVEL SECURITY;
ALTER TABLE reunioes ENABLE ROW LEVEL SECURITY;
ALTER TABLE frequencias ENABLE ROW LEVEL SECURITY;
ALTER TABLE pedidos_oracao ENABLE ROW LEVEL SECURITY;

-- Líderes podem ver apenas dados dos seus próprios GCs; Pastores vêem tudo:
CREATE POLICY "Lideres acessam seu proprio GC" ON membros
    FOR ALL
    USING (
        gc_id IN (
            SELECT id FROM gcs WHERE lider_id = auth.uid() OR vice_lider_id = auth.uid()
        )
        OR EXISTS (
            SELECT 1 FROM usuarios WHERE id = auth.uid() AND role IN ('pastor', 'super_admin')
        )
    );
`;

export const ARCHITECTURE_EXPLANATION = [
  {
    title: 'Tabela: usuarios',
    desc: 'Armazena pastores, supervisores e líderes de GC. Integração direta com Supabase Auth (auth.uid()).',
    keyFields: ['id (UUID)', 'email (citext)', 'role (enum)', 'telefone', 'ativo'],
  },
  {
    title: 'Tabela: gcs',
    desc: 'Representa a célula ou grupo caseiro. Contém dia da semana, horário, endereço e chave para o líder.',
    keyFields: ['id', 'nome', 'dia_semana', 'horario', 'localizacao_nome', 'lider_id (FK)'],
  },
  {
    title: 'Tabela: membros',
    desc: 'Cadastros com histórico de faltas consecutivas. Campo computado "necessita_follow_up" ativado com >= 2 faltas.',
    keyFields: ['id', 'gc_id (FK)', 'nome', 'whatsapp', 'faltas_consecutivas', 'necessita_follow_up'],
  },
  {
    title: 'Tabela: escalas_gc',
    desc: 'Escala semanal detalhada para o próximo encontro: Anfitrião, Louvor, Palavra, Lanche e Intercessão.',
    keyFields: ['id', 'gc_id (FK)', 'data_reuniao', 'anfitriao', 'louvor', 'palavra', 'lanche'],
  },
  {
    title: 'Tabela: reunioes & frequencias',
    desc: 'Registro do encontro (tema, oferta, visitantes) e tabela filha N:M com presença individual por membro.',
    keyFields: ['reuniao_id', 'membro_id', 'status (presente/ausente/justificado)', 'valor_oferta'],
  },
  {
    title: 'Tabela: pedidos_oracao & pipeline',
    desc: 'Pedidos de intercessão com contador comunitário e funil de integração dos novos visitantes ao discipulado.',
    keyFields: ['autor_nome', 'oracoes_count', 'atendido', 'estagio_pipeline'],
  },
];
