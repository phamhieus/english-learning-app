import React from 'react';

export type ChartType = 'bar' | 'line' | 'pie' | 'table' | 'process' | 'map';

export const detectChartType = (title: string): ChartType => {
  const t = title.toLowerCase();
  if (t.includes('pie') || t.includes('donut') || t.includes('proportion') || t.includes('percentage') || t.includes('sector')) return 'pie';
  if (t.includes('line') || t.includes('trend') || t.includes('over time') || t.includes('years') || t.includes('growth') || t.includes('change')) return 'line';
  if (t.includes('table') || t.includes('figures') || t.includes('statistics')) return 'table';
  if (t.includes('process') || t.includes('diagram') || t.includes('flow') || t.includes('stage') || t.includes('cycle') || t.includes('production')) return 'process';
  if (t.includes('map') || t.includes('plan') || t.includes('layout') || t.includes('town')) return 'map';
  return 'bar';
};

// IELTS-standard colours: distinct, printable, no gradients
const CC = ['#1f497d', '#c0504d', '#9bbb59', '#f79646', '#4bacc6'] as const;

// SVG coordinate constants — viewBox "0 0 500 310"
const CL = 68;        // chart left (space for Y labels)
const CT = 48;        // chart top  (space for title + legend)
const CR = 492;       // chart right
const CB = 262;       // chart bottom (space for X labels)
const CW = CR - CL;  // 424
const CH = CB - CT;  // 214

interface ChartProps { title: string; learning?: boolean; }

// ---------------------------------------------------------------------------
// Bar Chart
// ---------------------------------------------------------------------------
const BarChartSVG: React.FC<ChartProps> = ({ title, learning }) => {
  const rows = [
    { cat: 'USA',    v1: 72, v2: 82 },
    { cat: 'UK',     v1: 58, v2: 68 },
    { cat: 'Japan',  v1: 65, v2: 71 },
    { cat: 'Brazil', v1: 43, v2: 55 },
    { cat: 'India',  v1: 31, v2: 48 },
  ];
  const maxY = 100;
  const yTicks = [0, 20, 40, 60, 80, 100];
  const ys = (v: number) => CB - (v / maxY) * CH;
  const gW = CW / rows.length;
  const bW = 17;
  const maxV1 = Math.max(...rows.map(r => r.v1));
  const minV1 = Math.min(...rows.map(r => r.v1));

  return (
    <>
      <rect width="500" height="310" fill="white" />
      <text x="250" y="16" textAnchor="middle" fontSize="11" fontWeight="bold" fill="#111">
        {title || 'Social media usage (%) by country, 2015 and 2020'}
      </text>
      <text x="14" y={CT + CH / 2} textAnchor="middle" fontSize="9" fill="#555"
        transform={`rotate(-90,14,${CT + CH / 2})`}>Percentage (%)</text>
      {yTicks.map(v => (
        <g key={v}>
          <line x1={CL} y1={ys(v)} x2={CR} y2={ys(v)}
            stroke={v === 0 ? '#333' : '#e2e8f0'} strokeWidth={v === 0 ? 1.5 : 1} />
          <text x={CL - 5} y={ys(v) + 4} textAnchor="end" fontSize="10" fill="#444">{v}</text>
        </g>
      ))}
      <line x1={CL} y1={CT} x2={CL} y2={CB} stroke="#333" strokeWidth="1.5" />
      {rows.map((r, i) => {
        const cx = CL + i * gW + gW / 2;
        const b1x = cx - bW - 2;
        const b2x = cx + 2;
        const isMax = r.v1 === maxV1;
        const isMin = r.v1 === minV1;
        return (
          <g key={r.cat}>
            <rect x={b1x} y={ys(r.v1)} width={bW} height={CB - ys(r.v1)} fill={CC[0]} />
            <rect x={b2x} y={ys(r.v2)} width={bW} height={CB - ys(r.v2)} fill={CC[1]} />
            {learning && isMax && (
              <>
                <rect x={b1x - 1} y={ys(r.v1) - 1} width={bW + 2} height={CB - ys(r.v1) + 1}
                  fill="none" stroke="#f59e0b" strokeWidth="2" />
                <text x={b1x + bW / 2} y={ys(r.v1) - 5} textAnchor="middle" fontSize="9" fill="#b45309" fontWeight="bold">peak</text>
              </>
            )}
            {learning && isMin && (
              <text x={b1x + bW / 2} y={ys(r.v1) - 5} textAnchor="middle" fontSize="9" fill="#6b7280">low</text>
            )}
            <text x={cx} y={CB + 15} textAnchor="middle" fontSize="10" fill="#222">{r.cat}</text>
          </g>
        );
      })}
      <g transform={`translate(${CL},${CT - 22})`}>
        <rect width="14" height="12" fill={CC[0]} />
        <text x="18" y="10" fontSize="10" fill="#222">2015</text>
        <rect x="58" width="14" height="12" fill={CC[1]} />
        <text x="76" y="10" fontSize="10" fill="#222">2020</text>
      </g>
    </>
  );
};

