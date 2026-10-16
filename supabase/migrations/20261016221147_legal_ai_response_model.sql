-- User-selected account-visible model; preserve reservations, quota and pilot budget.
update legal_ai.settings set response_model='gpt-5-mini-2025-08-07', input_rate=0.25, output_rate=2 where id;
