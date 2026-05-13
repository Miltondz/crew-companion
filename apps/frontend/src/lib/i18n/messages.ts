export type Locale = 'en' | 'es'

export const messages = {
  en: {
    nav: {
      features: 'Features',
      howItWorks: 'How it works',
      roadmap: 'Roadmap',
      about: 'About',
      signIn: 'Sign in',
      getStarted: 'Get started',
    },
    demo: {
      banner: 'Demo — simulated data. Real team & full deployment coming soon.',
    },
    hero: {
      badge: 'AI Operational Runtime',
      title: 'The workspace that',
      titleHighlight: 'adapts to every person',
      titleSuffix: 'on your team',
      subtitle:
        "Crew Companion isn't a dashboard with AI bolted on. It's a runtime where three specialized agents build the interface based on who you are, how technical you are, and how urgent things are. The UI emerges from context — it isn't configured.",
      cta: 'Start now',
      demo: 'Live demo',
      badge1: '3 specialized agents',
      badge2: '14 generative surfaces',
      badge3: 'Open source',
    },
    differentiator: {
      eyebrow: 'Why it is different',
      text: "Most AI tools give you just another chat. Crew Companion",
      highlight: 'changes the entire interface',
      text2: "based on who you are and what is happening — without you having to ask.",
      highlight2: 'The agent works for you, not the other way around.',
      stat1Label: 'Specialized agents',
      stat1Sub: 'Orchestrator · Planner · Coach',
      stat2Label: 'Generative surfaces',
      stat2Sub: 'emerge from context',
      stat3Label: 'Urgency phases',
      stat3Sub: 'normal → focus → panic → expired',
      stat4Label: 'Spatial zones',
      stat4Sub: 'intelligent layout by context',
    },
    features: {
      eyebrow: 'Capabilities',
      title: 'Built for when',
      titleHighlight: 'the margin for error is zero',
      subtitle:
        'Every capability was born from a real problem: teams that do not coordinate, members who do not know what to do, leaders who lack visibility when they need it most.',
      items: [
        {
          title: 'One interface per person',
          description:
            'Role, technical level, and urgency determine what each person sees. The leader gets an operational overview; the member gets their next specific action. Nothing to configure.',
        },
        {
          title: 'Automatic urgency',
          description:
            'The system derives the urgency phase from the team deadline: normal → focus → urgent → panic → expired. Colors, surfaces, and agent tone change automatically. No manual alerts.',
        },
        {
          title: '14 generative surfaces',
          description:
            'The agent emits structured data and the runtime decides how to display it based on context. War room, viability countdown, dependency graph, troubleshooting wizard — no navigation needed.',
        },
        {
          title: 'Three specialized agents',
          description:
            'Orchestrator for general routing, Planner for tasks and milestones, Coach to guide blocked members. Each knows what to do based on who is talking and what phase it is.',
        },
        {
          title: 'Coach that adapts to skill level',
          description:
            'For non-technical profiles: numbered steps in plain language, no jargon. For technical users: direct and precise answers. Same agent, two completely different registers.',
        },
        {
          title: 'Real-time shared state',
          description:
            'Tasks, blockers, milestones, and documents in a persistent state model. Every agent or team action updates everyone\'s view instantly, no reloads.',
        },
      ],
    },
    useCases: {
      eyebrow: 'Use cases',
      title: 'What does this look like',
      titleHighlight: 'in practice?',
    },
    cta: {
      title: 'Ready to ship without the chaos?',
      subtitle:
        'Free during beta. No credit card. Start in 2 minutes.',
      button: 'Start now',
      demo: 'Live demo',
    },
    footer: {
      tagline: 'Cognitive Operational Runtime for project teams.',
      links: 'Links',
      legal: 'MIT License — use freely.',
    },
    common: {
      loading: 'Loading...',
      error: 'Something went wrong',
      retry: 'Try again',
    },
  },
  es: {
    nav: {
      features: 'Capacidades',
      howItWorks: 'Cómo funciona',
      roadmap: 'Roadmap',
      about: 'Acerca de',
      signIn: 'Iniciar sesión',
      getStarted: 'Empezar',
    },
    demo: {
      banner: 'Demo — datos simulados. Equipo real y despliegue completo: próximamente.',
    },
    hero: {
      badge: 'Runtime operacional con IA',
      title: 'El workspace que',
      titleHighlight: 'se adapta a cada persona',
      titleSuffix: 'del equipo',
      subtitle:
        'Crew Companion no es un dashboard con IA encima. Es un runtime donde tres agentes especializados construyen la interfaz según quién sos, qué tan técnico sos, y qué tan urgente está la situación. La UI emerge del contexto — no se configura.',
      cta: 'Empezar ahora',
      demo: 'Ver demo en vivo',
      badge1: '3 agentes especializados',
      badge2: '14 superficies generativas',
      badge3: 'Open source',
    },
    differentiator: {
      eyebrow: 'Por qué es diferente',
      text: 'La mayoría de herramientas con IA te dan un chat más. Crew Companion',
      highlight: 'cambia la interfaz completa',
      text2: 'según quién sos y qué está pasando — sin que tengas que pedirlo.',
      highlight2: 'El agente trabaja para vos, no al revés.',
      stat1Label: 'Agentes especializados',
      stat1Sub: 'Orquestador · Planner · Coach',
      stat2Label: 'Superficies generativas',
      stat2Sub: 'emergen según el contexto',
      stat3Label: 'Fases de urgencia',
      stat3Sub: 'normal → focus → panic → expirado',
      stat4Label: 'Zonas espaciales',
      stat4Sub: 'layout inteligente por contexto',
    },
    features: {
      eyebrow: 'Capacidades',
      title: 'Construido para cuando',
      titleHighlight: 'el margen de error es cero',
      subtitle:
        'Cada capacidad nació de un problema real: equipos que no se coordinan, miembros que no saben qué hacer, líderes que no tienen visibilidad cuando más la necesitan.',
      items: [
        {
          title: 'Una interfaz por persona',
          description:
            'El rol, el nivel técnico y la urgencia del momento determinan qué ve cada uno. El líder tiene panorama operativo; el miembro, su próxima acción específica. No hay que configurar nada.',
        },
        {
          title: 'Urgencia automática',
          description:
            'El sistema deriva la fase de urgencia del deadline del equipo: normal → focus → urgent → panic → expired. Colores, superficies y tono del agente cambian solos. Sin alertas manuales.',
        },
        {
          title: '14 superficies generativas',
          description:
            'El agente emite datos estructurados y el runtime decide cómo mostrarlos según contexto. Modo guerra, cuenta regresiva con viabilidad, grafo de dependencias, wizard de troubleshooting — sin navegación.',
        },
        {
          title: 'Tres agentes especializados',
          description:
            'Orquestador para routing general, Planner para tareas y milestones, Coach para guiar a miembros bloqueados. Cada uno sabe qué hacer según quién habla y qué fase es.',
        },
        {
          title: 'Coach que se adapta al nivel',
          description:
            'Para perfiles no técnicos: pasos numerados en lenguaje llano, sin jerga. Para técnicos: respuestas directas y precisas. El mismo agente, dos registros completamente distintos.',
        },
        {
          title: 'Estado compartido en tiempo real',
          description:
            'Tareas, blockers, milestones y documentos en un modelo de estado persistente. Cada acción del agente o del equipo actualiza la vista de todos al instante, sin recargas.',
        },
      ],
    },
    useCases: {
      eyebrow: 'Casos de uso',
      title: '¿Cómo se ve esto',
      titleHighlight: 'en la práctica?',
    },
    cta: {
      title: '¿Listo para deployar sin el caos?',
      subtitle: 'Gratis durante la beta. Sin tarjeta. Empezás en 2 minutos.',
      button: 'Empezar ahora',
      demo: 'Ver demo en vivo',
    },
    footer: {
      tagline: 'Runtime operacional cognitivo para equipos de proyecto.',
      links: 'Links',
      legal: 'Licencia MIT — usá libremente.',
    },
    common: {
      loading: 'Cargando...',
      error: 'Algo salió mal',
      retry: 'Reintentar',
    },
  },
} as const

type Stringified<T> = T extends string
  ? string
  : T extends readonly (infer U)[]
    ? Stringified<U>[]
    : { [K in keyof T]: Stringified<T[K]> }

export type Messages = Stringified<typeof messages.en>
