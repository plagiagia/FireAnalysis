import { useEffect, useMemo, useState } from 'react'
import Papa from 'papaparse'
import {
  ArrowDown,
  ArrowUpRight,
  CalendarBlank,
  CaretDown,
  ChartLineUp,
  CircleNotch,
  Compass,
  DownloadSimple,
  Fire,
  Info,
  MapPin,
  Moon,
  Pulse,
  SlidersHorizontal,
  Sparkle,
  Sun,
  Target,
  TrendUp,
  WarningCircle,
} from '@phosphor-icons/react'
import './styles.css'

const DATA_FILES = [
  { country: 'Greece', file: 'GREECE_2000_2021 - fire_archive_M-C61_214279.csv' },
  { country: 'Israel', file: 'ISRAEL_2000_2021 - fire_archive_M-C61_214285.csv' },
  { country: 'Italy', file: 'ITALY_2000_2021 - fire_archive_M-C61_214280.csv' },
  { country: 'Tunisia', file: 'TUNISIA_2000_2021_M-C61_214281.csv' },
]

const COUNTRY_COLORS = {
  All: '#e45c3a',
  Greece: '#e45c3a',
  Israel: '#8d6a4e',
  Italy: '#2f6f67',
  Tunisia: '#b38a47',
}

const TYPE_LABELS = {
  0: 'Vegetation fire',
  1: 'Active volcano',
  2: 'Static land source',
  3: 'Offshore detection',
}

const YEARS = Array.from({ length: 22 }, (_, index) => 2000 + index)

function parseRows(text, country) {
  const parsed = Papa.parse(text.trim(), { header: true, skipEmptyLines: true }).data
  return parsed.map((row, index) => ({
    id: `${country}-${index}`,
    country,
    latitude: Number(row.latitude),
    longitude: Number(row.longitude),
    brightness: Number(row.brightness),
    scan: Number(row.scan),
    track: Number(row.track),
    date: row.acq_date,
    time: row.acq_time,
    year: Number(row.acq_date?.slice(0, 4)),
    month: Number(row.acq_date?.slice(5, 7)),
    satellite: row.satellite,
    instrument: row.instrument,
    confidence: Number(row.confidence),
    version: row.version,
    brightT31: Number(row.bright_t31),
    frp: Number(row.frp),
    daynight: row.daynight,
    type: row.type === '' ? null : Number(row.type),
  }))
}

async function loadDataset(onProgress) {
  const base = import.meta.env.BASE_URL
  const results = []
  for (let index = 0; index < DATA_FILES.length; index += 1) {
    const source = DATA_FILES[index]
    const url = `${base}Data/${source.file}`
    const response = await fetch(url)
    if (!response.ok) throw new Error(`Unable to load ${source.file}`)
    const text = await response.text()
    results.push(...parseRows(text, source.country))
    onProgress(index + 1, DATA_FILES.length)
  }
  return results
}

function formatNumber(value, digits = 0) {
  if (!Number.isFinite(value)) return '—'
  return new Intl.NumberFormat('en-US', {
    maximumFractionDigits: digits,
    minimumFractionDigits: digits,
  }).format(value)
}

function formatCompact(value) {
  if (!Number.isFinite(value)) return '—'
  if (value >= 1000000) return `${(value / 1000000).toFixed(1)}m`
  if (value >= 1000) return `${(value / 1000).toFixed(value >= 10000 ? 0 : 1)}k`
  return formatNumber(value)
}

function percent(value) {
  return `${Math.round(value * 100)}%`
}

function App() {
  const [data, setData] = useState([])
  const [status, setStatus] = useState('loading')
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState('')

  useEffect(() => {
    loadDataset((complete, total) => setProgress(Math.round((complete / total) * 100)))
      .then((rows) => {
        setData(rows)
        setStatus('ready')
      })
      .catch((loadError) => {
        setError(loadError.message)
        setStatus('error')
      })
  }, [])

  return (
    <div className="app-shell">
      <Topbar />
      {status === 'loading' && <LoadingState progress={progress} />}
      {status === 'error' && <ErrorState message={error} />}
      {status === 'ready' && <Dashboard data={data} />}
    </div>
  )
}

