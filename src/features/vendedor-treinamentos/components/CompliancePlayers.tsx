import { useEffect, useRef } from 'react'
import { toast } from 'sonner'

// Players de vídeo com restrição de avanço (não deixa "pular" a aula) e teto
// de velocidade 1.5x — Especificação Funcional da Universidade MX.
// Portado de src/base44-reference/pages/Treinamentos.jsx (P0-03/UNIV-7).

declare global {
    interface Window {
        YT?: {
            Player: new (elementId: string, options: Record<string, unknown>) => YtPlayer
        }
        onYouTubeIframeAPIReady?: () => void
    }
}

interface YtPlayer {
    getCurrentTime: () => number
    getDuration: () => number
    getPlaybackRate: () => number
    setPlaybackRate: (rate: number) => void
    seekTo: (seconds: number, allowSeekAhead: boolean) => void
    destroy: () => void
}

interface CompliancePlayerProps {
    videoUrl: string
    onProgressUpdate: (percent: number) => void
    onCompleted: () => void
}

function getYoutubeId(url: string | null | undefined): string | null {
    if (!url) return null
    const match = url.match(/(?:youtu\.be\/|youtube(?:-nocookie)?\.com\/(?:watch\?v=|embed\/))([\w-]{6,})/)
    return match ? match[1] : null
}

export function getYoutubeEmbed(url: string | null | undefined): string | null {
    const id = getYoutubeId(url)
    return id ? `https://www.youtube-nocookie.com/embed/${id}` : null
}

export function getYoutubeThumbnail(url: string | null | undefined): string | null {
    const id = getYoutubeId(url)
    return id ? `https://img.youtube.com/vi/${id}/mqdefault.jpg` : null
}

export function YouTubeCompliancePlayer({ videoUrl, onProgressUpdate, onCompleted }: CompliancePlayerProps) {
    const containerId = useRef(`yt-player-${Math.random().toString(36).slice(2, 11)}`)
    const playerRef = useRef<YtPlayer | null>(null)
    const highestTimeRef = useRef(0)
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

    const videoId = getYoutubeId(videoUrl)

    useEffect(() => {
        if (!videoId) return

        highestTimeRef.current = 0

        const stopTracking = () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current)
                intervalRef.current = null
            }
        }

        const startTracking = () => {
            if (intervalRef.current) return
            intervalRef.current = setInterval(() => {
                const player = playerRef.current
                if (!player || typeof player.getCurrentTime !== 'function') return

                const currentTime = player.getCurrentTime()
                const duration = player.getDuration() || 0

                try {
                    const rate = player.getPlaybackRate()
                    if (rate > 1.5) {
                        player.setPlaybackRate(1.5)
                        toast.warning('A velocidade máxima permitida para este treinamento é 1.5x.')
                    }
                } catch {
                    // getPlaybackRate pode não estar pronto ainda — ignora nesta iteração.
                }

                if (currentTime > highestTimeRef.current + 2.5) {
                    player.seekTo(highestTimeRef.current, true)
                    toast.warning('Não é permitido avançar o vídeo para burlar o progresso da aula.')
                } else if (currentTime > highestTimeRef.current) {
                    highestTimeRef.current = currentTime
                }

                const percent = duration > 0 ? (highestTimeRef.current / duration) * 100 : 0
                onProgressUpdate(percent)

                if (duration > 0 && highestTimeRef.current >= duration * 0.95) {
                    onCompleted()
                }
            }, 500)
        }

        if (!window.YT) {
            const tag = document.createElement('script')
            tag.src = 'https://www.youtube.com/iframe_api'
            const firstScriptTag = document.getElementsByTagName('script')[0]
            firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag)
        }

        const initPlayer = () => {
            if (!window.YT) return
            playerRef.current = new window.YT.Player(containerId.current, {
                height: '100%',
                width: '100%',
                videoId,
                playerVars: {
                    autoplay: 0,
                    controls: 1,
                    disablekb: 1,
                    fs: 1,
                    modestbranding: 1,
                    rel: 0,
                    showinfo: 0,
                    iv_load_policy: 3,
                },
                events: {
                    onStateChange: (event: { data: number }) => {
                        if (event.data === 1) startTracking()
                        else stopTracking()
                    },
                },
            })
        }

        if (window.YT?.Player) {
            initPlayer()
        } else {
            const prevCallback = window.onYouTubeIframeAPIReady
            window.onYouTubeIframeAPIReady = () => {
                prevCallback?.()
                initPlayer()
            }
        }

        return () => {
            stopTracking()
            playerRef.current?.destroy()
        }
    }, [videoId, onProgressUpdate, onCompleted])

    return <div className="h-full w-full"><div id={containerId.current} className="h-full w-full" /></div>
}

export function HTML5CompliancePlayer({ videoUrl, onProgressUpdate, onCompleted }: CompliancePlayerProps) {
    const videoRef = useRef<HTMLVideoElement>(null)
    const highestTimeRef = useRef(0)

    useEffect(() => {
        highestTimeRef.current = 0
    }, [videoUrl])

    const handleTimeUpdate = () => {
        const video = videoRef.current
        if (!video) return

        const currentTime = video.currentTime
        const duration = video.duration || 0

        if (currentTime > highestTimeRef.current + 2.5) {
            video.currentTime = highestTimeRef.current
            toast.warning('Não é permitido avançar o vídeo para burlar o progresso da aula.')
        } else if (currentTime > highestTimeRef.current) {
            highestTimeRef.current = currentTime
        }

        const percent = duration > 0 ? (highestTimeRef.current / duration) * 100 : 0
        onProgressUpdate(percent)

        if (duration > 0 && highestTimeRef.current >= duration * 0.95) {
            onCompleted()
        }
    }

    const handleRateChange = () => {
        const video = videoRef.current
        if (!video) return
        if (video.playbackRate > 1.5) {
            video.playbackRate = 1.5
            toast.warning('A velocidade máxima permitida para este treinamento é 1.5x.')
        }
    }

    return (
        <video
            ref={videoRef}
            className="h-full w-full"
            controls
            preload="metadata"
            src={videoUrl}
            onTimeUpdate={handleTimeUpdate}
            onRateChange={handleRateChange}
            controlsList="nodownload"
        />
    )
}
