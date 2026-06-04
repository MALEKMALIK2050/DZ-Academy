// components/forum/Avatar.tsx
export type PostRole = 'ADMIN' | 'DESIGNER' | 'TEACHER' | 'STUDENT'

interface AvatarProps {
  firstName: string
  lastName: string
  role: PostRole
  size?: 'sm' | 'md'
}

const roleColors: Record<PostRole, string> = {
  ADMIN:    'bg-gradient-to-br from-purple-100 to-purple-200 text-purple-700',
  DESIGNER: 'bg-gradient-to-br from-pink-100 to-pink-200 text-pink-700',
  TEACHER:  'bg-gradient-to-br from-amber-100 to-amber-200 text-amber-700',
  STUDENT:  'bg-gradient-to-br from-blue-100 to-blue-200 text-blue-700',
}

export default function Avatar({
  firstName,
  lastName,
  role = 'STUDENT',
  size = 'md',
}: AvatarProps) {
  const fName = firstName || ''
  const lName = lastName || ''

  const initials = fName && lName
    ? `${fName[0]}${lName[0]}`.toUpperCase()
    : fName
    ? fName[0].toUpperCase()
    : '?'

  const sizeClass = size === 'sm'
    ? 'w-7 h-7 text-[10px]'
    : 'w-11 h-11 text-[12px]'

  return (
    <div
      className={`${sizeClass} ${roleColors[role]} rounded-full flex items-center justify-center font-semibold 
        shrink-0 shadow-sm border border-white/50 transition-transform hover:scale-105`}
      title={`${fName} ${lName} (${role})`}
    >
      {initials}
    </div>
  )
}
