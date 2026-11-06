/* The shell itself: virtual filesystem, parser, commands. No DOM in here.

   Output is a list of lines. A line is a string, or an array of parts { t, c, href },
   where c is a CSS colour class. A line array with `.pre = true` keeps its layout and
   scrolls sideways on narrow screens instead of wrapping. */

const USER = 'emr-dk';
const HOST = 'portfolio';
const HOME = `/home/${USER}`;

const SPECIES = [
  { name: 'Adelie', glyph: 'o', color: 'c-blue' },
  { name: 'Chinstrap', glyph: 'x', color: 'c-teal' },
  { name: 'Gentoo', glyph: '+', color: 'c-salmon' },
];

const NUMERIC_COLUMNS = ['bill_length_mm', 'bill_depth_mm', 'flipper_length_mm', 'body_mass_g'];
const PENGUIN_COLUMNS = ['species', 'island', ...NUMERIC_COLUMNS, 'sex'];

const SITES = [
  'site_colorful', 'site_funky', 'site_terminal', 'site_programming', 'site_huge',
  'site_old_school', 'site_minimalist', 'site_design', 'site_ragchat',
];

const ABOUT = `Emil Møller Rasmussen
Data engineer and GIS specialist.

I make sense of geospatial data, and like solving problems that
bring real value.

I am also the CTO of a small startup where we're trying to make a
product and a difference.

I have worked for agencies, cities, and municipalities: built
pipelines, shipped infrastructure, and made geospatial data useful
to those who need it.

When away from the keyboard: clarinet, hiking, opera, books.`;

const CONTACT = `email     emilmr@pm.me
github    https://github.com/emr-dk
linkedin  https://linkedin.com/in/emr-dk`;

const SKILLS = `{
  "languages": ["Python", "JavaScript", "Go", "C#"],
  "databases": ["PostgreSQL", "GIS", "vector stores"],
  "tools": ["Docker", "Linux", "Git", "Jupyter"],
  "focus": "geographic data & data engineering"
}`;

const ANALYSIS_SCRIPT = `#!/usr/bin/env python3
"""Plot two penguin measurements, right here in the terminal."""
import argparse

import pandas as pd

from terminal_plots import correlation, scatter

parser = argparse.ArgumentParser()
parser.add_argument("--x", default="bill_length_mm")
parser.add_argument("--y", default="bill_depth_mm")
args = parser.parse_args()

penguins = pd.read_csv("data/penguins.csv").dropna(subset=[args.x, args.y])

scatter(penguins, args.x, args.y, by="species")
correlation(penguins, args.x, args.y, by="species")`;

const PLAN = `Plan:

  [x] learn to type
  [x] put a terminal on the internet
  [ ] leave vim

You found the hidden file. There's no prize, but well done.`;

const PENGUIN_ART = [
  '     .--.    ',
  '    |o_o |   ',
  '    |:_/ |   ',
  '   //   \\ \\  ',
  '  (|     | ) ',
  ' /\'\\_   _/`\\ ',
  ' \\___)=(___/ ',
];

const span = (t, c) => ({ t, c });
const err = (text) => [span(text, 'c-err')];
const dim = (text) => [span(text, 'c-dim')];

function lineText(line) {
  return typeof line === 'string' ? line : line.map((part) => part.t).join('');
}

function preLine(parts) {
  const line = Array.isArray(parts) ? parts : [span(parts)];
  line.pre = true;
  return line;
}

function correlation(pairs) {
  const n = pairs.length;
  if (n < 2) return null;
  const meanX = pairs.reduce((sum, p) => sum + p[0], 0) / n;
  const meanY = pairs.reduce((sum, p) => sum + p[1], 0) / n;
  let xy = 0;
  let xx = 0;
  let yy = 0;
  for (const [x, y] of pairs) {
    xy += (x - meanX) * (y - meanY);
    xx += (x - meanX) ** 2;
    yy += (y - meanY) ** 2;
  }
  return xx && yy ? xy / Math.sqrt(xx * yy) : null;
}

function signed(value) {
  if (value === null) return 'n/a';
  return `${value >= 0 ? '+' : ''}${value.toFixed(2)}`;
}

/* Rounds an axis label to the fewest decimals that keep the range readable. */
function axisLabel(value, range) {
  return range >= 100 ? String(Math.round(value)) : value.toFixed(1);
}

