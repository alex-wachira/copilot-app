// ============================================================
// useSurge hook
// Manages surge state: passive detection, crowdsource prompt,
// voice reporting, and live zone fetching.
// ============================================================

import { useState, useEffect, useCallback, useRef } from 'react'
import {
  detectSurgeFromFare,
  logSurgeReport,
  fetchLiveSurgeZones,
  parseVoiceReport,
} from '../lib/surgeDetection'
import { forecastDemand, generateNudge } from '../lib/predictiveModel'

export function useSurge({ driverId, city = 'Chicago', lat = 41.8781, lng = -87.6298 }) {
  const [liveZones, setLiveZones]           = useState([])
  const [showReportPrompt, setShowReport]   = useState(false)
  const [pendingDetection, setPending]      = useState(null)
  const [isListening, setIsListening]       = useState(false)
  const [forecast, setForecast]             = useState(null)
  const [nudge, setNudge]                   = useState(null)
  const [loading, setLoading]               = useState(false)
  const recognitionRef                      = useRef(null)

  // ── Poll live zones every 3 minutes ──────────────────────
  useEffect(() => {
    let mounted = true
    const refresh = async () => {
      const zones = await fetchLiveSurgeZones(city)
      if (mounted) setLiveZones(zones)
    }
    refresh()
    const interval = setInterval(refresh, 3 * 60 * 1000)
    return () => { mounted = false; clearInterval(interval) }
  }, [city])

  // ── Load forecast on mount ────────────────────────────────
  useEffect(() => {
    let mounted = true
    const loadForecast = async () => {
      setLoading(true)
      const result = await forecastDemand({ lat, lng, city })
      if (mounted) {
        setForecast(result)
        setNudge(generateNudge({ ...result, city }))
        setLoading(false)
      }
    }
    loadForecast()
    return () => { mounted = false }
  }, [lat, lng, city])

  // ── Called when driver accepts a ride ─────────────────────
  const onRideAccepted = useCallback(async ({ acceptedFare, estimatedMiles, neighborhood }) => {
    const detection = detectSurgeFromFare({ acceptedFare, estimatedMiles, city })

    if (!detection.isSurge) {
      // Silently log "no surge" with high confidence
      await logSurgeReport({
        driverId, lat, lng, city, neighborhood,
        multiplier: 1.0,
        source: 'passive',
        confidence: detection.confidence,
      })
      return
    }

    if (!detection.needsConfirmation) {
      // High-confidence surge — log silently, no prompt needed
      await logSurgeReport({
        driverId, lat, lng, city, neighborhood,
        multiplier: detection.multiplier,
        source: 'passive',
        confidence: detection.confidence,
      })
      return
    }

    // Low-confidence surge — show one-tap confirmation prompt
    setPending({ detection, neighborhood })
    setShowReport(true)
  }, [driverId, city, lat, lng])

  // ── Driver taps a multiplier to confirm ──────────────────
  const confirmSurge = useCallback(async (multiplier) => {
    if (!pendingDetection) return
    await logSurgeReport({
      driverId, lat, lng, city,
      neighborhood: pendingDetection.neighborhood,
      multiplier,
      source: 'tap',
      confidence: 0.95,
    })
    setShowReport(false)
    setPending(null)
    // Refresh live zones immediately
    const zones = await fetchLiveSurgeZones(city)
    setLiveZones(zones)
  }, [pendingDetection, driverId, city, lat, lng])

  // ── Driver reports no surge ───────────────────────────────
  const reportNoSurge = useCallback(async () => {
    await logSurgeReport({
      driverId, lat, lng, city,
      neighborhood: pendingDetection?.neighborhood,
      multiplier: 1.0,
      source: 'tap',
      confidence: 0.9,
    })
    setShowReport(false)
    setPending(null)
  }, [pendingDetection, driverId, city, lat, lng])

  // ── Voice reporting ───────────────────────────────────────
  const startVoiceReport = useCallback(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SpeechRecognition) {
      console.warn('Speech recognition not supported in this browser')
      return
    }
    const recognition = new SpeechRecognition()
    recognitionRef.current = recognition
    recognition.lang = 'en-US'
    recognition.interimResults = false
    recognition.maxAlternatives = 1

    recognition.onstart = () => setIsListening(true)
    recognition.onend   = () => setIsListening(false)

    recognition.onresult = async (event) => {
      const transcript = event.results[0][0].transcript
      const parsed = parseVoiceReport(transcript)
      if (parsed.valid) {
        await logSurgeReport({
          driverId, lat, lng, city,
          neighborhood: parsed.neighborhood,
          multiplier: parsed.multiplier,
          source: 'voice',
          confidence: 0.85,
        })
        setShowReport(false)
        const zones = await fetchLiveSurgeZones(city)
        setLiveZones(zones)
      }
    }
    recognition.onerror = () => setIsListening(false)
    recognition.start()
  }, [driverId, city, lat, lng])

  const stopVoiceReport = useCallback(() => {
    recognitionRef.current?.stop()
    setIsListening(false)
  }, [])

  const dismissPrompt = useCallback(() => {
    setShowReport(false)
    setPending(null)
  }, [])

  return {
    // State
    liveZones,
    showReportPrompt,
    pendingDetection,
    isListening,
    forecast,
    nudge,
    loading,
    // Actions
    onRideAccepted,
    confirmSurge,
    reportNoSurge,
    startVoiceReport,
    stopVoiceReport,
    dismissPrompt,
  }
}
