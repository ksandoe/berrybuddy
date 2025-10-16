export default function Logo({ className = 'h-6 w-auto' }: { className?: string }) {
  return (
    <img src="/favicon.svg?v=3" alt="Berry Buddy" className={className} />
  )
}
