#!/bin/bash

# Notification System - Metrics Report Generator
# Generates a markdown report with metrics for the last 7 and 30 days

set -e

# Database connection (can be overridden via environment variables)
DB_HOST=
DB_PORT=
DB_USER=
DB_NAME= 
DB_PASSWORD=

if [ -z "$DB_PASSWORD" ]; then
  echo "Error: DB_PASSWORD environment variable is required"
  echo "Usage: DB_PASSWORD=your_password ./generate-metrics-report.sh"
  exit 1
fi

# Output file
REPORT_DIR="$(dirname "$0")/../reports"
mkdir -p "$REPORT_DIR"
REPORT_FILE="$REPORT_DIR/metrics-report-$(date +%Y-%m-%d).md"

# Helper function to run queries
run_query() {
  PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -t -A -F'|' -c "$1" 2>/dev/null
}

# Helper function to run queries with headers
run_query_table() {
  PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c "$1" 2>/dev/null
}

echo "Generating metrics report..."

# Start report
cat > "$REPORT_FILE" << 'EOF'
# Notification System - Metrics Report
EOF

echo "Generated: $(date '+%Y-%m-%d %H:%M:%S')" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"

# ============================================================
# SECTION 1: USERS
# ============================================================
echo "## 1. Usuários" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"

# Total users
TOTAL_USERS=$(run_query "SELECT COUNT(*) FROM users;")
TOTAL_TELEGRAM=$(run_query "SELECT COUNT(*) FROM users WHERE channel = 'telegram';")
TOTAL_SLACK=$(run_query "SELECT COUNT(*) FROM users WHERE channel = 'slack';")

echo "### Totais" >> "$REPORT_FILE"
echo "| Métrica | Valor |" >> "$REPORT_FILE"
echo "|---------|-------|" >> "$REPORT_FILE"
echo "| Total de usuários | $TOTAL_USERS |" >> "$REPORT_FILE"
echo "| Telegram | $TOTAL_TELEGRAM |" >> "$REPORT_FILE"
echo "| Slack | $TOTAL_SLACK |" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"

# New users last 7 days
NEW_7D=$(run_query "SELECT COUNT(*) FROM users WHERE created_at >= (NOW() - INTERVAL '7 days')::text;")
NEW_7D_TELEGRAM=$(run_query "SELECT COUNT(*) FROM users WHERE channel = 'telegram' AND created_at >= (NOW() - INTERVAL '7 days')::text;")
NEW_7D_SLACK=$(run_query "SELECT COUNT(*) FROM users WHERE channel = 'slack' AND created_at >= (NOW() - INTERVAL '7 days')::text;")

# New users last 30 days
NEW_30D=$(run_query "SELECT COUNT(*) FROM users WHERE created_at >= (NOW() - INTERVAL '30 days')::text;")
NEW_30D_TELEGRAM=$(run_query "SELECT COUNT(*) FROM users WHERE channel = 'telegram' AND created_at >= (NOW() - INTERVAL '30 days')::text;")
NEW_30D_SLACK=$(run_query "SELECT COUNT(*) FROM users WHERE channel = 'slack' AND created_at >= (NOW() - INTERVAL '30 days')::text;")

# Previous periods for comparison
NEW_7D_PREV=$(run_query "SELECT COUNT(*) FROM users WHERE created_at >= (NOW() - INTERVAL '14 days')::text AND created_at < (NOW() - INTERVAL '7 days')::text;")
NEW_30D_PREV=$(run_query "SELECT COUNT(*) FROM users WHERE created_at >= (NOW() - INTERVAL '60 days')::text AND created_at < (NOW() - INTERVAL '30 days')::text;")

echo "### Novos Usuários" >> "$REPORT_FILE"
echo "| Período | Total | Telegram | Slack | vs Período Anterior |" >> "$REPORT_FILE"
echo "|---------|-------|----------|-------|---------------------|" >> "$REPORT_FILE"
echo "| Últimos 7 dias | $NEW_7D | $NEW_7D_TELEGRAM | $NEW_7D_SLACK | anterior: $NEW_7D_PREV |" >> "$REPORT_FILE"
echo "| Últimos 30 dias | $NEW_30D | $NEW_30D_TELEGRAM | $NEW_30D_SLACK | anterior: $NEW_30D_PREV |" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"

# Peak days (new users)
echo "### Dias com Pico de Cadastros (últimos 30 dias)" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"
run_query "
SELECT
  SUBSTRING(created_at, 1, 10) as dia,
  COUNT(*) as novos_users
