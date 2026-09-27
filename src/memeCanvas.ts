export interface MemeRenderOptions {
  width?: number
  height?: number
  backgroundColor?: string
  backgroundGradient?: [string, string]
  mascotSvg?: string
  topText: string
  bottomText: string
  fontSize?: number
  textColor?: string
  strokeColor?: string
  enableLaserEyes?: boolean
  sticker?: 'none' | 'moon' | 'diamond' | 'robinhood' | '100x'
  ticker?: string
}

export function drawMemeToCanvas(canvas: HTMLCanvasElement, options: MemeRenderOptions): void {
  const width = options.width || 600
  const height = options.height || 600
  canvas.width = width
  canvas.height = height

  const ctx = canvas.getContext('2d')
  if (!ctx) return

  // 1. Draw Background
  if (options.backgroundGradient) {
    const grad = ctx.createLinearGradient(0, 0, width, height)
    grad.addColorStop(0, options.backgroundGradient[0])
    grad.addColorStop(1, options.backgroundGradient[1])
    ctx.fillStyle = grad
  } else {
    ctx.fillStyle = options.backgroundColor || '#0b0f19'
  }
  ctx.fillRect(0, 0, width, height)

  // 2. Draw Decorative Cyber Grid / Glow
  ctx.save()
  ctx.strokeStyle = 'rgba(0, 240, 255, 0.12)'
  ctx.lineWidth = 1
  for (let x = 0; x < width; x += 40) {
    ctx.beginPath()
    ctx.moveTo(x, 0)
    ctx.lineTo(x, height)
    ctx.stroke()
  }
  for (let y = 0; y < height; y += 40) {
    ctx.beginPath()
    ctx.moveTo(0, y)
    ctx.lineTo(width, y)
    ctx.stroke()
  }
  ctx.restore()

  // 3. Central Mascot Avatar (stylized circle or character)
  const centerX = width / 2
  const centerY = height / 2

  // Center radial glow
  const glow = ctx.createRadialGradient(centerX, centerY, 40, centerX, centerY, 200)
  glow.addColorStop(0, 'rgba(0, 240, 255, 0.25)')
  glow.addColorStop(1, 'rgba(0, 0, 0, 0)')
  ctx.fillStyle = glow
  ctx.fillRect(0, 0, width, height)

  // Draw Mascot Base
  ctx.save()
  ctx.beginPath()
  ctx.arc(centerX, centerY, 130, 0, Math.PI * 2)
  ctx.fillStyle = '#1a2236'
  ctx.fill()
  ctx.lineWidth = 6
  ctx.strokeStyle = '#00f0ff'
  ctx.stroke()

  // Cute Mascot Face
  // Eyes
  const eyeOffsetX = 45
  const eyeOffsetY = -20
  const eyeRadius = 16

  ctx.fillStyle = '#ffffff'
  ctx.beginPath()
  ctx.arc(centerX - eyeOffsetX, centerY + eyeOffsetY, eyeRadius, 0, Math.PI * 2)
  ctx.arc(centerX + eyeOffsetX, centerY + eyeOffsetY, eyeRadius, 0, Math.PI * 2)
  ctx.fill()

  // Pupils
  ctx.fillStyle = '#0b0f19'
  ctx.beginPath()
  ctx.arc(centerX - eyeOffsetX + 2, centerY + eyeOffsetY + 2, 8, 0, Math.PI * 2)
  ctx.arc(centerX + eyeOffsetX - 2, centerY + eyeOffsetY + 2, 8, 0, Math.PI * 2)
  ctx.fill()

  // Smile
  ctx.beginPath()
  ctx.arc(centerX, centerY + 30, 40, 0.1 * Math.PI, 0.9 * Math.PI, false)
  ctx.lineWidth = 5
  ctx.strokeStyle = '#ffffff'
  ctx.stroke()
  ctx.restore()

  // 4. Laser Eyes Effect (if enabled)
  if (options.enableLaserEyes) {
    ctx.save()
    const leftEye = { x: centerX - eyeOffsetX, y: centerY + eyeOffsetY }
    const rightEye = { x: centerX + eyeOffsetX, y: centerY + eyeOffsetY }

    const drawLaser = (origin: { x: number; y: number }, targetX: number, targetY: number) => {
      // Glow
      ctx.shadowColor = '#ff0055'
      ctx.shadowBlur = 25
      ctx.strokeStyle = '#ff0055'
      ctx.lineWidth = 8
      ctx.beginPath()
      ctx.moveTo(origin.x, origin.y)
      ctx.lineTo(targetX, targetY)
      ctx.stroke()

      // Core white beam
      ctx.strokeStyle = '#ffffff'
      ctx.lineWidth = 3
      ctx.beginPath()
      ctx.moveTo(origin.x, origin.y)
      ctx.lineTo(targetX, targetY)
      ctx.stroke()
    }

    drawLaser(leftEye, 0, height)
    drawLaser(rightEye, width, height)
    ctx.restore()
  }

  // 5. Sticker Overlay
  if (options.sticker && options.sticker !== 'none') {
    ctx.save()
    ctx.translate(width - 120, 100)
    ctx.rotate(0.15)

    let badgeText = '100X GEM'
    let badgeBg = '#ff007a'

    if (options.sticker === 'moon') {
      badgeText = 'TO THE MOON 🚀'
      badgeBg = '#7928ca'
    } else if (options.sticker === 'diamond') {
      badgeText = 'DIAMOND HANDS 💎'
      badgeBg = '#0070f3'
    } else if (options.sticker === 'robinhood') {
      badgeText = 'ROBINHOOD READY 🏹'
      badgeBg = '#00c805'
    }

    ctx.fillStyle = badgeBg
    ctx.beginPath()
    ctx.roundRect(-80, -20, 160, 40, 8)
    ctx.fill()
    ctx.lineWidth = 2
    ctx.strokeStyle = '#ffffff'
    ctx.stroke()

    ctx.fillStyle = '#ffffff'
    ctx.font = 'bold 13px sans-serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(badgeText, 0, 0)
    ctx.restore()
  }

  // 6. Watermark Ticker
  if (options.ticker) {
    ctx.save()
    ctx.font = 'bold 16px "JetBrains Mono", monospace'
    ctx.fillStyle = 'rgba(0, 240, 255, 0.7)'
    ctx.textAlign = 'right'
    ctx.fillText(`$${options.ticker.replace('$', '').toUpperCase()}`, width - 20, height - 20)
    ctx.restore()
  }

  // 7. Impact Meme Typography (Top & Bottom text)
  const drawMemeText = (text: string, yPos: number, baseline: CanvasTextBaseline) => {
    if (!text.trim()) return
    ctx.save()
    const fontSize = options.fontSize || Math.floor(width / 13)
    ctx.font = `900 ${fontSize}px Impact, "Arial Black", sans-serif`
    ctx.textAlign = 'center'
    ctx.textBaseline = baseline

    // Text Wrap calculation if too long
    const words = text.toUpperCase().split(' ')
    let line = ''
    const lines: string[] = []
    const maxWidth = width - 40

    for (let n = 0; n < words.length; n++) {
      const testLine = line + words[n] + ' '
      const metrics = ctx.measureText(testLine)
      if (metrics.width > maxWidth && n > 0) {
        lines.push(line.trim())
        line = words[n] + ' '
      } else {
        line = testLine
      }
    }
    lines.push(line.trim())

    const lineHeight = fontSize * 1.15
    const totalBlockHeight = lines.length * lineHeight
    const startY = baseline === 'top' ? yPos : yPos - totalBlockHeight + lineHeight

    lines.forEach((l, idx) => {
      const currentY = startY + idx * lineHeight
      // Outline stroke
      ctx.strokeStyle = options.strokeColor || '#000000'
      ctx.lineWidth = Math.max(6, Math.floor(fontSize / 8))
      ctx.lineJoin = 'miter'
      ctx.miterLimit = 2
      ctx.strokeText(l, centerX, currentY)

      // Fill
      ctx.fillStyle = options.textColor || '#ffffff'
      ctx.fillText(l, centerX, currentY)
    })

    ctx.restore()
  }

  drawMemeText(options.topText, 30, 'top')
  drawMemeText(options.bottomText, height - 35, 'bottom')
}

export function canvasToDataUrl(canvas: HTMLCanvasElement, format: 'image/png' | 'image/jpeg' = 'image/png'): string {
  return canvas.toDataURL(format, 0.95)
}

export function downloadCanvasMeme(canvas: HTMLCanvasElement, filename = 'meme.png'): void {
  const url = canvasToDataUrl(canvas, 'image/png')
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
}
