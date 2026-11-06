/* A small SQL engine for one in-memory table.
   Supports SELECT [DISTINCT] ... FROM t [WHERE] [GROUP BY] [HAVING] [ORDER BY] [LIMIT]. */

const AGGREGATES = new Set(['count', 'avg', 'sum', 'min', 'max', 'stddev']);
const KEYWORDS = new Set([
  'select', 'distinct', 'from', 'where', 'group', 'by', 'having', 'order', 'limit', 'as', 'asc',
  'desc', 'and', 'or', 'not', 'in', 'like', 'between', 'is', 'null', 'true', 'false',
]);

function sqlError(message) {
  const error = new Error(message);
  error.isSql = true;
  return error;
}

function tokenizeSql(source) {
  const tokens = [];
  let i = 0;
  while (i < source.length) {
    const ch = source[i];
    if (/\s/.test(ch)) { i++; continue; }

    if (ch === "'") {
      let value = '';
      i++;
      while (true) {
        if (i >= source.length) throw sqlError('unterminated quoted string');
        if (source[i] === "'" && source[i + 1] === "'") { value += "'"; i += 2; continue; }
        if (source[i] === "'") { i++; break; }
        value += source[i++];
      }
      tokens.push({ type: 'string', value });
      continue;
    }

    if (ch === '"') {
      const end = source.indexOf('"', i + 1);
      if (end < 0) throw sqlError('unterminated quoted identifier');
      tokens.push({ type: 'ident', value: source.slice(i + 1, end) });
      i = end + 1;
      continue;
    }

    const number = /^\d+(\.\d+)?|^\.\d+/.exec(source.slice(i));
    if (number) {
      tokens.push({ type: 'number', value: Number(number[0]) });
      i += number[0].length;
      continue;
    }

    const word = /^[A-Za-z_][A-Za-z0-9_]*/.exec(source.slice(i));
    if (word) {
      const lower = word[0].toLowerCase();
      tokens.push(KEYWORDS.has(lower) ? { type: 'kw', value: lower } : { type: 'ident', value: lower });
      i += word[0].length;
      continue;
    }

    const op = /^(<=|>=|<>|!=|[=<>+\-*/%(),;])/.exec(source.slice(i));
    if (op) {
      tokens.push({ type: 'op', value: op[0] === '<>' ? '!=' : op[0] });
      i += op[0].length;
      continue;
    }

    throw sqlError(`syntax error at or near "${ch}"`);
  }
  tokens.push({ type: 'end', value: 'end of input' });
  return tokens;
}