FROM users
WHERE created_at >= (NOW() - INTERVAL '30 days')::text
GROUP BY SUBSTRING(created_at, 1, 10)
HAVING COUNT(*) >= 2
ORDER BY novos_users DESC, dia DESC
LIMIT 5;
" | while IFS='|' read -r dia count; do
  if [ -n "$dia" ]; then
    echo "- **$dia**: $count novos usuários" >> "$REPORT_FILE"
  fi
done
echo "" >> "$REPORT_FILE"

# ============================================================
# SECTION 2: ACTIVITY / ENGAGEMENT
# ============================================================
echo "## 2. Atividade / Engajamento" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"

# Active users (received notification in period)
ACTIVE_7D=$(run_query "SELECT COUNT(DISTINCT user_id) FROM notifications WHERE created_at >= NOW() - INTERVAL '7 days';")
ACTIVE_30D=$(run_query "SELECT COUNT(DISTINCT user_id) FROM notifications WHERE created_at >= NOW() - INTERVAL '30 days';")

# Inactive users (is_active = false in user_preferences)
INACTIVE_SUBS=$(run_query "SELECT COUNT(DISTINCT user_id) FROM user_preferences WHERE is_active = false;")

echo "| Métrica | 7 dias | 30 dias |" >> "$REPORT_FILE"
echo "|---------|--------|---------|" >> "$REPORT_FILE"
echo "| Usuários ativos (receberam notificação) | $ACTIVE_7D | $ACTIVE_30D |" >> "$REPORT_FILE"
echo "| Taxa de atividade | $(echo "scale=1; $ACTIVE_7D * 100 / $TOTAL_USERS" | bc)% | $(echo "scale=1; $ACTIVE_30D * 100 / $TOTAL_USERS" | bc)% |" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"
echo "**Usuários com subscrições inativas:** $INACTIVE_SUBS" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"

# ============================================================
# SECTION 3: SLACK WORKSPACES
# ============================================================
echo "## 3. Workspaces Slack" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"

TOTAL_WORKSPACES=$(run_query "SELECT COUNT(*) FROM channel_workspaces WHERE is_active = true;")
NEW_WORKSPACES_7D=$(run_query "SELECT COUNT(*) FROM channel_workspaces WHERE installed_at >= NOW() - INTERVAL '7 days';")
NEW_WORKSPACES_30D=$(run_query "SELECT COUNT(*) FROM channel_workspaces WHERE installed_at >= NOW() - INTERVAL '30 days';")

echo "| Métrica | Valor |" >> "$REPORT_FILE"
echo "|---------|-------|" >> "$REPORT_FILE"
echo "| Total de workspaces ativos | $TOTAL_WORKSPACES |" >> "$REPORT_FILE"
echo "| Novos (7 dias) | $NEW_WORKSPACES_7D |" >> "$REPORT_FILE"
echo "| Novos (30 dias) | $NEW_WORKSPACES_30D |" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"

echo "### Lista de Workspaces" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"
run_query "
SELECT workspace_name, TO_CHAR(installed_at, 'YYYY-MM-DD') as installed
FROM channel_workspaces
WHERE is_active = true
ORDER BY installed_at DESC;
" | while IFS='|' read -r name installed; do
  if [ -n "$name" ]; then
    echo "- **$name** (instalado: $installed)" >> "$REPORT_FILE"
  fi
done
echo "" >> "$REPORT_FILE"

# ============================================================
# SECTION 4: SUBSCRIPTIONS (DAOs)
# ============================================================
echo "## 4. Subscrições (DAOs)" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"

TOTAL_SUBS=$(run_query "SELECT COUNT(*) FROM user_preferences WHERE is_active = true;")
NEW_SUBS_7D=$(run_query "SELECT COUNT(*) FROM user_preferences WHERE is_active = true AND created_at >= (NOW() - INTERVAL '7 days')::text;")
NEW_SUBS_30D=$(run_query "SELECT COUNT(*) FROM user_preferences WHERE is_active = true AND created_at >= (NOW() - INTERVAL '30 days')::text;")
USERS_WITH_SUBS=$(run_query "SELECT COUNT(DISTINCT user_id) FROM user_preferences WHERE is_active = true;")
AVG_SUBS=$(run_query "SELECT ROUND(COUNT(*)::numeric / NULLIF(COUNT(DISTINCT user_id), 0), 2) FROM user_preferences WHERE is_active = true;")