function Topbar() {
  return (
    <header className="topbar">
      <a className="brand" href="#top" aria-label="Fireline home">
        <span className="brand-mark"><Fire size={18} weight="fill" /></span>
        <span>
          <strong>FIRELINE</strong>
          <small>ACTIVE FIRE / MODIS</small>
        </span>
      </a>
      <nav className="topnav" aria-label="Primary navigation">
        <a href="#analysis">Analysis</a>
        <a href="#method">Method</a>
        <a href="https://www.kaggle.com/datasets/brsdincer/2000-2021-tunisiaisraelgreeceitaly-nasa" target="_blank" rel="noreferrer">
          Source <ArrowUpRight size={14} />
        </a>
      </nav>
      <div className="archive-stamp"><span className="status-dot" />ARCHIVE VIEW / 2000—2021</div>
    </header>
  )
}

function LoadingState({ progress }) {
  return (
    <main className="loading-state" id="top">
      <div className="loading-copy">
        <div className="eyebrow"><CircleNotch className="spin" size={16} /> Loading satellite archive</div>
        <h1>Mapping the<br /><em>signal.</em></h1>
        <p>Reading four country archives and preparing the analytical view.</p>
        <div className="loading-track"><span style={{ width: `${progress}%` }} /></div>
        <small>{progress}% / source files processed</small>
      </div>
      <div className="loading-slab" aria-hidden="true">
        <div className="skeleton skeleton-title" />
        <div className="skeleton skeleton-chart" />
        <div className="skeleton-row"><div className="skeleton" /><div className="skeleton" /><div className="skeleton" /></div>
      </div>
    </main>
  )
}

function ErrorState({ message }) {
  return (
    <main className="empty-state" id="top">
      <WarningCircle size={42} />
      <div>
        <div className="eyebrow">Data load interrupted</div>
        <h1>The archive could not be read.</h1>
        <p>{message || 'Check that the CSV files are available in the Data folder, then reload the page.'}</p>
        <button className="button button-dark" onClick={() => window.location.reload()}>Reload archive</button>
      </div>
    </main>
  )
}

