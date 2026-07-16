import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { Sidebar } from '@/components/layout/Sidebar'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getServerSession()

  if (!session) {
    redirect('/login')
  }

  return (
    <div className="min-h-screen bg-background flex">
      <Sidebar />
      <main
        className="flex-1 ml-[240px] min-h-screen overflow-auto"
        id="main-content"
      >
        <div className="w-full h-full flex flex-col">
          {children}
        </div>
      </main>
    </div>
  )
}
