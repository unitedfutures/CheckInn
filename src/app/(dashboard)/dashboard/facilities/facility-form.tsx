'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export function FacilityForm() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    name: '', address: '', beds24_property_id: '', airhost_property_id: '',
    remote_lock_device_id: '', emergency_contact: '', checkin_instructions: '',
  })
  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    const res = await fetch('/api/facilities', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    if (res.ok) { setOpen(false); setForm({ name: '', address: '', beds24_property_id: '', airhost_property_id: '', remote_lock_device_id: '', emergency_contact: '', checkin_instructions: '' }); router.refresh() }
    setLoading(false)
  }

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <Plus size={16} className="mr-1.5" /> 施設を追加
      </Button>

      {open && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-semibold text-gray-900">施設を追加</h3>
              <button onClick={() => setOpen(false)}><X size={20} className="text-gray-400" /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input id="name" label="施設名 *" placeholder="例：コテージ八ヶ岳" value={form.name} onChange={e => set('name', e.target.value)} required />
              <Input id="address" label="住所" placeholder="長野県諏訪郡原村〇〇" value={form.address} onChange={e => set('address', e.target.value)} />
              <Input id="beds24_property_id" label="Beds24 Property ID" placeholder="例：12345" value={form.beds24_property_id} onChange={e => set('beds24_property_id', e.target.value)} />
              <Input id="airhost_property_id" label="Airhost Property ID" placeholder="例：prop_xxxx" value={form.airhost_property_id} onChange={e => set('airhost_property_id', e.target.value)} />
              <Input id="remote_lock_device_id" label="RemoteLOCK Device ID" placeholder="例：device_xxxx" value={form.remote_lock_device_id} onChange={e => set('remote_lock_device_id', e.target.value)} />
              <Input id="emergency_contact" label="緊急連絡先" placeholder="例：090-0000-0000（管理人）" value={form.emergency_contact} onChange={e => set('emergency_contact', e.target.value)} />
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">チェックイン案内文</label>
                <textarea className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" rows={3}
                  placeholder="駐車場は施設正面の〇〇です..." value={form.checkin_instructions} onChange={e => set('checkin_instructions', e.target.value)} />
              </div>
              <div className="flex gap-3 pt-2">
                <Button type="button" variant="outline" className="flex-1" onClick={() => setOpen(false)}>キャンセル</Button>
                <Button type="submit" className="flex-1" loading={loading}>追加する</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