// ---------------------------------------------------------------------------
// Line Graph
// ---------------------------------------------------------------------------
const LineChartSVG: React.FC<ChartProps> = ({ title, learning }) => {
  const years = [1990, 1995, 2000, 2005, 2010, 2015];
  const series = [
    { name: 'Country A', data: [5,  8,  12, 18, 22, 24], dash: '',    color: CC[0] },
    { name: 'Country B', data: [10, 13, 10,  8, 11, 14], dash: '6 3', color: CC[1] },
    { name: 'Country C', data: [3,   4,  6,  9,  7, 10], dash: '2 5', color: CC[2] },
  ];
  const maxY = 25;
  const yTicks = [0, 5, 10, 15, 20, 25];
  const xs = (i: number) => CL + (i / (years.length - 1)) * CW;
  const ys = (v: number) => CB - (v / maxY) * CH;

  return (
    <>
      <rect width="500" height="310" fill="white" />
      <text x="250" y="16" textAnchor="middle" fontSize="11" fontWeight="bold" fill="#111">
        {title || 'Tourist arrivals in three countries, 1990–2015'}
      </text>
      <text x="14" y={CT + CH / 2} textAnchor="middle" fontSize="9" fill="#555"
        transform={`rotate(-90,14,${CT + CH / 2})`}>Millions</text>
      {yTicks.map(v => (
        <g key={v}>
          <line x1={CL} y1={ys(v)} x2={CR} y2={ys(v)}
            stroke={v === 0 ? '#333' : '#e2e8f0'} strokeWidth={v === 0 ? 1.5 : 1} />
          <text x={CL - 5} y={ys(v) + 4} textAnchor="end" fontSize="10" fill="#444">{v}</text>
        </g>
      ))}
      <line x1={CL} y1={CT} x2={CL} y2={CB} stroke="#333" strokeWidth="1.5" />
      {years.map((yr, i) => (
        <g key={yr}>
          <line x1={xs(i)} y1={CB} x2={xs(i)} y2={CB + 5} stroke="#333" strokeWidth="1" />
          <text x={xs(i)} y={CB + 17} textAnchor="middle" fontSize="10" fill="#222">{yr}</text>
        </g>
      ))}
      {series.map((s) => {
        const d = s.data.map((v, i) => `${i === 0 ? 'M' : 'L'}${xs(i).toFixed(1)},${ys(v).toFixed(1)}`).join(' ');
        const maxIdx = s.data.indexOf(Math.max(...s.data));
        const minIdx = s.data.indexOf(Math.min(...s.data));
        return (
          <g key={s.name}>
            <path d={d} fill="none" stroke={s.color} strokeWidth="2" strokeDasharray={s.dash} strokeLinejoin="round" />
            {s.data.map((v, i) => <circle key={i} cx={xs(i)} cy={ys(v)} r="3.5" fill={s.color} />)}
            {learning && (
              <>
                <circle cx={xs(maxIdx)} cy={ys(s.data[maxIdx])} r="6.5" fill="none" stroke="#f59e0b" strokeWidth="1.5" />
                <text x={xs(maxIdx)} y={ys(s.data[maxIdx]) - 10} textAnchor="middle" fontSize="8" fill="#b45309">peak</text>
                <text x={xs(minIdx)} y={ys(s.data[minIdx]) + 16} textAnchor="middle" fontSize="8" fill="#6b7280">low</text>
              </>
            )}
          </g>
        );
      })}
      {series.map((s, i) => (
        <g key={s.name} transform={`translate(${CL + i * 132},${CT - 22})`}>
          <line x1="0" y1="7" x2="22" y2="7" stroke={s.color} strokeWidth="2" strokeDasharray={s.dash} />
          <circle cx="11" cy="7" r="3" fill={s.color} />
          <text x="26" y="11" fontSize="10" fill="#222">{s.name}</text>
        </g>
      ))}
    </>
  );
};

