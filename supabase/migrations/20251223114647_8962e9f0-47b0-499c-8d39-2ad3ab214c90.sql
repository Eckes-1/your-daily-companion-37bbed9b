-- Enable realtime for transactions table
ALTER PUBLICATION supabase_realtime ADD TABLE public.transactions;

-- Also enable for transaction_tags to sync tags in realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.transaction_tags;