function Dashboard({ data }) {
  const [country, setCountry] = useState('All')
  const [fromYear, setFromYear] = useState(2000)
  const [toYear, setToYear] = useState(2021)
  const [metric, setMetric] = useState('detections')

  const filtered = useMemo(() => data.filter((row) => (
    (country === 'All' || row.country === country) && row.year >= fromYear && row.year <= toYear
  )), [country, data, fromYear, toYear])

  const stats = useMemo(() => buildStats(filtered), [filtered])
  const timeline = useMemo(() => buildTimeline(filtered, metric), [filtered, metric])
  const countryStats = useMemo(() => buildCountryStats(data, fromYear, toYear), [data, fromYear, toYear])
  const spatialBins = useMemo(() => buildSpatialBins(filtered), [filtered])

  function changeFromYear(value) {
    const next = Number(value)
    setFromYear(next)
    if (next > toYear) setToYear(next)
  }

  function changeToYear(value) {
    const next = Number(value)
    setToYear(next)
    if (next < fromYear) setFromYear(next)
  }

  return (
    <main id="top">
      <section className="hero-grid section-wrap">
        <div className="hero-copy">
          <div className="eyebrow"><span className="pulse-dot" /> NASA / ACTIVE FIRE SIGNAL</div>
          <h1>The geography<br /><em>of heat.</em></h1>
          <p className="hero-deck">A field guide to 157,779 satellite observations across the Mediterranean. Explore where fire appears, when it returns, and how the signal changes by country.</p>
          <div className="hero-actions">
            <a className="button button-dark" href="#analysis">Explore the signal <ArrowDown size={16} /></a>
            <span className="hero-note"><span className="mini-rule" /> Terra + Aqua / MODIS archive</span>
          </div>
        </div>
        <HeroVisual stats={stats} />
      </section>

      <section className="control-band" id="analysis">
        <div className="section-wrap control-inner">
          <div className="control-intro"><SlidersHorizontal size={17} /><span>Slice the archive</span></div>
          <ControlSelect label="Region" value={country} onChange={(event) => setCountry(event.target.value)} options={['All', ...DATA_FILES.map((item) => item.country)]} />
          <ControlSelect label="From" value={fromYear} onChange={(event) => changeFromYear(event.target.value)} options={YEARS} />
          <ControlSelect label="To" value={toYear} onChange={(event) => changeToYear(event.target.value)} options={YEARS} />
          <div className="metric-toggle" aria-label="Chart metric">
            <button className={metric === 'detections' ? 'active' : ''} onClick={() => setMetric('detections')}>Detections</button>
            <button className={metric === 'frp' ? 'active' : ''} onClick={() => setMetric('frp')}>FRP total</button>
          </div>
          <div className="filter-result"><span className="status-dot" />{formatNumber(filtered.length)} observations</div>
        </div>
      </section>

      <section className="section-wrap metric-band">
        <MetricBlock icon={<Target size={19} />} label="Hotspot detections" value={formatNumber(stats.total)} note={`${fromYear}—${toYear}`} />
        <MetricBlock icon={<TrendUp size={19} />} label="Strong confidence" value={percent(stats.highConfidenceShare)} note="confidence ≥ 80" />
        <MetricBlock icon={<Fire size={19} />} label="Average FRP" value={`${formatNumber(stats.avgFrp, 1)} MW`} note="per detection" />
        <MetricBlock icon={<Moon size={19} />} label="Night signal" value={percent(stats.nightShare)} note="of observations" />
      </section>

      <section className="section-wrap story-grid">
        <Panel className="timeline-panel" eyebrow="01 / Temporal signal" title="Fire returns in waves." subtitle={metric === 'detections' ? 'Monthly hotspot detections reveal the seasonal rhythm.' : 'Monthly Fire Radiative Power shows when the signal carries the most energy.'}>
          <TimelineChart points={timeline} metric={metric} color={COUNTRY_COLORS[country]} />
        </Panel>
        <InsightPanel stats={stats} country={country} metric={metric} timeline={timeline} />
      </section>

      <section className="section-wrap story-grid lower-grid">
        <Panel className="spatial-panel" eyebrow="02 / Spatial field" title="Heat is not evenly distributed." subtitle="Each mark is an aggregated hotspot cell. Denser and brighter cells indicate recurring detections.">
          <SpatialPlot bins={spatialBins} country={country} />
        </Panel>
        <Panel className="anatomy-panel" eyebrow="03 / Detection anatomy" title="Read the signal." subtitle="Satellite context changes how each observation should be interpreted.">
          <Anatomy stats={stats} />
        </Panel>
      </section>

      <section className="section-wrap country-section">
        <div className="section-heading-row">
          <div>
            <div className="eyebrow">04 / Country lens</div>
            <h2>Four coastlines, four fire signatures.</h2>
          </div>
          <p>Click a row to refocus the dashboard. Comparison respects the selected year window.</p>
        </div>
        <CountryTable rows={countryStats} selected={country} onSelect={setCountry} />
      </section>

      <section className="section-wrap method-section" id="method">
        <div className="method-mark"><Compass size={24} /></div>
        <div>
          <div className="eyebrow">Method note</div>
          <h2>A hotspot is a signal, not a verdict.</h2>
          <p>This dashboard works with NASA MODIS active-fire records published on Kaggle. A row is a detected hotspot pixel during a Terra or Aqua overpass—not a unique fire perimeter or a confirmed incident. Use FRP, confidence, location, and repeat observations together when drawing conclusions.</p>
        </div>
        <a className="source-link" href="https://www.kaggle.com/datasets/brsdincer/2000-2021-tunisiaisraelgreeceitaly-nasa" target="_blank" rel="noreferrer">Read the source <ArrowUpRight size={16} /></a>
      </section>

      <footer className="footer section-wrap">
        <div><span className="brand-mark small"><Fire size={14} weight="fill" /></span> FIRELINE / ACTIVE FIRE ANALYSIS</div>
        <span>Built from 157,779 MODIS observations / 2000—2021</span>
        <a href="https://github.com/plagiagia/FireAnalysis" target="_blank" rel="noreferrer">Open source dashboard <ArrowUpRight size={14} /></a>
      </footer>
    </main>
  )
}