function scatterPlot(rows, xColumn, yColumn, width) {
  const points = rows.filter((row) => row[xColumn] !== null && row[yColumn] !== null);
  const xs = points.map((row) => row[xColumn]);
  const ys = points.map((row) => row[yColumn]);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);

  const labels = [maxY, (maxY + minY) / 2, minY].map((v) => axisLabel(v, maxY - minY));
  const gutter = Math.max(...labels.map((label) => label.length));
  const plotWidth = Math.max(20, Math.min(width, 76) - gutter - 2);
  const plotHeight = width < 56 ? 12 : 16;

  const grid = Array.from({ length: plotHeight }, () => Array(plotWidth).fill(null));
  for (const row of points) {
    const col = Math.round(((row[xColumn] - minX) / (maxX - minX || 1)) * (plotWidth - 1));
    const rowIndex = Math.round(((maxY - row[yColumn]) / (maxY - minY || 1)) * (plotHeight - 1));
    grid[rowIndex][col] = SPECIES.find((s) => s.name === row.species);
  }

  const lines = [preLine(dim(`  ${yColumn}`))];
  grid.forEach((cells, index) => {
    let label = '';
    if (index === 0) label = labels[0];
    else if (index === Math.floor((plotHeight - 1) / 2)) label = labels[1];
    else if (index === plotHeight - 1) label = labels[2];

    const parts = [span(`${label.padStart(gutter)} |`, 'c-dim')];
    for (const cell of cells) {
      const last = parts[parts.length - 1];
      const color = cell ? cell.color : undefined;
      if (last.c === color) last.t += cell ? cell.glyph : ' ';
      else parts.push(span(cell ? cell.glyph : ' ', color));
    }
    lines.push(preLine(parts));
  });

  const indent = ' '.repeat(gutter + 1);
  const left = axisLabel(minX, maxX - minX);
  const right = axisLabel(maxX, maxX - minX);
  lines.push(preLine(dim(`${indent}+${'-'.repeat(plotWidth)}`)));
  lines.push(preLine(dim(`${indent} ${left}${right.padStart(plotWidth - left.length)}`)));
  lines.push(preLine(dim(`${indent} ${xColumn.padStart((plotWidth + xColumn.length) / 2)}`)));
  lines.push('');

  const legend = [];
  SPECIES.forEach((species, index) => {
    if (index) legend.push(span('   '));
    legend.push(span(`${species.glyph} ${species.name}`, species.color));
  });
  lines.push(legend);
  lines.push('');

  const pairs = (list) => list.map((row) => [row[xColumn], row[yColumn]]);
  lines.push(`correlation, all ${points.length} penguins: ${signed(correlation(pairs(points)))}`);
  for (const species of SPECIES) {
    const r = correlation(pairs(points.filter((row) => row.species === species.name)));
    lines.push([span(`  ${species.name.padEnd(10)}`, species.color), span(signed(r))]);
  }
  return lines;
}

function decimalsIn(value) {
  if (typeof value !== 'number' || Number.isInteger(value)) return 0;
  return Math.min(2, String(value).split('.')[1]?.length ?? 2);
}

function sqlTable({ columns, rows }) {
  /* Every number in a column gets the same decimals, so the points line up. */
  const decimals = columns.map((_, i) => Math.max(0, ...rows.map((row) => decimalsIn(row[i]))));
  const cells = rows.map((row) => row.map((value, i) => {
    if (value === null) return '';
    return typeof value === 'number' ? value.toFixed(decimals[i]) : String(value);
  }));
  const widths = columns.map((name, i) => (
    Math.max(name.length, ...cells.map((row) => row[i].length))
  ));
  const numeric = columns.map((_, i) => rows.length > 0 && rows.every((row) => (
    row[i] === null || typeof row[i] === 'number'
  )));

  const lines = [];
  lines.push(preLine([span(
    ` ${columns.map((name, i) => name.padEnd(widths[i])).join(' | ')}`, 'c-lime',
  )]));
  lines.push(preLine(dim(`-${widths.map((w) => '-'.repeat(w)).join('-+-')}-`)));
  for (const row of cells) {
    lines.push(preLine(` ${row.map((cell, i) => (
      numeric[i] ? cell.padStart(widths[i]) : cell.padEnd(widths[i])
    )).join(' | ')}`));
  }
  lines.push(`(${rows.length} ${rows.length === 1 ? 'row' : 'rows'})`);
  return lines;
}

function toCsv(rows) {
  const header = PENGUIN_COLUMNS.join(',');
  const body = rows.map((row) => (
    PENGUIN_COLUMNS.map((column) => (row[column] === null ? '' : row[column])).join(',')
  ));
  return [header, ...body].join('\n');
}

function normalisePenguins(raw) {
  return raw.map((row) => ({
    species: row.species,
    island: row.island,
    bill_length_mm: row.x,
    bill_depth_mm: row.y,
    flipper_length_mm: row.flipper_length_mm,
    body_mass_g: row.body_mass_g,
    sex: row.sex ? row.sex.toLowerCase() : null,
  }));
}

