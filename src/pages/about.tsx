import { useState, useEffect, useRef } from 'react'
import Shuffle from '../components/Shuffle'
import Lanyard from '../components/Lanyard'
import forLanyard from '../assets/images/for_lanyard.jpg'

export default function About() {
  const sectionRef = useRef<HTMLDivElement>(null)
  const [isAboutVisible, setIsAboutVisible] = useState(false)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsAboutVisible(entry.isIntersecting)
      },
      { 
        threshold: 0.1 
      }
    )

    if (sectionRef.current) {
      observer.observe(sectionRef.current)
    }

    return () => {
      observer.disconnect()
    }
  }, [])

  return (
    <section 
      id="about" 
      ref={sectionRef}
      className="w-full min-h-screen md:h-screen bg-[#030712] relative overflow-hidden flex flex-col md:flex-row" 
      style={{ fontFamily: "'Manrope', sans-serif" }}
    >
      
      {/* LEFT SIDE: Interactive Lanyard Canvas (Top on mobile) */}
      <div className="w-full h-[400px] md:w-1/2 md:h-full relative overflow-hidden border-b md:border-b-0 md:border-r border-white/5">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(99,102,241,0.02)_0%,transparent_75%)] pointer-events-none" />
        <div className="absolute inset-0 -mt-10 md:-mt-30 h-[110%]">
          {isAboutVisible ? (
            <Lanyard portrait={forLanyard} active={isAboutVisible} />
          ) : (
            <div className="w-full h-full bg-[#030712]" />
          )}
        </div>
      </div>

      {/* RIGHT SIDE: Narrative Content Block (Bottom on mobile) */}
      <div className="w-full md:w-1/2 min-h-screen md:h-full relative z-10 flex flex-col justify-between p-8 sm:p-16 md:p-20 select-none">
        
        {/* Top Alignment Holder */}
        <div className="h-6 hidden md:block" />

        {/* Narrative Core Frame */}
        <div className="my-auto space-y-8 md:space-y-10">
          
          {/* Header Section (Right-Aligned on Mobile ONLY) */}
          <div className="space-y-1 text-right md:text-left">
            <div className="overflow-hidden py-1">
              <Shuffle
                text="ABOUT ME"
                tag="h2"
                textAlign="left" // Default engine syncs with desktop md rules
                shuffleDirection="right"
                animationMode="evenodd"
                duration={0.6}
                stagger={0.03}
                className="text-5xl sm:text-6xl md:text-7xl font-black tracking-tight uppercase leading-none text-white text-right md:text-left"
                style={{ fontWeight: 950 }}
              />
            </div>
            <div className="overflow-hidden py-1 flex items-center justify-end md:justify-start gap-4">
              <Shuffle
                text="& System Foundations"
                tag="span"
                textAlign="left"
                shuffleDirection="right"
                animationMode="evenodd"
                duration={0.6}
                stagger={0.035}
                className="text-3xl sm:text-4xl md:text-5xl font-extralight text-indigo-300 italic tracking-wide leading-none text-right md:text-left"
                style={{ fontFamily: "'Playfair Display', 'Georgia', serif" }}
              />
              <div className="h-[1px] flex-1 bg-gradient-to-r from-slate-700/60 to-transparent ml-2 opacity-50 hidden sm:block md:block" />
            </div>
          </div>

          {/* Narrative Copy (Maintains original left alignment everywhere) */}
          <div className="max-w-xl space-y-6 md:space-y-8">
            <p className="text-lg sm:text-xl md:text-2xl font-light leading-relaxed text-slate-200 tracking-tight text-left">
              I am a full-stack developer who naturally gravitates toward the backend. I enjoy exploring server architectures, writing logic, and discovering how structured data connects seamlessly behind the scenes.
            </p>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs leading-relaxed text-slate-400 tracking-wide uppercase text-left">
              <div className="space-y-2 border-l-2 border-indigo-500/30 pl-4 py-1">
                <span className="font-bold text-white block mb-0.5">My Current Focus</span>
                <p className="normal-case text-slate-400 text-sm">
                  I am focused on strengthening my foundational knowledge of API routing, server stability, and databases, aiming to write clean, maintainable backend code.
                </p>
              </div>
              <div className="space-y-2 border-l-2 border-emerald-400/30 pl-4 py-1">
                <span className="font-bold text-white block mb-0.5">The Full Stack Mix</span>
                <p className="normal-case text-slate-400 text-sm">
                  While I enjoy building web interfaces, I treat the frontend as a clean wrapper designed to correctly display the underlying logic I construct.
                </p>
              </div>
            </div>
          </div>

        </div>

        {/* Footer Row (Maintains original layout configuration) */}
        <div className="pt-8 md:pt-6 border-t border-white/5 grid grid-cols-1 sm:grid-cols-3 gap-4 text-left">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1">Location</p>
            <p className="text-xs font-semibold text-indigo-300">Philippines</p>
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1">Preferred Environment</p>
            <p className="text-xs font-semibold text-emerald-400">Backend Logic</p>
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1">Stage</p>
            <p className="text-xs font-semibold text-slate-300">Junior Developer</p>
          </div>
        </div>

      </div>

    </section>
  )
}