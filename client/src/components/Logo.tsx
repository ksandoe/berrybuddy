export default function Logo({ className = 'h-6 w-auto' }: { className?: string }) {
  return (
    <img src="/logo.svg" alt="Berry Buddy" className={className} />
  )
}