// ---------------------------------------------------------------------------
// Pie Chart
// ---------------------------------------------------------------------------
const PieChartSVG: React.FC<ChartProps> = ({ title, learning }) => {
  const pcx = 185; const pcy = 160; const r = 105;
  const slices = [
    { label: 'Housing',   pct: 30, color: CC[0] },
    { label: 'Food',      pct: 25, color: CC[1] },
    { label: 'Transport', pct: 20, color: CC[2] },
    { label: 'Health',    pct: 15, color: CC[3] },
    { label: 'Other',     pct: 10, color: CC[4] },
  ];
  const maxPct = Math.max(...slices.map(s => s.pct));
  let angle = -Math.PI / 2;
  const rendered = slices.map((s) => {
    const sweep = (s.pct / 100) * 2 * Math.PI;
    const midAngle = angle + sweep / 2;
    const x1 = pcx + r * Math.cos(angle);
    const y1 = pcy + r * Math.sin(angle);
    angle += sweep;
    const x2 = pcx + r * Math.cos(angle);
    const y2 = pcy + r * Math.sin(angle);
    const large = sweep > Math.PI ? 1 : 0;
    return { ...s, d: `M${pcx},${pcy} L${x1.toFixed(1)},${y1.toFixed(1)} A${r},${r} 0 ${large},1 ${x2.toFixed(1)},${y2.toFixed(1)} Z`, midAngle };
  });

  return (
    <>
      <rect width="500" height="310" fill="white" />
      <text x="250" y="16" textAnchor="middle" fontSize="11" fontWeight="bold" fill="#111">
        {title || 'Household expenditure in Australia (%)'}
      </text>
      {rendered.map(({ d, color, label, pct, midAngle }) => {
        const isMax = learning && pct === maxPct;
        return (
          <g key={label}>
            <path d={d} fill={color} stroke="white" strokeWidth="2" />
            {isMax && <path d={d} fill="none" stroke="#f59e0b" strokeWidth="2.5" />}
            <text x={pcx + r * 0.64 * Math.cos(midAngle)} y={pcy + r * 0.64 * Math.sin(midAngle) + 4}
              textAnchor="middle" fontSize="10" fontWeight="bold" fill="white">{pct}%</text>
          </g>
        );
      })}
      {slices.map(({ label, pct, color }, i) => (
        <g key={label} transform={`translate(312,${72 + i * 34})`}>
          <rect width="14" height="14" fill={color} />
          <text x="20" y="11" fontSize="11" fill="#111">{label}</text>
          <text x="20" y="25" fontSize="10" fill="#666">{pct}%{learning && pct === maxPct ? ' ← largest' : ''}</text>
        </g>
      ))}
    </>
  );
};