echo "| Métrica | Valor |" >> "$REPORT_FILE"
echo "|---------|-------|" >> "$REPORT_FILE"
echo "| Total de subscrições ativas | $TOTAL_SUBS |" >> "$REPORT_FILE"
echo "| Novas (7 dias) | $NEW_SUBS_7D |" >> "$REPORT_FILE"
echo "| Novas (30 dias) | $NEW_SUBS_30D |" >> "$REPORT_FILE"
echo "| Usuários com subscrições | $USERS_WITH_SUBS |" >> "$REPORT_FILE"
echo "| Média de DAOs por usuário | $AVG_SUBS |" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"

echo "### Ranking de DAOs Mais Seguidas" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"
echo "| DAO | Subscribers |" >> "$REPORT_FILE"
echo "|-----|-------------|" >> "$REPORT_FILE"
run_query "
SELECT dao_id, COUNT(*) as subs
FROM user_preferences
WHERE is_active = true
GROUP BY dao_id
ORDER BY subs DESC;
" | while IFS='|' read -r dao subs; do
  if [ -n "$dao" ]; then
    echo "| $dao | $subs |" >> "$REPORT_FILE"
  fi
done
echo "" >> "$REPORT_FILE"

# ============================================================
# SECTION 5: NOTIFICATIONS
# ============================================================
echo "## 5. Notificações" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"

NOTIF_7D=$(run_query "SELECT COUNT(*) FROM notifications WHERE created_at >= NOW() - INTERVAL '7 days';")
NOTIF_30D=$(run_query "SELECT COUNT(*) FROM notifications WHERE created_at >= NOW() - INTERVAL '30 days';")
NOTIF_7D_PREV=$(run_query "SELECT COUNT(*) FROM notifications WHERE created_at >= NOW() - INTERVAL '14 days' AND created_at < NOW() - INTERVAL '7 days';")
NOTIF_30D_PREV=$(run_query "SELECT COUNT(*) FROM notifications WHERE created_at >= NOW() - INTERVAL '60 days' AND created_at < NOW() - INTERVAL '30 days';")

AVG_NOTIF_7D=$(echo "scale=1; $NOTIF_7D / 7" | bc)
AVG_NOTIF_30D=$(echo "scale=1; $NOTIF_30D / 30" | bc)

echo "| Período | Total | Média/dia | vs Período Anterior |" >> "$REPORT_FILE"
echo "|---------|-------|-----------|---------------------|" >> "$REPORT_FILE"
echo "| Últimos 7 dias | $NOTIF_7D | $AVG_NOTIF_7D | anterior: $NOTIF_7D_PREV |" >> "$REPORT_FILE"
echo "| Últimos 30 dias | $NOTIF_30D | $AVG_NOTIF_30D | anterior: $NOTIF_30D_PREV |" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"

echo "### Por Tipo (últimos 30 dias)" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"
echo "| Tipo | Total |" >> "$REPORT_FILE"
echo "|------|-------|" >> "$REPORT_FILE"
run_query "
SELECT
  CASE
    WHEN event_id ~ '-reminder$' THEN 'reminder'
    WHEN event_id ~ '-finished$' THEN 'finished'
    WHEN event_id ~ '-non-voting-' THEN 'non-voting'
    ELSE 'proposal'
  END as event_type,
  COUNT(*) as total
FROM notifications
WHERE created_at >= NOW() - INTERVAL '30 days'
GROUP BY 1
ORDER BY total DESC;
" | while IFS='|' read -r type count; do
  if [ -n "$type" ]; then
    echo "| $type | $count |" >> "$REPORT_FILE"
  fi
done
echo "" >> "$REPORT_FILE"

echo "### Por Dia da Semana (últimos 30 dias)" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"
echo "| Dia | Notificações |" >> "$REPORT_FILE"
echo "|-----|--------------|" >> "$REPORT_FILE"
run_query "
SELECT
  TO_CHAR(created_at, 'Dy') as day_of_week,
  COUNT(*) as notifications
FROM notifications
WHERE created_at >= NOW() - INTERVAL '30 days'
GROUP BY TO_CHAR(created_at, 'Dy'), EXTRACT(DOW FROM created_at)
ORDER BY EXTRACT(DOW FROM created_at);
" | while IFS='|' read -r day count; do
  if [ -n "$day" ]; then
    echo "| $day | $count |" >> "$REPORT_FILE"
  fi
done
echo "" >> "$REPORT_FILE"

# ============================================================
# SECTION 6: WALLETS
# ============================================================
echo "## 6. Wallets" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"