function parseSql(source) {
  const tokens = tokenizeSql(source);
  let pos = 0;

  const peek = () => tokens[pos];
  const is = (type, value) => peek().type === type && (value === undefined || peek().value === value);
  const accept = (type, value) => (is(type, value) ? tokens[pos++] : null);
  const fail = () => { throw sqlError(`syntax error at or near "${peek().value}"`); };
  const expect = (type, value) => accept(type, value) || fail();

  function expression() { return orExpr(); }

  function orExpr() {
    let left = andExpr();
    while (accept('kw', 'or')) left = { kind: 'logic', op: 'or', left, right: andExpr() };
    return left;
  }

  function andExpr() {
    let left = notExpr();
    while (accept('kw', 'and')) left = { kind: 'logic', op: 'and', left, right: notExpr() };
    return left;
  }

  function notExpr() {
    if (accept('kw', 'not')) return { kind: 'not', value: notExpr() };
    return comparison();
  }

  function comparison() {
    const left = additive();

    for (const op of ['=', '!=', '<=', '>=', '<', '>']) {
      if (accept('op', op)) return { kind: 'compare', op, left, right: additive() };
    }

    if (accept('kw', 'is')) {
      const negated = Boolean(accept('kw', 'not'));
      expect('kw', 'null');
      return { kind: 'isnull', value: left, negated };
    }

    const negated = Boolean(accept('kw', 'not'));
    if (accept('kw', 'like')) return { kind: 'like', value: left, pattern: additive(), negated };
    if (accept('kw', 'between')) {
      const low = additive();
      expect('kw', 'and');
      return { kind: 'between', value: left, low, high: additive(), negated };
    }
    if (accept('kw', 'in')) {
      expect('op', '(');
      const items = [expression()];
      while (accept('op', ',')) items.push(expression());
      expect('op', ')');
      return { kind: 'in', value: left, items, negated };
    }
    if (negated) fail();
    return left;
  }

  function additive() {
    let left = multiplicative();
    while (is('op', '+') || is('op', '-')) {
      const op = tokens[pos++].value;
      left = { kind: 'math', op, left, right: multiplicative() };
    }
    return left;
  }

  function multiplicative() {
    let left = unary();
    while (is('op', '*') || is('op', '/') || is('op', '%')) {
      const op = tokens[pos++].value;
      left = { kind: 'math', op, left, right: unary() };
    }
    return left;
  }

  function unary() {
    if (accept('op', '-')) return { kind: 'negate', value: unary() };
    return primary();
  }

  function primary() {
    const token = peek();
    if (token.type === 'number' || token.type === 'string') {
      pos++;
      return { kind: 'literal', value: token.value };
    }
    if (accept('kw', 'null')) return { kind: 'literal', value: null };
    if (accept('kw', 'true')) return { kind: 'literal', value: true };
    if (accept('kw', 'false')) return { kind: 'literal', value: false };
    if (accept('op', '(')) {
      const inner = expression();
      expect('op', ')');
      return inner;
    }
    if (token.type === 'ident') {
      pos++;
      if (!accept('op', '(')) return { kind: 'column', name: token.value };
      return call(token.value);
    }
    return fail();
  }

  function call(name) {
    if (accept('op', '*')) {
      if (name !== 'count') fail();
      expect('op', ')');
      return { kind: 'aggregate', name, star: true };
    }
    if (AGGREGATES.has(name)) {
      const distinct = Boolean(accept('kw', 'distinct'));
      const arg = expression();
      expect('op', ')');
      return { kind: 'aggregate', name, arg, distinct };
    }
    const args = [];
    if (!accept('op', ')')) {
      do args.push(expression()); while (accept('op', ','));
      expect('op', ')');
    }
    return { kind: 'call', name, args };
  }

  function selectItem() {
    if (accept('op', '*')) return { star: true };
    const expr = expression();
    let alias = null;
    if (accept('kw', 'as')) alias = expect('ident').value;
    else if (is('ident')) alias = tokens[pos++].value;
    return { expr, alias, label: alias || defaultLabel(expr) };
  }

  function defaultLabel(expr) {
    if (expr.kind === 'column') return expr.name;
    if (expr.kind === 'aggregate' || expr.kind === 'call') return expr.name;
    return '?column?';
  }

  function list(parse) {
    const items = [parse()];
    while (accept('op', ',')) items.push(parse());
    return items;
  }

  expect('kw', 'select');
  const query = { distinct: Boolean(accept('kw', 'distinct')) };
  query.items = list(selectItem);
  expect('kw', 'from');
  query.table = expect('ident').value;
  if (accept('kw', 'where')) query.where = expression();
  if (accept('kw', 'group')) {
    expect('kw', 'by');
    query.groupBy = list(expression);
  }
  if (accept('kw', 'having')) query.having = expression();
  if (accept('kw', 'order')) {
    expect('kw', 'by');
    query.orderBy = list(() => {
      const expr = expression();
      const desc = Boolean(accept('kw', 'desc'));
      if (!desc) accept('kw', 'asc');
      return { expr, desc };
    });
  }
  if (accept('kw', 'limit')) query.limit = expect('number').value;
  accept('op', ';');
  if (!is('end')) fail();
  return query;
}

function likeToRegExp(pattern) {
  const body = String(pattern)
    .replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    .replace(/%/g, '.*')
    .replace(/_/g, '.');
  return new RegExp(`^${body}$`, 's');
}

function compareValues(a, b) {
  if (typeof a === 'number' && typeof b === 'number') return a - b;
  const left = String(a);
  const right = String(b);
  return left < right ? -1 : left > right ? 1 : 0;
}