// ---------------------------------------------------------------------------
// Table
// ---------------------------------------------------------------------------
const TableChartSVG: React.FC<ChartProps> = ({ title }) => {
  const headers = ['Country', '2000', '2005', '2010', '2015'];
  const cW = [116, 77, 77, 77, 77]; // sum = 424 = CW
  const colX: number[] = [];
  let cx = CL;
  cW.forEach(w => { colX.push(cx); cx += w; });
  const rowH = 38;
  const dataRows = [
    ['Japan',     '185', '192', '198', '205'],
    ['UK',        '143', '155', '161', '168'],
    ['Australia', '210', '225', '231', '248'],
    ['Canada',    '167', '174', '180', '195'],
  ];
  const tableH = (dataRows.length + 1) * rowH;

  return (
    <>
      <rect width="500" height="310" fill="white" />
      <text x="250" y="16" textAnchor="middle" fontSize="11" fontWeight="bold" fill="#111">
        {title || 'Water consumption per capita (litres/day)'}
      </text>
      <rect x={CL} y={CT} width={CW} height={rowH} fill={CC[0]} />
      {headers.map((h, i) => (
        <text key={h} x={colX[i] + cW[i] / 2} y={CT + rowH / 2 + 4}
          textAnchor="middle" fontSize="10.5" fontWeight="bold" fill="white">{h}</text>
      ))}
      {dataRows.map((row, ri) => (
        <g key={ri}>
          <rect x={CL} y={CT + (ri + 1) * rowH} width={CW} height={rowH}
            fill={ri % 2 === 0 ? '#dae3f3' : 'white'} />
          {row.map((cell, ci) => (
            <text key={ci} x={colX[ci] + cW[ci] / 2} y={CT + (ri + 1) * rowH + rowH / 2 + 4}
              textAnchor="middle" fontSize="11" fill="#111">{cell}</text>
          ))}
        </g>
      ))}
      {colX.slice(1).map((x, i) => (
        <line key={i} x1={x} y1={CT} x2={x} y2={CT + tableH} stroke="#b8c9e0" strokeWidth="1" />
      ))}
      {Array.from({ length: dataRows.length + 2 }, (_, i) => CT + i * rowH).map((y, i) => (
        <line key={i} x1={CL} y1={y} x2={CR} y2={y} stroke="#b8c9e0" strokeWidth="1" />
      ))}
      <rect x={CL} y={CT} width={CW} height={tableH} fill="none" stroke={CC[0]} strokeWidth="1.5" />
      <text x={CL} y={CT + tableH + 16} fontSize="9" fill="#666" fontStyle="italic">* litres per person per day</text>
    </>
  );
};

// ---------------------------------------------------------------------------
// Process Diagram
// ---------------------------------------------------------------------------
const ProcessChartSVG: React.FC<ChartProps> = ({ title }) => {
  const bW = 110; const bH = 50; const aH = bH / 2;
  const row1 = [
    { x: 65,  y: 85,  step: '1', label: ['Raw', 'materials'] },
    { x: 195, y: 85,  step: '2', label: ['Sorting', '& cleaning'] },
    { x: 325, y: 85,  step: '3', label: ['Crushing', '& melting'] },
  ];
  const row2 = [
    { x: 325, y: 185, step: '4', label: ['Moulding', '& shaping'] },
    { x: 195, y: 185, step: '5', label: ['Quality', 'check'] },
    { x: 65,  y: 185, step: '6', label: ['Final', 'product'] },
  ];
  const renderBox = (b: typeof row1[0]) => (
    <g key={b.step}>
      <rect x={b.x} y={b.y} width={bW} height={bH} rx="4" fill="#dae3f3" stroke={CC[0]} strokeWidth="1.5" />
      <rect x={b.x} y={b.y} width={22} height={bH} rx="4" fill={CC[0]} />
      <text x={b.x + 11} y={b.y + bH / 2 + 5} textAnchor="middle" fontSize="11" fontWeight="bold" fill="white">{b.step}</text>
      {b.label.map((ln, li) => (
        <text key={li}
          x={b.x + 66}
          y={b.y + bH / 2 + (b.label.length === 1 ? 4 : (li - 0.5) * 13 + 5)}
          textAnchor="middle" fontSize="9.5" fill="#111">{ln}</text>
      ))}
    </g>
  );

  return (
    <>
      <rect width="500" height="310" fill="white" />
      <text x="250" y="16" textAnchor="middle" fontSize="11" fontWeight="bold" fill="#111">
        {title || 'The process of glass recycling'}
      </text>
      <defs>
        <marker id="ielts-arr" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto">
          <polygon points="0 0, 8 4, 0 8" fill={CC[0]} />
        </marker>
      </defs>
      {row1.map(renderBox)}
      {row2.map(renderBox)}
      {/* Row 1: left → right */}
      <line x1={175} y1={85 + aH} x2={193} y2={85 + aH} stroke={CC[0]} strokeWidth="1.5" markerEnd="url(#ielts-arr)" />
      <line x1={305} y1={85 + aH} x2={323} y2={85 + aH} stroke={CC[0]} strokeWidth="1.5" markerEnd="url(#ielts-arr)" />
      {/* Down arrow from box 3 to box 4 */}
      <line x1={380} y1={135} x2={380} y2={183} stroke={CC[0]} strokeWidth="1.5" markerEnd="url(#ielts-arr)" />
      {/* Row 2: right → left */}
      <line x1={325} y1={185 + aH} x2={307} y2={185 + aH} stroke={CC[0]} strokeWidth="1.5" markerEnd="url(#ielts-arr)" />
      <line x1={195} y1={185 + aH} x2={177} y2={185 + aH} stroke={CC[0]} strokeWidth="1.5" markerEnd="url(#ielts-arr)" />
      <text x="250" y="290" textAnchor="middle" fontSize="9" fill="#666" fontStyle="italic">Stages 1–6 of the recycling process</text>
    </>
  );
};

