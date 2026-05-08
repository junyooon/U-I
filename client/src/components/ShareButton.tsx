import { useState } from 'react'
import { useShareToken, useGenerateShareToken, useRevokeShareToken } from '../api/share'
import { useIsMobile } from '../hooks/useIsMobile'

export default function ShareButton() {
  const isMobile = useIsMobile()
  const { data: shareData } = useShareToken()
  const generateShare = useGenerateShareToken()
  const revokeShare = useRevokeShareToken()
  const [open, setOpen] = useState(false)
  const [copied, setCopied] = useState(false)

  const shareUrl = shareData?.share_token
    ? `${window.location.origin}/share/${shareData.share_token}`
    : null

  function copy() {
    if (!shareUrl) return
    navigator.clipboard.writeText(shareUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen(p => !p)}
        style={{
          background: 'rgba(10,10,22,0.8)',
          border: `1px solid ${open ? 'rgba(147,197,253,0.3)' : 'rgba(255,255,255,0.1)'}`,
          borderRadius: '8px',
          color: open ? '#93c5fd' : '#6b7280',
          fontSize: '13px',
          padding: '8px 14px',
          cursor: 'pointer',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          transition: 'color 0.15s, border-color 0.15s',
        }}
        onMouseEnter={e => { if (!open) e.currentTarget.style.color = '#e5e7eb' }}
        onMouseLeave={e => { if (!open) e.currentTarget.style.color = '#6b7280' }}
      >
        ⎘ Share
        {shareData?.share_token && (
          <span style={{
            fontSize: '9px', fontWeight: 700, letterSpacing: '0.04em',
            color: '#4ade80',
            background: 'rgba(74,222,128,0.12)',
            border: '1px solid rgba(74,222,128,0.25)',
            borderRadius: '3px', padding: '1px 4px',
          }}>ON</span>
        )}
      </button>

      {open && (
        <>
          {/* backdrop to close */}
          <div
            style={{ position: 'fixed', inset: 0, zIndex: 40 }}
            onClick={() => setOpen(false)}
          />
          <div style={{
            position: 'absolute',
            top: isMobile ? undefined : 'calc(100% + 8px)',
            bottom: isMobile ? 'calc(100% + 8px)' : undefined,
            right: 0,
            width: isMobile ? 'calc(100vw - 32px)' : '300px',
            background: '#0d0f1e',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '12px',
            padding: '16px',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
            zIndex: 50,
            boxShadow: '0 16px 48px rgba(0,0,0,0.5)',
          }}>
            <div>
              <p style={{ fontSize: '13px', fontWeight: 600, color: '#e5e7eb', marginBottom: '4px' }}>
                Share your graph
              </p>
              <p style={{ fontSize: '11px', color: '#6b7280', lineHeight: '1.5' }}>
                Anyone with this link sees a view-only version — names and categories only, no contact details.
              </p>
            </div>

            {shareUrl ? (
              <>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <input
                    readOnly
                    value={shareUrl}
                    onFocus={e => e.target.select()}
                    style={{
                      flex: 1, padding: '7px 10px', borderRadius: '6px',
                      border: '1px solid rgba(255,255,255,0.1)',
                      background: 'rgba(255,255,255,0.04)', color: '#9ca3af',
                      fontSize: '11px', outline: 'none', minWidth: 0,
                    }}
                  />
                  <button
                    onClick={copy}
                    style={{
                      flexShrink: 0, padding: '7px 12px', borderRadius: '6px',
                      border: '1px solid rgba(255,255,255,0.1)',
                      background: copied ? 'rgba(74,222,128,0.1)' : 'rgba(255,255,255,0.06)',
                      color: copied ? '#4ade80' : '#9ca3af',
                      fontSize: '12px', cursor: 'pointer', transition: 'all 0.15s',
                    }}
                  >
                    {copied ? '✓ Copied' : '⎘ Copy'}
                  </button>
                </div>
                <button
                  onClick={() => revokeShare.mutate()}
                  disabled={revokeShare.isPending}
                  style={{
                    padding: '7px 0', borderRadius: '6px',
                    border: '1px solid rgba(248,113,113,0.2)',
                    background: 'transparent', color: '#f87171',
                    fontSize: '12px', cursor: 'pointer',
                  }}
                >
                  {revokeShare.isPending ? 'Revoking…' : 'Revoke link'}
                </button>
              </>
            ) : (
              <button
                onClick={() => generateShare.mutate()}
                disabled={generateShare.isPending}
                style={{
                  padding: '9px 0', borderRadius: '6px',
                  border: 'none', background: '#3b82f6',
                  color: '#fff', fontSize: '13px', fontWeight: 600, cursor: 'pointer',
                }}
              >
                {generateShare.isPending ? 'Generating…' : 'Create share link'}
              </button>
            )}
          </div>
        </>
      )}
    </div>
  )
}
