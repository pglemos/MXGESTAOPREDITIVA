import React, { useState } from 'react'
import { afterEach, describe, expect, mock, test } from 'bun:test'
import { act, cleanup, render } from '@testing-library/react'

mock.module('@/lib/toast', () => ({
    toast: { warning: mock(() => {}) },
}))

const { YouTubeCompliancePlayer } = await import('./CompliancePlayers')

type PlayerEvents = {
    onStateChange?: (event: { data: number }) => void
}

let playerCreations = 0

function renderPlayerThatUpdatesProgress() {
    function Harness() {
        const [, setProgress] = useState(0)

        return (
            <YouTubeCompliancePlayer
                videoUrl="https://youtu.be/UMj0WbeNmLw"
                onProgressUpdate={setProgress}
                onCompleted={() => setProgress(100)}
            />
        )
    }

    return render(<Harness />)
}

describe('YouTubeCompliancePlayer', () => {
    afterEach(() => {
        cleanup()
        playerCreations = 0
        delete window.YT
        delete window.onYouTubeIframeAPIReady
    })

    test('mantém a mesma instância durante atualizações de progresso', async () => {
        window.YT = {
            Player: class {
                constructor(_elementId: string, options: { events?: PlayerEvents }) {
                    playerCreations += 1
                    options.events?.onStateChange?.({ data: 1 })
                }

                getCurrentTime() { return 1 }
                getDuration() { return 100 }
                getPlaybackRate() { return 1 }
                setPlaybackRate() {}
                seekTo() {}
                destroy() {}
            },
        }

        await act(async () => {
            renderPlayerThatUpdatesProgress()
            await new Promise(resolve => setTimeout(resolve, 600))
        })

        expect(playerCreations).toBe(1)
    })
})