// ---------------------------------------------------------------------------
// Map / Plan
// ---------------------------------------------------------------------------
const MapChartSVG: React.FC<ChartProps> = ({ title }) => {
  const halfW = Math.floor(CW / 2) - 6; // 206
  const midX = CL + halfW + 6;           // 280
  const hc = halfW / 2;                   // 103

  return (
    <>
      <rect width="500" height="310" fill="white" />
      <text x="250" y="16" textAnchor="middle" fontSize="11" fontWeight="bold" fill="#111">
        {title || 'Town plan: 1980 and 2020'}
      </text>
      <text x={CL + hc} y={CT - 6} textAnchor="middle" fontSize="10" fontWeight="bold" fill="#444">1980</text>
      <text x={midX + hc} y={CT - 6} textAnchor="middle" fontSize="10" fontWeight="bold" fill="#444">2020</text>
      <line x1={midX - 3} y1={CT} x2={midX - 3} y2={CB} stroke="#cbd5e1" strokeWidth="1.5" strokeDasharray="4 3" />

      {/* ── 1980 ── */}
      <rect x={CL} y={CT} width={halfW} height={CH} fill="#f8fafc" stroke="#94a3b8" strokeWidth="1" />
      <rect x={CL + 4} y={CT + 4} width={halfW - 8} height={78} fill="#d1fae5" stroke="#6ee7b7" strokeWidth="0.8" />
      <text x={CL + hc} y={CT + 43} textAnchor="middle" fontSize="9" fill="#065f46">Farm land</text>
      <rect x={CL + 4} y={CT + 88} width={hc - 4} height={64} fill="#dbeafe" stroke="#93c5fd" strokeWidth="0.8" />
      <text x={CL + hc / 2} y={CT + 122} textAnchor="middle" fontSize="9" fill="#1e40af">Housing</text>
      <rect x={CL + hc + 2} y={CT + 88} width={hc - 6} height={64} fill="#fef3c7" stroke="#fcd34d" strokeWidth="0.8" />
      <text x={CL + hc * 1.5} y={CT + 122} textAnchor="middle" fontSize="9" fill="#92400e">School</text>
      <rect x={CL + 4} y={CT + 158} width={halfW - 8} height={16} fill="#e2e8f0" stroke="#94a3b8" strokeWidth="0.8" />
      <text x={CL + hc} y={CT + 169} textAnchor="middle" fontSize="8" fill="#475569">Main Road</text>
      <path d={`M${CL + 4},${CT + 185} Q${CL + hc},${CT + 197} ${CL + halfW - 4},${CT + 185}`}
        fill="none" stroke="#60a5fa" strokeWidth="6" opacity="0.6" />
      <text x={CL + hc} y={CT + 208} textAnchor="middle" fontSize="8" fill="#2563eb">River</text>

      {/* ── 2020 ── */}
      <rect x={midX} y={CT} width={halfW} height={CH} fill="#f8fafc" stroke="#94a3b8" strokeWidth="1" />
      <rect x={midX + 4} y={CT + 4} width={halfW - 8} height={78} fill="#fce7f3" stroke="#f9a8d4" strokeWidth="0.8" />
      <text x={midX + hc} y={CT + 38} textAnchor="middle" fontSize="9" fill="#9d174d">Shopping</text>
      <text x={midX + hc} y={CT + 51} textAnchor="middle" fontSize="9" fill="#9d174d">Centre</text>
      <rect x={midX + 4} y={CT + 88} width={hc - 4} height={64} fill="#ede9fe" stroke="#c4b5fd" strokeWidth="0.8" />
      <text x={midX + hc / 2} y={CT + 120} textAnchor="middle" fontSize="9" fill="#5b21b6">Apart-</text>
      <text x={midX + hc / 2} y={CT + 132} textAnchor="middle" fontSize="9" fill="#5b21b6">ments</text>
      <rect x={midX + hc + 2} y={CT + 88} width={hc - 6} height={64} fill="#fef3c7" stroke="#fcd34d" strokeWidth="0.8" />
      <text x={midX + hc * 1.5} y={CT + 122} textAnchor="middle" fontSize="9" fill="#92400e">School</text>
      <rect x={midX + 4} y={CT + 158} width={halfW - 8} height={20} fill="#cbd5e1" stroke="#94a3b8" strokeWidth="0.8" />
      <text x={midX + hc} y={CT + 171} textAnchor="middle" fontSize="8" fill="#334155">Dual Carriageway</text>
      <path d={`M${midX + 4},${CT + 185} Q${midX + hc},${CT + 197} ${midX + halfW - 4},${CT + 185}`}
        fill="none" stroke="#60a5fa" strokeWidth="6" opacity="0.6" />
      <text x={midX + hc} y={CT + 208} textAnchor="middle" fontSize="8" fill="#2563eb">River</text>

      <text x="250" y="286" textAnchor="middle" fontSize="9" fill="#666" fontStyle="italic">Shading = new or changed features</text>
    </>
  );
};