function HeroVisual({ stats }) {
  return (
    <div className="hero-visual" aria-label="Archive summary">
      <div className="hero-visual-top"><span>ARCHIVE / FIELD 04</span><span>01—21</span></div>
      <div className="signal-orbit">
        <span className="orbit-ring ring-one" />
        <span className="orbit-ring ring-two" />
        <span className="orbit-ring ring-three" />
        <span className="orbit-cross cross-one" />
        <span className="orbit-cross cross-two" />
        <div className="orbit-core"><Fire size={26} weight="fill" /><small>FRP</small><strong>{formatCompact(stats.total)}</strong></div>
        <div className="orbit-label label-north">{stats.peakYear || '—'} / PEAK YEAR</div>
        <div className="orbit-label label-east">{formatCompact(stats.totalFrp)} MW / TOTAL ENERGY</div>
      </div>
      <div className="hero-visual-bottom"><span><Pulse size={14} /> signal detected</span><span>Terra + Aqua / MODIS</span></div>
    </div>
  )
}

function ControlSelect({ label, value, onChange, options }) {
  return (
    <label className="control-select">
      <span>{label}</span>
      <span className="select-wrap"><select value={value} onChange={onChange}>{options.map((option) => <option key={option} value={option}>{option}</option>)}</select><CaretDown size={14} /></span>
    </label>
  )
}

function MetricBlock({ icon, label, value, note }) {
  return <div className="metric-block"><div className="metric-label">{icon}<span>{label}</span></div><strong>{value}</strong><small>{note}</small></div>
}

function Panel({ className = '', eyebrow, title, subtitle, children }) {
  return <article className={`panel ${className}`}><div className="panel-header"><div><div className="eyebrow">{eyebrow}</div><h2>{title}</h2><p>{subtitle}</p></div><Info size={17} /></div>{children}</article>
}

function InsightPanel({ stats, country, metric, timeline }) {
  const peakMonth = stats.peakMonth ? `${stats.peakMonth.label} ${stats.peakMonth.year}` : '—'
  const selectedLabel = country === 'All' ? 'the full four-country archive' : country
  return (
    <aside className="insight-panel">
      <div className="eyebrow"><Sparkle size={15} /> Analyst readout</div>
      <h2>{selectedLabel} keeps its own rhythm.</h2>
      <p className="insight-lead">The strongest month in this view is <strong>{peakMonth}</strong>, with <strong>{formatNumber(stats.peakMonth?.value || 0)}</strong> {metric === 'detections' ? 'detections' : 'MW of FRP'}.</p>
      <div className="insight-list">
        <Readout label="Most active year" value={stats.peakYear ? `${stats.peakYear} / ${formatNumber(stats.peakYearValue)}` : '—'} />
        <Readout label="Highest-intensity detection" value={`${formatNumber(stats.maxFrp, 1)} MW`} />
        <Readout label="Most common satellite" value={stats.topSatellite || '—'} />
      </div>
      <div className="insight-foot"><ChartLineUp size={17} /><span>Hover the timeline to inspect the archive month by month.</span></div>
    </aside>
  )
}

function Readout({ label, value }) {
  return <div className="readout"><span>{label}</span><strong>{value}</strong></div>
}

