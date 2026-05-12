'use client'

import { cn } from '@/lib/utils'
import type { HabitatWeather } from '@/runtime/companion'

interface Props {
  weather: HabitatWeather
}

const SKY_GRADIENTS: Record<HabitatWeather, string> = {
  sunny:   'from-sky-400 via-sky-300 to-sky-200',
  cloudy:  'from-slate-400 via-slate-300 to-slate-200',
  rain:    'from-orange-700 via-orange-500 to-amber-400',
  stormy:  'from-red-950 via-red-900 to-red-800',
  night:   'from-zinc-900 via-zinc-800 to-zinc-700',
}

export function HabitatBackground({ weather }: Props) {
  return (
    <div className="absolute inset-0 overflow-hidden rounded-xl pointer-events-none">
      {/* sky */}
      <div className={cn(
        'absolute inset-0 bg-gradient-to-b transition-all duration-1000',
        SKY_GRADIENTS[weather]
      )} />

      {/* sun — visible on sunny/cloudy */}
      {(weather === 'sunny' || weather === 'cloudy') && (
        <div className={cn(
          'absolute top-3 right-5 w-8 h-8 rounded-full transition-all duration-1000',
          weather === 'sunny' ? 'bg-yellow-300 shadow-[0_0_16px_4px_rgba(253,224,71,0.5)]' : 'bg-yellow-200 opacity-50'
        )} />
      )}

      {/* moon — night */}
      {weather === 'night' && (
        <div className="absolute top-4 right-6 w-6 h-6 rounded-full bg-zinc-300 shadow-[0_0_10px_2px_rgba(203,213,225,0.3)]" />
      )}

      {/* storm flash */}
      {weather === 'stormy' && (
        <div className="absolute top-2 left-1/2 -translate-x-1/2 w-0.5 h-8 bg-yellow-300 opacity-0 animate-[lightning_2s_ease-in-out_infinite]" />
      )}

      {/* rain drops */}
      {(weather === 'rain' || weather === 'stormy') && (
        <div className="absolute inset-0">
          {[...Array(12)].map((_, i) => (
            <div
              key={i}
              className="absolute w-0.5 rounded-full bg-blue-300 opacity-60 animate-[fall_0.8s_linear_infinite]"
              style={{
                left: `${(i * 8.3) % 100}%`,
                height: `${6 + (i % 3) * 2}px`,
                animationDelay: `${(i * 0.07).toFixed(2)}s`,
                animationDuration: `${0.6 + (i % 4) * 0.1}s`,
              }}
            />
          ))}
        </div>
      )}

      {/* clouds */}
      {(weather === 'cloudy' || weather === 'rain') && (
        <>
          <div className="absolute top-5 left-4 w-14 h-5 rounded-full bg-white opacity-60" />
          <div className="absolute top-3 left-10 w-10 h-4 rounded-full bg-white opacity-50" />
        </>
      )}

      {/* storm clouds */}
      {weather === 'stormy' && (
        <>
          <div className="absolute top-4 left-2 w-16 h-6 rounded-full bg-zinc-700 opacity-80" />
          <div className="absolute top-2 left-8 w-12 h-5 rounded-full bg-zinc-600 opacity-70" />
          <div className="absolute top-5 right-2 w-10 h-4 rounded-full bg-zinc-700 opacity-75" />
        </>
      )}

      {/* stars — night */}
      {weather === 'night' && (
        <>
          {[...Array(8)].map((_, i) => (
            <div
              key={i}
              className="absolute w-0.5 h-0.5 rounded-full bg-white opacity-70"
              style={{
                top: `${5 + (i * 7) % 40}%`,
                left: `${(i * 13) % 90}%`,
              }}
            />
          ))}
        </>
      )}

      {/* ground */}
      <div className="absolute bottom-0 left-0 right-0 h-10 bg-gradient-to-t from-green-800 to-green-700 rounded-b-xl" />

      {/* ground detail */}
      <div className="absolute bottom-7 left-2 text-[10px]">🌱</div>
      <div className="absolute bottom-7 right-2 text-[10px]">🌱</div>
    </div>
  )
}