// ---------------------------------------------------------------------------
// Registry
// ---------------------------------------------------------------------------
const CHART_SVGS: Record<ChartType, React.FC<ChartProps>> = {
  bar: BarChartSVG,
  line: LineChartSVG,
  pie: PieChartSVG,
  table: TableChartSVG,
  process: ProcessChartSVG,
  map: MapChartSVG,
};

export const CHART_TYPE_LABELS: Record<ChartType, string> = {
  bar:     'Bar Chart',
  line:    'Line Graph',
  pie:     'Pie Chart',
  table:   'Table',
  process: 'Process Diagram',
  map:     'Map / Plan',
};

// Vocabulary shown in Learning Mode (WritingResult)
export const TREND_VOCAB = [
  { phrase: 'rose steadily',          use: 'gradual upward trend' },
  { phrase: 'declined gradually',     use: 'slow downward trend' },
  { phrase: 'remained stable',        use: 'flat / no change' },
  { phrase: 'fluctuated',             use: 'irregular up-and-down movement' },
  { phrase: 'peaked at',              use: 'the highest recorded point' },
  { phrase: 'reached a low of',       use: 'the lowest recorded point' },
  { phrase: 'increased sharply',      use: 'rapid upward movement' },
  { phrase: 'dropped significantly',  use: 'rapid downward movement' },
] as const;

// ---------------------------------------------------------------------------
// Main export
// ---------------------------------------------------------------------------
interface ChartPromptProps { title: string; learning?: boolean; }

const ChartPrompt: React.FC<ChartPromptProps> = ({ title, learning }) => {
  const chartType = detectChartType(title);
  const ChartSVG = CHART_SVGS[chartType];
  const typeLabel = CHART_TYPE_LABELS[chartType];
  return (
    <div className="rounded-lg border border-slate-300 bg-white overflow-hidden">
      <svg
        viewBox="0 0 500 310"
        className="w-full h-auto"
        style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}
      >
        <ChartSVG title={title} learning={learning} />
      </svg>
      <div className="px-3 py-1.5 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
        <span className="text-[10px] text-slate-500 font-medium uppercase tracking-wide">
          IELTS Writing Task 1 — {typeLabel}
        </span>
        {learning && (
          <span className="text-[9px] bg-amber-100 text-amber-700 px-2 py-0.5 rounded font-semibold uppercase tracking-wide">
            Learning Mode
          </span>
        )}
      </div>
    </div>
  );
};

export default ChartPrompt;
