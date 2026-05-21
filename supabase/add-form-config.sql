-- フォーム設定カラムを facilities に追加
ALTER TABLE public.facilities
  ADD COLUMN IF NOT EXISTS form_config JSONB NOT NULL DEFAULT '{
    "face_photo": "optional",
    "address": "required",
    "phone": "required",
    "num_guests": "required"
  }'::jsonb;
