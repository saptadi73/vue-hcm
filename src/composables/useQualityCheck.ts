export interface QualityCheckResult {
  accepted: boolean
  brightnessScore: number
  blurScore: number
  reasons: string[]
}

function clamp(value: number, min = 0, max = 1) {
  return Math.max(min, Math.min(max, value))
}

export function useQualityCheck() {
  async function evaluateFromVideo(video: HTMLVideoElement): Promise<QualityCheckResult> {
    const width = video.videoWidth || 320
    const height = video.videoHeight || 240

    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height

    const context = canvas.getContext('2d', { willReadFrequently: true })

    if (!context) {
      return {
        accepted: false,
        brightnessScore: 0,
        blurScore: 0,
        reasons: ['Canvas context tidak tersedia'],
      }
    }

    context.drawImage(video, 0, 0, width, height)
    const imageData = context.getImageData(0, 0, width, height).data

    let luminanceTotal = 0
    let edgeEnergyTotal = 0
    let sampledPixels = 0

    for (let y = 1; y < height - 1; y += 2) {
      for (let x = 1; x < width - 1; x += 2) {
        const index = (y * width + x) * 4
        const rightIndex = (y * width + (x + 1)) * 4
        const downIndex = ((y + 1) * width + x) * 4

        const r = imageData[index] ?? 0
        const g = imageData[index + 1] ?? 0
        const b = imageData[index + 2] ?? 0

        const rr = imageData[rightIndex] ?? 0
        const rg = imageData[rightIndex + 1] ?? 0
        const rb = imageData[rightIndex + 2] ?? 0

        const dr = imageData[downIndex] ?? 0
        const dg = imageData[downIndex + 1] ?? 0
        const db = imageData[downIndex + 2] ?? 0

        const lum = 0.299 * r + 0.587 * g + 0.114 * b
        const lumRight = 0.299 * rr + 0.587 * rg + 0.114 * rb
        const lumDown = 0.299 * dr + 0.587 * dg + 0.114 * db

        luminanceTotal += lum
        edgeEnergyTotal += Math.abs(lum - lumRight) + Math.abs(lum - lumDown)
        sampledPixels += 1
      }
    }

    const brightnessScore = clamp(luminanceTotal / sampledPixels / 255)
    const blurScore = clamp(edgeEnergyTotal / sampledPixels / 48)

    const reasons: string[] = []

    if (brightnessScore < 0.28) {
      reasons.push('Terlalu gelap, tingkatkan pencahayaan')
    }

    if (brightnessScore > 0.9) {
      reasons.push('Terlalu terang, hindari backlight')
    }

    if (blurScore < 0.18) {
      reasons.push('Wajah terlalu blur, tahan kamera agar stabil')
    }

    return {
      accepted: reasons.length === 0,
      brightnessScore,
      blurScore,
      reasons,
    }
  }

  return {
    evaluateFromVideo,
  }
}
