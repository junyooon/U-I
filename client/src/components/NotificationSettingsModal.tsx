import { useEffect, useState } from 'react'
import { useNotificationSettings, usePatchNotificationSettings, useSendTestDigest } from '../api/notifications'

interface Props {
  onClose: () => void
}

export default function NotificationSettingsModal({ onClose }: Props) {
  const { data, isLoading } = useNotificationSettings()
  const patch = usePatchNotificationSettings()
  const testDigest = useSendTestDigest()

  const [warnDays, setWarnDays] = useState(30)
  const [alertDays, setAlertDays] = useState(60)
  const [criticalDays, setCriticalDays] = useState(90)
  const [emailDigest, setEmailDigest] = useState(true)
  const [testSent, setTestSent] = useState(false)

  useEffect(() => {
    if (data) {
      setWarnDays(data.global_thresholds.warn_days)
      setAlertDays(data.global_thresholds.alert_days)
      setCriticalDays(data.global_thresholds.critical_days)
      setEmailDigest(data.channels.email_digest)
    }
  }, [data])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  async function handleSave() {
    await patch.mutateAsync({
      warn_days: warnDays,
      alert_days: alertDays,
      critical_days: criticalDays,
      channel_email_digest: emailDigest,
    })
    onClose()
  }

  async function handleTestDigest() {
    await testDigest.mutateAsync()
    setTestSent(true)
  }

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 50,
        background: 'rgba(0,0,0,0.6)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        backdropFilter: 'blur(4px)',
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: '400px', maxWidth: 'calc(100vw - 32px)',
          background: '#0d0f1e',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: '14px',
          padding: '28px',
        }}
        onClick={e => e.stopPropagation()}
      >
        <h2 style={{ color: '#fff', fontSize: '16px', fontWeight: 600, marginBottom: '24px' }}>
          Notification settings
        </h2>

        {isLoading ? (
          <p style={{ color: '#4b5563', fontSize: '13px' }}>Loading…</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {/* Drift thresholds */}
            <div>
              <p style={sectionLabel}>DRIFT THRESHOLDS</p>
              <p style={{ fontSize: '12px', color: '#4b5563', marginBottom: '16px', lineHeight: '1.5' }}>
                Days since last contact before a notification is triggered.
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <ThresholdRow
                  label="Warn"
                  color="#F59E0B"
                  value={warnDays}
                  onChange={setWarnDays}
                />
                <ThresholdRow
                  label="Alert"
                  color="#F97316"
                  value={alertDays}
                  onChange={setAlertDays}
                />
                <ThresholdRow
                  label="Critical"
                  color="#EF4444"
                  value={criticalDays}
                  onChange={setCriticalDays}
                />
              </div>
            </div>

            {/* Channels */}
            <div>
              <p style={sectionLabel}>CHANNELS</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <ToggleRow
                  label="Weekly email digest"
                  description="A summary of contacts drifting beyond your warn threshold"
                  checked={emailDigest}
                  onChange={setEmailDigest}
                />
              </div>
            </div>

            {/* Test digest */}
            {emailDigest && (
              <div style={{
                padding: '12px 14px',
                borderRadius: '8px',
                border: '1px solid rgba(255,255,255,0.07)',
                background: 'rgba(255,255,255,0.03)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '12px',
              }}>
                <p style={{ fontSize: '12px', color: '#6b7280', lineHeight: '1.4' }}>
                  {testSent ? '✓ Digest sent to your email' : 'Send a test digest to verify your email is set up.'}
                </p>
                {!testSent && (
                  <button
                    onClick={handleTestDigest}
                    disabled={testDigest.isPending}
                    style={{
                      flexShrink: 0, padding: '6px 12px', borderRadius: '6px',
                      border: '1px solid rgba(255,255,255,0.1)',
                      background: 'transparent', color: '#9ca3af',
                      fontSize: '12px', cursor: 'pointer', whiteSpace: 'nowrap',
                    }}
                  >
                    {testDigest.isPending ? 'Sending…' : 'Send test'}
                  </button>
                )}
              </div>
            )}

            {/* Actions */}
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <button onClick={onClose} style={cancelStyle}>Cancel</button>
              <button
                onClick={handleSave}
                disabled={patch.isPending}
                style={saveStyle}
              >
                {patch.isPending ? 'Saving…' : 'Save'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function ThresholdRow({ label, color, value, onChange }: {
  label: string
  color: string
  value: number
  onChange: (v: number) => void
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
      <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: color, flexShrink: 0 }} />
      <span style={{ fontSize: '13px', color: '#9ca3af', width: '52px', flexShrink: 0 }}>{label}</span>
      <input
        type="number"
        min={1}
        max={365}
        value={value}
        onChange={e => onChange(Math.max(1, parseInt(e.target.value) || 1))}
        style={{
          width: '64px', padding: '6px 10px', borderRadius: '6px',
          border: '1px solid rgba(255,255,255,0.1)',
          background: 'rgba(255,255,255,0.05)', color: '#fff',
          fontSize: '13px', outline: 'none', textAlign: 'center',
        }}
      />
      <span style={{ fontSize: '12px', color: '#4b5563' }}>days</span>
    </div>
  )
}

function ToggleRow({ label, description, checked, onChange }: {
  label: string
  description: string
  checked: boolean
  onChange: (v: boolean) => void
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px' }}>
      <div>
        <p style={{ fontSize: '13px', color: '#e5e7eb', marginBottom: '2px' }}>{label}</p>
        <p style={{ fontSize: '11px', color: '#4b5563', lineHeight: '1.4' }}>{description}</p>
      </div>
      <button
        onClick={() => onChange(!checked)}
        style={{
          flexShrink: 0,
          width: '36px', height: '20px',
          borderRadius: '10px',
          border: 'none',
          background: checked ? '#3b82f6' : 'rgba(255,255,255,0.1)',
          cursor: 'pointer',
          position: 'relative',
          transition: 'background 0.2s',
        }}
      >
        <span style={{
          position: 'absolute',
          top: '2px',
          left: checked ? '18px' : '2px',
          width: '16px', height: '16px',
          borderRadius: '50%',
          background: '#fff',
          transition: 'left 0.2s',
        }} />
      </button>
    </div>
  )
}

const sectionLabel: React.CSSProperties = {
  fontSize: '10px', fontWeight: 600, letterSpacing: '1.5px',
  color: '#4b5563', marginBottom: '12px',
}
const cancelStyle: React.CSSProperties = {
  padding: '9px 16px', borderRadius: '8px',
  border: '1px solid rgba(255,255,255,0.1)',
  background: 'transparent', color: '#6b7280',
  fontSize: '13px', cursor: 'pointer',
}
const saveStyle: React.CSSProperties = {
  padding: '9px 20px', borderRadius: '8px',
  border: 'none', background: '#3b82f6',
  color: '#fff', fontSize: '13px',
  fontWeight: 600, cursor: 'pointer',
}
