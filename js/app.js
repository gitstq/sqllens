/**
 * SQLens — 主应用逻辑
 * 绑定交互：格式化、压缩、复制、语法高亮渲染、结构分析、主题切换。
 */
(function () {
  'use strict';

  var $ = function (id) { return document.getElementById(id); };

  var input = $('input');
  var output = $('output');
  var btnFormat = $('btn-format');
  var btnMinify = $('btn-minify');
  var btnCopy = $('btn-copy');
  var btnTheme = $('btn-theme');
  var btnClear = $('btn-clear');
  var templateSel = $('template');
  var dialectSel = $('dialect');
  var caseSel = $('case');
  var commaFirst = $('commaFirst');
  var highlightChk = $('highlight');
  var inputStats = $('input-stats');
  var outputStats = $('output-stats');
  var analyzerSummary = $('analyzer-summary');
  var structure = $('structure');
  var toastEl = $('toast');
  var app = $('app');

  var TT = SQLTokenizer.TokenType;

  /* ---------------- 工具 ---------------- */

  var toastTimer = null;
  function toast(msg) {
    toastEl.textContent = msg;
    toastEl.classList.add('show');
    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(function () {
      toastEl.classList.remove('show');
    }, 1800);
  }

  function escapeHtml(s) {
    return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  function currentConfig() {
    return {
      dialect: dialectSel.value,
      keywordCase: caseSel.value,
      commaFirst: commaFirst.checked
    };
  }

  /* ---------------- 语法高亮渲染 ---------------- */

  function renderHighlighted(sql) {
    var tokens = SQLTokenizer.tokenize(sql);
    // 重组为行
    var html = '';
    var lineBuf = [];
    var lineNum = 0;

    function flushLine() {
      lineNum++;
      html += '<span class="line"><span class="line-num">' + lineNum + '</span>' + lineBuf.join('') + '</span>';
      lineBuf = [];
    }

    tokens.forEach(function (t) {
      if (t.type === TT.WHITESPACE && t.value.indexOf('\n') !== -1) {
        flushLine();
        return;
      }
      if (t.type === TT.WHITESPACE) {
        // 保留空白，替换为安全的空格
        lineBuf.push(escapeHtml(t.value));
        return;
      }
      var cls = '';
      switch (t.type) {
        case TT.KEYWORD: cls = 'tok-keyword'; break;
        case TT.STRING: cls = 'tok-string'; break;
        case TT.NUMBER: cls = 'tok-number'; break;
        case TT.COMMENT: cls = 'tok-comment'; break;
        case TT.FUNCTION: cls = 'tok-function'; break;
        case TT.OPERATOR: cls = 'tok-operator'; break;
        case TT.QUOTED_IDENT: cls = 'tok-quoted-ident'; break;
        case TT.PARAM: cls = 'tok-param'; break;
        default: cls = 'tok-ident';
      }
      lineBuf.push('<span class="' + cls + '">' + escapeHtml(t.value) + '</span>');
    });
    if (lineBuf.length) flushLine();

    return html;
  }

  function renderPlain(sql) {
    var lines = sql.split('\n');
    var html = '';
    lines.forEach(function (l, i) {
      html += '<span class="line"><span class="line-num">' + (i + 1) + '</span>' + escapeHtml(l) + '</span>';
    });
    return html;
  }

  function renderOutput(sql) {
    if (highlightChk.checked) {
      output.innerHTML = renderHighlighted(sql);
    } else {
      output.innerHTML = renderPlain(sql);
    }
  }

  /* ---------------- 结构分析渲染 ---------------- */

  function renderStructure(parsed) {
    var html = '';
    if (!parsed.statements.length) {
      html = '<div class="struct-empty">无可分析语句</div>';
      structure.innerHTML = html;
      analyzerSummary.textContent = '';
      return;
    }

    var s = parsed.statements[0];
    // 语句类型徽章
    html += '<div class="struct-node"><span class="struct-badge">' +
      escapeHtml(s.type.toUpperCase()) + '</span>' +
      '<span class="struct-content">' + escapeHtml(s.columns.length ? s.columns[0] : '') + '</span></div>';

    // 表
    if (s.tables.length) {
      html += '<div class="struct-section">涉及表</div>';
      s.tables.forEach(function (tb) {
        html += '<div class="struct-node struct-row"><span class="struct-badge table">TABLE</span>' +
          '<span class="struct-content">' + escapeHtml(tb) + '</span></div>';
      });
    }

    // JOIN
    if (s.joins.length) {
      html += '<div class="struct-section">连接</div>';
      s.joins.forEach(function (jn) {
        html += '<div class="struct-node struct-row"><span class="struct-badge">' +
          escapeHtml(jn.kind) + '</span>' +
          '<span class="struct-content">' + escapeHtml(jn.table + (jn.on ? '  ON ' + jn.on : '')) + '</span></div>';
      });
    }

    // 查询子句
    if (s.clauses.length) {
      html += '<div class="struct-section">查询结构</div>';
      s.clauses.forEach(function (c) {
        if (c.name === 'SELECT' || c.name === 'FROM') return; // 已有表格展示
        html += '<div class="struct-node struct-row"><span class="struct-badge keyword">' +
          escapeHtml(c.name) + '</span>' +
          '<span class="struct-content">' + escapeHtml(c.content) + '</span></div>';
      });
    }

    // 函数
    if (s.functions.length) {
      html += '<div class="struct-section">函数</div>';
      html += '<div class="struct-node struct-row"><span class="struct-content">' +
        s.functions.map(function (f) { return '<span class="tok-function">' + escapeHtml(f) + '</span>'; }).join(' · ') +
        '</span></div>';
    }

    // 参数
    if (s.params.length) {
      html += '<div class="struct-section">参数</div>';
      html += '<div class="struct-node struct-row"><span class="struct-content">' +
        s.params.map(function (p) { return '<span class="tok-param">' + escapeHtml(p) + '</span>'; }).join(' · ') +
        '</span></div>';
    }

    structure.innerHTML = html;

    // 汇总
    var summary = parsed.stats.statements + ' 条语句';
    if (parsed.stats.tables.length) summary += ' · ' + parsed.stats.tables.length + ' 张表';
    if (parsed.stats.functions.length) summary += ' · ' + parsed.stats.functions.length + ' 个函数';
    if (parsed.stats.params.length) summary += ' · ' + parsed.stats.params.length + ' 个参数';
    analyzerSummary.textContent = summary;
  }

  /* ---------------- 核心动作 ---------------- */

  function updateInputStats() {
    var text = input.value;
    var lines = text ? text.split('\n').length : 0;
    var chars = text.length;
    inputStats.textContent = lines + ' 行 · ' + chars + ' 字符';
  }

  function updateOutputStats(sql) {
    var lines = sql ? sql.split('\n').length : 0;
    var chars = sql.length;
    outputStats.textContent = lines + ' 行 · ' + chars + ' 字符';
  }

  function runFormat() {
    var sql = input.value;
    if (!sql.trim()) {
      toast('请输入 SQL');
      return;
    }
    try {
      var cfg = currentConfig();
      var result = SQLFormatter.format(sql, cfg);
      renderOutput(result.sql);
      updateOutputStats(result.sql);
      // 结构分析
      var parsed = SQLParser.parse(sql);
      renderStructure(parsed);
      toast('格式化完成');
    } catch (e) {
      toast('解析错误: ' + e.message);
    }
  }

  function runMinify() {
    var sql = input.value;
    if (!sql.trim()) {
      toast('请输入 SQL');
      return;
    }
    try {
      var out = SQLFormatter.minify(sql);
      renderOutput(out);
      updateOutputStats(out);
      toast('压缩完成');
    } catch (e) {
      toast('解析错误: ' + e.message);
    }
  }

  function copyResult() {
    var text = output.innerText || output.textContent || '';
    if (!text.trim()) { toast('无内容可复制'); return; }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(function () {
        toast('已复制到剪贴板');
      }, function () {
        fallbackCopy(text);
      });
    } else {
      fallbackCopy(text);
    }
  }

  function fallbackCopy(text) {
    var ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    try {
      document.execCommand('copy');
      toast('已复制到剪贴板');
    } catch (e) {
      toast('复制失败，请手动选择');
    }
    document.body.removeChild(ta);
  }

  /* ---------------- 主题 ---------------- */

  function toggleTheme() {
    var cur = app.getAttribute('data-theme');
    var next = cur === 'dark' ? 'light' : 'dark';
    app.setAttribute('data-theme', next);
    try {
      localStorage.setItem('sqllens-theme', next);
    } catch (e) { /* ignore */ }
  }

  /* ---------------- 事件绑定 ---------------- */

  btnFormat.addEventListener('click', runFormat);
  btnMinify.addEventListener('click', runMinify);
  btnCopy.addEventListener('click', copyResult);
  btnClear.addEventListener('click', function () {
    input.value = '';
    updateInputStats();
    renderOutput('');
    outputStats.textContent = '';
    structure.innerHTML = '<div class="struct-empty">无可分析语句</div>';
    analyzerSummary.textContent = '';
    input.focus();
  });
  btnTheme.addEventListener('click', toggleTheme);

  input.addEventListener('input', function () {
    updateInputStats();
    // 自动重算结构分析
    var sql = input.value;
    if (sql.trim()) {
      try {
        var parsed = SQLParser.parse(sql);
        renderStructure(parsed);
      } catch (e) { /* ignore */ }
    }
  });

  input.addEventListener('keydown', function (e) {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      runFormat();
    }
    if (e.key === 'Tab') {
      e.preventDefault();
      var start = this.selectionStart, end = this.selectionEnd;
      this.value = this.value.substring(0, start) + '  ' + this.value.substring(end);
      this.selectionStart = this.selectionEnd = start + 2;
      updateInputStats();
    }
  });

  output.addEventListener('click', function () {
    var sel = window.getSelection();
    if (!sel.toString()) {
      // 全选点击的当前行？无需
    }
  });

  // 模板加载
  templateSel.addEventListener('change', function () {
    var key = templateSel.value;
    if (!key) return;
    var t = SQLTemplates[key];
    if (t) {
      input.value = t.sql;
      updateInputStats();
      try {
        var parsed = SQLParser.parse(t.sql);
        renderStructure(parsed);
      } catch (e) { /* ignore */ }
      runFormat();
    }
    templateSel.value = '';
  });

  // 重算配置变化
  [commaFirst, caseSel, highlightChk].forEach(function (el) {
    el.addEventListener('change', function () {
      var sql = input.value;
      if (sql.trim()) runFormat();
    });
  });

  // 初始化
  (function init() {
    // 恢复主题
    try {
      var saved = localStorage.getItem('sqllens-theme');
      if (saved) app.setAttribute('data-theme', saved);
    } catch (e) { /* ignore */ }
    updateInputStats();
    runFormat();
  })();
})();
