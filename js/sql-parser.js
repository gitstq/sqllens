/**
 * SQLens — SQL Structure Parser
 * 轻量级 SQL 结构解析器：从 token 流提取查询组件（SELECT 列、FROM 表、
 * JOIN、WHERE、GROUP BY、ORDER BY、LIMIT 等），用于结构树可视化。
 * 不追求完整 AST，聚焦常用查询结构。
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory(root);
  else root.SQLParser = factory(root);
})(typeof self !== 'undefined' ? self : this, function (root) {
  'use strict';

  var SQLTokenizer = (typeof module === 'object' && module.exports)
    ? require('./sql-tokenizer.js')
    : root.SQLTokenizer;
  var T = SQLTokenizer.TokenType;

  var CLAUSE = {
    SELECT: 'SELECT', FROM: 'FROM', WHERE: 'WHERE', GROUP: 'GROUP BY',
    HAVING: 'HAVING', ORDER: 'ORDER BY', LIMIT: 'LIMIT', OFFSET: 'OFFSET',
    JOIN: 'JOIN', SET: 'SET', VALUES: 'VALUES', INTO: 'INTO',
    UPDATE: 'UPDATE', DELETE: 'DELETE', INSERT: 'INSERT', RETURNING: 'RETURNING'
  };

  var JOIN_WORDS = ['JOIN', 'INNER', 'LEFT', 'RIGHT', 'FULL', 'CROSS'];
  var JOIN_SET = {};
  JOIN_WORDS.forEach(function (w) { JOIN_SET[w] = true; });

  function isJoin(upper) {
    return upper === 'JOIN' || upper === 'INNER' || upper === 'LEFT' ||
      upper === 'RIGHT' || upper === 'FULL' || upper === 'CROSS';
  }

  function joinKind(upper) {
    if (upper === 'JOIN') return 'JOIN';
    if (upper === 'INNER') return 'INNER JOIN';
    if (upper === 'LEFT') return 'LEFT JOIN';
    if (upper === 'RIGHT') return 'RIGHT JOIN';
    if (upper === 'FULL') return 'FULL JOIN';
    if (upper === 'CROSS') return 'CROSS JOIN';
    return upper + ' JOIN';
  }

  function sliceValue(tokens, start, end) {
    var parts = [];
    for (var i = start; i < end && i < tokens.length; i++) {
      var t = tokens[i];
      if (t.type === T.WHITESPACE) continue;
      parts.push(t.value);
    }
    return parts.join(' ');
  }

  /**
   * 解析单个语句（以 ; 或结尾分隔）。
   */
  function parseStatement(tokens) {
    var stmt = {
      type: 'query',         // query | insert | update | delete | create | unknown
      clauses: [],           // [{name, keyword, content, sub}]
      joins: [],             // [{kind, table, alias, on}]
      tables: [],            // 涉及的表（去重）
      columns: [],           // SELECT 列
      functions: [],         // 使用的函数
      params: []             // 参数占位符
    };

    // 找到顶层语句类型
    for (var i = 0; i < tokens.length; i++) {
      var t = tokens[i];
      if (t.type === T.KEYWORD) {
        var u = t.value.toUpperCase();
        if (u === 'SELECT') { stmt.type = 'query'; break; }
        if (u === 'INSERT') { stmt.type = 'insert'; break; }
        if (u === 'UPDATE') { stmt.type = 'update'; break; }
        if (u === 'DELETE') { stmt.type = 'delete'; break; }
        if (u === 'CREATE' || u === 'ALTER' || u === 'DROP' || u === 'TRUNCATE') {
          stmt.type = 'ddl'; break;
        }
      }
    }

    // 提取参数
    tokens.forEach(function (t) {
      if (t.type === T.PARAM) stmt.params.push(t.value);
      if (t.type === T.FUNCTION) stmt.functions.push(t.value);
    });
    if (stmt.params.length) stmt.params = Array.from(new Set(stmt.params));
    if (stmt.functions.length) stmt.functions = Array.from(new Set(stmt.functions));

    // 提取顶层子句（不深入括号）
    var depth = 0;
    var clauseStart = -1;
    var currentClause = null;
    var pendingJoin = null;

    function endClause(endIdx) {
      if (currentClause && clauseStart >= 0) {
        var content = sliceValue(tokens, clauseStart, endIdx);
        var item = {
          name: currentClause,
          content: content
        };
        stmt.clauses.push(item);
        // SELECT 列拆分
        if (currentClause === CLAUSE.SELECT) {
          stmt.columns = splitColumns(tokens, clauseStart, endIdx);
        }
      }
      currentClause = null;
      clauseStart = -1;
    }

    for (var i2 = 0; i2 < tokens.length; i2++) {
      var tk = tokens[i2];
      if (tk.type === T.WHITESPACE) continue;
      if (tk.type === T.PAREN_OPEN) { depth++; continue; }
      if (tk.type === T.PAREN_CLOSE) { if (depth > 0) depth--; continue; }
      if (depth > 0) continue;

      if (tk.type === T.KEYWORD) {
        var u2 = tk.value.toUpperCase();
        var isTop = false;
        var clauseName = null;

        if (u2 === 'SELECT') { isTop = true; clauseName = CLAUSE.SELECT; }
        else if (u2 === 'FROM') { isTop = true; clauseName = CLAUSE.FROM; }
        else if (u2 === 'WHERE') { isTop = true; clauseName = CLAUSE.WHERE; }
        else if (u2 === 'HAVING') { isTop = true; clauseName = CLAUSE.HAVING; }
        else if (u2 === 'LIMIT') { isTop = true; clauseName = CLAUSE.LIMIT; }
        else if (u2 === 'OFFSET') { isTop = true; clauseName = CLAUSE.OFFSET; }
        else if (u2 === 'RETURNING') { isTop = true; clauseName = CLAUSE.RETURNING; }
        else if (u2 === 'SET') { isTop = true; clauseName = CLAUSE.SET; }
        else if (u2 === 'VALUES') { isTop = true; clauseName = CLAUSE.VALUES; }
        else if (u2 === 'INTO') { isTop = true; clauseName = CLAUSE.INTO; }
        else if (u2 === 'UPDATE') { isTop = true; clauseName = CLAUSE.UPDATE; }
        else if (u2 === 'DELETE') { isTop = true; clauseName = CLAUSE.DELETE; }
        else if (u2 === 'INSERT') { isTop = true; clauseName = CLAUSE.INSERT; }
        else if (u2 === 'GROUP') {
          // GROUP BY：看下一个是否 BY
          var nxt = tokens[i2 + 1];
          if (nxt && nxt.type === T.KEYWORD && nxt.value.toUpperCase() === 'BY') {
            isTop = true; clauseName = CLAUSE.GROUP;
          }
        } else if (u2 === 'ORDER') {
          var nxt2 = tokens[i2 + 1];
          if (nxt2 && nxt2.type === T.KEYWORD && nxt2.value.toUpperCase() === 'BY') {
            isTop = true; clauseName = CLAUSE.ORDER;
          }
        } else if (isJoin(u2)) {
          // JOIN 处理：LEFT/RIGHT/INNER/FULL/CROSS 与 JOIN 组合算一次
          endClause(i2);
          var kind;
          var joinWordIdx = i2;
          if (u2 !== 'JOIN') {
            // 修饰词（LEFT 等），需找到其后紧跟的 JOIN
            var jnIdx = i2 + 1;
            while (jnIdx < tokens.length && tokens[jnIdx].type !== T.WHITESPACE &&
                   (tokens[jnIdx].type === T.KEYWORD && tokens[jnIdx].value.toUpperCase() === 'JOIN')) {
              jnIdx++;
            }
            if (jnIdx - 1 >= i2 && tokens[jnIdx - 1].type === T.KEYWORD &&
                tokens[jnIdx - 1].value.toUpperCase() === 'JOIN') {
              kind = joinKind(u2);
              joinWordIdx = jnIdx - 1; // 指向 JOIN
            } else {
              // 孤立修饰词，跳过
              continue;
            }
          } else {
            kind = 'JOIN';
          }
          // 提取表名：从 JOIN 之后开始
          var tableEnd = joinWordIdx + 1;
          while (tableEnd < tokens.length && tokens[tableEnd].type !== T.KEYWORD &&
                 tokens[tableEnd].type !== T.COMMA && tokens[tableEnd].type !== T.PAREN_OPEN &&
                 tokens[tableEnd].type !== T.SEMICOLON) {
            tableEnd++;
          }
          var joinTable = sliceValue(tokens, joinWordIdx + 1, tableEnd);
          var onIdx = -1;
          for (var j = tableEnd; j < tokens.length; j++) {
            if (tokens[j].type === T.KEYWORD && tokens[j].value.toUpperCase() === 'ON') { onIdx = j; break; }
            if (tokens[j].type === T.KEYWORD && !isJoin(tokens[j].value.toUpperCase()) &&
                ['WHERE', 'GROUP', 'ORDER', 'HAVING', 'LIMIT', 'OFFSET', 'ON', 'USING'].indexOf(tokens[j].value.toUpperCase()) === -1 &&
                tokens[j].value.toUpperCase() !== 'AS') { break; }
          }
          var onContent = onIdx >= 0 ? sliceValue(tokens, onIdx + 1, onIdx + 6) : '';
          stmt.joins.push({
            kind: kind,
            table: joinTable,
            on: onContent
          });
          pendingJoin = null;
          i2 = joinWordIdx; // 跳过已处理的 JOIN 词（for 循环会再 +1）
          continue;
        }

        if (isTop && clauseName) {
          endClause(i2);
          // 若为 GROUP BY / ORDER BY，跳过 BY
          var skip = 1;
          if ((u2 === 'GROUP' || u2 === 'ORDER')) skip = 2;
          currentClause = clauseName;
          clauseStart = i2 + skip;
          continue;
        }
      }
    }
    endClause(tokens.length);

    // 提取 FROM 中的表
    var fromClause = null;
    stmt.clauses.forEach(function (c) {
      if (c.name === CLAUSE.FROM) fromClause = c;
    });
    if (fromClause) {
      var words = fromClause.content.split(/\s+/).filter(Boolean);
      // 简单启发式：逗号分隔或空白分隔的标识符作为表名
      var parts = fromClause.content.split(',');
      parts.forEach(function (p) {
        var pw = p.trim().split(/\s+/).filter(Boolean);
        if (pw.length) stmt.tables.push(pw[0]);
      });
    }
    // UPDATE 的表
    stmt.clauses.forEach(function (c) {
      if (c.name === CLAUSE.UPDATE) {
        var uw = c.content.split(/\s+/).filter(Boolean);
        if (uw.length) stmt.tables.push(uw[0]);
      }
      if (c.name === CLAUSE.INTO || c.name === CLAUSE.INSERT) {
        var iw = c.content.split(/\s+/).filter(Boolean);
        if (iw.length) stmt.tables.push(iw[0]);
      }
      if (c.name === CLAUSE.DELETE) {
        var dw = c.content.split(/\s+/).filter(Boolean);
        if (dw.length) stmt.tables.push(dw[0]);
      }
    });
    // JOIN 表
    stmt.joins.forEach(function (jn) {
      var jw = jn.table.split(/\s+/).filter(Boolean);
      if (jw.length) stmt.tables.push(jw[0]);
    });
    stmt.tables = Array.from(new Set(stmt.tables));

    return stmt;
  }

  /**
   * 拆分 SELECT 列（处理函数调用与别名）。
   */
  function splitColumns(tokens, start, end) {
    var cols = [];
    var current = [];
    var depth = 0;
    for (var i = start; i < end; i++) {
      var t = tokens[i];
      if (t.type === T.WHITESPACE) {
        current.push(' ');
        continue;
      }
      if (t.type === T.PAREN_OPEN) { depth++; current.push(t.value); continue; }
      if (t.type === T.PAREN_CLOSE) { if (depth > 0) depth--; current.push(t.value); continue; }
      if (t.type === T.COMMA && depth === 0) {
        cols.push(current.join('').trim());
        current = [];
        continue;
      }
      current.push(t.value);
    }
    if (current.join('').trim()) cols.push(current.join('').trim());
    return cols.filter(function (c) { return c && c !== 'SELECT'; });
  }

  /**
   * 拆分多条语句（按分号），返回每条语句的解析结果。
   */
  function parse(sql) {
    var raw = SQLTokenizer.tokenize(sql);
    var tokens = raw.filter(function (t) { return t.type !== T.WHITESPACE; });
    var statements = [];
    var current = [];
    var depth = 0;

    tokens.forEach(function (t, idx) {
      if (t.type === T.PAREN_OPEN) depth++;
      if (t.type === T.PAREN_CLOSE) { if (depth > 0) depth--; }
      if (t.type === T.SEMICOLON && depth === 0) {
        if (current.length) {
          statements.push(parseStatement(current));
          current = [];
        }
        return;
      }
      current.push(t);
    });
    if (current.length) statements.push(parseStatement(current));

    // 汇总统计
    var stats = { statements: statements.length, tables: [], functions: [], params: [] };
    statements.forEach(function (s) {
      s.tables.forEach(function (tb) { if (stats.tables.indexOf(tb) === -1) stats.tables.push(tb); });
      s.functions.forEach(function (f) { if (stats.functions.indexOf(f) === -1) stats.functions.push(f); });
      s.params.forEach(function (p) { if (stats.params.indexOf(p) === -1) stats.params.push(p); });
    });

    return { statements: statements, stats: stats };
  }

  return {
    parse: parse,
    parseStatement: parseStatement,
    CLAUSE: CLAUSE
  };
});