function TimelineChart({ points, metric, color }) {
  const [hoverIndex, setHoverIndex] = useState(null)
  const width = 820
  const height = 300
  const padding = { top: 24, right: 18, bottom: 42, left: 48 }
  const plotWidth = width - padding.left - padding.right
  const plotHeight = height - padding.top - padding.bottom
  const maxValue = Math.max(...points.map((point) => point.value), 1)
  const scaleX = (index) => padding.left + (points.length <= 1 ? plotWidth / 2 : (index / (points.length - 1)) * plotWidth)
  const scaleY = (value) => padding.top + plotHeight - (value / maxValue) * plotHeight
  const line = points.map((point, index) => `${index === 0 ? 'M' : 'L'} ${scaleX(index).toFixed(2)} ${scaleY(point.value).toFixed(2)}`).join(' ')
  const area = `${line} L ${scaleX(points.length - 1).toFixed(2)} ${padding.top + plotHeight} L ${scaleX(0).toFixed(2)} ${padding.top + plotHeight} Z`
  const displayed = hoverIndex === null ? null : points[hoverIndex]
  const yTicks = [0, 0.5, 1].map((ratio) => Math.round(maxValue * ratio))

  function handleMove(event) {
    if (!points.length) return
    const rect = event.currentTarget.getBoundingClientRect()
    const relative = Math.max(0, Math.min(1, (event.clientX - rect.left) / rect.width))
    setHoverIndex(Math.round(relative * (points.length - 1)))
  }

  return (
    <div className="chart-shell">
      {!points.length ? <EmptyChart text="No observations in this window." /> : <>
        <div className="chart-meta"><span>{metric === 'detections' ? 'MONTHLY DETECTIONS' : 'MONTHLY FRP / MW'}</span><span>{points[0]?.label} — {points[points.length - 1]?.label}</span></div>
        <div className="line-chart-wrap">
          <svg className="line-chart" viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Monthly activity chart" onMouseMove={handleMove} onMouseLeave={() => setHoverIndex(null)}>
            {yTicks.map((tick, index) => {
              const y = scaleY(tick)
              return <g key={tick}><line x1={padding.left} x2={width - padding.right} y1={y} y2={y} className="chart-grid-line" /><text x={padding.left - 12} y={y + 4} textAnchor="end" className="chart-axis-label">{formatCompact(tick)}</text></g>
            })}
            <path d={area} fill={`${color}18`} />
            <path d={line} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            {displayed && <><line x1={scaleX(hoverIndex)} x2={scaleX(hoverIndex)} y1={padding.top} y2={padding.top + plotHeight} className="chart-hover-line" /><circle cx={scaleX(hoverIndex)} cy={scaleY(displayed.value)} r="5" fill="#f4f1ea" stroke={color} strokeWidth="3" /></>}
            <text x={padding.left} y={height - 12} className="chart-axis-label">{points[0]?.label}</text>
            <text x={width - padding.right} y={height - 12} textAnchor="end" className="chart-axis-label">{points[points.length - 1]?.label}</text>
          </svg>
          {displayed && <div className="chart-tooltip" style={{ left: `${(hoverIndex / Math.max(points.length - 1, 1)) * 100}%` }}><strong>{formatNumber(displayed.value, metric === 'frp' ? 0 : 0)}{metric === 'frp' ? ' MW' : ''}</strong><span>{displayed.label}</span></div>}
        </div>
      </>}
    </div>
  )
}

function SpatialPlot({ bins, country }) {
  const width = 820
  const height = 330
  const padding = { top: 18, right: 20, bottom: 44, left: 52 }
  const innerWidth = width - padding.left - padding.right
  const innerHeight = height - padding.top - padding.bottom
  const binMax = Math.max(...bins.map((bin) => bin.count), 1)
  return (
    <div className="spatial-wrap">
      {!bins.length ? <EmptyChart text="No spatial signal in this window." /> : <>
        <div className="spatial-meta"><span><MapPin size={14} /> {country === 'All' ? 'Mediterranean field' : `${country} field`}</span><span>longitude / latitude grid</span></div>
        <svg className="spatial-plot" viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Spatial hotspot field">
          {Array.from({ length: 5 }, (_, index) => {
            const x = padding.left + (index / 4) * innerWidth
            const y = padding.top + (index / 4) * innerHeight
            return <g key={index}><line x1={x} x2={x} y1={padding.top} y2={padding.top + innerHeight} className="chart-grid-line" /><line x1={padding.left} x2={padding.left + innerWidth} y1={y} y2={y} className="chart-grid-line" /></g>
          })}
          {bins.map((bin) => {
            const x = padding.left + bin.x * innerWidth
            const y = padding.top + (1 - bin.y) * innerHeight
            const radius = 3 + (bin.count / binMax) * 16
            return <g key={bin.key}><circle cx={x} cy={y} r={radius + 5} fill="#e45c3a10" /><circle cx={x} cy={y} r={radius} fill="#e45c3a" opacity={0.22 + (bin.count / binMax) * 0.7}><title>{`${formatNumber(bin.count)} observations / ${bin.latitude.toFixed(2)}, ${bin.longitude.toFixed(2)}`}</title></circle></g>
          })}
          <text x={padding.left} y={height - 13} className="chart-axis-label">{bins[0]?.minLon.toFixed(1)}°</text>
          <text x={width - padding.right} y={height - 13} textAnchor="end" className="chart-axis-label">{bins[0]?.maxLon.toFixed(1)}°</text>
          <text x={14} y={padding.top + 6} className="chart-axis-label">{bins[0]?.maxLat.toFixed(1)}°</text>
          <text x={14} y={padding.top + innerHeight} className="chart-axis-label">{bins[0]?.minLat.toFixed(1)}°</text>
        </svg>
        <div className="spatial-legend"><span><i className="legend-dot dot-small" /> sparse</span><span><i className="legend-dot dot-large" /> recurring signal</span><span className="legend-note">aggregated cells / not fire perimeters</span></div>
      </>}
    </div>
  )
}

