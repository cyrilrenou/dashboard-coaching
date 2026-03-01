'use client'

import { useEffect, useState } from 'react'
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis,
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Cell
} from 'recharts'

interface CoachEntry {
  id: string; nom: string; date: string; semaine: string
  scoreProgression: number; scoreClarte: number; scoreConviction: number
  scoreEcoute: number; scoreLeadership: number; scorePosture: number; scoreSuivi: number
  tempsParole: number; evolution: string; type: string
  axesAmelioration: string; forcesObservees: string; recommandation: string
}

interface ReunionEntry {
  id: string; nom: string; date: string; semaine: string
  scoreQualite: number; qualiteGlobale: string; type: string
  duree: number; niveauAlignement: string; niveauDecision: string
}

function formatDate(dateStr: string) {
  if (!dateStr) return ''
  return new Date(dateStr).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })
}

function EvolutionBadge({ value }: { value: string }) {
  if (!value) return null
  const config: Record<string, { bg: string; text: string; emoji: string }> = {
    'En progression': { bg: '#14532d', text: '#86efac', emoji: '↑' },
    'Stable': { bg: '#713f12', text: '#fde68a', emoji: '→' },
    'En régression': { bg: '#7f1d1d', text: '#fca5a5', emoji: '↓' },
  }
  const c = config[value] ?? { bg: '#27272a', text: '#a1a1aa', emoji: '?' }
  return (
    <span style={{ color: c.text, background: c.bg, padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 700, whiteSpace: 'nowrap' }}>
      {c.emoji} {value}
    </span>
  )
}

function ScoreRing({ value, max = 10, label, color }: { value: number, max?: number, label: string, color: string }) {
  const pct = value != null ? Math.min((value / max) * 100, 100) : 0
  const r = 34
  const circ = 2 * Math.PI * r
  const dash = (pct / 100) * circ
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
      <svg width={84} height={84} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={42} cy={42} r={r} fill="none" stroke="#3f3f46" strokeWidth={6} />
        <circle cx={42} cy={42} r={r} fill="none" stroke={color} strokeWidth={6}
          strokeDasharray={`${dash} ${circ}`} strokeLinecap="round" />
        <text x={42} y={42} textAnchor="middle" dominantBaseline="central"
          style={{ transform: 'rotate(90deg)', transformOrigin: '42px 42px', fill: '#f4f4f5', fontSize: 17, fontWeight: 700, fontFamily: 'monospace' }}>
          {value ?? '—'}
        </text>
      </svg>
      <span style={{ fontSize: 11, color: '#a1a1aa', letterSpacing: 1, textTransform: 'uppercase', textAlign: 'center' }}>{label}</span>
    </div>
  )
}

const COLORS = {
  green: '#4ade80',
  teal: '#2dd4bf',
  yellow: '#facc15',
  purple: '#a78bfa',
  orange: '#fb923c',
  red: '#f87171',
  muted: '#71717a',
  bg: '#09090b',
  card: '#18181b',
  border: '#27272a',
  text: '#f4f4f5',
  textMuted: '#a1a1aa',
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null
  return (
    <div style={{ background: '#27272a', border: '1px solid #3f3f46', borderRadius: 8, padding: '10px 14px', color: COLORS.text, fontSize: 12 }}>
      <p style={{ color: COLORS.textMuted, marginBottom: 4 }}>{label}</p>
      {payload.map((p: any, i: number) => (
        <p key={i} style={{ color: p.color ?? COLORS.green, fontWeight: 700 }}>{p.value}</p>
      ))}
    </div>
  )
}

