import type { SVGProps } from 'react'

interface InkfraLogoProps {
  size?: number
  className?: string
}

export function InkfraLogo({ size = 20, className }: InkfraLogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="inkfra-grad" x1="4" y1="4" x2="28" y2="28" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#60A5FA" />
          <stop offset="50%" stopColor="#6366F1" />
          <stop offset="100%" stopColor="#A855F7" />
        </linearGradient>
      </defs>
      <path
        d="M8.5 9.5L16 5.5L23.5 9.5V17.5L16 21.5L8.5 17.5V9.5Z"
        stroke="url(#inkfra-grad)"
        strokeWidth="2.2"
        strokeLinejoin="round"
      />
      <path d="M16 13.5V26.5" stroke="url(#inkfra-grad)" strokeWidth="2.2" strokeLinecap="round" />
      <path d="M9 9.8L16 13.5L23 9.8" stroke="url(#inkfra-grad)" strokeWidth="2" strokeLinecap="round" />
      <circle cx="16" cy="5.5" r="2.2" fill="#93C5FD" />
      <circle cx="8.5" cy="17.5" r="2.2" fill="#818CF8" />
      <circle cx="23.5" cy="17.5" r="2.2" fill="#C084FC" />
      <circle cx="16" cy="26.5" r="2.2" fill="#60A5FA" />
    </svg>
  )
}

interface ProviderLogoProps extends Omit<SVGProps<SVGSVGElement>, 'children'> {
  provider?: string
  resourceType?: string
  size?: number
}