TOTAL_WALLETS=$(run_query "SELECT COUNT(*) FROM user_addresses WHERE is_active = true;")
NEW_WALLETS_7D=$(run_query "SELECT COUNT(*) FROM user_addresses WHERE is_active = true AND created_at >= (NOW() - INTERVAL '7 days')::text;")
NEW_WALLETS_30D=$(run_query "SELECT COUNT(*) FROM user_addresses WHERE is_active = true AND created_at >= (NOW() - INTERVAL '30 days')::text;")
USERS_WITH_WALLET=$(run_query "SELECT COUNT(DISTINCT user_id) FROM user_addresses WHERE is_active = true;")
PCT_WITH_WALLET=$(echo "scale=1; $USERS_WITH_WALLET * 100 / $TOTAL_USERS" | bc)

echo "| Métrica | Valor |" >> "$REPORT_FILE"
echo "|---------|-------|" >> "$REPORT_FILE"
echo "| Total de wallets conectadas | $TOTAL_WALLETS |" >> "$REPORT_FILE"
echo "| Novas (7 dias) | $NEW_WALLETS_7D |" >> "$REPORT_FILE"
echo "| Novas (30 dias) | $NEW_WALLETS_30D |" >> "$REPORT_FILE"
echo "| Usuários com wallet | $USERS_WITH_WALLET ($PCT_WITH_WALLET%) |" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"

echo "### Wallets Mais Seguidas (por múltiplos usuários)" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"
MULTI_FOLLOWED=$(run_query "
SELECT address, COUNT(DISTINCT user_id) as followers
FROM user_addresses
WHERE is_active = true
GROUP BY address
HAVING COUNT(DISTINCT user_id) > 1
ORDER BY followers DESC;
")

if [ -n "$MULTI_FOLLOWED" ]; then
  echo "| Wallet | Seguidores |" >> "$REPORT_FILE"
  echo "|--------|------------|" >> "$REPORT_FILE"
  echo "$MULTI_FOLLOWED" | while IFS='|' read -r addr followers; do
    if [ -n "$addr" ]; then
      SHORT_ADDR="${addr:0:6}...${addr: -4}"
      echo "| \`$SHORT_ADDR\` | $followers |" >> "$REPORT_FILE"
    fi
  done
else
  echo "_Nenhuma wallet seguida por múltiplos usuários._" >> "$REPORT_FILE"
fi
echo "" >> "$REPORT_FILE"

# ============================================================
# SECTION 7: HIGHLIGHTS
# ============================================================
echo "## 7. Destaques e Anomalias" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"

echo "### Dias com Pico de Notificações (últimos 30 dias)" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"
run_query "
SELECT
  TO_CHAR(created_at, 'YYYY-MM-DD') as dia,
  COUNT(*) as notificacoes
FROM notifications
WHERE created_at >= NOW() - INTERVAL '30 days'
GROUP BY TO_CHAR(created_at, 'YYYY-MM-DD')
ORDER BY notificacoes DESC
LIMIT 5;
" | while IFS='|' read -r dia count; do
  if [ -n "$dia" ]; then
    echo "- **$dia**: $count notificações" >> "$REPORT_FILE"
  fi
done
echo "" >> "$REPORT_FILE"

echo "### Crescimento Mensal (histórico)" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"
echo "| Mês | Novos Usuários | Novas Subscrições |" >> "$REPORT_FILE"
echo "|-----|----------------|-------------------|" >> "$REPORT_FILE"
run_query "
SELECT
  COALESCE(u.month, s.month) as month,
  COALESCE(u.new_users, 0) as new_users,
  COALESCE(s.new_subs, 0) as new_subs
FROM (
  SELECT SUBSTRING(created_at, 1, 7) as month, COUNT(*) as new_users
  FROM users WHERE created_at IS NOT NULL
  GROUP BY SUBSTRING(created_at, 1, 7)
) u
FULL OUTER JOIN (
  SELECT SUBSTRING(created_at, 1, 7) as month, COUNT(*) as new_subs
  FROM user_preferences WHERE created_at IS NOT NULL
  GROUP BY SUBSTRING(created_at, 1, 7)
) s ON u.month = s.month
ORDER BY month;
" | while IFS='|' read -r month users subs; do
  if [ -n "$month" ]; then
    echo "| $month | $users | $subs |" >> "$REPORT_FILE"
  fi
done
echo "" >> "$REPORT_FILE"

# Footer
echo "---" >> "$REPORT_FILE"
echo "_Relatório gerado automaticamente em $(date '+%Y-%m-%d %H:%M:%S')_" >> "$REPORT_FILE"

echo ""
echo "Report generated: $REPORT_FILE"
echo ""
