import { useLayoutEffect, useEffect, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import { sessionsApi } from '../api/endpoints';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Skeleton } from '../components/ui/skeleton';
// Kept from the custom kit
import { ErrorBox } from '../components/modern';
import { useAsync } from '../hooks/useAsync';
import type { CreatorSession } from '../types';

/* ------------------------------------------------------------------ */
/* Config                                                              */
/* ------------------------------------------------------------------ */
const PAL = [
  { name: 'Slate', a: '#1F3A5F', b: '#EEF2F7' },
  { name: 'Forest', a: '#0F5C4D', b: '#ECF4F0' },
  { name: 'Graphite', a: '#2B2F36', b: '#F1F2F4' },
  { name: 'Burgundy', a: '#7A1F3D', b: '#F8EEF1' },
  { name: 'Teal', a: '#0E6B78', b: '#E9F4F6' },
] as const;

/** Paper sizes. w/h are CSS px at 96 dpi; cw/ch are the real printed lengths. */
const SIZES = {
  short: { label: 'Short bond (Letter), 8.5 × 11 in', w: 816, h: 1056, cw: '8.5in', ch: '11in' },
  a4: { label: 'A4, 210 × 297 mm', w: 794, h: 1123, cw: '210mm', ch: '297mm' },
  long: { label: 'Long bond (Folio), 8.5 × 13 in', w: 816, h: 1248, cw: '8.5in', ch: '13in' },
  legal: { label: 'Legal, 8.5 × 14 in', w: 816, h: 1344, cw: '8.5in', ch: '14in' },
  a5: { label: 'A5, 148 × 210 mm', w: 559, h: 794, cw: '148mm', ch: '210mm' },
} as const;
type PaperKey = keyof typeof SIZES;
const PAPER_ORDER: PaperKey[] = ['short', 'a4', 'long', 'legal', 'a5'];

type ColKey = 'no' | 'name' | 'company' | 'email' | 'time' | 'sign' | 'custom';
type InputType = 'text' | 'number' | 'signature';
type Col = { id: string; k: ColKey; l: string; on: 0 | 1; inputType?: InputType };
type Cfg = {
  title: string;
  pal: number;
  paper: PaperKey;
  land: 0 | 1;
  cols: Col[];
  rows: number;
  det: 0 | 1;
  f: [string, string][];
  foot: string;
  logo: 0 | 1;
  qr: 0 | 1;
};

const MAX_COLS = 12;
const ROW_OPTIONS = [10, 15, 20, 25, 30, 35, 40, 50];
const COL_W: Partial<Record<ColKey, number>> = { no: 44, time: 90, sign: 170 };
const uid = () => Math.random().toString(36).slice(2, 8);

const timeOf = (d: Date) => d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
const dayOf = (d: Date) => d.toLocaleDateString([], { month: 'short', day: 'numeric' });
const when = (a: string, b: string) => `${dayOf(new Date(a))}, ${timeOf(new Date(a))} to ${timeOf(new Date(b))}`;

/** What the sheet needs from a session. A real session fits, and so does the unsaved form on the Create page. */
type Seed = { category?: string; title: string; venue: string; startsAt: string; endsAt: string };

function newCfg(s: Seed | null): Cfg {
  const c = s?.category;
  return {
    title: `${c === 'Employee' ? 'Meeting' : c === 'School' ? 'Class' : 'Event'} attendance`,
    pal: 0,
    paper: 'a4',
    land: 0,
    cols: [
      { id: 'no', k: 'no', l: 'No', on: 1 },
      { id: 'name', k: 'name', l: 'Name', on: 1 },
      { id: 'company', k: 'company', l: 'Company', on: 0 },
      { id: 'email', k: 'email', l: 'Email', on: 1 },
      { id: 'time', k: 'time', l: 'Time in', on: 1 },
      { id: 'sign', k: 'sign', l: 'Signature', on: 1 },
    ],
    rows: 25,
    det: 1,
    f: [
      ['Date', (s ? new Date(s.startsAt) : new Date()).toLocaleDateString('en-US')],
      ['Time', s ? when(s.startsAt, s.endsAt) : ''],
      ['Place', s?.venue ?? ''],
      ['Moderator', ''],
      ['Subject', s?.title ?? ''],
    ],
    foot: 'Please sign in clearly and legibly.',
    logo: 1,
    qr: 1,
  };
}