function Anatomy({ stats }) {
  const maxDayNight = Math.max(stats.dayCount, stats.nightCount, 1)
  const types = Object.entries(stats.typeCounts).sort(([, a], [, b]) => b - a)
  return <div className="anatomy-content">
    <div className="anatomy-group"><div className="anatomy-label"><span>Day / night split</span><span>{formatNumber(stats.dayCount + stats.nightCount)}</span></div><div className="split-bars"><div style={{ width: `${(stats.dayCount / maxDayNight) * 100}%` }}><Sun size={14} /> Day <strong>{percent(stats.dayShare)}</strong></div><div style={{ width: `${(stats.nightCount / maxDayNight) * 100}%` }}><Moon size={14} /> Night <strong>{percent(stats.nightShare)}</strong></div></div></div>
    <div className="anatomy-group"><div className="anatomy-label"><span>Hotspot classification</span><span>raw type field</span></div><div className="type-list">{types.slice(0, 4).map(([type, count]) => <div className="type-row" key={type}><span><i className={`type-dot type-${type}`} />{TYPE_LABELS[type] || 'Unclassified'}</span><strong>{formatNumber(count)}</strong></div>)}</div></div>
    <div className="anatomy-callout"><Info size={16} /><span>Some near-real-time records do not carry a populated type value. Treat the classification as context, not a final diagnosis.</span></div>
  </div>
}

function CountryTable({ rows, selected, onSelect }) {
  const max = Math.max(...rows.map((row) => row.total), 1)
  return <div className="country-table" role="table" aria-label="Country comparison">{rows.map((row) => <button className={`country-row ${selected === row.country ? 'selected' : ''}`} key={row.country} onClick={() => onSelect(row.country)} role="row"><span className="country-name"><i style={{ background: COUNTRY_COLORS[row.country] }} />{row.country}</span><span className="country-bar"><i style={{ width: `${(row.total / max) * 100}%`, background: COUNTRY_COLORS[row.country] }} /></span><span className="country-total">{formatNumber(row.total)}</span><span className="country-frp">{formatCompact(row.totalFrp)} MW</span><span className="country-arrow"><ArrowUpRight size={16} /></span></button>)}</div>
}

function EmptyChart({ text }) {
  return <div className="empty-chart"><Info size={18} /><span>{text}</span></div>
}