/* Three-valued logic: any comparison against NULL is NULL, which WHERE treats as false. */
function evaluate(node, scope) {
  const value = (child) => evaluate(child, scope);

  if (scope.groupKey) {
    const key = scope.groupKey(node);
    if (key) return key.value;
  }

  switch (node.kind) {
    case 'literal': return node.value;
    case 'column': return scope.column(node);
    case 'aggregate': return scope.aggregate(node);
    case 'negate': {
      const v = value(node.value);
      return v === null ? null : -v;
    }
    case 'not': {
      const v = value(node.value);
      return v === null ? null : !v;
    }
    case 'logic': {
      const left = value(node.left);
      const right = value(node.right);
      if (node.op === 'and') {
        if (left === false || right === false) return false;
        return left === null || right === null ? null : Boolean(left && right);
      }
      if (left === true || right === true) return true;
      return left === null || right === null ? null : Boolean(left || right);
    }
    case 'compare': {
      const left = value(node.left);
      const right = value(node.right);
      if (left === null || right === null) return null;
      const order = compareValues(left, right);
      switch (node.op) {
        case '=': return order === 0;
        case '!=': return order !== 0;
        case '<': return order < 0;
        case '<=': return order <= 0;
        case '>': return order > 0;
        default: return order >= 0;
      }
    }
    case 'math': {
      const left = value(node.left);
      const right = value(node.right);
      if (left === null || right === null) return null;
      if (typeof left !== 'number' || typeof right !== 'number') {
        throw sqlError(`operator ${node.op} needs numbers`);
      }
      if ((node.op === '/' || node.op === '%') && right === 0) throw sqlError('division by zero');
      switch (node.op) {
        case '+': return left + right;
        case '-': return left - right;
        case '*': return left * right;
        case '/': return left / right;
        default: return left % right;
      }
    }
    case 'isnull': {
      const isNull = value(node.value) === null;
      return node.negated ? !isNull : isNull;
    }
    case 'like': {
      const v = value(node.value);
      const pattern = value(node.pattern);
      if (v === null || pattern === null) return null;
      const match = likeToRegExp(pattern).test(String(v));
      return node.negated ? !match : match;
    }
    case 'between': {
      const v = value(node.value);
      const low = value(node.low);
      const high = value(node.high);
      if (v === null || low === null || high === null) return null;
      const inside = compareValues(v, low) >= 0 && compareValues(v, high) <= 0;
      return node.negated ? !inside : inside;
    }
    case 'in': {
      const v = value(node.value);
      if (v === null) return null;
      const items = node.items.map(value);
      const found = items.some((item) => item !== null && compareValues(v, item) === 0);
      if (found) return !node.negated;
      return items.includes(null) ? null : Boolean(node.negated);
    }
    case 'call': return callFunction(node.name, node.args.map(value));
    default: throw sqlError('unsupported expression');
  }
}

function callFunction(name, args) {
  if (name === 'coalesce') {
    const present = args.find((arg) => arg !== null);
    return present === undefined ? null : present;
  }
  if (args.length === 0) throw sqlError(`function ${name}() does not exist`);
  const [first, second] = args;
  if (first === null) return null;
  switch (name) {
    case 'round': {
      const factor = 10 ** (second || 0);
      return Math.round(first * factor) / factor;
    }
    case 'abs': return Math.abs(first);
    case 'floor': return Math.floor(first);
    case 'ceil': return Math.ceil(first);
    case 'lower': return String(first).toLowerCase();
    case 'upper': return String(first).toUpperCase();
    case 'length': return String(first).length;
    default: throw sqlError(`function ${name}() does not exist`);
  }
}

function aggregateValue(node, rows, rowScope) {
  if (node.star) return rows.length;

  let values = rows
    .map((row) => evaluate(node.arg, rowScope(row)))
    .filter((v) => v !== null);
  if (node.distinct) values = [...new Set(values)];

  if (node.name === 'count') return values.length;
  if (values.length === 0) return null;

  const sum = values.reduce((total, v) => total + v, 0);
  switch (node.name) {
    case 'sum': return sum;
    case 'avg': return sum / values.length;
    case 'min': return values.reduce((a, b) => (compareValues(a, b) <= 0 ? a : b));
    case 'max': return values.reduce((a, b) => (compareValues(a, b) >= 0 ? a : b));
    default: {
      if (values.length < 2) return null;
      const mean = sum / values.length;
      return Math.sqrt(values.reduce((t, v) => t + (v - mean) ** 2, 0) / (values.length - 1));
    }
  }
}

function hasAggregate(node) {
  if (!node || typeof node !== 'object') return false;
  if (node.kind === 'aggregate') return true;
  return Object.values(node).some((child) => (
    Array.isArray(child) ? child.some(hasAggregate) : hasAggregate(child)
  ));
}

