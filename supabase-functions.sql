-- ============================================================
-- Your Digital Lift — Supabase SQL Functions
-- ============================================================

-- ============================================================
-- 1. get_dashboard_stats — aggregate KPIs for the dashboard
-- ============================================================
CREATE OR REPLACE FUNCTION get_dashboard_stats()
RETURNS TABLE (
  total_members      bigint,
  active_members     bigint,
  revenue_this_month numeric,
  pending_dues       numeric
) LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_start_of_month date := date_trunc('month', CURRENT_DATE)::date;
  v_end_of_month   date := (date_trunc('month', CURRENT_DATE) + INTERVAL '1 month - 1 day')::date;
BEGIN
  RETURN QUERY
  SELECT
    (SELECT count(*)::bigint FROM members)                                                      AS total_members,
    (SELECT count(*)::bigint FROM members WHERE status = 'active')                              AS active_members,
    (SELECT COALESCE(sum(amount), 0)::numeric
       FROM payments
      WHERE payment_date >= v_start_of_month
        AND payment_date <= (v_end_of_month + INTERVAL '1 day')::timestamptz
        AND status = 'completed')                                                                AS revenue_this_month,
    (SELECT COALESCE(sum(amount_paid - paid.amount), 0)::numeric
       FROM member_subscriptions s
       LEFT JOIN LATERAL (
          SELECT COALESCE(sum(amount), 0) AS amount
            FROM payments p
           WHERE p.subscription_id = s.id AND p.status = 'completed'
       ) paid ON true
      WHERE s.end_date >= CURRENT_DATE
        AND s.payment_status != 'completed')                                                     AS pending_dues;
END;
$$;

-- ============================================================
-- 2. get_revenue_report — daily revenue between two dates
-- ============================================================
CREATE OR REPLACE FUNCTION get_revenue_report(
  p_start_date date,
  p_end_date   date
)
RETURNS TABLE (
  date   date,
  amount numeric
) LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.payment_date::date          AS date,
    COALESCE(sum(p.amount), 0)    AS amount
  FROM payments p
  WHERE p.payment_date::date BETWEEN p_start_date AND p_end_date
    AND p.status = 'completed'
  GROUP BY p.payment_date::date
  ORDER BY p.payment_date::date;
END;
$$;

-- ============================================================
-- 3. get_attendance_today — today's check-ins with member details
-- ============================================================
CREATE OR REPLACE FUNCTION get_attendance_today()
RETURNS TABLE (
  id            uuid,
  member_id     uuid,
  member_code   text,
  member_name   text,
  check_in      timestamptz,
  check_out     timestamptz,
  method        text,
  avatar_url    text,
  gender        text,
  phone         text
) LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  RETURN QUERY
  SELECT
    a.id,
    a.member_id,
    m.member_code,
    p.full_name        AS member_name,
    a.check_in,
    a.check_out,
    a.method,
    p.avatar_url,
    m.gender,
    p.phone
  FROM attendance a
  JOIN members   m ON m.id = a.member_id
  LEFT JOIN profiles p ON p.id = m.profile_id
  WHERE a.check_in::date = CURRENT_DATE
  ORDER BY a.check_in DESC;
END;
$$;

-- ============================================================
-- 4. get_members_expiring_this_month — subscriptions ending within 30 days
-- ============================================================
CREATE OR REPLACE FUNCTION get_members_expiring_this_month()
RETURNS TABLE (
  member_id     uuid,
  member_code   text,
  member_name   text,
  phone         text,
  email         text,
  plan_name     text,
  end_date      date,
  days_remaining int
) LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  RETURN QUERY
  SELECT
    m.id                AS member_id,
    m.member_code,
    p.full_name         AS member_name,
    p.phone,
    p.email,
    mp.name             AS plan_name,
    s.end_date,
    (s.end_date - CURRENT_DATE)::int AS days_remaining
  FROM member_subscriptions s
  JOIN members            m  ON m.id = s.member_id
  LEFT JOIN profiles      p  ON p.id = m.profile_id
  JOIN membership_plans   mp ON mp.id = s.plan_id
  WHERE s.end_date BETWEEN CURRENT_DATE AND (CURRENT_DATE + INTERVAL '30 days')
    AND m.status = 'active'
  ORDER BY s.end_date;
END;
$$;
