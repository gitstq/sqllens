/**
 * SQLens — 模板库
 * 常用 SQL 示例模板，便于快速开始。
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.SQLTemplates = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  return {
    'select-basic': {
      name: 'SELECT 基础查询',
      sql: "SELECT id, name, email, created_at\nFROM users\nWHERE status = 'active'\nORDER BY created_at DESC\nLIMIT 100"
    },
    'select-join': {
      name: 'JOIN 多表连接',
      sql: "SELECT u.id, u.name, o.order_no, o.total_amount\nFROM users u\nINNER JOIN orders o ON o.user_id = u.id\nLEFT JOIN addresses a ON a.user_id = u.id\nWHERE o.status = 'paid'\n  AND o.total_amount >= 100\nORDER BY o.created_at DESC"
    },
    'select-group': {
      name: '聚合分组查询',
      sql: "SELECT status, COUNT(*) AS order_count, SUM(total_amount) AS revenue\nFROM orders\nWHERE created_at >= '2025-01-01'\nGROUP BY status\nHAVING COUNT(*) > 10\nORDER BY revenue DESC"
    },
    'subquery': {
      name: '子查询',
      sql: "SELECT id, name\nFROM users\nWHERE id IN (\n  SELECT user_id\n  FROM orders\n  WHERE total_amount > 500\n)\nAND department_id = (\n  SELECT id FROM departments WHERE code = 'ENG'\n)"
    },
    'case-when': {
      name: 'CASE WHEN 分支',
      sql: "SELECT\n  id,\n  name,\n  CASE\n    WHEN score >= 90 THEN 'A'\n    WHEN score >= 80 THEN 'B'\n    WHEN score >= 70 THEN 'C'\n    ELSE 'D'\n  END AS grade\nFROM students\nORDER BY score DESC"
    },
    'window': {
      name: '窗口函数',
      sql: "SELECT\n  id,\n  department_id,\n  salary,\n  ROW_NUMBER() OVER (PARTITION BY department_id ORDER BY salary DESC) AS rank_in_dept,\n  AVG(salary) OVER (PARTITION BY department_id) AS dept_avg\nFROM employees"
    },
    'insert': {
      name: 'INSERT 插入',
      sql: "INSERT INTO users (name, email, status)\nVALUES\n  ('张伟', 'zhangwei@example.com', 'active'),\n  ('李娜', 'lina@example.com', 'active'),\n  ('王强', 'wangqiang@example.com', 'pending')"
    },
    'update': {
      name: 'UPDATE 更新',
      sql: "UPDATE users\nSET status = 'vip', updated_at = NOW()\nWHERE total_spent > 10000\n  AND status <> 'vip'"
    },
    'create-table': {
      name: 'CREATE TABLE 建表',
      sql: "CREATE TABLE orders (\n  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,\n  order_no VARCHAR(32) NOT NULL,\n  user_id BIGINT UNSIGNED NOT NULL,\n  total_amount DECIMAL(10, 2) NOT NULL DEFAULT 0.00,\n  status ENUM('pending', 'paid', 'shipped', 'done') NOT NULL DEFAULT 'pending',\n  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,\n  PRIMARY KEY (id),\n  UNIQUE KEY uk_order_no (order_no),\n  KEY idx_user_id (user_id)\n) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4"
    },
    'cte': {
      name: 'CTE 公用表表达式',
      sql: "WITH active_users AS (\n  SELECT id, name FROM users WHERE status = 'active'\n),\nuser_orders AS (\n  SELECT user_id, COUNT(*) AS cnt\n  FROM orders\n  GROUP BY user_id\n)\nSELECT au.name, uo.cnt\nFROM active_users au\nJOIN user_orders uo ON uo.user_id = au.id\nWHERE uo.cnt > 5"
    }
  };
});
