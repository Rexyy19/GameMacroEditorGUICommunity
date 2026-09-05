import { useState, useEffect, useRef } from 'react'

type Tab = 'General' | 'Hold Macro' | 'Auto Skill'

interface MacroRow {
  id: number
  hotkey: string
  skillKey: string
  interval: number
  enabled: boolean
}

const makeRows = (n: number): MacroRow[] =>
  Array.from({ length: n }, (_, i) => ({
    id: i + 1,
    hotkey: '',
    skillKey: '',
    interval: 1000,
    enabled: false,
  }))


const INTERVAL_OPTIONS = [100, 200, 300, 500, 750, 1000, 1500, 2000, 3000, 5000]


const INPUT_STYLE: React.CSSProperties = {
  background: '#111827',
  color: '#e2e8f0',
  border: '1px solid #1f2937',
  borderRadius: 6,
  padding: '4px 8px',
  fontSize: 12,
  fontFamily: 'Inter, sans-serif',
  width: '100%',
  outline: 'none',
}

function normalizeKey(e: KeyboardEvent): string {
  const map: Record<string, string> = {
    ' ': 'Space', 'ArrowLeft': 'Left', 'ArrowRight': 'Right',
    'ArrowUp': 'Up', 'ArrowDown': 'Down', 'PageUp': 'PgUp',
    'PageDown': 'PgDn',
  }
  if (map[e.key]) return map[e.key]
  if (e.code.startsWith('Numpad')) return 'NumPad' + e.code.slice(6)
  if (e.key.length === 1) return e.key.toUpperCase()
  return e.key
}

function normalizeMouseButton(btn: number): string {
  const map: Record<number, string> = { 0: 'LButton', 1: 'MButton', 2: 'RButton', 3: 'XButton1', 4: 'XButton2' }
  return map[btn] ?? `Mouse${btn}`
}

function KeyCapture({
  value,
  onChange,
  placeholder,
}: {
  value: string
  onChange: (v: string) => void
  placeholder?: string
}) {
  const [capturing, setCapturing] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!capturing) return

    const onKey = (e: KeyboardEvent) => {
      e.preventDefault()
      if (e.key === 'Escape') { setCapturing(false); return }
      if (['Control', 'Alt', 'Shift', 'Meta'].includes(e.key)) return
      onChange(normalizeKey(e))
      setCapturing(false)
    }

    const onMouse = (e: MouseEvent) => {
      // ignore left-click on the button itself
      if (e.button === 0 && ref.current?.contains(e.target as Node)) return
      e.preventDefault()
      onChange(normalizeMouseButton(e.button))
      setCapturing(false)
    }

    window.addEventListener('keydown', onKey, true)
    window.addEventListener('mousedown', onMouse, true)
    return () => {
      window.removeEventListener('keydown', onKey, true)
      window.removeEventListener('mousedown', onMouse, true)
    }
  }, [capturing, onChange])

  const label = value || placeholder || '—'

  return (
    <div ref={ref} style={{ display: 'flex', gap: 4 }}>
      <button
        onClick={() => setCapturing(v => !v)}
        title={capturing ? 'Press any key or mouse button… (Esc to cancel)' : 'Click to capture key'}
        style={{
          flex: 1,
          padding: '4px 8px',
          borderRadius: 6,
          border: `1px solid ${capturing ? '#0ea5e9' : '#1f2937'}`,
          background: capturing ? '#0c1f2e' : '#111827',
          color: capturing ? '#38bdf8' : value ? '#e2e8f0' : '#4b5563',
          fontSize: 12,
          fontFamily: 'JetBrains Mono, monospace',
          cursor: 'pointer',
          textAlign: 'left',
          transition: 'all 0.15s',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          animation: capturing ? 'pulse-border 1s infinite' : 'none',
        }}
      >
        {capturing ? '⌨ Press key…' : label}
      </button>
      {value && (
        <button
          onClick={() => onChange('')}
          title="Clear"
          style={{
            width: 26,
            borderRadius: 6,
            border: '1px solid #1f2937',
            background: '#111827',
            color: '#4b5563',
            fontSize: 13,
            cursor: 'pointer',
            flexShrink: 0,
          }}
        >
          ×
        </button>
      )}
    </div>
  )
}

