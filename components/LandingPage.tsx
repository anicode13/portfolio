"use client"

import { useRef, useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import gsap from "gsap"
import { MorphSVGPlugin } from "gsap/all"

gsap.registerPlugin(MorphSVGPlugin)

export default function LandingPage() {
    const [isDarkMode, setIsDarkMode] = useState(false)
    const pathRef = useRef<SVGPathElement | null>(null)
    const containerRef = useRef<HTMLDivElement | null>(null)
    const router = useRouter()
    const playPath =
        "M3.5 5L3.50049 3.9468C3.50049 3.177 4.33382 2.69588 5.00049 3.08078L20.0005 11.741C20.6672 12.1259 20.6672 13.0882 20.0005 13.4731L17.2388 15.1412L17.0055 15.2759M3.50049 8L3.50049 21.2673C3.50049 22.0371 4.33382 22.5182 5.00049 22.1333L14.1192 16.9423L14.4074 16.7759"
    const pausePath =
        "M15.5004 4.05859V5.0638V5.58691V8.58691V15.5869V19.5869V21.2549M8.5 3.96094V10.3721V17V19L8.5 21"

    useEffect(() => {
        document.documentElement.setAttribute('data-theme', isDarkMode ? 'dark' : 'light')
    }, [isDarkMode])

    const handleClick = () => {
        const tl = gsap.timeline({
            onComplete: () => {
                router.push("/path")
            }
        })
        if (pathRef.current) {
            tl.to(pathRef.current, {
                duration: 0.5,
                morphSVG: {
                    type: "rotational",
                    map: "complexity",
                    shape: pausePath,
                },
                ease: "power4.inOut",
            })
        }
        if (containerRef.current) {
            tl.to(containerRef.current, {
                duration: 0.6,
                scale: 0.98,
                autoAlpha: 0,
                ease: "power2.inOut"
            }, "-=0.2")
        }
    }

    const toggleDarkMode = () => {
        setIsDarkMode(!isDarkMode)
    }

    return (
        <div ref={containerRef} className="flex h-screen w-screen justify-center items-center relative landing-bg">
            {/* Dark mode toggle */}
            <button
                onClick={toggleDarkMode}
                className="absolute top-6 right-6 p-3 rounded-full shadow-md hover:shadow-lg transition-all duration-200 theme-toggle"
                style={{
                    background: 'var(--bg-secondary)',
                    boxShadow: '0 2px 8px var(--shadow-light)',
                    color: 'var(--text-primary)'
                }}
            >
                {isDarkMode ? (
                    <svg width="20" height="20" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clipRule="evenodd" />
                    </svg>
                ) : (
                    <svg width="20" height="20" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
                    </svg>
                )}
            </button>

            <button
                onClick={handleClick}
                data-play-pause="toggle"
                className="play-pause-button text-primary"
            >
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="100%"
                    viewBox="0 0 24 25"
                    fill="none"
                    className="play-pause-icon"
                >
                    <path
                        ref={pathRef}
                        d={playPath}
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeMiterlimit="16"
                        data-play-pause="path"
                        strokeLinecap="round"
                    ></path>
                </svg>
            </button>
            <style jsx global>{`
                :root {
                  --padding: 10vmin;
                  --color-background: ${isDarkMode ? '#0a0a0a' : '#D0CBC7'};
                  --font-size-large: 8vw;
                  --font-size-medium: 4vw;
                  --font-size-normal: 2vw;
                  --bg-secondary: ${isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'};
                  --shadow-light: ${isDarkMode ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.3)'};
                  --text-primary: ${isDarkMode ? '#ffffff' : '#000000'};
                }
                html, body, .landing-bg {
                  background-color: var(--color-background) !important;
                  color: var(--text-primary) !important;
                  font-family: 'Libre Baskerville', serif;
                  font-size: var(--font-size-normal);
                  min-height: 100vh;
                  min-width: 100vw;
                  margin: 0;
                  padding: 0;
                  transition: background 0.3s, color 0.3s;
                }
                .theme-toggle {
                  background: var(--bg-secondary) !important;
                  color: var(--text-primary) !important;
                  border: 2px solid var(--shadow-light) !important;
                }
                .theme-toggle:hover {
                  background: ${isDarkMode ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)'} !important;
                  box-shadow: 0 4px 20px rgba(0,0,0,0.2);
                }
                .play-pause-button {
                  background: none !important;
                  border: none !important;
                  box-shadow: none !important;
                  outline: none;
                  color: var(--text-primary) !important;
                  cursor: pointer;
                  margin-top: 2rem;
                  font-size: var(--font-size-large);
                  transition: color 0.3s;
                  padding: 0 !important;
                  border-radius: 0 !important;
                }
            `}</style>
        </div>
    )
}