/** Fill the Time, Place and Subject rows from the session when they are still blank (keeps anything typed). */
function fillBlank(c: Cfg, s: Seed): Cfg {
  const fresh = newCfg(s).f;
  return { ...c, f: c.f.map((row) => (row[1] ? row : (fresh.find((x) => x[0] === row[0]) ?? row))) as [string, string][] };
}

/** Accept saved settings only if they have the current shape (older saves are ignored). */
function norm(raw: unknown): Cfg | null {
  const c = raw as Partial<Cfg> | null;
  if (!c || typeof c.title !== 'string' || !Array.isArray(c.cols) || !Array.isArray(c.f)) return null;
  if (!c.cols.every((x) => x && typeof x.k === 'string' && typeof x.l === 'string' && typeof x.id === 'string')) return null;
  return {
    ...newCfg(null),
    ...c,
    paper: c.paper && c.paper in SIZES ? c.paper : 'a4',
    land: c.land ? 1 : 0,
  } as Cfg;
}

const storeKey = (id: string) => `geoattend:sheet:${id}`;
function loadRaw(id: string): unknown {
  try {
    const raw = localStorage.getItem(storeKey(id));
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

/* ------------------------------------------------------------------ */
/* Small UI pieces                                                     */
/* ------------------------------------------------------------------ */
const mut = { color: 'var(--mut)' } as const;
const check = 'h-[22px] w-[22px] shrink-0 cursor-pointer accent-[var(--pine)]';
const miniBtn =
  'grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-[var(--line)] text-[14px] leading-none text-[var(--mut)] hover:border-[var(--pine)] hover:text-[var(--ink)] disabled:opacity-30 disabled:hover:border-[var(--line)] disabled:hover:text-[var(--mut)] focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-[var(--sig)]';
const focusRing =
  'focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[color-mix(in_srgb,var(--pine)_25%,transparent)]';

const GRID = '#9CA3AF'; // table line colour

/* ------------------------------------------------------------------ */
/* Page                                                                */
/* ------------------------------------------------------------------ */
export function SheetPage() {
  const { id = 'preview' } = useParams();
  const nav = useNavigate();
  const loc = useLocation();
  const isPreview = id === 'preview';
  // Opened from Create: the details typed there, so the sheet is not blank.
  const prefill = (loc.state as { prefill?: Seed } | null)?.prefill ?? null;

  // Check if this is view-only mode (attendee viewing) vs edit mode (creator editing)
  const isViewOnly = window.location.pathname.includes('/s/') && window.location.pathname.includes('/sheet');

  // ?print=1 -> opened from Manage: no editor, auto-opens the print dialog once the data is in.
  const qs = new URLSearchParams(window.location.search);
  const printMode = id !== 'preview' && qs.get('print') === '1';
  // ?view=1 -> same read-only sheet, but no auto print and no editor.
  const viewMode = id !== 'preview' && qs.get('view') === '1';
  // ?pdf=1 -> for PDF generation, render all pages without page navigation
  const pdfMode = id !== 'preview' && qs.get('pdf') === '1';
  const readOnly = printMode || viewMode || pdfMode;

  // No API calls for the "preview" id.
  const session = useAsync(() => (isPreview ? Promise.resolve(null) : sessionsApi.getMine(id)), [id]);
  const recs = useAsync(() => (isPreview ? Promise.resolve(null) : sessionsApi.records(id)), [id]);

  const [cfg, setCfg] = useState<Cfg | null>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const inited = useRef(false);
  useEffect(() => {
    if (inited.current) return;
    if (isPreview) {
      const saved = norm(loadRaw(id));
      setCfg(prefill ? (saved ? fillBlank(saved, prefill) : newCfg(prefill)) : saved ?? newCfg(null));
      inited.current = true;
    } else if (session.data) {
      // saved on the server (Session.sheet) -> saved in this browser -> defaults
      const fromServer = norm((session.data as unknown as { sheet?: unknown }).sheet);
      setCfg(fromServer ?? norm(loadRaw(id)) ?? newCfg(session.data));
      inited.current = true;
    }
  }, [id, isPreview, session.data]);

  const up = (patch: Partial<Cfg>) => setCfg((c) => (c ? { ...c, ...patch } : c));

  // Remember how the design looked when it opened, so Back can warn before throwing edits away.
  const opened = useRef<string | null>(null);
  useEffect(() => {
    if (cfg && opened.current === null) opened.current = JSON.stringify(cfg);
  }, [cfg]);

  /** Back to where we came from; if this page was opened directly, go to the session instead. */
  const goBack = () => {
    const idx = (window.history.state as { idx?: number } | null)?.idx ?? 0;
    if (idx > 0) nav(-1);
    else nav(isPreview ? '/create' : isViewOnly ? `/s/${id}` : `/manage/${id}`);
  };

  // Printing uses its own full-size copy of the sheet (printPortal below), so the on-screen
  // preview scale and the app layout can never end up on paper. Bump printTick to print.
  const [printTick, setPrintTick] = useState(0);
  const autoPrinted = useRef(false);
  useEffect(() => {
    if (!printMode || autoPrinted.current || !cfg || !recs.data) return;
    autoPrinted.current = true;
    setPrintTick((n) => n + 1);
  }, [printMode, cfg, recs.data]);
  useEffect(() => {
    if (printTick === 0) return;
    let cancelled = false;
    void (async () => {
      try {
        await document.fonts?.ready;
      } catch {
        /* ignore */
      }
      // two frames so the print copy is laid out before the dialog opens
      await new Promise<void>((r) => requestAnimationFrame(() => requestAnimationFrame(() => r())));
      if (!cancelled) window.print();
    })();
    return () => {
      cancelled = true;
    };
  }, [printTick]);

  const [newCol, setNewCol] = useState('');
  const [saving, setSaving] = useState(false);
  const editing = !isViewOnly && !readOnly;
  const dirty = editing && !!cfg && opened.current !== null && JSON.stringify(cfg) !== opened.current;
  const leave = () => {
    if (dirty && !window.confirm('Leave without saving? Your changes to the sheet will be lost.')) return;
    goBack();
  };

  /* paper */
  const size = SIZES[cfg?.paper ?? 'a4'];
  const land = !!cfg?.land;
  const W = land ? size.h : size.w;
  const H = land ? size.w : size.h;
  const pageW = land ? size.ch : size.cw;
  const pageH = land ? size.cw : size.ch;

  /* scale the sheet to whatever width the preview box has (phone to desktop) */
  const pvRef = useRef<HTMLDivElement>(null);
  const shRef = useRef<HTMLDivElement>(null);
  const [k, setK] = useState(0.5);
  const [ph, setPh] = useState(560);
  useLayoutEffect(() => {
    const fit = () => {
      const w = pvRef.current?.clientWidth ?? W;
      if (!w) return;
      const s = w / W;
      setK(s);
      setPh((shRef.current?.offsetHeight ?? H) * s);
    };
    fit();
    const ro = new ResizeObserver(fit);
    if (pvRef.current) ro.observe(pvRef.current);
    if (shRef.current) ro.observe(shRef.current);
    window.addEventListener('resize', fit);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', fit);
    };
  }, [cfg, W, H]);

  const save = async () => {
    if (!cfg) return;
    setSaving(true);
    try {
      localStorage.setItem(storeKey(id), JSON.stringify(cfg));
    } catch {
      /* ignore */
    }
    if (!isPreview) {
      try {
        // Session.sheet (Mixed) already exists in the model; the update route must allow "sheet".
        await sessionsApi.update(id, { sheet: cfg } as Record<string, unknown>);
      } catch {
        /* still saved in this browser */
      }
    }
    setSaving(false);
    goBack();
  };

  /* print: a separate, unscaled copy of the sheet is mounted on <body>; everything else is hidden on paper */
  const printCss = `
@page{size:${pageW} ${pageH};margin:0}
#sheet-print-root{display:none}
@media print{
  html,body{margin:0!important;padding:0!important;background:#fff!important}
  body>*:not(#sheet-print-root){display:none!important}
  #sheet-print-root{display:block!important}
  #sheet-print-root .sheet{-webkit-print-color-adjust:exact;print-color-adjust:exact;break-inside:avoid}
}`;

  const wrap = (children: ReactNode) => (
    <div className="mx-auto w-full max-w-[1052px] px-[max(1rem,env(safe-area-inset-left))] pb-24 pt-5 min-[1536px]:max-w-[1240px]">
      <style>{printCss}</style>
      {children}
    </div>
  );

  if (!cfg) {
    return wrap(
      <>
        <ErrorBox error={session.error} />
        <div className="space-y-4">
          {/* Header skeleton */}
          <div className="space-y-2">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-full max-w-sm" />
          </div>

          {/* Sheet preview skeleton */}
          <div className="mt-6 space-y-3 rounded-xl border border-[var(--line)] bg-[var(--card)] p-4 sm:p-6">
            <Skeleton className="h-6 w-64 max-w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />

            <div className="pt-4">
              <Skeleton className="h-32 w-full" />
            </div>

            <div className="grid grid-cols-1 gap-4 pt-4 min-[480px]:grid-cols-3">
              <Skeleton className="h-24" />
              <Skeleton className="h-24" />
              <Skeleton className="h-24" />
            </div>
          </div>
        </div>
      </>,
    );
  }

  /* ---------- column helpers ---------- */
  const setCol = (i: number, patch: Partial<Col>) =>
    up({ cols: cfg.cols.map((c, j) => (j === i ? { ...c, ...patch } : c)) });
  const moveCol = (i: number, d: -1 | 1) => {
    const a = [...cfg.cols];
    const j = i + d;
    if (j < 0 || j >= a.length) return;
    const t = a[i]!;
    a[i] = a[j]!;
    a[j] = t;
    up({ cols: a });
  };
  const addCol = () => {
    const name = newCol.trim().slice(0, 30);
    if (!name || cfg.cols.length >= MAX_COLS) return;
    up({ cols: [...cfg.cols, { id: uid(), k: 'custom', l: name, on: 1, inputType: 'text' }] });
    setNewCol('');
  };

  /* ---------- sheet data ---------- */
  const s = session.data ?? null;
  const locked = !!(s && s.sheetLocked);
  const p = PAL[cfg.pal] ?? PAL[0];
  const ac = p.a;
  const ti = p.b;
  const records = recs.data?.records ?? [];
  const shown = cfg.cols.filter((c) => c.on);
  const rowsPerPage = cfg.rows;
  const totalPages = Math.max(1, Math.ceil(records.length / rowsPerPage));
  // Row height so one page of rows fits the paper: page padding + header + details block + table head
  // + footer, and 1px of border per row. (The old numbers left 1px per row and the footer line unaccounted for.)
  const padY = H < 900 ? 30 : 60;
  const fixedH = padY * 2 + 83 + (cfg.det && cfg.f.some((x) => x[1]) ? 142 : 0) + 20 + 37 + 76;
  const rh = Math.max(18, Math.min(40, Math.floor((H - fixedH - 24) / rowsPerPage) - 1));
  const link = s?.shareLink || 'https://geoattend.app';
  const meta = `Location verified, ${s?.radius ?? 100} m radius · ${(s?.location.lat ?? 14.5995).toFixed(4)}, ${(
    s?.location.lng ?? 120.9842
  ).toFixed(4)}`;
  const lb = {
    fontSize: 10,
    letterSpacing: '.14em',
    textTransform: 'uppercase' as const,
    color: '#6B7280',
    fontWeight: 700,
  };

  const cellValue = (c: Col, r: number) => {
    const rec = records[r];
    switch (c.k) {
      case 'no':
        return `${r < 9 ? '0' : ''}${r + 1}`;
      case 'name':
        return rec?.name ?? '';
      case 'email':
        return rec?.email ?? '';
      case 'time':
        return rec ? timeOf(new Date(rec.at)) : '';
      default:
        return ''; // company, signature and custom columns are left blank to write in
    }
  };

  /* ---------- render a single page ---------- */
  const renderPage = (pageNum: number, mode: 'screen' | 'print' | 'pdf' = 'screen') => {
    const startIdx = pageNum * rowsPerPage;
    const pageRecords = records.slice(startIdx, startIdx + rowsPerPage);
    const rowsToShow = Math.max(rowsPerPage, pageRecords.length);

    return (
      <div
        key={pageNum}
        className="sheet"
        style={{
          position: 'relative',
          width: mode === 'print' ? pageW : W,
          minHeight: mode === 'print' ? undefined : H,
          boxSizing: 'border-box',
          padding: `${padY}px 54px`,
          background: '#fff',
          color: '#111',
          fontFamily: 'Manrope, system-ui, sans-serif',
          pageBreakAfter: pageNum < totalPages - 1 ? 'always' : 'auto',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-end',
            paddingBottom: 16,
            borderBottom: `3px solid ${ac}`,
          }}
        >
          <div>
            <div style={lb}>Attendance register {totalPages > 1 ? `(Page ${pageNum + 1} of ${totalPages})` : ''}</div>
            <div
              style={{
                fontFamily: 'Fraunces, Georgia, serif',
                fontSize: cfg.title.length > 28 ? 32 : 40,
                fontWeight: 600,
                color: '#111',
                lineHeight: 1.1,
                marginTop: 6,
              }}
            >
              {cfg.title}
            </div>
          </div>
          {cfg.qr === 1 && (
            <div className="w-16 ml-3.5 shrink-0">
              <QRCodeSVG value={link} size={64} style={{ display: 'block', width: '100%', height: 'auto' }} />
              <div style={{ fontSize: 8, textAlign: 'center', color: '#6B7280', marginTop: 2 }}>Scan to check in</div>
            </div>
          )}
        </div>

        {pageNum === 0 && cfg.det === 1 && cfg.f.some((x) => x[1]) && (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3,1fr)',
              gap: '14px 20px',
              background: ti,
              marginTop: 20,
              padding: '16px 20px',
              borderRadius: 4,
              borderLeft: `4px solid ${ac}`,
            }}
          >
            {cfg.f
              .filter((x) => x[1])
              .map((x) => (
                <div key={x[0]}>
                  <div style={lb}>{x[0]}</div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: '#111', marginTop: 3 }}>{x[1]}</div>
                </div>
              ))}
          </div>
        )}

        <table
          style={{
            width: '100%',
            borderCollapse: 'collapse',
            marginTop: 20,
            border: `1.5px solid ${ac}`,
          }}
        >
          <thead>
            <tr>
              {shown.map((c) => (
                <th
                  key={c.id}
                  style={{
                    textAlign: 'left',
                    padding: '10px 8px',
                    fontSize: 10.5,
                    letterSpacing: '.12em',
                    textTransform: 'uppercase',
                    color: ac,
                    background: ti,
                    border: `1px solid ${GRID}`,
                    borderBottom: `2px solid ${ac}`,
                    width: COL_W[c.k],
                  }}
                >
                  {c.l}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: rowsToShow }, (_, i) => {
              const r = startIdx + i;
              const rec = records[r];
              return (
                <tr key={i} style={{ background: i % 2 ? '#F8F9FB' : '#fff' }}>
                  {shown.map((c) => {
                    const isSignature = c.k === 'sign';
                    const signatureData = rec?.signature;

                    return (
                      <td
                        key={c.id}
                        style={{
                          border: `1px solid ${GRID}`,
                          height: rh,
                          padding: isSignature && signatureData ? '4px' : '0 8px',
                          fontSize: 14,
                          color: c.k === 'no' ? '#9CA3AF' : '#111',
                          fontVariantNumeric: 'tabular-nums',
                          verticalAlign: 'middle',
                        }}
                      >
                        {isSignature && signatureData ? (
                          <img
                            src={signatureData}
                            alt="Signature"
                            style={{
                              maxWidth: '100%',
                              maxHeight: rh - 8,
                              objectFit: 'contain',
                              display: 'block',
                            }}
                          />
                        ) : (
                          cellValue(c, r)
                        )}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  };

  /* ---------- the printed sheet (all pages for print/pdf, one page for preview) ---------- */
  const sheet = (
    <div
      ref={shRef}
      style={{
        position: 'absolute',
        left: 0,
        top: 0,
        transform: `scale(${k})`,
        transformOrigin: 'top left',
      }}
    >
      {renderPage(currentPage)}
    </div>
  );

  const toMm = (v: string) => (v.endsWith('in') ? parseFloat(v) * 25.4 : parseFloat(v));
  /** All pages at real size, only mounted for printing. */
  const printPortal =
    printTick > 0
      ? createPortal(
        <div id="sheet-print-root">{Array.from({ length: totalPages }, (_, n) => renderPage(n, 'print'))}</div>,
        document.body,
      )
      : null;
  /** All pages at real size, for the PDF download (ManagePage captures each .sheet inside #pdf-root). */
  const pdfPortal = pdfMode
    ? createPortal(
      <div
        id="pdf-root"
        data-mm-w={toMm(pageW)}
        data-mm-h={toMm(pageH)}
        style={{ position: 'absolute', left: 0, top: 0, width: W, background: '#fff' }}
      >
        {Array.from({ length: totalPages }, (_, n) => renderPage(n, 'pdf'))}
      </div>,
      document.body,
    )
    : null;

  /** Print and Save sit in the page header on wide screens and in a bar fixed to the bottom on phones. */
  const actions = editing ? (
    <>
      <Button type="button" variant="outline" onClick={() => setPrintTick((n) => n + 1)}>
        <i className="ti ti-printer mr-2 text-[18px]" aria-hidden="true" />
        Print
      </Button>
      <Button type="button" disabled={saving || locked} onClick={save}>
        {saving ? 'Saving...' : locked ? 'Sheet locked' : dirty ? 'Save and go back' : 'Done'}
      </Button>
    </>
  ) : null;

  /* ---------- page ---------- */
  return wrap(
    <>
      {printPortal}
      {pdfPortal}
      <div className="noprint">
        <button
          type="button"
          onClick={leave}
          className={`inline-flex items-center gap-1.5 text-[13px] font-semibold text-[var(--mut)] hover:text-[var(--ink)] ${focusRing}`}
        >
          <i className="ti ti-arrow-left text-[14px]" aria-hidden="true" />
          Back
        </button>
        <div className="mt-2 flex flex-wrap items-end justify-between gap-x-4 gap-y-2">
          <div className="min-w-0">
            <h1 className="text-[24px] font-bold leading-tight tracking-tight min-[400px]:text-[28px]">Attendance sheet</h1>
            <p className="pb-4 text-[13px]" style={mut}>
              {isViewOnly
                ? 'View the attendance sheet for this session.'
                : printMode
                  ? 'Print this sheet, or choose Save as PDF in the print dialog.'
                  : viewMode
                    ? 'Preview of the attendance sheet. Use Print to print or save it as a PDF.'
                    : 'Design the sheet. The preview shows exactly what will print.'}
            </p>
          </div>
          {editing && <div className="hidden shrink-0 gap-2 pb-4 min-[900px]:flex">{actions}</div>}
        </div>
      </div>

      <ErrorBox error={session.error} />

      <div className={`mt-[18px] grid grid-cols-1 gap-x-[21px] gap-y-[18px] ${readOnly || isViewOnly ? 'mx-auto max-w-[820px]' : 'min-[900px]:grid-cols-[minmax(0,1.14fr)_minmax(0,1fr)]'}`}>
        {/* Preview */}
        <div className="min-w-0 min-[900px]:self-start min-[900px]:[@media(min-height:760px)]:sticky min-[900px]:[@media(min-height:760px)]:top-5">
          <div
            ref={pvRef}
            className="sheet-pv relative w-full overflow-hidden rounded-2xl border border-[var(--line)] bg-white shadow-md"
            style={{ height: ph }}
          >
            {sheet}
          </div>

          {/* Page navigation - only show if multiple pages */}
          {totalPages > 1 && (
            <div className="noprint mt-3 flex items-center justify-between gap-2 rounded-xl border border-[var(--line)] bg-[var(--card)] px-2 py-2.5 sm:px-4">
              <button
                type="button"
                onClick={() => setCurrentPage(Math.max(0, currentPage - 1))}
                disabled={currentPage === 0}
                className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-semibold transition-colors ${currentPage === 0
                  ? 'cursor-not-allowed text-[var(--mut)] opacity-50'
                  : 'text-[var(--pine)] hover:bg-[var(--tint)]'
                  } ${focusRing}`}
              >
                <i className="ti ti-chevron-left text-[16px]" aria-hidden="true" />
                <span className="hidden min-[400px]:inline">Previous</span>
                <span className="sr-only min-[400px]:hidden">Previous page</span>
              </button>

              <div className="flex items-center gap-2">
                <span className="text-sm text-[var(--mut)]">
                  Page {currentPage + 1} of {totalPages}
                </span>
                <div className="hidden gap-1 sm:flex">
                  {totalPages <= 10 && Array.from({ length: totalPages }, (_, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setCurrentPage(i)}
                      aria-label={`Go to page ${i + 1}`}
                      className={`h-2 w-2 rounded-full transition-all ${i === currentPage ? 'w-6 bg-[var(--sig)]' : 'bg-[var(--line)] hover:bg-[var(--mut)]'
                        } ${focusRing}`}
                    />
                  ))}
                </div>
              </div>

              <button
                type="button"
                onClick={() => setCurrentPage(Math.min(totalPages - 1, currentPage + 1))}
                disabled={currentPage === totalPages - 1}
                className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-semibold transition-colors ${currentPage === totalPages - 1
                  ? 'cursor-not-allowed text-[var(--mut)] opacity-50'
                  : 'text-[var(--pine)] hover:bg-[var(--tint)]'
                  } ${focusRing}`}
              >
                <span className="hidden min-[400px]:inline">Next</span>
                <span className="sr-only min-[400px]:hidden">Next page</span>
                <i className="ti ti-chevron-right text-[16px]" aria-hidden="true" />
              </button>
            </div>
          )}

          {readOnly && !isViewOnly && (
            <Button type="button" className="noprint mt-3 w-full" onClick={() => setPrintTick((n) => n + 1)}>
              <i className="ti ti-printer mr-2 text-[18px]" aria-hidden="true" />
              Print sheet
            </Button>
          )}
        </div>

        {/* Controls - only show if not view-only mode */}
        {!isViewOnly && !readOnly && (
          <div className="noprint min-w-0 space-y-5">
            {/* Page setup */}
            <Card>
              <CardHeader>
                <CardTitle>Page setup</CardTitle>
                <CardDescription>Heading, paper and colour.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="sheet-title">Sheet heading</Label>
                  <Input id="sheet-title" value={cfg.title} maxLength={60} onChange={(e) => up({ title: e.target.value })} />
                  <p className="text-[13px]" style={mut}>
                    Printed at the top of the page. It is separate from the session name.
                  </p>
                </div>

                <div className="grid gap-5 min-[560px]:grid-cols-[1.5fr_1fr] min-[900px]:grid-cols-1 min-[1100px]:grid-cols-[1.5fr_1fr]">
                  <div className="min-w-0 space-y-2">
                    <Label>Paper size</Label>
                    <Select value={cfg.paper} onValueChange={(v) => up({ paper: v as PaperKey })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select paper" />
                      </SelectTrigger>
                      <SelectContent>
                        {PAPER_ORDER.map((key) => (
                          <SelectItem key={key} value={key}>
                            {SIZES[key].label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="min-w-0 space-y-2">
                    <Label>Rows per page</Label>
                    <Select value={String(cfg.rows)} onValueChange={(v) => up({ rows: Number(v) })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {ROW_OPTIONS.map((n) => (
                          <SelectItem key={n} value={String(n)}>
                            {n}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Orientation</Label>
                  <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-label="Orientation">
                    <Button
                      type="button"
                      size="sm"
                      role="radio"
                      aria-checked={!cfg.land}
                      variant={!cfg.land ? 'default' : 'outline'}
                      onClick={() => up({ land: 0 })}
                    >
                      <i className="ti ti-rectangle-vertical mr-1.5 text-[16px]" aria-hidden="true" />
                      Portrait
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      role="radio"
                      aria-checked={!!cfg.land}
                      variant={cfg.land ? 'default' : 'outline'}
                      onClick={() => up({ land: 1 })}
                    >
                      <i className="ti ti-rectangle mr-1.5 text-[16px]" aria-hidden="true" />
                      Landscape
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Colour theme</Label>
                  <div className="flex flex-wrap gap-2">
                    {PAL.map((x, i) => (
                      <button
                        key={x.name}
                        type="button"
                        aria-label={`${x.name} theme`}
                        aria-pressed={cfg.pal === i}
                        title={x.name}
                        onClick={() => up({ pal: i })}
                        className={`h-[38px] w-[38px] shrink-0 cursor-pointer rounded-full border-[3px] border-[var(--card)] p-0 ${focusRing}`}
                        style={{
                          background: `linear-gradient(135deg, ${x.a} 50%, ${x.b} 50%)`,
                          outline: cfg.pal === i ? '3px solid var(--pine)' : '1px solid var(--line)',
                        }}
                      />
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Columns */}
            <Card>
              <CardHeader>
                <CardTitle>Columns</CardTitle>
                <CardDescription>
                  Tick to show, type to rename, use the arrows to reorder.
                  {locked && ' (Sheet locked after first check-in)'}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2.5">
                {cfg.cols.map((c, i) => (
                  <div key={c.id}>
                    <div className="flex flex-wrap items-center gap-2">
                      <input
                        type="checkbox"
                        className={check}
                        aria-label={`Show column ${c.l}`}
                        checked={!!c.on}
                        disabled={c.k === 'name' || locked}
                        onChange={(e) => setCol(i, { on: e.target.checked ? 1 : 0 })}
                      />
                      <Input
                        type="text"
                        aria-label="Column label"
                        className="min-w-0 flex-1 basis-[130px]"
                        value={c.l}
                        maxLength={30}
                        disabled={locked}
                        onChange={(e) => setCol(i, { l: e.target.value })}
                      />
                      <div className="ml-auto flex shrink-0 items-center gap-2">
                      <button
                        type="button"
                        className={miniBtn}
                        aria-label={`Move ${c.l} up`}
                        disabled={i === 0 || locked}
                        onClick={() => moveCol(i, -1)}
                      >
                        <i className="ti ti-arrow-up" aria-hidden="true" />
                      </button>
                      <button
                        type="button"
                        className={miniBtn}
                        aria-label={`Move ${c.l} down`}
                        disabled={i === cfg.cols.length - 1 || locked}
                        onClick={() => moveCol(i, 1)}
                      >
                        <i className="ti ti-arrow-down" aria-hidden="true" />
                      </button>
                      {c.k === 'custom' ? (
                        <button
                          type="button"
                          className={`${miniBtn} !text-[var(--err)]`}
                          aria-label={`Remove ${c.l}`}
                          disabled={locked}
                          onClick={() => up({ cols: cfg.cols.filter((_, j) => j !== i) })}
                        >
                          <i className="ti ti-x" aria-hidden="true" />
                        </button>
                      ) : (
                        <span className="h-9 w-9 shrink-0" aria-hidden="true" />
                      )}
                      </div>
                    </div>
                    {c.k === 'custom' && (
                      <div className="ml-[30px] mt-1.5 flex flex-wrap items-center gap-2 text-[13px]" style={mut}>
                        <span className="text-[11px] font-semibold">Input type</span>
                        <Select
                          value={c.inputType || 'text'}
                          disabled={locked}
                          onValueChange={(v) => setCol(i, { inputType: v as InputType })}
                        >
                          <SelectTrigger className="w-[190px] max-w-full">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="text">Text</SelectItem>
                            <SelectItem value="number">Number</SelectItem>
                            <SelectItem value="signature">Signature/Handwritten</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                  </div>
                ))}

                {/* Add your own column */}
                {!locked && (
                  <div className="space-y-2 pt-3">
                    <Label htmlFor="new-col">Add a column</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        id="new-col"
                        type="text"
                        placeholder="e.g. Contact no., Age, Section"
                        className="min-w-0 flex-1"
                        maxLength={30}
                        value={newCol}
                        onChange={(e) => setNewCol(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            addCol();
                          }
                        }}
                      />
                      <Button type="button" variant="outline" size="sm" className="shrink-0" onClick={addCol} disabled={!newCol.trim() || cfg.cols.length >= MAX_COLS}>
                        <i className="ti ti-plus mr-1 text-[16px]" aria-hidden="true" />
                        Add
                      </Button>
                    </div>
                    {cfg.cols.length >= MAX_COLS && (
                      <p className="text-[13px]" style={mut}>
                        Up to {MAX_COLS} columns.
                      </p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Details block */}
            <Card>
              <CardHeader className="flex-row items-center justify-between space-y-0">
                <CardTitle>Details block</CardTitle>
                <input
                  type="checkbox"
                  className={check}
                  aria-label="Show details block"
                  checked={!!cfg.det}
                  onChange={(e) => up({ det: e.target.checked ? 1 : 0 })}
                />
              </CardHeader>
              <CardContent className="space-y-4">
                {cfg.f.map((x, i) => (
                  <div key={x[0]} className="space-y-2">
                    <Label htmlFor={`det-${i}`}>{x[0]}</Label>
                    <Input
                      id={`det-${i}`}
                      type="text"
                      value={x[1]}
                      disabled={!cfg.det}
                      onChange={(e) =>
                        up({ f: cfg.f.map((y, j) => (j === i ? [y[0], e.target.value] : y)) as [string, string][] })
                      }
                    />
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
      {editing && (
        <div className="noprint fixed inset-x-0 bottom-0 z-30 grid grid-cols-2 gap-2 border-t border-[var(--line)] bg-[var(--card)] px-4 pb-[calc(10px+env(safe-area-inset-bottom,0px))] pt-2.5 min-[900px]:hidden">
          {actions}
        </div>
      )}
    </>,
  );
}