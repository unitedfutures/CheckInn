-- 施設テーブルにアンケート設問設定を追加
ALTER TABLE public.facilities
  ADD COLUMN IF NOT EXISTS survey_config JSONB NOT NULL DEFAULT '{
    "standard": {
      "overall":     true,
      "cleanliness": true,
      "facilities":  true,
      "location":    true,
      "revisit":     false,
      "comment":     true
    },
    "custom": []
  }'::jsonb;

-- アンケート回答テーブル
CREATE TABLE IF NOT EXISTS public.survey_responses (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  facility_id      UUID NOT NULL REFERENCES public.facilities(id) ON DELETE CASCADE,
  user_id          UUID NOT NULL,              -- 施設オーナーのID（RLS用）
  respondent_name  TEXT,
  respondent_email TEXT,
  stay_checkin     DATE,
  stay_checkout    DATE,
  answers          JSONB NOT NULL DEFAULT '{}',
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS
ALTER TABLE public.survey_responses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "オーナーのみ参照可" ON public.survey_responses
  FOR SELECT USING (auth.uid() = user_id);

-- 匿名ユーザーから INSERT 許可（公開フォーム用）
CREATE POLICY "誰でも回答可" ON public.survey_responses
  FOR INSERT WITH CHECK (true);