function MacroTable({
  rows,
  onChange,
  showSkillKey,
}: {
  rows: MacroRow[]
  onChange: (rows: MacroRow[]) => void
  showSkillKey: boolean
}) {
  const update = (id: number, patch: Partial<MacroRow>) =>
    onChange(rows.map(r => (r.id === id ? { ...r, ...patch } : r)))

  return (
    <div style={{ overflowY: 'auto', flex: 1 }}>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ borderBottom: '1px solid #1f2937' }}>
            {['#', 'Hotkey', ...(showSkillKey ? ['Skill Key'] : []), 'Interval (ms)', ''].map(h => (
              <th
                key={h}
                style={{
                  padding: '8px 10px',
                  textAlign: 'left',
                  fontSize: 11,
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  color: '#475569',
                  whiteSpace: 'nowrap',
                }}
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map(row => (
            <tr
              key={row.id}
              style={{
                borderBottom: '1px solid #0f172a',
                background: row.enabled ? 'rgba(56,189,248,0.03)' : 'transparent',
                transition: 'background 0.15s',
              }}
            >
              {/* # */}
              <td
                style={{
                  padding: '7px 10px',
                  fontSize: 12,
                  color: '#334155',
                  fontFamily: 'JetBrains Mono, monospace',
                  width: 32,
                }}
              >
                {row.id}
              </td>

              {/* Hotkey */}
              <td style={{ padding: '7px 8px', width: 140 }}>
                <KeyCapture
                  value={row.hotkey}
                  onChange={v => update(row.id, { hotkey: v })}
                  placeholder="None"
                />
              </td>

              {/* Skill Key */}
              {showSkillKey && (
                <td style={{ padding: '7px 8px', width: 140 }}>
                  <KeyCapture
                    value={row.skillKey}
                    onChange={v => update(row.id, { skillKey: v })}
                    placeholder="None"
                  />
                </td>
              )}

              {/* Interval */}
              <td style={{ padding: '7px 8px', width: 130 }}>
                <div style={{ display: 'flex', gap: 4 }}>
                  <select
                    value={INTERVAL_OPTIONS.includes(row.interval) ? row.interval : ''}
                    onChange={e => update(row.id, { interval: Number(e.target.value) })}
                    style={{ background: '#111827', color: '#e2e8f0', border: '1px solid #1f2937', borderRadius: 6, padding: '4px 8px', fontSize: 12, fontFamily: 'Inter, sans-serif', width: 90, outline: 'none', cursor: 'pointer' }}
                  >
                    {INTERVAL_OPTIONS.map(v => (
                      <option key={v} value={v}>{v}</option>
                    ))}
                  </select>
                  <input
                    type="number"
                    min={50}
                    max={99999}
                    value={row.interval}
                    onChange={e => update(row.id, { interval: Number(e.target.value) })}
                    style={{ ...INPUT_STYLE, width: 60 }}
                  />
                </div>
              </td>

              {/* Enable toggle */}
              <td style={{ padding: '7px 10px', width: 40 }}>
                <button
                  onClick={() => update(row.id, { enabled: !row.enabled })}
                  title={row.enabled ? 'Disable' : 'Enable'}
                  style={{
                    width: 32,
                    height: 18,
                    borderRadius: 9,
                    border: 'none',
                    cursor: 'pointer',
                    background: row.enabled ? '#0284c7' : '#1e293b',
                    position: 'relative',
                    transition: 'background 0.2s',
                    display: 'block',
                  }}
                >
                  <span
                    style={{
                      position: 'absolute',
                      top: 2,
                      left: row.enabled ? 'calc(100% - 16px)' : 2,
                      width: 14,
                      height: 14,
                      borderRadius: '50%',
                      background: row.enabled ? '#fff' : '#475569',
                      transition: 'left 0.2s',
                    }}
                  />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function GeneralTab() {
  const [gameWindow, setGameWindow] = useState('')
  const [pauseKey, setPauseKey] = useState('F12')
  const [startOnLaunch, setStartOnLaunch] = useState(false)
  const [topmost, setTopmost] = useState(true)
  const [speed, setSpeed] = useState(100)

  const Toggle = ({ on, set }: { on: boolean; set: (v: boolean) => void }) => (
    <button
      onClick={() => set(!on)}
      style={{
        width: 36,
        height: 20,
        borderRadius: 10,
        border: 'none',
        cursor: 'pointer',
        background: on ? '#0284c7' : '#1e293b',
        position: 'relative',
        transition: 'background 0.2s',
        flexShrink: 0,
      }}
    >
      <span
        style={{
          position: 'absolute',
          top: 2,
          left: on ? 'calc(100% - 18px)' : 2,
          width: 16,
          height: 16,
          borderRadius: '50%',
          background: on ? '#fff' : '#475569',
          transition: 'left 0.2s',
        }}
      />
    </button>
  )

  const Row = ({ label, children }: { label: string; children: React.ReactNode }) => (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '10px 0',
        borderBottom: '1px solid #0f172a',
        gap: 16,
      }}
    >
      <span style={{ fontSize: 13, color: '#94a3b8' }}>{label}</span>
      <div style={{ width: 200, flexShrink: 0 }}>{children}</div>
    </div>
  )

  return (
    <div style={{ padding: '4px 0' }}>
      <Row label="Target Window">
        <input
          value={gameWindow}
          onChange={e => setGameWindow(e.target.value)}
          placeholder="e.g. Ragnarok Online"
          style={INPUT_STYLE}
        />
      </Row>
      <Row label="Pause / Resume Key">
        <KeyCapture value={pauseKey} onChange={setPauseKey} />
      </Row>
      <Row label="Macro Speed (%)">
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <input
            type="range"
            min={10}
            max={200}
            value={speed}
            onChange={e => setSpeed(Number(e.target.value))}
            style={{ flex: 1, accentColor: '#0284c7' }}
          />
          <span style={{ fontSize: 12, color: '#38bdf8', fontFamily: 'JetBrains Mono, monospace', width: 36, textAlign: 'right' }}>
            {speed}%
          </span>
        </div>
      </Row>
      <Row label="Start macros on launch">
        <Toggle on={startOnLaunch} set={setStartOnLaunch} />
      </Row>
      <Row label="Always on top">
        <Toggle on={topmost} set={setTopmost} />
      </Row>
    </div>
  )
}

export default function App() {
  const [tab, setTab] = useState<Tab>('General')
  const [holdRows, setHoldRows] = useState<MacroRow[]>(makeRows(10))
  const [skillRows, setSkillRows] = useState<MacroRow[]>(makeRows(10))
  const [saved, setSaved] = useState(false)

  const tabs: Tab[] = ['General', 'Hold Macro', 'Auto Skill']

  const handleSave = () => {
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        background: '#080c12',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'Inter, sans-serif',
      }}
    >
      {/* Window */}
      <div
        style={{
          width: 560,
          height: 560,
          background: '#0d1117',
          borderRadius: 12,
          border: '1px solid #1f2937',
          boxShadow: '0 24px 80px rgba(0,0,0,0.7)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        {/* Title bar */}
        <div
          style={{
            height: 42,
            background: '#090d13',
            borderBottom: '1px solid #1f2937',
            display: 'flex',
            alignItems: 'center',
            paddingLeft: 14,
            paddingRight: 14,
            gap: 8,
            flexShrink: 0,
          }}
        >
          <div
            style={{
              width: 22,
              height: 22,
              borderRadius: 6,
              background: 'linear-gradient(135deg, #0ea5e9, #7c3aed)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 11,
              fontWeight: 700,
              color: '#fff',
            }}
          >
            M
          </div>
          <span style={{ fontSize: 13, fontWeight: 600, color: '#e2e8f0', letterSpacing: '-0.01em' }}>
            Macro Settings
          </span>
          <div style={{ flex: 1 }} />
          <div style={{ display: 'flex', gap: 6 }}>
            {['#374151', '#374151', '#374151'].map((c, i) => (
              <div key={i} style={{ width: 10, height: 10, borderRadius: '50%', background: c }} />
            ))}
          </div>
        </div>

        {/* Tabs */}
        <div
          style={{
            display: 'flex',
            background: '#090d13',
            borderBottom: '1px solid #1f2937',
            paddingLeft: 12,
            gap: 2,
            flexShrink: 0,
          }}
        >
          {tabs.map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              style={{
                padding: '9px 16px',
                fontSize: 12,
                fontWeight: 500,
                color: tab === t ? '#e2e8f0' : '#475569',
                background: 'transparent',
                border: 'none',
                borderBottom: `2px solid ${tab === t ? '#0ea5e9' : 'transparent'}`,
                cursor: 'pointer',
                transition: 'all 0.15s',
                fontFamily: 'Inter, sans-serif',
                marginBottom: -1,
              }}
            >
              {t}
            </button>
          ))}
        </div>

        {/* Content */}
        <div
          style={{
            flex: 1,
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            padding: '0 14px',
          }}
        >
          {tab === 'General' && (
            <div style={{ flex: 1, overflowY: 'auto', paddingTop: 8 }}>
              <GeneralTab />
            </div>
          )}

          {tab === 'Hold Macro' && (
            <MacroTable rows={holdRows} onChange={setHoldRows} showSkillKey={false} />
          )}

          {tab === 'Auto Skill' && (
            <MacroTable rows={skillRows} onChange={setSkillRows} showSkillKey={true} />
          )}
        </div>

        {/* Footer */}
        <div
          style={{
            height: 52,
            borderTop: '1px solid #1f2937',
            background: '#090d13',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            paddingLeft: 16,
            paddingRight: 16,
            gap: 8,
            flexShrink: 0,
          }}
        >
          {saved && (
            <span style={{ fontSize: 12, color: '#4ade80', marginRight: 8 }}>
              ✓ Saved
            </span>
          )}
          <button
            onClick={handleSave}
            style={{
              padding: '7px 20px',
              borderRadius: 7,
              border: 'none',
              background: '#0ea5e9',
              color: '#fff',
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer',
              fontFamily: 'Inter, sans-serif',
              transition: 'background 0.15s',
            }}
          >
            Save
          </button>
          <button
            style={{
              padding: '7px 20px',
              borderRadius: 7,
              border: '1px solid #1f2937',
              background: '#111827',
              color: '#94a3b8',
              fontSize: 13,
              fontWeight: 500,
              cursor: 'pointer',
              fontFamily: 'Inter, sans-serif',
            }}
          >
            Apply
          </button>
          <button
            style={{
              padding: '7px 20px',
              borderRadius: 7,
              border: '1px solid #1f2937',
              background: 'transparent',
              color: '#475569',
              fontSize: 13,
              fontWeight: 500,
              cursor: 'pointer',
              fontFamily: 'Inter, sans-serif',
            }}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}