function buildStats(rows) {
  const total = rows.length
  const totalFrp = rows.reduce((sum, row) => sum + (Number.isFinite(row.frp) ? row.frp : 0), 0)
  const dayCount = rows.filter((row) => row.daynight === 'D').length
  const nightCount = rows.filter((row) => row.daynight === 'N').length
  const highConfidence = rows.filter((row) => row.confidence >= 80).length
  const typeCounts = rows.reduce((acc, row) => { const key = row.type ?? 'unknown'; acc[key] = (acc[key] || 0) + 1; return acc }, {})
  const satelliteCounts = rows.reduce((acc, row) => { acc[row.satellite] = (acc[row.satellite] || 0) + 1; return acc }, {})
  const yearCounts = rows.reduce((acc, row) => { acc[row.year] = (acc[row.year] || 0) + 1; return acc }, {})
  const yearlyPeak = Object.entries(yearCounts).sort(([, a], [, b]) => b - a)[0]
  const monthly = buildTimeline(rows, 'detections')
  const peakMonth = monthly.slice().sort((a, b) => b.value - a.value)[0]
  return {
    total,
    totalFrp,
    avgFrp: total ? totalFrp / total : 0,
    maxFrp: rows.reduce((max, row) => Math.max(max, row.frp || 0), 0),
    dayCount,
    nightCount,
    dayShare: total ? dayCount / total : 0,
    nightShare: total ? nightCount / total : 0,
    highConfidenceShare: total ? highConfidence / total : 0,
    typeCounts,
    peakYear: yearlyPeak?.[0],
    peakYearValue: yearlyPeak?.[1],
    peakMonth,
    topSatellite: Object.entries(satelliteCounts).sort(([, a], [, b]) => b - a)[0]?.[0],
  }
}

function buildTimeline(rows, metric) {
  const groups = rows.reduce((acc, row) => {
    const key = `${row.year}-${String(row.month).padStart(2, '0')}`
    if (!acc[key]) acc[key] = { year: row.year, month: row.month, count: 0, frp: 0 }
    acc[key].count += 1
    acc[key].frp += row.frp || 0
    return acc
  }, {})
  return Object.values(groups).sort((a, b) => a.year - b.year || a.month - b.month).map((group) => ({
    label: new Date(group.year, group.month - 1, 1).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
    year: group.year,
    value: metric === 'frp' ? group.frp : group.count,
  }))
}

function buildCountryStats(rows, fromYear, toYear) {
  const inWindow = rows.filter((row) => row.year >= fromYear && row.year <= toYear)
  return DATA_FILES.map(({ country }) => {
    const countryRows = inWindow.filter((row) => row.country === country)
    return { country, total: countryRows.length, totalFrp: countryRows.reduce((sum, row) => sum + (row.frp || 0), 0) }
  }).sort((a, b) => b.total - a.total)
}

function buildSpatialBins(rows) {
  if (!rows.length) return []
  const bounds = rows.reduce((result, row) => ({
    minLat: Math.min(result.minLat, row.latitude),
    maxLat: Math.max(result.maxLat, row.latitude),
    minLon: Math.min(result.minLon, row.longitude),
    maxLon: Math.max(result.maxLon, row.longitude),
  }), { minLat: Infinity, maxLat: -Infinity, minLon: Infinity, maxLon: -Infinity })
  const minLatRaw = bounds.minLat
  const maxLatRaw = bounds.maxLat
  const minLonRaw = bounds.minLon
  const maxLonRaw = bounds.maxLon
  const latPad = Math.max((maxLatRaw - minLatRaw) * 0.04, 0.15)
  const lonPad = Math.max((maxLonRaw - minLonRaw) * 0.04, 0.15)
  const minLat = minLatRaw - latPad
  const maxLat = maxLatRaw + latPad
  const minLon = minLonRaw - lonPad
  const maxLon = maxLonRaw + lonPad
  const columns = 18
  const rowsCount = 11
  const grouped = rows.reduce((acc, row) => {
    const col = Math.min(columns - 1, Math.max(0, Math.floor(((row.longitude - minLon) / (maxLon - minLon)) * columns)))
    const rowIndex = Math.min(rowsCount - 1, Math.max(0, Math.floor(((row.latitude - minLat) / (maxLat - minLat)) * rowsCount)))
    const key = `${col}-${rowIndex}`
    if (!acc[key]) acc[key] = { col, rowIndex, count: 0, latitude: 0, longitude: 0 }
    acc[key].count += 1
    acc[key].latitude += row.latitude
    acc[key].longitude += row.longitude
    return acc
  }, {})
  return Object.values(grouped).map((bin) => ({
    key: `${bin.col}-${bin.rowIndex}`,
    count: bin.count,
    x: (bin.col + 0.5) / columns,
    y: (bin.rowIndex + 0.5) / rowsCount,
    latitude: bin.latitude / bin.count,
    longitude: bin.longitude / bin.count,
    minLat,
    maxLat,
    minLon,
    maxLon,
  }))
}

export default App
