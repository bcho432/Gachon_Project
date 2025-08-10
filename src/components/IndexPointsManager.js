import React, { useEffect, useState } from 'react'
import { getIndexPointsConfig, setIndexPointsConfig, recalcAllPublicationIndexPoints } from '../utils/itemPointsManager'
import toast from 'react-hot-toast'

const IndexPointsManager = () => {
  const [config, setConfig] = useState({ SSCI: 0, SCOPUS: 0, KCI: 0, Other: 0 })
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      try {
        const cfg = await getIndexPointsConfig()
        setConfig(cfg)
      } catch (e) {
        toast.error('Failed to load index points')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const handleSave = async (key) => {
    setSaving(true)
    try {
      const points = Number(config[key]) || 0
      const res = await setIndexPointsConfig(key, points)
      if (res.success) {
        // After update, trigger recalculation for all related items
        const recalc = await recalcAllPublicationIndexPoints()
        if (recalc.success) {
          toast.success(`${key} points updated. Recalculated ${recalc.updated} item(s).`)
        } else {
          toast.success(`${key} points updated`)
          toast.error('Recalculation failed for some items')
        }
      } else {
        toast.error(`Failed to update ${key}`)
      }
    } catch (e) {
      toast.error('Save failed')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <div className="p-4 text-sm text-gray-600">Loading index points...</div>
  }

  const Row = ({ label }) => (
    <div className="flex items-center gap-3">
      <label className="w-24 text-sm text-gray-700">{label}</label>
      <input
        type="number"
        value={config[label]}
        onChange={(e) => setConfig((c) => ({ ...c, [label]: e.target.value }))}
        className="w-24 px-2 py-1 border border-gray-300 rounded text-sm"
      />
      <button
        onClick={() => handleSave(label)}
        disabled={saving}
        className="px-3 py-1 text-sm bg-primary-600 text-white rounded hover:bg-primary-700 disabled:opacity-50"
      >
        Save
      </button>
    </div>
  )

  return (
    <div className="p-4 bg-white border border-gray-200 rounded">
      <h3 className="text-md font-semibold mb-3">Research Index Points</h3>
      <div className="font-semibold text-sm text-gray-800 mb-2">Be sure to refresh the page to see recaclulated scoring for users</div>
      <p className="text-xs text-gray-600 mb-3">Select points awarded when a publication's index is set.</p>
      <div className="space-y-2">
        <Row label="SSCI" />
        <Row label="SCOPUS" />
        <Row label="KCI" />
        <Row label="Other" />
      </div>
    </div>
  )
}

export default IndexPointsManager

