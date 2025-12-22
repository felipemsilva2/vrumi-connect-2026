-- ============================================
-- SCRIPT DE AUDITORIA PÓS-MIGRAÇÃO (CONSOLIDADO)
-- Execute no Supabase Dashboard > SQL Editor
-- ============================================

SELECT * FROM (
    -- 1. Bookings pagos sem transaction associada
    SELECT 'INV-01: Bookings pagos sem transaction' as verificacao, COUNT(*)::int as total
    FROM bookings b
    LEFT JOIN instructor_transactions t ON t.booking_id = b.id
    WHERE b.payment_status = 'completed' AND t.id IS NULL
    
    UNION ALL
    
    -- 2. Instrutores aprovados com dados incompletos
    SELECT 'INV-02: Instrutores aprovados incompletos', COUNT(*)::int
    FROM instructors
    WHERE status = 'approved'
      AND (stripe_account_id IS NULL OR stripe_onboarding_complete IS NOT TRUE)
    
    UNION ALL
    
    -- 3. Bookings com status/payment_status conflitantes
    SELECT 'INV-03: Bookings com estados conflitantes', COUNT(*)::int
    FROM bookings
    WHERE (status = 'confirmed' AND payment_status != 'completed')
       OR (status = 'completed' AND payment_status != 'completed')
       OR (status = 'pending' AND payment_status = 'completed')
    
    UNION ALL
    
    -- 4. Bookings sem instrutor válido
    SELECT 'ORF-02a: Bookings sem instrutor', COUNT(*)::int
    FROM bookings b
    LEFT JOIN instructors i ON b.instructor_id = i.id
    WHERE i.id IS NULL AND b.instructor_id IS NOT NULL
    
    UNION ALL
    
    -- 5. Transactions sem booking válido
    SELECT 'ORF-02b: Transactions sem booking', COUNT(*)::int
    FROM instructor_transactions t
    LEFT JOIN bookings b ON t.booking_id = b.id
    WHERE b.id IS NULL AND t.booking_id IS NOT NULL
    
    UNION ALL
    
    -- 6. Bookings pendentes antigos
    SELECT 'ORF-01: Bookings pendentes antigos (>24h)', COUNT(*)::int
    FROM bookings
    WHERE payment_status = 'pending'
      AND created_at < NOW() - INTERVAL '24 hours'
    
    UNION ALL
    
    -- 7. CPFs duplicados
    SELECT 'VAL-01: CPFs duplicados', COUNT(*)::int
    FROM (SELECT cpf FROM instructors WHERE cpf IS NOT NULL GROUP BY cpf HAVING COUNT(*) > 1) x
    
    UNION ALL
    
    -- 8. Status inválidos em bookings
    SELECT 'CTR-02a: Status inválidos em bookings', COUNT(*)::int
    FROM bookings WHERE status NOT IN ('pending', 'confirmed', 'completed', 'cancelled')
    
    UNION ALL
    
    -- 9. Payment status inválidos
    SELECT 'CTR-02b: Payment status inválidos', COUNT(*)::int
    FROM bookings WHERE payment_status NOT IN ('pending', 'completed', 'failed', 'refunded')
    
    UNION ALL
    
    -- 10. Status inválidos em instructors
    SELECT 'CTR-02c: Status inválidos em instructors', COUNT(*)::int
    FROM instructors WHERE status NOT IN ('pending', 'approved', 'rejected', 'suspended')
    
    UNION ALL
    
    -- 11. Preços inválidos em instrutores
    SELECT 'VAL-03a: Instrutores com preço inválido', COUNT(*)::int
    FROM instructors WHERE price_per_lesson <= 0 OR price_per_lesson > 10000
    
    UNION ALL
    
    -- 12. Preços inválidos em bookings
    SELECT 'VAL-03b: Bookings com preço inválido', COUNT(*)::int
    FROM bookings WHERE price <= 0 OR price > 10000
) AS audit_results
ORDER BY verificacao;

-- RESULTADO: Linhas com total > 0 indicam problemas a corrigir
