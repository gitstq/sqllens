/**
 * SQLens — SQL Tokenizer
 * 零依赖 SQL 词法分析器。将 SQL 文本拆分为带类型的 Token 流，
 * 支持字符串、数字、标识符、注释、括号、运算符、关键字。
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.SQLTokenizer = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  var KEYWORDS = [
    'SELECT', 'FROM', 'WHERE', 'GROUP', 'BY', 'ORDER', 'HAVING', 'LIMIT',
    'OFFSET', 'JOIN', 'INNER', 'LEFT', 'RIGHT', 'FULL', 'OUTER', 'CROSS',
    'ON', 'AND', 'OR', 'NOT', 'IN', 'IS', 'NULL', 'LIKE', 'BETWEEN',
    'EXISTS', 'UNION', 'ALL', 'DISTINCT', 'AS', 'INSERT', 'INTO', 'VALUES',
    'UPDATE', 'SET', 'DELETE', 'CREATE', 'TABLE', 'INDEX', 'VIEW',
    'DROP', 'ALTER', 'ADD', 'COLUMN', 'PRIMARY', 'KEY', 'FOREIGN',
    'REFERENCES', 'CONSTRAINT', 'CASE', 'WHEN', 'THEN', 'ELSE', 'END',
    'DESC', 'ASC', 'IF', 'NULLS', 'FIRST', 'LAST', 'WITH', 'RECURSIVE',
    'CAST', 'COALESCE', 'NVL', 'IFNULL', 'TRUE', 'FALSE', 'USING',
    'INTERSECT', 'EXCEPT', 'MINUS', 'RETURNING', 'DATABASE', 'USE',
    'TRUNCATE', 'GRANT', 'REVOKE', 'COMMIT', 'ROLLBACK', 'BEGIN',
    'START', 'TRANSACTION', 'MERGE', 'REPLACE', 'IGNORE', 'DEFAULT'
  ];
  var KEYWORD_SET = {};
  KEYWORDS.forEach(function (k) { KEYWORD_SET[k] = true; });

  // SQL 中常见的函数名（用于着色）
  var FUNCTIONS = [
    'COUNT', 'SUM', 'AVG', 'MIN', 'MAX', 'ABS', 'ROUND', 'CEIL', 'FLOOR',
    'UPPER', 'LOWER', 'LENGTH', 'SUBSTRING', 'TRIM', 'REPLACE', 'CONCAT',
    'NOW', 'CURRENT_DATE', 'CURRENT_TIMESTAMP', 'DATE', 'YEAR', 'MONTH',
    'DAY', 'HOUR', 'COALESCE', 'NULLIF', 'GREATEST', 'LEAST', 'RAND',
    'IF', 'GROUP_CONCAT', 'JSON_EXTRACT', 'JSON_ARRAY', 'LAST_INSERT_ID',
    'UNIX_TIMESTAMP', 'FROM_UNIXTIME', 'STR_TO_DATE', 'DATE_FORMAT',
    'MD5', 'SHA1', 'SHA2', 'ROW_NUMBER', 'RANK', 'DENSE_RANK', 'NTILE',
    'LEAD', 'LAG', 'FIRST_VALUE', 'LAST_VALUE', 'PERCENTILE_CONT',
    'STDDEV', 'VARIANCE', 'WINDOW'
  ];
  var FUNCTION_SET = {};
  FUNCTIONS.forEach(function (f) { FUNCTION_SET[f] = true; });

  var TokenType = {
    WHITESPACE: 'whitespace',
    COMMENT: 'comment',
    STRING: 'string',
    NUMBER: 'number',
    IDENT: 'ident',
    QUOTED_IDENT: 'quoted-ident',
    OPERATOR: 'operator',
    PAREN_OPEN: 'paren-open',
    PAREN_CLOSE: 'paren-close',
    COMMA: 'comma',
    SEMICOLON: 'semicolon',
    KEYWORD: 'keyword',
    FUNCTION: 'function',
    PARAM: 'param',
    DOT: 'dot'
  };

  /**
   * 分词
   * @param {string} sql 输入 SQL
   * @returns {Array<{type:string, value:string, start:number, end:number}>}
   */
  function tokenize(sql) {
    var tokens = [];
    var i = 0;
    var len = sql.length;
    var line = 1;
    var col = 1;

    function advance(n) {
      for (var j = 0; j < n; j++) {
        if (sql[i] === '\n') { line++; col = 1; } else { col++; }
        i++;
      }
    }

    while (i < len) {
      var ch = sql[i];
      var start = i;
      var startLine = line;
      var startCol = col;

      // 空白
      if (ch === ' ' || ch === '\t' || ch === '\n' || ch === '\r' || ch === '\f') {
        var ws = '';
        while (i < len && /[ \t\n\r\f]/.test(sql[i])) { ws += sql[i]; advance(1); }
        tokens.push({ type: TokenType.WHITESPACE, value: ws, start: start, end: i, line: startLine, col: startCol });
        continue;
      }

      // 行注释 -- ...
      if (ch === '-' && sql[i + 1] === '-') {
        var lc = '';
        while (i < len && sql[i] !== '\n') { lc += sql[i]; advance(1); }
        tokens.push({ type: TokenType.COMMENT, value: lc, start: start, end: i, line: startLine, col: startCol });
        continue;
      }

      // 行注释 # ... (MySQL)
      if (ch === '#') {
        var hc = '';
        while (i < len && sql[i] !== '\n') { hc += sql[i]; advance(1); }
        tokens.push({ type: TokenType.COMMENT, value: hc, start: start, end: i, line: startLine, col: startCol });
        continue;
      }

      // 块注释 /* ... */
      if (ch === '/' && sql[i + 1] === '*') {
        var bc = '/*';
        advance(2);
        while (i < len && !(sql[i] === '*' && sql[i + 1] === '/')) { bc += sql[i]; advance(1); }
        if (i < len) { bc += '*/'; advance(2); }
        tokens.push({ type: TokenType.COMMENT, value: bc, start: start, end: i, line: startLine, col: startCol });
        continue;
      }

      // 字符串 '...'（支持 '' 转义）
      if (ch === '\'') {
        var str = '\'';
        advance(1);
        while (i < len) {
          if (sql[i] === '\'') {
            if (sql[i + 1] === '\'') { str += "''"; advance(2); continue; }
            str += '\''; advance(1); break;
          }
          str += sql[i]; advance(1);
        }
        tokens.push({ type: TokenType.STRING, value: str, start: start, end: i, line: startLine, col: startCol });
        continue;
      }

      // 双引号字符串/标识符 "..."（MySQL 也支持）
      if (ch === '"') {
        var dstr = '"';
        advance(1);
        while (i < len) {
          if (sql[i] === '"') {
            if (sql[i + 1] === '"') { dstr += '""'; advance(2); continue; }
            dstr += '"'; advance(1); break;
          }
          dstr += sql[i]; advance(1);
        }
        tokens.push({ type: TokenType.QUOTED_IDENT, value: dstr, start: start, end: i, line: startLine, col: startCol });
        continue;
      }

      // 反引号标识符 `...`
      if (ch === '`') {
        var bt = '`';
        advance(1);
        while (i < len) {
          if (sql[i] === '`') {
            if (sql[i + 1] === '`') { bt += '``'; advance(2); continue; }
            bt += '`'; advance(1); break;
          }
          bt += sql[i]; advance(1);
        }
        tokens.push({ type: TokenType.QUOTED_IDENT, value: bt, start: start, end: i, line: startLine, col: startCol });
        continue;
      }

      // 方括号标识符 [name] (SQL Server)
      if (ch === '[') {
        var br = '[';
        advance(1);
        while (i < len && sql[i] !== ']') { br += sql[i]; advance(1); }
        if (i < len) { br += ']'; advance(1); }
        tokens.push({ type: TokenType.QUOTED_IDENT, value: br, start: start, end: i, line: startLine, col: startCol });
        continue;
      }

      // 数字
      if (/[0-9]/.test(ch) || (ch === '.' && /[0-9]/.test(sql[i + 1] || ''))) {
        var num = '';
        while (i < len && /[0-9a-fA-FxXbBoO.]/.test(sql[i])) {
          // 十六进制 0x... 十进制 0b... 八进制 0o...
          num += sql[i]; advance(1);
        }
        // 科学计数法 e+10 / E-5
        if (i < len && /[eE]/.test(sql[i]) && /[0-9+-]/.test(sql[i + 1] || '')) {
          num += sql[i]; advance(1);
          if (i < len && /[+-]/.test(sql[i])) { num += sql[i]; advance(1); }
          while (i < len && /[0-9]/.test(sql[i])) { num += sql[i]; advance(1); }
        }
        tokens.push({ type: TokenType.NUMBER, value: num, start: start, end: i, line: startLine, col: startCol });
        continue;
      }

      // 参数占位符 ? :name @name $1 ${name}
      if (ch === '?' || ch === '@') {
        var param = ch; advance(1);
        while (i < len && /[A-Za-z0-9_]/.test(sql[i])) { param += sql[i]; advance(1); }
        tokens.push({ type: TokenType.PARAM, value: param, start: start, end: i, line: startLine, col: startCol });
        continue;
      }
      if (ch === '$') {
        var dollar = ch; advance(1);
        while (i < len && /[A-Za-z0-9_{}]/.test(sql[i])) { dollar += sql[i]; advance(1); }
        tokens.push({ type: TokenType.PARAM, value: dollar, start: start, end: i, line: startLine, col: startCol });
        continue;
      }
      if (ch === ':' && /[A-Za-z_]/.test(sql[i + 1] || '')) {
        var named = ch; advance(1);
        while (i < len && /[A-Za-z0-9_]/.test(sql[i])) { named += sql[i]; advance(1); }
        tokens.push({ type: TokenType.PARAM, value: named, start: start, end: i, line: startLine, col: startCol });
        continue;
      }

      // 括号、逗号、分号
      if (ch === '(') { advance(1); tokens.push({ type: TokenType.PAREN_OPEN, value: '(', start: start, end: i, line: startLine, col: startCol }); continue; }
      if (ch === ')') { advance(1); tokens.push({ type: TokenType.PAREN_CLOSE, value: ')', start: start, end: i, line: startLine, col: startCol }); continue; }
      if (ch === ',') { advance(1); tokens.push({ type: TokenType.COMMA, value: ',', start: start, end: i, line: startLine, col: startCol }); continue; }
      if (ch === ';') { advance(1); tokens.push({ type: TokenType.SEMICOLON, value: ';', start: start, end: i, line: startLine, col: startCol }); continue; }
      if (ch === '.') { advance(1); tokens.push({ type: TokenType.DOT, value: '.', start: start, end: i, line: startLine, col: startCol }); continue; }

      // 运算符（多字符优先）
      var op2 = sql.substr(i, 2);
      if (['<=', '>=', '<>', '!=', '||', '::', '->', '->>', '#>', '#>>', '~*', '!~', '&&', '@>', '<@', '?|', '?&', ':=', '<<', '>>'].indexOf(op2) !== -1) {
        advance(2);
        tokens.push({ type: TokenType.OPERATOR, value: op2, start: start, end: i, line: startLine, col: startCol });
        continue;
      }
      var op1 = ch;
      if ('+-*/%=<>!&|^~'.indexOf(ch) !== -1) {
        advance(1);
        tokens.push({ type: TokenType.OPERATOR, value: op1, start: start, end: i, line: startLine, col: startCol });
        continue;
      }

      // 标识符 / 关键字
      var word = '';
      while (i < len && /[A-Za-z0-9_$]/.test(sql[i])) { word += sql[i]; advance(1); }
      if (word) {
        var upper = word.toUpperCase();
        var type;
        if (KEYWORD_SET[upper]) type = TokenType.KEYWORD;
        else if (FUNCTION_SET[upper] && sql[i] === '(') type = TokenType.FUNCTION;
        else type = TokenType.IDENT;
        tokens.push({ type: type, value: word, start: start, end: i, line: startLine, col: startCol });
        continue;
      }

      // 未知字符
      advance(1);
      tokens.push({ type: TokenType.OPERATOR, value: ch, start: start, end: i, line: startLine, col: startCol });
    }

    return tokens;
  }

  /**
   * 过滤空白 token
   */
  function stripWhitespace(tokens) {
    return tokens.filter(function (t) { return t.type !== TokenType.WHITESPACE; });
  }

  /**
   * 计算每个 token 的缩进级别与行归属（用于高亮渲染）。
   */
  function buildLines(tokens) {
    var lines = [];
    var current = [];
    tokens.forEach(function (t) {
      if (t.type === TokenType.WHITESPACE && t.value.indexOf('\n') !== -1) {
        lines.push(current);
        current = [];
        return;
      }
      current.push(t);
    });
    if (current.length) lines.push(current);
    return lines;
  }

  return {
    TokenType: TokenType,
    KEYWORDS: KEYWORDS,
    tokenize: tokenize,
    stripWhitespace: stripWhitespace,
    buildLines: buildLines
  };
});
