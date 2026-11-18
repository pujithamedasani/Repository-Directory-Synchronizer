import { useState, useEffect } from 'react'
import { Settings as SettingsIcon, Save, RotateCcw } from 'lucide-react'
import toast from 'react-hot-toast'
import { getSettings, updateSettings, resetSettings } from '../services/api'
import Button from '../components/ui/Button'
import Card from '../components/ui/Card'

export default function Settings() {
  const [config, setConfig] = useState({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const loadSettings = async () => {
    setLoading(true)
    try {
      const res = await getSettings()
      setConfig(res.data || {})
    } catch (err) {
      toast.error('Failed to load application settings')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadSettings()
  }, [])

  const handleChange = (key, value) => {
    setConfig(prev => ({ ...prev, [key]: value }))
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      await updateSettings(config)
      toast.success('Settings updated successfully')
    } catch (err) {
      toast.error(err.message || 'Failed to save settings')
    } finally {
      setSaving(false)
    }
  }

  const handleReset = async () => {
    if (!window.confirm('Reset all settings to default values?')) return
    try {
      const res = await resetSettings()
      setConfig(res.data || {})
      toast.success('Settings reset to defaults')
    } catch (err) {
      toast.error('Failed to reset settings')
    }
  }

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto space-y-4">
        {[1, 2, 3].map(i => <div key={i} className="h-24 bg-[#1e1e2a] rounded animate-pulse" />)}
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-slate-100">Application Settings</h2>
          <p className="text-sm text-slate-500">Configure synchronization policies, checksum verification, and defaults.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" icon={RotateCcw} onClick={handleReset}>
            Reset Defaults
          </Button>
          <Button variant="primary" icon={Save} onClick={handleSave} loading={saving}>
            Save Changes
          </Button>
        </div>
      </div>

      <Card className="p-6 space-y-5">
        <h3 className="text-sm font-semibold text-slate-200 border-b border-[#2a2a3a] pb-3">
          Synchronization Defaults
        </h3>

        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm font-medium text-slate-200">Default Sync Mode</div>
            <div className="text-xs text-slate-500">Default strategy when initiating new directory sync</div>
          </div>
          <select
            value={config.default_sync_mode || 'one_way'}
            onChange={(e) => handleChange('default_sync_mode', e.target.value)}
            className="bg-[#1e1e2a] border border-[#2a2a3a] text-slate-200 text-xs rounded-lg px-3 py-1.5 font-mono"
          >
            <option value="one_way">One-Way (Mirror)</option>
            <option value="two_way">Two-Way (Bidirectional)</option>
          </select>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm font-medium text-slate-200">SHA-256 Checksum Verification</div>
            <div className="text-xs text-slate-500">Verify file contents using hashing rather than timestamp only</div>
          </div>
          <input
            type="checkbox"
            checked={config.use_checksum === 'true' || config.use_checksum === true}
            onChange={(e) => handleChange('use_checksum', e.target.checked ? 'true' : 'false')}
            className="rounded text-indigo-600 focus:ring-0"
          />
        </div>

        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm font-medium text-slate-200">Preserve File Timestamps</div>
            <div className="text-xs text-slate-500">Retain original creation and modification timestamps on copy</div>
          </div>
          <input
            type="checkbox"
            checked={config.preserve_timestamps === 'true' || config.preserve_timestamps === true}
            onChange={(e) => handleChange('preserve_timestamps', e.target.checked ? 'true' : 'false')}
            className="rounded text-indigo-600 focus:ring-0"
          />
        </div>

        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm font-medium text-slate-200">Include Hidden Files</div>
            <div className="text-xs text-slate-500">Process hidden files and dotfiles during directory traverse</div>
          </div>
          <input
            type="checkbox"
            checked={config.include_hidden_files === 'true' || config.include_hidden_files === true}
            onChange={(e) => handleChange('include_hidden_files', e.target.checked ? 'true' : 'false')}
            className="rounded text-indigo-600 focus:ring-0"
          />
        </div>
      </Card>
    </div>
  )
}
