// Worker for analyzing time-series of Fourier spectra

console.log("Audio worker started")

let hzPerBin = NaN

// The note range to detect relative to A4
const minNote = -15
const maxNote = 20

// Probability threshold
const threshold = 0.8

// We'll store indices for each note in [minNote, maxNote)
const notes = new Uint8Array(maxNote - minNote)
const buffer = new Uint8Array(maxNote - minNote)
const prob = new Float32Array(maxNote - minNote)

let bufferTotal = 0
let frame = 0

// Receive initial settings
onmessage = function (e) {
  // If we got an object with {hzPerBin}, it's init
  if (typeof e.data === "object" && e.data.hzPerBin) {
    hzPerBin = e.data.hzPerBin
    for (let n = minNote, i = 0; n < maxNote; n++, i++) {
      notes[i] = noteIndex(n)
    }
    // After setup, subsequent messages go to analyze
    onmessage = analyze
  }
}

function noteIndex(n) {
  const f = 440 * Math.pow(2, n / 12)
  return parseInt((f + hzPerBin / 2) / hzPerBin)
}

// Next step in analyzing
function analyze({ data }) {
  // data is our frequency bin array
  let maxVal = 0
  let total = 0
  let maxIdx = 0

  for (let i = 0; i < notes.length; i++) {
    const v = data[notes[i]]
    if (v > maxVal) {
      maxVal = v
      maxIdx = i
    }
    buffer[i] = v
    total += v
  }

  // Check if total power doubled => start new analysis
  if (total > bufferTotal * 2) {
    frame = 0
    prob.fill(0.5)
  }

  if (frame > 0 || total > bufferTotal * 2) {
    // Update probabilities
    for (let i = 0; i < prob.length; i++) {
      const on = prob[i] * condProb(true, i, maxVal, total, maxIdx)
      const off = (1 - prob[i]) * condProb(false, i, maxVal, total, maxIdx)
      prob[i] = on / (on + off)
    }
    frame++
    if (frame === 3) {
      frame = 0
      sendChord()
    }
  }

  bufferTotal = total

  // Send total power
  postMessage(total)
}

function condProb(on, idx, maxVal, total, maxIdx) {
  const lambda = 1
  const m = 4
  const pow = buffer[idx]
  const avg = total / buffer.length

  let localMax = 0
  for (let i = Math.max(0, idx - 1), cap = Math.min(idx + 2, buffer.length); i < cap; i++) {
    localMax = Math.max(localMax, buffer[i])
  }

  let p = 1
  if (on) {
    p *= lambda * Math.exp(-lambda * (maxVal - pow) / avg)
    p *= lambda * Math.exp(-lambda * Math.abs(localMax - pow))
    p *= lambda * 0.5 * Math.exp(-lambda * 0.5 * Math.abs(maxIdx - idx) / m)
  } else {
    p *= lambda * Math.exp(-lambda * pow / avg)
    if (pow === localMax) {
      p *= lambda
    } else {
      p *= lambda * Math.exp(-lambda / Math.abs(localMax - pow))
    }
    if (maxIdx === idx) {
      p *= lambda * 0.5
    } else {
      p *= lambda * 0.5 * Math.exp(-lambda * 0.5 * m / Math.abs(maxIdx - idx))
    }
  }
  return p
}

function sendChord() {
  const result = []
  for (let i = 0; i < prob.length; i++) {
    if (prob[i] > threshold) {
      result.push(minNote + i)
    }
  }
  if (result.length > 0) {
    postMessage(result)
  }
}
