/**
 * SQLens — SQL Formatter
 * 零依赖 SQL 格式化引擎。基于 tokenizer 输出，提供缩进、大小写归一、
 * 逗号换行、括号嵌套等格式化能力。
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory(root);
  else root.SQLFormatter = factory(root);
})(typeof self !== 'undefined' ? self : this, function (root) {
  'use strict';

  var SQLTokenizer = (typeof module === 'object' && module.exports)
    ? require('./sql-tokenizer.js')
    : root.SQLTokenizer;
  var T = SQLTokenizer.TokenType;

  // 内容型子句：进入列表缩进（SELECT/UPDATE/SET/VALUES/RETURNING）
  var CONTENT_CLAUSES = ['SELECT', 'UPDATE', 'SET', 'VALUES', 'RETURNING'];
  var CONTENT_SET = {};
  CONTENT_CLAUSES.forEach(function (k) { CONTENT_SET[k] = true; });

  // 段型子句：换行并结束列表缩进
  var SECTION_CLAUSES = [
    'FROM', 'WHERE', 'GROUP', 'ORDER', 'HAVING', 'LIMIT', 'OFFSET',
    'UNION', 'EXCEPT', 'INTERSECT', 'JOIN', 'INNER', 'LEFT', 'RIGHT',
    'FULL', 'CROSS', 'INSERT', 'INTO', 'DELETE'
  ];
  var SECTION_SET = {};
  SECTION_CLAUSES.forEach(function (k) { SECTION_SET[k] = true; });

  // JOIN 修饰词（后跟 JOIN）
  var JOIN_MODS = ['INNER', 'LEFT', 'RIGHT', 'FULL', 'CROSS'];

  var DEFAULTS = {
    indent: '  ',
    keywordCase: 'upper',   // upper | lower | preserve
    commaFirst: false,
    spaces: true
  };

  function clone(obj) { return JSON.parse(JSON.stringify(obj)); }
  function applyCase(word, mode) {
    if (mode === 'upper') return word.toUpperCase();
    if (mode === 'lower') return word.toLowerCase();
    return word;
  }

  /**
   * 主格式化函数。
   */
  function format(sql, userConfig) {
    var cfg = clone(DEFAULTS);
    if (userConfig) {
      Object.keys(userConfig).forEach(function (k) {
        if (userConfig[k] !== undefined) cfg[k] = userConfig[k];
      });
    }
    var rawTokens = SQLTokenizer.tokenize(sql);
    var tokens = rawTokens.filter(function (t) { return t.type !== T.WHITESPACE; });

    if (!tokens.length) return { sql: '', error: null };

    var lines = [];
    var line = [];
    var indent = 0;
    var inList = false;          // 是否处于内容列表（SELECT 列 / VALUES）
    var parenStack = [];         // {multiline:boolean}

    function emitLine() {
      if (line.length) {
        var pad = '';
        for (var i = 0; i < indent; i++) pad += cfg.indent;
        lines.push(pad + line.join(''));
        line = [];
      } else {
        lines.push('');
      }
    }
    function pushRaw(s) { line.push(s); }
    function pushSpace() {
      if (line.length && !/[\s(.]$/.test(line[line.length - 1])) line.push(' ');
    }
    function trimTrailingSpace() {
      if (line.length && line[line.length - 1] === ' ') line.pop();
    }

    function isBlockOpen(idx) {
      if (tokens[idx].type !== T.PAREN_OPEN) return false;
      for (var j = idx - 1; j >= 0; j--) {
        var pt = tokens[j];
        if (pt.type === T.KEYWORD) {
          var kw = pt.value.toUpperCase();
          if (['FROM', 'JOIN', 'INNER', 'LEFT', 'RIGHT', 'FULL', 'CROSS',
               'ON', 'IN', 'WHERE', 'HAVING', 'AND', 'OR', 'UPDATE', 'INTO',
               'BY', 'VALUES', 'SET'].indexOf(kw) !== -1) return true;
          return false;
        }
        if (pt.type === T.COMMA || pt.type === T.OPERATOR || pt.type === T.PAREN_OPEN) return true;
        if (pt.type === T.IDENT || pt.type === T.FUNCTION || pt.type === T.QUOTED_IDENT || pt.type === T.PAREN_CLOSE) return false;
        return true;
      }
      return true;
    }

    function prevSignificant(i) {
      for (var j = i - 1; j >= 0; j--) {
        if (tokens[j].type !== T.WHITESPACE) return tokens[j];
      }
      return null;
    }

    var i = 0;
    while (i < tokens.length) {
      var tok = tokens[i];
      var type = tok.type;
      var val = tok.value;
      var upper = val.toUpperCase();
      var next = tokens[i + 1];

      // ---------- 注释：独占一行 ----------
      if (type === T.COMMENT) {
        if (line.length) emitLine();
        line.push(val);
        emitLine();
        i++;
        continue;
      }

      // ---------- 括号 ----------
      if (type === T.PAREN_OPEN) {
        var prev = prevSignificant(i);
        var isFunc = prev && (prev.type === T.IDENT || prev.type === T.FUNCTION ||
          prev.type === T.QUOTED_IDENT || prev.type === T.PAREN_CLOSE);
        var block = !isFunc && isBlockOpen(i);
        if (block) {
          pushSpace();
          pushRaw('(');
          parenStack.push({ multiline: true });
          emitLine();
          indent++;
        } else {
          pushRaw('(');
          parenStack.push({ multiline: false });
        }
        i++;
        continue;
      }

      if (type === T.PAREN_CLOSE) {
        var frame = parenStack.length ? parenStack.pop() : null;
        if (frame && frame.multiline) {
          if (line.length) emitLine();
          indent--;
          var pad = '';
          for (var k = 0; k < indent; k++) pad += cfg.indent;
          line.push(pad + ')');
          emitLine();
        } else {
          trimTrailingSpace();
          pushRaw(')');
        }
        i++;
        continue;
      }

      // ---------- 逗号 ----------
      if (type === T.COMMA) {
        if (cfg.commaFirst) {
          if (line.length) emitLine();
          var padC = '';
          for (var c = 0; c < indent; c++) padC += cfg.indent;
          line.push(padC + ',');
          emitLine();
        } else {
          pushRaw(',');
          if (next && next.type !== T.PAREN_CLOSE) {
            if (line.length) emitLine();
          }
        }
        i++;
        continue;
      }

      // ---------- 分号 ----------
      if (type === T.SEMICOLON) {
        trimTrailingSpace();
        pushRaw(';');
        if (line.length) emitLine();
        i++;
        continue;
      }

      // ---------- 关键字 ----------
      if (type === T.KEYWORD) {
        var word = applyCase(val, cfg.keywordCase);

        // BY：跟随 GROUP / ORDER
        if (upper === 'BY') {
          pushSpace();
          pushRaw(word);
          i++;
          continue;
        }

        // ON / USING：跟随 JOIN 行
        if (upper === 'ON' || upper === 'USING') {
          pushSpace();
          pushRaw(word);
          i++;
          continue;
        }

        // JOIN 组合：LEFT JOIN / INNER JOIN 等同行
        if (JOIN_MODS.indexOf(upper) !== -1 && next &&
            next.type === T.KEYWORD && next.value.toUpperCase() === 'JOIN') {
          if (line.length) emitLine();
          if (inList) { indent--; inList = false; }
          pushRaw(word);
          pushSpace();
          pushRaw(applyCase('JOIN', cfg.keywordCase));
          i += 2;
          continue;
        }
        if (upper === 'JOIN') {
          if (line.length) emitLine();
          if (inList) { indent--; inList = false; }
          pushRaw(word);
          i++;
          continue;
        }

        // AND / OR：换行（保持在 WHERE 内不缩进）
        if (upper === 'AND' || upper === 'OR') {
          if (line.length) emitLine();
          pushRaw(word);
          i++;
          continue;
        }

        // 内容型子句：SELECT 行保持当前缩进，其后列列表缩进 +1
        if (CONTENT_SET[upper]) {
          if (line.length) emitLine();
          if (inList) { indent--; inList = false; }
          // 记录 SELECT 关键字所在缩进，立即输出该行后再对列表缩进
          var selectIndent = indent;
          var padS = '';
          for (var si = 0; si < selectIndent; si++) padS += cfg.indent;
          line.push(padS + word);
          emitLine();
          indent++;
          inList = true;
          i++;
          continue;
        }

        // 段型子句：换行并结束列表缩进
        if (SECTION_SET[upper]) {
          if (line.length) emitLine();
          if (inList) { indent--; inList = false; }
          pushRaw(word);
          i++;
          continue;
        }

        // 其他关键字（AS, IN, IS, NULL, DESC...）
        pushSpace();
        pushRaw(word);
        i++;
        continue;
      }

      // ---------- 点：紧贴 ----------
      if (type === T.DOT) {
        pushRaw('.');
        i++;
        continue;
      }

      // ---------- 运算符 ----------
      if (type === T.OPERATOR) {
        if (cfg.spaces) pushSpace();
        pushRaw(val);
        if (cfg.spaces) pushSpace();
        i++;
        continue;
      }

      // ---------- 其他 token ----------
      if (type === T.STRING || type === T.NUMBER || type === T.IDENT ||
          type === T.QUOTED_IDENT || type === T.PARAM || type === T.FUNCTION) {
        pushSpace();
        pushRaw(val);
        i++;
        continue;
      }

      pushRaw(val);
      i++;
    }

    if (line.length) emitLine();

    // 清理多余空行
    var clean = [];
    var prevEmpty = false;
    lines.forEach(function (l) {
      var isEmpty = l.trim() === '';
      if (isEmpty && prevEmpty) return;
      clean.push(l);
      prevEmpty = isEmpty;
    });
    while (clean.length && clean[0].trim() === '') clean.shift();
    while (clean.length && clean[clean.length - 1].trim() === '') clean.pop();

    return { sql: clean.join('\n'), error: null };
  }

  /**
   * 压缩模式：去除多余空白（保留注释与字符串内容）。
   */
  function minify(sql) {
    var rawTokens = SQLTokenizer.tokenize(sql);
    var out = [];
    var prev = null;
    rawTokens.forEach(function (t) {
      if (t.type === T.WHITESPACE) return;
      if (t.type === T.COMMENT) {
        if (out.length) out.push(' ');
        out.push(t.value);
        prev = ' ';
        return;
      }
      var v = t.value;
      var need = false;
      if (prev != null) {
        var a = prev, b = v;
        var wordA = /[A-Za-z0-9_$"`'\]]$/.test(a);
        var wordB = /^[A-Za-z0-9_$"`'[]/.test(b);
        if (wordA && wordB) need = true;
        else if (/^[+\-*/%<>=!&|^~]$/.test(a) && wordB) need = true;
        else if (wordA && /^[+\-*/%<>=!&|^~]/.test(b)) need = true;
      }
      if (need) out.push(' ');
      out.push(v);
      prev = v;
    });
    return out.join('').trim();
  }

  return {
    DEFAULTS: DEFAULTS,
    format: format,
    minify: minify
  };
});