function runSql(source, tables) {
  const query = parseSql(source);
  const table = tables[query.table];
  if (!table) throw sqlError(`relation "${query.table}" does not exist`);

  const rowScope = (row) => ({
    column(node) {
      if (!table.columns.includes(node.name)) throw sqlError(`column "${node.name}" does not exist`);
      return row[node.name];
    },
    aggregate() {
      throw sqlError('aggregate functions are not allowed here');
    },
  });

  if (query.where && hasAggregate(query.where)) {
    throw sqlError('aggregate functions are not allowed in WHERE');
  }

  const items = query.items.flatMap((item) => (
    item.star
      ? table.columns.map((name) => ({ expr: { kind: 'column', name }, label: name }))
      : [item]
  ));

  const aliases = new Map(items.filter((item) => item.alias).map((item) => [item.alias, item.expr]));
  /* GROUP BY and ORDER BY may name a select item by alias or 1-based position. */
  const resolve = (expr) => {
    if (expr.kind === 'column' && aliases.has(expr.name)) return aliases.get(expr.name);
    if (expr.kind === 'literal' && typeof expr.value === 'number') {
      const item = items[expr.value - 1];
      if (!item) throw sqlError(`position ${expr.value} is not in select list`);
      return item.expr;
    }
    return expr;
  };

  const groupKeys = (query.groupBy || []).map(resolve);
  const groupKeyIds = new Set(groupKeys.map((key) => JSON.stringify(key)));
  const orderKeys = (query.orderBy || []).map((order) => ({ ...order, expr: resolve(order.expr) }));

  const grouped = groupKeys.length > 0
    || query.having
    || items.some((item) => hasAggregate(item.expr))
    || orderKeys.some((order) => hasAggregate(order.expr));

  let filtered = table.rows;
  if (query.where) {
    filtered = filtered.filter((row) => evaluate(query.where, rowScope(row)) === true);
  }

  let scopes;
  if (grouped) {
    const groups = new Map();
    if (groupKeys.length === 0) groups.set('', filtered);
    else {
      for (const row of filtered) {
        const id = JSON.stringify(groupKeys.map((key) => evaluate(key, rowScope(row))));
        if (!groups.has(id)) groups.set(id, []);
        groups.get(id).push(row);
      }
    }

    /* A grouped expression takes its value from the group's first row. */
    const groupScope = (rows) => ({
      groupKey(node) {
        if (rows.length === 0 || !groupKeyIds.has(JSON.stringify(node))) return null;
        return { value: evaluate(node, rowScope(rows[0])) };
      },
      column(node) {
        throw sqlError(`column "${node.name}" must appear in GROUP BY or an aggregate`);
      },
      aggregate: (node) => aggregateValue(node, rows, rowScope),
    });

    scopes = [...groups.values()].map(groupScope);
    if (query.having) {
      scopes = scopes.filter((scope) => evaluate(query.having, scope) === true);
    }
  } else {
    scopes = filtered.map(rowScope);
  }

  let results = scopes.map((scope) => ({
    values: items.map((item) => evaluate(item.expr, scope)),
    sort: orderKeys.map((order) => evaluate(order.expr, scope)),
  }));

  if (query.distinct) {
    const seen = new Set();
    results = results.filter((result) => {
      const id = JSON.stringify(result.values);
      if (seen.has(id)) return false;
      seen.add(id);
      return true;
    });
  }

  if (orderKeys.length) {
    results = results
      .map((result, index) => ({ result, index }))
      .sort((a, b) => {
        for (let k = 0; k < orderKeys.length; k++) {
          const left = a.result.sort[k];
          const right = b.result.sort[k];
          if (left === right) continue;
          /* Postgres sorts NULLs as the largest value. */
          if (left === null) return orderKeys[k].desc ? -1 : 1;
          if (right === null) return orderKeys[k].desc ? 1 : -1;
          const order = compareValues(left, right);
          if (order !== 0) return orderKeys[k].desc ? -order : order;
        }
        return a.index - b.index;
      })
      .map(({ result }) => result);
  }

  if (query.limit !== undefined) results = results.slice(0, query.limit);

  return { columns: items.map((item) => item.label), rows: results.map((result) => result.values) };
}
