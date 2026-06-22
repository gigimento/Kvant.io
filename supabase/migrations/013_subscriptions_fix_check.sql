ALTER TABLE subscriptions DROP CONSTRAINT IF EXISTS subscriptions_product_check;

ALTER TABLE subscriptions
ADD CONSTRAINT subscriptions_product_check
CHECK (product IN ('reports', 'seo', 'combined'));