export function ProviderLogo({ provider, resourceType, size = 16, className, ...rest }: ProviderLogoProps) {
  const common = {
    width: size,
    height: size,
    viewBox: '0 0 24 24',
    fill: 'none',
    className,
    'aria-hidden': true as const,
    ...rest,
  }

  // Specific company / OSS product marks first
  switch (resourceType) {
    case 'devops_github_actions':
      return (
        <svg {...common}>
          <path
            fill="currentColor"
            d="M12 2C6.475 2 2 6.475 2 12a9.994 9.994 0 006.838 9.488c.5.087.687-.213.687-.476 0-.237-.013-1.024-.013-1.862-2.512.463-3.162-.612-3.362-1.175-.113-.288-.6-1.175-1.025-1.413-.35-.187-.85-.65-.013-.662.788-.013 1.35.725 1.538 1.025.9 1.512 2.338 1.087 2.912.825.088-.65.35-1.087.638-1.337-2.225-.25-4.55-1.113-4.55-4.938 0-1.088.387-1.987 1.025-2.688-.1-.25-.45-1.275.1-2.65 0 0 .837-.262 2.75 1.026a9.28 9.28 0 012.5-.338c.85 0 1.7.112 2.5.337 1.912-1.3 2.75-1.024 2.75-1.024.55 1.375.2 2.4.1 2.65.637.7 1.025 1.587 1.025 2.687 0 3.838-2.337 4.688-4.562 4.938.362.312.675.912.675 1.85 0 1.337-.013 2.412-.013 2.75 0 .262.188.574.688.474A10.016 10.016 0 0022 12c0-5.525-4.475-10-10-10z"
          />
        </svg>
      )
    case 'devops_gitlab_ci':
      return (
        <svg {...common}>
          <path fill="#E24329" d="M12 20.5L15.68 9.18H8.32L12 20.5z" />
          <path fill="#FC6D26" d="M12 20.5L8.32 9.18H3.16L12 20.5z" />
          <path fill="#FCA326" d="M3.16 9.18L2.04 12.62a.76.76 0 00.28.85L12 20.5 3.16 9.18z" />
          <path fill="#E24329" d="M3.16 9.18h5.16L6.1 2.34a.38.38 0 00-.72 0L3.16 9.18z" />
          <path fill="#FC6D26" d="M12 20.5l3.68-11.32h5.16L12 20.5z" />
          <path fill="#FCA326" d="M20.84 9.18l1.12 3.44a.76.76 0 01-.28.85L12 20.5l8.84-11.32z" />
          <path fill="#E24329" d="M20.84 9.18h-5.16l2.22-6.84a.38.38 0 01.72 0l2.22 6.84z" />
        </svg>
      )
    case 'sec_vault':
      return (
        <svg {...common}>
          <path
            fill="#FFCF25"
            d="M3.2 4.5h17.6L12 21 3.2 4.5zm6.6 3.7v2h1.6v-2H9.8zm2.8 0v2h1.6v-2h-1.6zm-2.8 3.1v2h1.6v-2H9.8zm2.8 0v2h1.6v-2h-1.6z"
          />
        </svg>
      )
    case 'obs_prometheus':
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="9.2" stroke="#E6522C" strokeWidth="1.8" />
          <path
            fill="#E6522C"
            d="M12 5.2c-.8 2-2.4 3.4-2.4 5.5 0 1.4.8 2.4 2.4 2.4s2.4-1 2.4-2.4c0-2.1-1.6-3.5-2.4-5.5zM7.6 15.2h8.8v1.6H7.6v-1.6zm1.7 2.5h5.4v1.3H9.3v-1.3z"
          />
        </svg>
      )
    case 'obs_grafana':
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="4.2" stroke="#F46800" strokeWidth="2.2" />
          <path
            stroke="#FF9830"
            strokeWidth="2"
            strokeLinecap="round"
            d="M12 2.8v2.4M12 18.8v2.4M2.8 12h2.4M18.8 12h2.4M5.5 5.5l1.7 1.7M16.8 16.8l1.7 1.7M18.5 5.5l-1.7 1.7M7.2 16.8l-1.7 1.7"
          />
        </svg>
      )
    case 'db_redis':
      return (
        <svg {...common}>
          <path fill="#DC382D" d="M12 3.5l8 3.6-8 3.6-8-3.6 8-3.6z" />
          <path fill="#B91C1C" d="M4 11.1l8 3.6 8-3.6v2.7l-8 3.6-8-3.6v-2.7z" />
          <path fill="#991B1B" d="M4 15.2l8 3.6 8-3.6v2.7l-8 3.6-8-3.6v-2.7z" />
        </svg>
      )
    case 'db_postgres':
      return (
        <svg {...common}>
          <path
            fill="#336791"
            d="M12 3.5c-4.2 0-7.5 3.1-7.5 7.1 0 2.5 1.1 4.6 2.8 5.9v2.8c0 .8.6 1.2 1.3 1.2.9 0 1.4-.6 1.4-1.5v-1.4c.6.2 1.3.3 2 .3s1.4-.1 2-.3v1.4c0 .9.5 1.5 1.4 1.5.7 0 1.3-.4 1.3-1.2v-2.8c1.7-1.3 2.8-3.4 2.8-5.9 0-4-3.3-7.1-7.5-7.1z"
          />
          <circle cx="9.6" cy="10.2" r="1.1" fill="#fff" />
          <circle cx="14.4" cy="10.2" r="1.1" fill="#fff" />
        </svg>
      )
    case 'net_nginx':
      return (
        <svg {...common}>
          <path fill="#009639" d="M12 2.2L20.5 7v10L12 21.8 3.5 17V7L12 2.2z" />
          <path stroke="#fff" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" d="M8.8 15.6V8.4l6.4 7.2V8.4" />
        </svg>
      )
    case 'msg_kafka':
      return (
        <svg {...common}>
          <circle cx="12" cy="5" r="2.2" stroke="currentColor" strokeWidth="1.8" />
          <circle cx="12" cy="12" r="2.5" stroke="currentColor" strokeWidth="1.8" />
          <circle cx="12" cy="19" r="2.2" stroke="currentColor" strokeWidth="1.8" />
          <circle cx="18.2" cy="8.5" r="2" stroke="currentColor" strokeWidth="1.8" />
          <circle cx="18.2" cy="15.5" r="2" stroke="currentColor" strokeWidth="1.8" />
          <path stroke="currentColor" strokeWidth="1.6" d="M12 7.2v2.3M12 14.5v2.3M14.2 10.7l2.2-1.3M14.2 13.3l2.2 1.3" />
        </svg>
      )
    case 'devops_ansible_playbook':
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="9.5" fill="#EE0000" />
          <path stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M8.5 16.5L12 6.8l3.8 9.7-4.7-3.4" />
        </svg>
      )
  }

  switch (provider) {
    case 'aws':
      return (
        <svg {...common}>
          <path
            fill="#FF9900"
            d="M7.6 12.6L6.2 7.4h1.6l.8 3.4.9-3.4h1.4l.9 3.4.8-3.4h1.6l-1.4 5.2h-1.6l-.9-3.3-.9 3.3H7.6z"
          />
          <path
            stroke="#FF9900"
            strokeWidth="1.9"
            strokeLinecap="round"
            d="M4.2 15.4c4.5 2.7 10.9 2.7 15.3 0"
          />
          <path
            stroke="#FF9900"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M17.8 14.4l2.1.8-.6 2.1"
          />
        </svg>
      )
    case 'azure':
      return (
        <svg {...common}>
          <path fill="#0078D4" d="M10.4 3.5L3.2 19.5h4.5l4.9-11.2L10.4 3.5z" />
          <path fill="#38BDF8" d="M13.5 3.5l-4.2 9.9 5.5 3.3-5.8 2.8h11.8L13.5 3.5z" />
        </svg>
      )
    case 'gcp':
      return (
        <svg {...common}>
          <path
            fill="#EA4335"
            d="M15.2 8.2A5.5 5.5 0 006.9 9.5l-2.3-1.8A8.3 8.3 0 0117.3 6l-2.1 2.2z"
          />
          <path
            fill="#FBBC05"
            d="M6.9 9.5a5.3 5.3 0 00-.4 2.5c0 .9.2 1.7.6 2.5L4.8 16.3A8.3 8.3 0 014.6 7.7l2.3 1.8z"
          />
          <path
            fill="#34A853"
            d="M16.5 17.6A8.3 8.3 0 014.8 16.3l2.3-1.8a5.4 5.4 0 007.4.9l2 2.2z"
          />
          <path
            fill="#4285F4"
            d="M20.3 12c0-.6-.1-1.2-.2-1.8H12v3.4h4.7a4 4 0 01-1.7 2.6l2 2.2c2-1.8 3.3-4.1 3.3-6.4z"
          />
        </svg>
      )
    case 'multi':
      return (
        <svg {...common}>
          <circle cx="8" cy="14" r="3.8" fill="#FF9900" fillOpacity="0.9" />
          <circle cx="16" cy="14" r="3.8" fill="#0078D4" fillOpacity="0.9" />
          <circle cx="12" cy="8.5" r="3.8" fill="#4285F4" fillOpacity="0.92" />
        </svg>
      )
    case 'kubernetes':
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="5.4" stroke="#326CE5" strokeWidth="2.1" />
          <circle cx="12" cy="12" r="1.7" fill="#326CE5" />
          <path
            stroke="#326CE5"
            strokeWidth="1.9"
            strokeLinecap="round"
            d="M12 2.8v3.8M12 17.4v3.8M4.6 6.2l3 2.3M16.4 15.5l3 2.3M19.4 6.2l-3 2.3M7.6 15.5l-3 2.3M3 13.8l3.6-.8M17.4 13l3.6.8"
          />
        </svg>
      )
    case 'docker':
      return (
        <svg {...common}>
          <path fill="#2496ED" d="M6.5 8.5h2.4v2.2H6.5V8.5zm2.9 0h2.4v2.2H9.4V8.5zm2.9 0h2.4v2.2h-2.4V8.5zm-2.9-2.7h2.4V8H9.4V5.8zm2.9 0h2.4V8h-2.4V5.8zm2.9 2.7h2.4v2.2h-2.4V8.5z" />
          <path
            fill="#2496ED"
            d="M21.4 11.4c-.6-.4-1.9-.6-2.8-.3-.2-.9-.8-1.8-1.6-2.3l-.3-.2-.2.3c-.4.7-.5 1.8-.1 2.7-.4.2-1.1.4-1.9.4H2.7l-.1.5c-.2 1.8.4 3.6 1.7 4.9 1.3 1.2 3.1 1.8 5.2 1.8 4.4 0 7.9-2 9.7-5.7.7 0 2.1.1 2.8-1.3.1-.1.2-.4.3-.6l-.9-.2z"
          />
        </svg>
      )
    case 'terraform':
      return (
        <svg {...common}>
          <path fill="#7B42BC" d="M8.8 3.5l5.4 3.1v6.2l-5.4-3.1V3.5z" />
          <path fill="#5C4EE5" d="M15.1 7.1l5.4-3.1v6.2l-5.4 3.1V7.1z" />
          <path fill="#7B42BC" d="M2.5 7.1l5.4 3.1v6.2l-5.4-3.1V7.1z" />
          <path fill="#5C4EE5" d="M8.8 10.9l5.4 3.1v6.2l-5.4-3.1v-6.2z" />
        </svg>
      )
    case 'devops':
      return (
        <svg {...common}>
          <path
            stroke="#38BDF8"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M8.5 16a4 4 0 110-8c2.2 0 3.5 2 3.5 4s1.3 4 3.5 4a4 4 0 100-8c-2.2 0-3.5 2-3.5 4s-1.3 4-3.5 4z"
          />
        </svg>
      )
    default:
      return (
        <svg {...common}>
          <path
            stroke="#94A3B8"
            strokeWidth="1.9"
            strokeLinejoin="round"
            d="M12 3.5l7.5 4.3v8.4L12 20.5l-7.5-4.3V7.8L12 3.5z"
          />
          <path stroke="#94A3B8" strokeWidth="1.7" d="M12 12.2l7.5-4.4M12 12.2v8.3M12 12.2L4.5 7.8" />
        </svg>
      )
  }
}