export default function Dashboard() {
  const [data, setData] = useState<{ coach: CoachEntry[], reunions: ReunionEntry[] } | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdate, setLastUpdate] = useState('')

  useEffect(() => {
    fetch('/api/data')
      .then(r => r.json())
      .then(d => { if (d.error) throw new Error(d.error); setData(d); setLastUpdate(new Date().toLocaleTimeString('fr-FR')) })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return (
    <div style={{ minHeight: '100vh', background: COLORS.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ color: COLORS.green, fontSize: 13, letterSpacing: 4 }}>CHARGEMENT...</div>
    </div>
  )

  if (error) return (
    <div style={{ minHeight: '100vh', background: COLORS.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 12 }}>
      <div style={{ color: COLORS.red, fontSize: 14 }}>⚠ Erreur Notion API</div>
      <div style={{ color: COLORS.textMuted, fontSize: 12 }}>{error}</div>
    </div>
  )

  const coach = data?.coach ?? []
  const reunions = data?.reunions ?? []
  const latest = coach[coach.length - 1]
  const last3 = coach.slice(-3)

  const avg = (key: keyof CoachEntry) => {
    const vals = last3.map(e => e[key] as number).filter(v => v != null)
    return vals.length ? Math.round(vals.reduce((a, b) => a + b, 0) / vals.length) : 0
  }

  const radarData = [
    { subject: 'Clarté', value: avg('scoreClarte') },
    { subject: 'Conviction', value: avg('scoreConviction') },
    { subject: 'Écoute', value: avg('scoreEcoute') },
    { subject: 'Leadership', value: avg('scoreLeadership') },
    { subject: 'Posture', value: avg('scorePosture') },
    { subject: 'Suivi', value: avg('scoreSuivi') },
  ]

  const progressionData = coach.filter(e => e.scoreProgression != null)
    .map(e => ({ date: formatDate(e.date), score: e.scoreProgression }))

  const qualiteData = reunions.filter(e => e.scoreQualite != null)
    .map(e => ({ date: formatDate(e.date), score: e.scoreQualite, nom: e.nom }))

  const reunionsAvecScore = reunions.filter(r => r.scoreQualite != null)
  const moyQualite = reunionsAvecScore.length
    ? (reunionsAvecScore.reduce((a, r) => a + r.scoreQualite, 0) / reunionsAvecScore.length).toFixed(1)
    : '—'

  const card = { background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 14, padding: 24 }
  const label = { fontSize: 11, color: COLORS.textMuted, letterSpacing: 2, textTransform: 'uppercase' as const, marginBottom: 10, display: 'block' }

  return (
    <div style={{ minHeight: '100vh', background: COLORS.bg, color: COLORS.text, fontFamily: "'DM Sans', system-ui, sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;700&family=DM+Mono:wght@400;500&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        .recharts-cartesian-grid-horizontal line,
        .recharts-cartesian-grid-vertical line { stroke: #27272a !important; }
        .recharts-polar-grid-concentric-polygon { stroke: #27272a !important; }
        .recharts-polar-grid-angle line { stroke: #27272a !important; }
      `}</style>

      {/* Header */}
      <div style={{ borderBottom: `1px solid ${COLORS.border}`, padding: '18px 40px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: COLORS.green, boxShadow: `0 0 10px ${COLORS.green}88` }} />
          <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 13, color: COLORS.text, letterSpacing: 2 }}>COACHING DASHBOARD</span>
          <span style={{ fontSize: 11, color: COLORS.muted }}>CYRIL RENOU · DUPLIX</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          {latest && <EvolutionBadge value={latest.evolution} />}
          <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: COLORS.muted }}>MAJ {lastUpdate}</span>
        </div>
      </div>

      <div style={{ padding: '28px 40px', display: 'flex', flexDirection: 'column', gap: 20 }}>

        {/* KPIs */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
          {[
            { label: 'Score actuel', value: latest?.scoreProgression ?? '—', unit: '/100', color: COLORS.green },
            { label: 'Séances analysées', value: coach.length, unit: 'séances', color: COLORS.teal },
            { label: 'Réunions avec données', value: reunions.length, unit: 'réunions', color: COLORS.yellow },
            { label: 'Qualité moyenne', value: moyQualite, unit: '/5', color: COLORS.purple },
          ].map((kpi, i) => (
            <div key={i} style={card}>
              <span style={label}>{kpi.label}</span>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                <span style={{ fontSize: 42, fontWeight: 700, color: kpi.color, lineHeight: 1, fontFamily: "'DM Mono', monospace" }}>{kpi.value}</span>
                <span style={{ fontSize: 13, color: COLORS.textMuted }}>{kpi.unit}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Radar + Progression */}
        <div style={{ display: 'grid', gridTemplateColumns: '360px 1fr', gap: 14 }}>
          <div style={card}>
            <span style={label}>Profil — 3 dernières séances</span>
            <ResponsiveContainer width="100%" height={270}>
              <RadarChart data={radarData}>
                <PolarGrid />
                <PolarAngleAxis dataKey="subject" tick={{ fill: COLORS.textMuted, fontSize: 12 }} />
                <Radar dataKey="value" stroke={COLORS.green} fill={COLORS.green} fillOpacity={0.15} strokeWidth={2}
                  dot={{ fill: COLORS.green, r: 3, strokeWidth: 0 }} />
              </RadarChart>
            </ResponsiveContainer>
          </div>

          <div style={card}>
            <span style={label}>Score de progression — historique</span>
            <ResponsiveContainer width="100%" height={270}>
              <LineChart data={progressionData} margin={{ top: 10, right: 20, bottom: 0, left: -15 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" tick={{ fill: COLORS.textMuted, fontSize: 11 }} />
                <YAxis domain={[0, 100]} tick={{ fill: COLORS.textMuted, fontSize: 11 }} />
                <Tooltip content={<CustomTooltip />} />
                <Line type="monotone" dataKey="score" stroke={COLORS.green} strokeWidth={2}
                  dot={{ fill: COLORS.green, strokeWidth: 0, r: 4 }}
                  activeDot={{ r: 6, fill: COLORS.green, stroke: COLORS.bg, strokeWidth: 2 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Score rings + Qualité */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          <div style={card}>
            <span style={label}>Scores détaillés — dernière séance {latest ? `· ${formatDate(latest.date)}` : ''}</span>
            {latest ? (
              <div style={{ display: 'flex', justifyContent: 'space-around', flexWrap: 'wrap', gap: 16, marginTop: 12 }}>
                <ScoreRing value={latest.scoreClarte} label="Clarté" color={COLORS.green} />
                <ScoreRing value={latest.scoreConviction} label="Conviction" color={COLORS.teal} />
                <ScoreRing value={latest.scoreEcoute} label="Écoute" color={COLORS.yellow} />
                <ScoreRing value={latest.scoreLeadership} label="Leadership" color={COLORS.purple} />
                <ScoreRing value={latest.scorePosture} label="Posture" color={COLORS.orange} />
                <ScoreRing value={latest.scoreSuivi} label="Suivi" color={COLORS.red} />
              </div>
            ) : (
              <div style={{ color: COLORS.textMuted, fontSize: 13, marginTop: 20 }}>Aucune donnée — les scores seront disponibles après la prochaine analyse Zapier</div>
            )}
          </div>

          <div style={card}>
            <span style={label}>Qualité réunions — historique</span>
            {qualiteData.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={qualiteData} margin={{ top: 10, right: 10, bottom: 0, left: -20 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" tick={{ fill: COLORS.textMuted, fontSize: 11 }} />
                  <YAxis domain={[0, 5]} ticks={[1, 2, 3, 4, 5]} tick={{ fill: COLORS.textMuted, fontSize: 11 }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="score" radius={[4, 4, 0, 0]}>
                    {qualiteData.map((e, i) => (
                      <Cell key={i} fill={e.score >= 4 ? COLORS.green : e.score === 3 ? COLORS.yellow : COLORS.red} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ color: COLORS.textMuted, fontSize: 13, marginTop: 20 }}>Les scores de qualité seront disponibles après la prochaine analyse Zapier</div>
            )}
          </div>
        </div>

        {/* Recommandation */}
        {latest?.recommandation && (
          <div style={{ ...card, borderColor: COLORS.green + '44', background: '#14532d22' }}>
            <span style={label}>📌 Recommandation clé — {formatDate(latest.date)}</span>
            <p style={{ fontSize: 15, color: COLORS.text, lineHeight: 1.7 }}>{latest.recommandation}</p>
            {latest.forcesObservees && (
              <p style={{ fontSize: 12, color: COLORS.textMuted, marginTop: 12, lineHeight: 1.6, borderTop: `1px solid ${COLORS.border}`, paddingTop: 12 }}>
                <span style={{ color: COLORS.green, fontWeight: 600 }}>Forces : </span>{latest.forcesObservees}
              </p>
            )}
          </div>
        )}

        {/* Historique */}
        <div style={card}>
          <span style={label}>Historique des séances</span>
          <div style={{ marginTop: 8 }}>
            {coach.slice().reverse().slice(0, 10).map((entry, i) => (
              <div key={i} style={{
                display: 'grid', gridTemplateColumns: '90px 1fr 70px 70px auto',
                alignItems: 'center', gap: 16, padding: '11px 12px',
                borderRadius: 8, background: i === 0 ? '#27272a' : 'transparent',
                borderBottom: `1px solid ${COLORS.border}`
              }}>
                <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: COLORS.textMuted }}>
                  {formatDate(entry.date)}
                </span>
                <span style={{ fontSize: 13, color: COLORS.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {entry.nom ?? '—'}
                </span>
                <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 14, color: COLORS.green, textAlign: 'right', fontWeight: 700 }}>
                  {entry.scoreProgression ?? '—'}<span style={{ fontSize: 10, color: COLORS.textMuted }}>/100</span>
                </span>
                <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: COLORS.textMuted, textAlign: 'right' }}>
                  {entry.tempsParole ? entry.tempsParole + '%' : '—'}
                </span>
                <EvolutionBadge value={entry.evolution} />
              </div>
            ))}
          </div>
        </div>

      </div>

      <div style={{ borderTop: `1px solid ${COLORS.border}`, padding: '14px 40px', display: 'flex', justifyContent: 'space-between' }}>
        <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: '#3f3f46' }}>SOURCE · NOTION API · BDD IA COACH + RÉUNIONS</span>
        <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: '#3f3f46' }}>DUPLIX · {new Date().getFullYear()}</span>
      </div>
    </div>
  )
}
