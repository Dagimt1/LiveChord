import React, { useState, useRef, useEffect } from "react"
import { AudioAnalyzer } from "./AudioAnalyzer"
import { render as renderWave } from "./wave"

export default function App() {
  // Which "view" is displayed? "start" | "error" | "chord"
  const [view, setView] = useState("start")
  // Toggles the help card
  const [showHelp, setShowHelp] = useState(false)

  // Chord info states
  const [chordSvg, setChordSvg] = useState("")
  const [chordName, setChordName] = useState("...")

  // Wave animation references
  const waveCanvasRef = useRef(null)
  const chordViewRef = useRef(null)
  const nPowerRef = useRef(0)
  const cPowerRef = useRef(0)

  // Start button: open audio
  const handleStart = () => {
    AudioAnalyzer.open()
      .then(analyzer => {
        setView("chord") // switch to chord view
        // Handle chord events
        analyzer.onchord = chord => {
          setChordSvg(chord.svg())
          setChordName(chord.name)
        }
        // Handle power events
        analyzer.onpower = power => {
          nPowerRef.current = power
        }
      })
      .catch(() => {
        // If user denies permission or no audio input is available
        setView("error")
      })
  }

  // Toggle the help card
  const handleHelp = () => {
    setShowHelp(prev => !prev)
  }

  // Animate wave in a requestAnimationFrame loop
  useEffect(() => {
    const canvas = waveCanvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")

    function animate() {
      if (view === "chord") {
        // match canvas width to .card container
        if (chordViewRef.current) {
          canvas.width = chordViewRef.current.offsetWidth
        }
        canvas.height = 100

        // Interpolate
        cPowerRef.current = (cPowerRef.current * 1.5 + nPowerRef.current * 0.5) / 2

        // If there's any power at all, draw the wave
        if (cPowerRef.current > 1e-5) {
          renderWave(canvas.width, canvas.height, ctx, cPowerRef.current, Date.now())
        } else {
          // Clear if no power
          ctx.clearRect(0, 0, canvas.width, canvas.height)
        }
      } else {
        // If not in chord view, just clear
        ctx.clearRect(0, 0, canvas.width, canvas.height)
      }
      requestAnimationFrame(animate)
    }

    const reqId = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(reqId)
  }, [view])

  return (
    <>
      {/* Header */}
      <div className="header">
        <h1 className="logo">Chords</h1>
        <a
          id="btn-help"
          className="button"
          onClick={handleHelp}
          href="#!"
          style={{ cursor: "pointer" }}
        >
          Help & About
        </a>
      </div>

      {/* Main container */}
      <div className="view">

        {/* Help & About Card (tailored content) */}
        <div id="view-help" className={`card full ${showHelp ? "" : "hidden"}`}>
          <img className="hero" src="/piano_gif.gif" alt="piano" />
          
          <h1>Help</h1>
          <p>
            To recognize chords, please allow microphone access and play (or sing) a chord. 
            For best results:
          </p>
          <ul>
            <li>Use a quiet environment to reduce background noise.</li>
            <li>Position your instrument or voice at a moderate distance from the mic.</li>
            <li>Play or sustain notes clearly for accurate detection.</li>
          </ul>

          <h1>About</h1>
          <p>
            This Chords app is a personal project by <strong>Dagim Jalleta</strong>, aimed at 
            identifying musical chords in real-time using local audio processing. The underlying 
            method examines frequency content via a fast Fourier Transform (FFT) and then applies 
            statistical techniques to filter out overtones and noise.
          </p>
          <p>
            If you’d like to view the source code or connect with me:
          </p>
          <ul>
            <li>
              <a 
                href="https://github.com/Dagimt1" 
                target="_blank" 
                rel="noreferrer" 
                style={{ color: "#fff", textDecoration: "underline" }}
              >
                GitHub
              </a>
            </li>
            <li>
              <a 
                href="https://www.linkedin.com/in/dagim-jalleta/" 
                target="_blank" 
                rel="noreferrer" 
                style={{ color: "#fff", textDecoration: "underline" }}
              >
                LinkedIn
              </a>
            </li>
          </ul>

          <h2>Algorithm Basics</h2>
          <p>
            Every <sup>1</sup>/<sub>10</sub> of a second, the audio input is split into 4096-sample 
            buffers. A <a href="https://en.wikipedia.org/wiki/Fast_Fourier_transform" 
            target="_blank" rel="noreferrer">
              fast Fourier Transform
            </a> determines the power spectrum, discarding frequencies not matching typical musical 
            notes. A new analysis series starts whenever total power more than doubles between 
            consecutive checks. Using a 
            <a href="https://en.wikipedia.org/wiki/Recursive_Bayesian_estimation" 
            target="_blank" rel="noreferrer">
              Bayes Filter
            </a>, chords are identified in real time from the likely note combinations.
          </p>
          <p>
            <img className="figure" src="/spectrum.jpg" alt="spectrum example" />
            <center>
              Example spectrum illustrating a C<sub>4</sub> major chord. 
              The detected chord is highlighted in red.
            </center>
          </p>
        </div>

        {/* Start Card */}
        {view === "start" && (
          <div id="view-start" className="card">
            <img className="hero" src="/tape.png" alt="tape" />
            <h1>Start Recording</h1>
            <p>To recognize chords, we need to record some audio!</p>
            <a
              id="btn-start"
              className="button primary"
              onClick={handleStart}
              href="#!"
              style={{ cursor: "pointer" }}
            >
              Enable Microphone
            </a>
          </div>
        )}

        {/* Error Card */}
        {view === "error" && (
          <div id="view-error" className="card">
            <img className="hero" src="/no-mic.svg" alt="no mic" />
            <h1>Could not Start Recording</h1>
            <p>
              It seems like you have no microphone available, or you denied permission.
              If permission was denied, please refresh and grant mic access. Audio is not stored
              or sent anywhere—this app processes everything locally.
            </p>
            <a
              className="button"
              onClick={() => window.location.reload()}
              href="#!"
              style={{ cursor: "pointer" }}
            >
              Refresh Page
            </a>
          </div>
        )}

        {/* Chord Card */}
        {view === "chord" && (
          <div id="view-chord" className="card" ref={chordViewRef}>
            {/* We are injecting the chord’s SVG via dangerouslySetInnerHTML */}
            <span
              id="chord-render"
              dangerouslySetInnerHTML={{ __html: chordSvg }}
            />
            <p id="chord-info">{chordName}</p>
            <canvas id="waves" ref={waveCanvasRef}></canvas>
          </div>
        )}
      </div>
    </>
  )
}