function globToRegExp(glob) {
  const body = glob.replace(/[.+^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*').replace(/\?/g, '.');
  return new RegExp(`^${body}$`);
}

function createShell({ penguins: rawPenguins, cols = () => 80, now = () => new Date() }) {
  const penguins = normalisePenguins(rawPenguins);
  const startedAt = now();
  const history = [];
  let cwd = HOME.split('/').filter(Boolean);
  let status = 0;
  let mode = 'shell';

  const file = (content) => ({ type: 'file', content });
  const dir = (children) => ({ type: 'dir', children });

  const root = dir({
    home: dir({
      [USER]: dir({
        'about.txt': file(ABOUT),
        'contact.txt': file(CONTACT),
        'skills.json': file(SKILLS),
        'do_analysis.py': file(ANALYSIS_SCRIPT),
        '.plan': file(PLAN),
        '.bash_history': file(() => history.join('\n')),
        data: dir({ 'penguins.csv': file(toCsv(penguins)) }),
        sites: dir(Object.fromEntries(SITES.map((name) => [name, { type: 'site', url: `/${name}/` }]))),
      }),
    }),
    etc: dir({
      hostname: file(HOST),
      motd: file('The penguins are real. Palmer Station, Antarctica, 2007-2009.'),
      passwd: file(`root:x:0:0:not you:/root:/bin/false\n${USER}:x:1000:1000:Emil:${HOME}:/bin/sh`),
    }),
  });

  const tables = { penguins: { columns: PENGUIN_COLUMNS, rows: penguins } };

  /* ---- paths ---- */

  function resolvePath(path) {
    const parts = path.startsWith('/') ? [] : [...cwd];
    const expanded = path === '~' || path.startsWith('~/') ? HOME + path.slice(1) : path;
    if (expanded !== path) parts.length = 0;
    for (const part of expanded.split('/')) {
      if (part === '' || part === '.') continue;
      if (part === '..') parts.pop();
      else parts.push(part);
    }
    return parts;
  }

  function nodeAt(parts) {
    let node = root;
    for (const part of parts) {
      if (node.type !== 'dir' || !Object.hasOwn(node.children, part)) return null;
      node = node.children[part];
    }
    return node;
  }

  const lookup = (path) => nodeAt(resolvePath(path));

  function displayPath(parts = cwd) {
    const abs = `/${parts.join('/')}`;
    if (abs === HOME) return '~';
    return abs.startsWith(`${HOME}/`) ? `~${abs.slice(HOME.length)}` : abs;
  }

  function contentOf(node) {
    return typeof node.content === 'function' ? node.content() : node.content;
  }

  function linesOf(text) {
    return text === '' ? [] : text.replace(/\n$/, '').split('\n');
  }

  /* ---- command helpers ---- */

  /* Splits short flags from operands; `valueFlags` take the next (or attached) value. */
  function parseFlags(args, valueFlags = '') {
    const flags = {};
    const operands = [];
    for (let i = 0; i < args.length; i++) {
      const arg = args[i];
      if (arg === '--') { operands.push(...args.slice(i + 1)); break; }
      if (!/^-[A-Za-z0-9]/.test(arg)) { operands.push(arg); continue; }
      for (let j = 1; j < arg.length; j++) {
        const flag = arg[j];
        if (valueFlags.includes(flag)) {
          flags[flag] = arg.slice(j + 1) || args[++i];
          break;
        }
        flags[flag] = true;
      }
    }
    return { flags, operands };
  }

  /* Gathers input lines from file operands, or stdin when there are none. */
  function readInputs(name, operands, stdin) {
    const errors = [];
    const lines = [];
    if (operands.length === 0) return { lines: stdin || [], errors };
    for (const path of operands) {
      const node = lookup(path);
      if (!node) errors.push(err(`${name}: ${path}: No such file or directory`));
      else if (node.type === 'dir') errors.push(err(`${name}: ${path}: Is a directory`));
      else if (node.type === 'site') errors.push(err(`${name}: ${path}: is a website, try: open ${path}`));
      else lines.push(...linesOf(contentOf(node)));
    }
    return { lines, errors };
  }

  const ok = (stdout, stderr = []) => ({ stdout, stderr, status: stderr.length ? 1 : 0 });
  const fail = (message) => ({ stdout: [], stderr: [err(message)], status: 1 });

  function listEntry(name, node) {
    if (node.type === 'dir') return [span(`${name}/`, 'c-blue')];
    if (node.type === 'site') return [{ t: name, c: 'c-teal', href: node.url }];
    return [span(name)];
  }

  function longEntry(name, node) {
    const size = node.type === 'file' ? contentOf(node).length : 4096;
    const permissions = { dir: 'drwxr-xr-x', site: 'lrwxrwxrwx', file: '-rw-r--r--' }[node.type];
    return [
      span(`${permissions} ${USER} ${String(size).padStart(6)} `, 'c-dim'),
      ...listEntry(name, node),
    ];
  }

  function open(target) {
    const name = target.replace(/\/$/, '').split('/').pop();
    const node = lookup(target) || lookup(`~/sites/${name}`);
    if (!node || node.type !== 'site') return null;
    if (node.url === '/site_terminal/') return { stdout: ["You're already here."], stderr: [], status: 0 };
    return { stdout: [dim(`opening ${node.url} ...`)], stderr: [], status: 0, navigate: node.url };
  }

  /* ---- commands ---- */

  const commands = {
    help: {
      group: 'start here', usage: 'help', desc: 'this list',
      run() {
        const groups = new Map();
        for (const [name, command] of Object.entries(commands)) {
          if (!command.group) continue;
          if (!groups.has(command.group)) groups.set(command.group, []);
          groups.get(command.group).push([name, command]);
        }
        const lines = [];
        for (const [group, entries] of groups) {
          lines.push([span(group, 'c-lime')]);
          for (const [name, command] of entries) {
            lines.push([span(`  ${name.padEnd(10)}`, 'c-teal'), span(command.desc)]);
          }
          lines.push('');
        }
        lines.push(dim('Pipes, && and > all work: cut -d, -f1 data/penguins.csv | sort | uniq -c'));
        lines.push(dim('Tab completes, the arrow keys walk through history.'));
        return ok(lines);
      },
    },
    man: {
      group: 'start here', usage: 'man COMMAND', desc: 'how to use a command',
      run({ args }) {
        const command = commands[args[0]];
        if (!args[0]) return fail('What manual page do you want?');
        if (!command || !command.usage) return fail(`No manual entry for ${args[0]}`);
        return ok([`${command.usage}`, dim(`  ${command.desc}`)]);
      },
    },
    neofetch: {
      group: 'start here', usage: 'neofetch', desc: 'about this machine',
      run() {
        const seconds = Math.round((now() - startedAt) / 1000);
        const info = [
          [`${USER}@${HOST}`, ''],
          ['-'.repeat(`${USER}@${HOST}`.length), ''],
          ['OS', 'GitHub Pages'],
          ['Uptime', `${seconds} s, since you got here`],
          ['Shell', 'hand-rolled JavaScript'],
          ['Languages', 'Python, JavaScript, Go, C#'],
          ['Database', 'PostgreSQL'],
          ['Sound', 'clarinet'],
        ];
        return ok(PENGUIN_ART.concat(['']).map((art, i) => {
          const [key, value] = info[i] || ['', ''];
          return preLine([
            span(art.padEnd(15), 'c-teal'),
            span(key, 'c-lime'),
            span(value ? `: ${value}` : ''),
          ]);
        }));
      },
    },

    ls: {
      group: 'files', usage: 'ls [-a] [-l] [PATH]', desc: 'list files',
      run({ args, piped }) {
        const { flags, operands } = parseFlags(args);
        const path = operands[0] || '.';
        const node = lookup(path);
        if (!node) return fail(`ls: cannot access '${path}': No such file or directory`);
        const entries = node.type === 'dir'
          ? Object.entries(node.children)
            .filter(([name]) => flags.a || !name.startsWith('.'))
            .sort(([a], [b]) => a.localeCompare(b))
          : [[path, node]];

        if (flags.l) return ok(entries.map(([name, entry]) => preLine(longEntry(name, entry))));
        if (piped) return ok(entries.map(([name]) => name));
        const row = [];
        entries.forEach(([name, entry], index) => {
          if (index) row.push(span('  '));
          row.push(...listEntry(name, entry));
        });
        return ok(row.length ? [row] : []);
      },
    },
    cd: {
      group: 'files', usage: 'cd [PATH]', desc: 'change directory, or walk into a site',
      run({ args }) {
        const target = args[0] || '~';
        const parts = resolvePath(target);
        const node = nodeAt(parts);
        if (!node) return fail(`cd: ${target}: No such file or directory`);
        if (node.type === 'site') return open(target);
        if (node.type !== 'dir') return fail(`cd: ${target}: Not a directory`);
        cwd = parts;
        return ok([]);
      },
    },
    pwd: {
      group: 'files', usage: 'pwd', desc: 'print the current directory',
      run: () => ok([`/${cwd.join('/')}`]),
    },
    cat: {
      group: 'files', usage: 'cat [FILE...]', desc: 'print files',
      run({ args, stdin }) {
        const { lines, errors } = readInputs('cat', args, stdin);
        return ok(lines, errors);
      },
    },
    rm: {
      usage: 'rm FILE', desc: 'delete a file you created',
      run({ args }) {
        const { flags, operands } = parseFlags(args);
        if (operands.length === 0) return fail('rm: missing operand');
        if (flags.r && operands.some((path) => resolvePath(path).length === 0)) {
          return fail("rm: nice try. It's a static site, the real copy lives on GitHub.");
        }
        const stderr = [];
        for (const path of operands) {
          const parts = resolvePath(path);
          const node = nodeAt(parts);
          if (!node) stderr.push(err(`rm: cannot remove '${path}': No such file or directory`));
          else if (!node.created) stderr.push(err(`rm: cannot remove '${path}': Permission denied`));
          else delete nodeAt(parts.slice(0, -1)).children[parts[parts.length - 1]];
        }
        return ok([], stderr);
      },
    },

    grep: {
      group: 'data', usage: 'grep [-i] [-v] [-c] [-n] PATTERN [FILE...]', desc: 'search lines',
      run({ args, stdin, piped }) {
        const { flags, operands } = parseFlags(args);
        const [pattern, ...paths] = operands;
        if (pattern === undefined) return fail('usage: grep [-i] [-v] [-c] [-n] PATTERN [FILE...]');
        let regex;
        try {
          regex = new RegExp(pattern, flags.i ? 'gi' : 'g');
        } catch {
          return fail(`grep: invalid pattern: ${pattern}`);
        }
        const { lines, errors } = readInputs('grep', paths, stdin);
        const matches = [];
        lines.forEach((line, index) => {
          const text = lineText(line);
          regex.lastIndex = 0;
          if (regex.test(text) !== Boolean(flags.v)) matches.push({ text, number: index + 1 });
        });
        if (flags.c) return ok([String(matches.length)], errors);

        const output = matches.map(({ text, number }) => {
          const prefix = flags.n ? `${number}:` : '';
          if (piped || flags.v || pattern === '') return prefix + text;
          const parts = prefix ? [span(prefix, 'c-dim')] : [];
          let last = 0;
          for (const match of text.matchAll(regex)) {
            if (match[0] === '') continue;
            parts.push(span(text.slice(last, match.index)), span(match[0], 'c-salmon'));
            last = match.index + match[0].length;
          }
          parts.push(span(text.slice(last)));
          return parts;
        });
        return { stdout: output, stderr: errors, status: matches.length ? 0 : 1 };
      },
    },
    head: {
      group: 'data', usage: 'head [-n N] [FILE...]', desc: 'first lines',
      run({ args, stdin }) {
        const { flags, operands } = parseFlags(args, 'n');
        const { lines, errors } = readInputs('head', operands, stdin);
        return ok(lines.slice(0, Number(flags.n ?? 10)), errors);
      },
    },
    tail: {
      group: 'data', usage: 'tail [-n N] [FILE...]', desc: 'last lines',
      run({ args, stdin }) {
        const { flags, operands } = parseFlags(args, 'n');
        const { lines, errors } = readInputs('tail', operands, stdin);
        const count = String(flags.n ?? 10);
        if (count.startsWith('+')) return ok(lines.slice(Number(count) - 1), errors);
        return ok(Number(count) ? lines.slice(-Number(count)) : [], errors);
      },
    },
    wc: {
      group: 'data', usage: 'wc [-l] [-w] [-c] [FILE...]', desc: 'count lines, words, bytes',
      run({ args, stdin }) {
        const { flags, operands } = parseFlags(args);
        const { lines, errors } = readInputs('wc', operands, stdin);
        const text = lines.map(lineText);
        const counts = {
          l: text.length,
          w: text.join(' ').split(/\s+/).filter(Boolean).length,
          c: text.reduce((sum, line) => sum + line.length + 1, 0),
        };
        const wanted = ['l', 'w', 'c'].filter((flag) => flags[flag]);
        const shown = (wanted.length ? wanted : ['l', 'w', 'c']).map((flag) => counts[flag]);
        return ok([shown.join(' ')], errors);
      },
    },
    cut: {
      group: 'data', usage: 'cut -d DELIM -f LIST [FILE...]', desc: 'pick columns',
      run({ args, stdin }) {
        const { flags, operands } = parseFlags(args, 'df');
        if (!flags.f) return fail('cut: you must specify a list of fields with -f');
        const delimiter = flags.d ?? '\t';
        const fields = flags.f.split(',').flatMap((part) => {
          const [from, to] = part.split('-').map(Number);
          if (!part.includes('-')) return [from];
          return Array.from({ length: to - from + 1 }, (_, i) => from + i);
        });
        if (fields.some((field) => !(field >= 1))) return fail('cut: fields are numbered from 1');
        const { lines, errors } = readInputs('cut', operands, stdin);
        const output = lines.map((line) => {
          const cells = lineText(line).split(delimiter);
          return fields.filter((field) => field <= cells.length)
            .map((field) => cells[field - 1]).join(delimiter);
        });
        return ok(output, errors);
      },
    },
    sort: {
      group: 'data', usage: 'sort [-n] [-r] [-u] [-t DELIM] [-k N] [FILE...]', desc: 'sort lines',
      run({ args, stdin }) {
        const { flags, operands } = parseFlags(args, 'tk');
        const { lines, errors } = readInputs('sort', operands, stdin);
        const key = (text) => {
          if (!flags.k) return text;
          const cells = flags.t ? text.split(flags.t) : text.trim().split(/\s+/);
          return cells[Number(flags.k) - 1] ?? '';
        };
        const compare = (a, b) => {
          if (flags.n) return (parseFloat(key(a)) || 0) - (parseFloat(key(b)) || 0);
          return key(a) < key(b) ? -1 : key(a) > key(b) ? 1 : 0;
        };
        let sorted = lines.map(lineText).sort(compare);
        if (flags.r) sorted.reverse();
        if (flags.u) sorted = [...new Set(sorted)];
        return ok(sorted, errors);
      },
    },
    uniq: {
      group: 'data', usage: 'uniq [-c] [FILE...]', desc: 'collapse repeated lines',
      run({ args, stdin }) {
        const { flags, operands } = parseFlags(args);
        const { lines, errors } = readInputs('uniq', operands, stdin);
        const runs = [];
        for (const text of lines.map(lineText)) {
          const last = runs[runs.length - 1];
          if (last && last.text === text) last.count++;
          else runs.push({ text, count: 1 });
        }
        return ok(runs.map(({ text, count }) => (
          flags.c ? `${String(count).padStart(7)} ${text}` : text
        )), errors);
      },
    },
    python3: {
      group: 'data', usage: 'python3 do_analysis.py [--x COLUMN] [--y COLUMN]', desc: 'plot the penguins',
      run({ args }) {
        const script = args[0];
        if (!script) return fail("python3: no interpreter in here, but try: python3 do_analysis.py");
        const node = lookup(script);
        if (!node) return fail(`python3: can't open file '${script}': No such file or directory`);
        if (!script.endsWith('do_analysis.py')) return fail(`python3: ${script}: not a Python script`);

        const options = { '--x': 'bill_length_mm', '--y': 'bill_depth_mm' };
        for (let i = 1; i < args.length; i += 2) {
          if (!(args[i] in options)) return fail(`do_analysis.py: unknown argument ${args[i]}`);
          if (!NUMERIC_COLUMNS.includes(args[i + 1])) {
            return fail(`do_analysis.py: ${args[i]} must be one of ${NUMERIC_COLUMNS.join(', ')}`);
          }
          options[args[i]] = args[i + 1];
        }
        return ok(scatterPlot(penguins, options['--x'], options['--y'], cols()));
      },
    },
    psql: {
      group: 'data', usage: 'psql [-c QUERY]', desc: 'query the penguins with real SQL',
      run({ args }) {
        const { flags } = parseFlags(args, 'c');
        if (typeof flags.c === 'string') return runQuery(flags.c);
        mode = 'psql';
        return ok([
          'psql (handmade). Type \\d for the table, \\q to quit.',
          dim("  select species, round(avg(body_mass_g)) as grams from penguins group by 1;"),
        ]);
      },
    },

    echo: {
      group: 'misc', usage: 'echo [TEXT]', desc: 'print text',
      run: ({ args }) => ok([args.join(' ')]),
    },
    open: {
      group: 'misc', usage: 'open SITE', desc: 'visit another page, see ls sites',
      run({ args }) {
        if (!args[0]) return fail('usage: open SITE');
        return open(args[0]) || fail(`open: ${args[0]}: no such site, see: ls sites`);
      },
    },
    curl: {
      group: 'misc', usage: 'curl URL [-o FILE]', desc: 'fetch the penguin monitor',
      run({ args }) {
        const { flags, operands } = parseFlags(args, 'o');
        const url = operands[0];
        if (!url) return fail('curl: try: curl penguinmonitor.aq/pengdata.json -o penguins.json');
        if (!url.includes('penguinmonitor.aq')) return fail(`curl: could not resolve host: ${url}`);
        const json = JSON.stringify(penguins.slice(0, 3), null, 1);
        if (!flags.o) return ok(linesOf(json));
        writeFile(flags.o, json, false);
        return ok(['downloading data...', '25%', '50%', '75%', '100%']);
      },
    },
    history: {
      group: 'misc', usage: 'history', desc: 'what you have typed',
      run: () => ok(history.map((entry, i) => `${String(i + 1).padStart(4)}  ${entry}`)),
    },
    clear: {
      group: 'misc', usage: 'clear', desc: 'wipe the screen',
      run: () => ({ stdout: [], stderr: [], status: 0, clear: true }),
    },
    exit: {
      group: 'misc', usage: 'exit', desc: 'back to the front page',
      run: () => ({ stdout: [dim('logout')], stderr: [], status: 0, navigate: '/' }),
    },

    whoami: { run: () => ok([USER]) },
    hostname: { run: () => ok([HOST]) },
    date: { run: () => ok([now().toString().replace(/ \(.*\)$/, '')]) },
    uname: { run: () => ok(['GitHubPages']) },
    true: { run: () => ok([]) },
    false: { run: () => ({ stdout: [], stderr: [], status: 1 }) },
    sudo: {
      run: () => fail(`${USER} is not in the sudoers file. This incident will be reported to the penguins.`),
    },
    vim: { run: () => fail("vim: you would never find the way out. Try cat.") },
    nano: { run: () => fail('nano: read-only filesystem.') },
    emacs: { run: () => fail('emacs: a fine operating system, but not this one.') },
    penguinsay: {
      usage: 'penguinsay TEXT', desc: 'let a penguin say it',
      run({ args, stdin }) {
        const text = args.length ? args.join(' ') : (stdin || []).map(lineText).join(' ') || 'noot';
        const width = Math.min(text.length, Math.max(16, Math.min(cols(), 60) - 6));
        const rows = text.match(new RegExp(`.{1,${width}}`, 'g'));
        return ok([
          ` ${'_'.repeat(width + 2)}`,
          ...rows.map((row) => `| ${row.padEnd(width)} |`),
          ` ${'-'.repeat(width + 2)}`,
          '    \\',
          ...PENGUIN_ART.map((art) => [span(art, 'c-teal')]),
        ].map((line) => preLine(typeof line === 'string' ? [span(line)] : line)));
      },
    },
  };

  /* ---- psql ---- */

  function runQuery(query) {
    try {
      return ok(sqlTable(runSql(query, tables)));
    } catch (error) {
      if (!error.isSql) throw error;
      return fail(`ERROR:  ${error.message}`);
    }
  }

  function describeTable() {
    const rows = PENGUIN_COLUMNS.map((column) => [
      column, NUMERIC_COLUMNS.includes(column) ? 'numeric' : 'text',
    ]);
    return sqlTable({ columns: ['column', 'type'], rows }).slice(0, -1);
  }

  function runPsqlLine(line) {
    const input = line.trim();
    if (input === '') return [];
    if (['\\q', 'exit', 'quit'].includes(input)) { mode = 'shell'; return []; }
    if (input === '\\dt') return ['penguins'];
    if (input === '\\d' || input === '\\d penguins') return describeTable();
    if (input === '\\?' || input === 'help') {
      return [
        '\\d      show the table',
        '\\q      quit',
        dim('SELECT with WHERE, GROUP BY, HAVING, ORDER BY, LIMIT. Aggregates: count avg sum min max stddev.'),
      ];
    }
    if (input.startsWith('\\')) return [err(`invalid command ${input.split(/\s/)[0]}`)];
    const result = runQuery(input);
    return [...result.stdout, ...result.stderr];
  }

  /* ---- parsing ---- */

  function tokenize(line) {
    const tokens = [];
    let word = null;
    let glob = false;

    const add = (text) => { word = (word ?? '') + text; };
    const flush = () => {
      if (word !== null) tokens.push({ word, glob });
      word = null;
      glob = false;
    };
    const variable = (start) => {
      const match = /^\$(\?|[A-Za-z_][A-Za-z0-9_]*)/.exec(line.slice(start));
      if (!match) return null;
      const name = match[1];
      const env = {
        '?': String(status), USER, HOME, PWD: `/${cwd.join('/')}`, HOSTNAME: HOST, SHELL: '/bin/sh',
      };
      return { value: env[name] ?? '', length: match[0].length };
    };

    let i = 0;
    while (i < line.length) {
      const ch = line[i];

      if (ch === "'") {
        const end = line.indexOf("'", i + 1);
        if (end < 0) throw new Error("unexpected EOF while looking for matching `''");
        add(line.slice(i + 1, end));
        i = end + 1;
      } else if (ch === '"') {
        add('');
        i++;
        while (true) {
          if (i >= line.length) throw new Error('unexpected EOF while looking for matching `"\'');
          if (line[i] === '"') { i++; break; }
          if (line[i] === '\\' && '"\\$'.includes(line[i + 1])) { add(line[i + 1]); i += 2; continue; }
          const expanded = line[i] === '$' ? variable(i) : null;
          if (expanded) { add(expanded.value); i += expanded.length; continue; }
          add(line[i++]);
        }
      } else if (ch === '\\' && i + 1 < line.length) {
        add(line[i + 1]);
        i += 2;
      } else if (/\s/.test(ch)) {
        flush();
        i++;
      } else if (ch === '$' && variable(i)) {
        const expanded = variable(i);
        add(expanded.value);
        i += expanded.length;
      } else {
        const op = /^(&&|\|\||>>|[|;>])/.exec(line.slice(i));
        if (op) {
          flush();
          tokens.push({ op: op[0] });
          i += op[0].length;
        } else {
          if (ch === '*' || ch === '?') glob = true;
          add(ch);
          i++;
        }
      }
    }
    flush();
    return tokens;
  }

  /* Returns [{ connector, pipeline: [{ argv, redirect }] }]. */
  function parse(tokens) {
    const sequence = [];
    let connector = null;
    let pipeline = [];
    let stage = { argv: [], redirect: null };

    const endStage = () => {
      if (stage.argv.length === 0) throw new Error('syntax error near unexpected token');
      pipeline.push(stage);
      stage = { argv: [], redirect: null };
    };

    for (let i = 0; i < tokens.length; i++) {
      const token = tokens[i];
      if (token.word !== undefined) {
        stage.argv.push(token);
      } else if (token.op === '>' || token.op === '>>') {
        const target = tokens[++i];
        if (!target || target.word === undefined) throw new Error('syntax error near unexpected token `newline\'');
        stage.redirect = { path: target.word, append: token.op === '>>' };
      } else if (token.op === '|') {
        endStage();
      } else {
        endStage();
        sequence.push({ connector, pipeline });
        connector = token.op;
        pipeline = [];
      }
    }
    if (stage.argv.length) endStage();
    if (pipeline.length) sequence.push({ connector, pipeline });
    else if (connector && connector !== ';') throw new Error('syntax error: unexpected end of line');
    return sequence;
  }

  function expandGlobs(argv) {
    return argv.flatMap(({ word, glob }) => {
      if (!glob) return [word];
      const slash = word.lastIndexOf('/');
      const prefix = word.slice(0, slash + 1);
      const node = lookup(prefix || '.');
      if (!node || node.type !== 'dir') return [word];
      const regex = globToRegExp(word.slice(slash + 1));
      const matches = Object.keys(node.children)
        .filter((name) => !name.startsWith('.') && regex.test(name))
        .sort()
        .map((name) => prefix + name);
      return matches.length ? matches : [word];
    });
  }

  function writeFile(path, text, append) {
    const parts = resolvePath(path);
    const parent = nodeAt(parts.slice(0, -1));
    const name = parts[parts.length - 1];
    if (!parent || parent.type !== 'dir') return `${path}: No such file or directory`;
    const existing = parent.children[name];
    if (existing && existing.type !== 'file') return `${path}: Is a directory`;
    if (existing && !existing.created) return `${path}: Permission denied`;
    const previous = append && existing ? `${existing.content}\n` : '';
    parent.children[name] = { type: 'file', content: previous + text, created: true };
    return null;
  }

  function runPipeline(pipeline, effects) {
    let stdin = null;
    const stderr = [];
    let exit = 0;

    pipeline.forEach((stage, index) => {
      const [name, ...args] = expandGlobs(stage.argv);
      const command = Object.hasOwn(commands, name) ? commands[name] : null;
      const piped = index < pipeline.length - 1 || stage.redirect !== null;

      let result;
      if (command) {
        result = command.run({ args, stdin, piped });
      } else {
        result = { stdout: [], stderr: [err(`sh: ${name}: command not found. Try help.`)], status: 127 };
      }

      stderr.push(...result.stderr);
      exit = result.status;
      stdin = result.stdout;
      if (result.clear) effects.clear = true;
      if (result.navigate) effects.navigate = result.navigate;

      if (stage.redirect) {
        const problem = writeFile(stage.redirect.path, stdin.map(lineText).join('\n'), stage.redirect.append);
        if (problem) { stderr.push(err(`sh: ${problem}`)); exit = 1; }
        stdin = [];
      }
    });

    return { stdout: stdin, stderr, status: exit };
  }

  function runLine(line) {
    const effects = { lines: [] };
    let sequence;
    try {
      sequence = parse(tokenize(line));
    } catch (error) {
      status = 2;
      effects.lines.push(err(`sh: ${error.message}`));
      return effects;
    }

    for (const { connector, pipeline } of sequence) {
      if (connector === '&&' && status !== 0) continue;
      if (connector === '||' && status === 0) continue;
      const result = runPipeline(pipeline, effects);
      status = result.status;
      if (effects.clear) { effects.lines = []; }
      effects.lines.push(...result.stderr, ...result.stdout);
      if (effects.navigate) break;
    }
    return effects;
  }

  /* ---- public interface ---- */

  function run(line) {
    const trimmed = line.trim();
    if (trimmed) history.push(trimmed);
    if (mode === 'psql') {
      if (trimmed === 'clear') return { lines: [], clear: true };
      return { lines: runPsqlLine(line) };
    }
    if (!trimmed) return { lines: [] };
    return runLine(trimmed);
  }

  function prompt() {
    if (mode === 'psql') return [span('penguins=> ', 'c-lime')];
    return [
      span(`${USER}@${HOST}`, 'c-lime'),
      span(':'),
      span(displayPath(), 'c-blue'),
      span(' $ '),
    ];
  }

  function suggestions() {
    if (mode === 'psql') {
      return [
        'select species, count(*) from penguins group by 1',
        "select island, round(avg(body_mass_g)) from penguins where sex = 'female' group by 1",
        '\\d',
        '\\q',
      ];
    }
    return ['help', 'cat about.txt', 'cat contact.txt', 'ls sites', 'psql', 'neofetch'];
  }

  /* Returns { value, options }: the completed input, and the choices if it is ambiguous. */
  function complete(input) {
    if (mode === 'psql') return { value: input, options: [] };
    const start = input.lastIndexOf(' ') + 1;
    const word = input.slice(start);
    const head = input.slice(0, start);
    const first = !/\S/.test(head) || /[|;&]\s*$/.test(head);

    let candidates;
    if (first && !word.includes('/')) {
      candidates = Object.keys(commands).filter((name) => name.startsWith(word));
    } else {
      const slash = word.lastIndexOf('/');
      const prefix = word.slice(0, slash + 1);
      const partial = word.slice(slash + 1);
      const node = lookup(prefix || '.');
      if (!node || node.type !== 'dir') return { value: input, options: [] };
      candidates = Object.entries(node.children)
        .filter(([name]) => name.startsWith(partial) && (partial.startsWith('.') || !name.startsWith('.')))
        .map(([name, entry]) => prefix + name + (entry.type === 'file' ? '' : '/'));
    }

    if (candidates.length === 0) return { value: input, options: [] };
    if (candidates.length === 1) {
      const [only] = candidates;
      return { value: head + only + (only.endsWith('/') ? '' : ' '), options: [] };
    }

    let common = candidates[0];
    for (const candidate of candidates) {
      while (!candidate.startsWith(common)) common = common.slice(0, -1);
    }
    return { value: head + common, options: candidates.sort() };
  }

  return {
    run, prompt, suggestions, complete, path: () => displayPath(), historyList: () => history,
  };
}

if (typeof module !== 'undefined') module.exports = { createShell, lineText };
