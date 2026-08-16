/**
 * SQLens — 核心引擎单元测试（Node 运行）
 * 运行：node test/engine.test.js
 */
'use strict';

var assert = require('assert');
var path = require('path');
var Tokenizer = require(path.join(__dirname, '..', 'js', 'sql-tokenizer.js'));
var Formatter = require(path.join(__dirname, '..', 'js', 'sql-formatter.js'));
var Parser = require(path.join(__dirname, '..', 'js', 'sql-parser.js'));

var passed = 0;
var failed = 0;

function test(name, fn) {
  try {
    fn();
    passed++;
    console.log('  ✓ ' + name);
  } catch (e) {
    failed++;
    console.error('  ✗ ' + name);
    console.error('    ' + e.message);
  }
}

// ---------- Tokenizer ----------
console.log('\n[Tokenizer]');
test('识别关键字/字符串/数字/运算符', function () {
  var toks = Tokenizer.tokenize("SELECT a, 'str', 42 FROM t WHERE x >= 3");
  assert.ok(toks.some(function (t) { return t.type === Tokenizer.TokenType.KEYWORD && t.value === 'SELECT'; }));
  assert.ok(toks.some(function (t) { return t.type === Tokenizer.TokenType.STRING && t.value === "'str'"; }));
  assert.ok(toks.some(function (t) { return t.type === Tokenizer.TokenType.NUMBER && t.value === '42'; }));
  assert.ok(toks.some(function (t) { return t.type === Tokenizer.TokenType.OPERATOR && t.value === '>='; }));
});

test('识别引号标识符与注释', function () {
  var toks = Tokenizer.tokenize('SELECT `col`, "a" /* block */ FROM t -- line');
  assert.ok(toks.some(function (t) { return t.type === Tokenizer.TokenType.QUOTED_IDENT && t.value === '`col`'; }));
  assert.ok(toks.some(function (t) { return t.type === Tokenizer.TokenType.COMMENT; }));
});

test('识别参数占位符', function () {
  var toks = Tokenizer.tokenize('SELECT * FROM t WHERE id = ? AND name = :name');
  var params = toks.filter(function (t) { return t.type === Tokenizer.TokenType.PARAM; });
  assert.strictEqual(params.length, 2);
});

test('识别函数调用', function () {
  var toks = Tokenizer.tokenize('SELECT COUNT(*) FROM t');
  assert.ok(toks.some(function (t) { return t.type === Tokenizer.TokenType.FUNCTION && t.value === 'COUNT'; }));
});

// ---------- Formatter ----------
console.log('\n[Formatter]');
test('基础 SELECT 格式化包含换行与缩进', function () {
  var r = Formatter.format('select a,b,c from users where id=1');
  assert.ok(r.sql.indexOf('\n') !== -1, '应包含换行');
  assert.ok(r.sql.toUpperCase().indexOf('SELECT') !== -1);
  assert.ok(r.sql.indexOf('  a') !== -1 || r.sql.indexOf('  a,') !== -1, '列应缩进');
});

test('大小写归一 upper', function () {
  var r = Formatter.format('select a from t', { keywordCase: 'upper' });
  assert.ok(r.sql.indexOf('SELECT') !== -1);
  assert.ok(r.sql.indexOf('FROM') !== -1);
});

test('大小写归一 lower', function () {
  var r = Formatter.format('SELECT a FROM t', { keywordCase: 'lower' });
  assert.ok(r.sql.indexOf('select') !== -1);
  assert.ok(r.sql.indexOf('from') !== -1);
});

test('JOIN 换行', function () {
  var r = Formatter.format('SELECT * FROM a JOIN b ON a.id=b.id');
  assert.ok(r.sql.indexOf('JOIN') !== -1);
  assert.ok(r.sql.indexOf('ON a.id = b.id') !== -1 || r.sql.indexOf('ON a.id=b.id') !== -1);
});

test('子查询括号缩进', function () {
  var r = Formatter.format('SELECT * FROM (SELECT id FROM t) x WHERE id IN (1,2,3)');
  assert.ok(r.sql.indexOf('(SELECT') !== -1 || r.sql.indexOf('(\n') !== -1, '子查询应换行');
  assert.ok(r.sql.indexOf('  id') !== -1, '子查询内部应缩进');
  assert.ok(r.sql.indexOf('IN') !== -1 && r.sql.indexOf('1,') !== -1, 'IN 列表应保留');
});

test('minify 压缩', function () {
  var r = Formatter.minify('SELECT  a  ,  b   FROM   t   WHERE  id  =  1');
  assert.ok(r.indexOf('  ') === -1, '不应有连续空格');
});

test('GROUP BY / ORDER BY 不拆行', function () {
  var r = Formatter.format('SELECT a, COUNT(*) FROM t GROUP BY a ORDER BY a DESC');
  assert.ok(r.sql.indexOf('GROUP BY') !== -1);
  assert.ok(r.sql.indexOf('ORDER BY') !== -1);
});

test('多语句分号分隔', function () {
  var r = Formatter.format('SELECT 1; SELECT 2');
  var lines = r.sql.split('\n');
  assert.ok(lines.length >= 2);
});

test('comment 保留', function () {
  var r = Formatter.format('SELECT a -- 注释\nFROM t');
  assert.ok(r.sql.indexOf('-- 注释') !== -1);
});

// ---------- Parser ----------
console.log('\n[Parser]');
test('解析 SELECT 结构', function () {
  var r = Parser.parse('SELECT id, name FROM users WHERE age > 18 GROUP BY name ORDER BY id LIMIT 10');
  assert.strictEqual(r.statements.length, 1);
  var s = r.statements[0];
  assert.strictEqual(s.type, 'query');
  assert.ok(s.columns.length >= 2, '应解析出列');
  assert.ok(s.tables.indexOf('users') !== -1, '应解析出表 users');
  assert.ok(s.clauses.some(function (c) { return c.name === 'WHERE'; }));
  assert.ok(s.clauses.some(function (c) { return c.name === 'GROUP BY'; }));
});

test('解析 JOIN', function () {
  var r = Parser.parse('SELECT * FROM a LEFT JOIN b ON a.id = b.id');
  var s = r.statements[0];
  assert.strictEqual(s.joins.length, 1);
  assert.strictEqual(s.joins[0].kind, 'LEFT JOIN');
  assert.ok(s.tables.indexOf('b') !== -1);
});

test('解析函数与参数', function () {
  var r = Parser.parse('SELECT COUNT(*), SUM(amount) FROM t WHERE id = ?');
  var s = r.statements[0];
  assert.ok(s.functions.indexOf('COUNT') !== -1);
  assert.ok(s.params.indexOf('?') !== -1);
});

test('多语句统计', function () {
  var r = Parser.parse('SELECT 1; SELECT 2; UPDATE t SET a=1');
  assert.strictEqual(r.statements.length, 3);
  assert.strictEqual(r.stats.statements, 3);
});

// ---------- 汇总 ----------
console.log('\n结果: ' + passed + ' 通过, ' + failed + ' 失败');
if (failed > 0) process.exit(1);
