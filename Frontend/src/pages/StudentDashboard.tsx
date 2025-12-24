import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Navbar } from "@/components/navbar"
import api from "@/services/api"
import { MessageCircle, Megaphone, FileText, Users, Loader2 } from "lucide-react"
import { authService } from "@/lib/auth"
import StudentTabs from "@/pages/StudentTabs"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"

export default function StudentDashboard() {
  const navigate = useNavigate()

  const [activeTab, setActiveTab] = useState<"discussion" | "announcements" | "documents" | null>(null)
  const [user, setUser] = useState<any>(null)
  const [loadingUser, setLoadingUser] = useState(true)
  const [showGroupDialog, setShowGroupDialog] = useState(false)
  const [groupStats, setGroupStats] = useState<{
    lecturers: { name: string }[]
    students: { name: string }[]
  } | null>(null)
  const [loadingStats, setLoadingStats] = useState(false)

  // Fetch and verify user
  useEffect(() => {
    const storedUser = authService.getCurrentUser()
    if (!storedUser) navigate("/login")
    else setUser(storedUser)
    setLoadingUser(false)
  }, [navigate])

  // Fetch group member details
  const fetchGroupStats = async () => {
    try {
      setLoadingStats(true)
      const res = await api.get(`/groups/${user.group_id}/members`)
      setGroupStats(res.data)
    } catch (err) {
      console.error("Error fetching group stats:", err)
      setGroupStats(null)
    } finally {
      setLoadingStats(false)
    }
  }

  // Redirect if not student
  useEffect(() => {
    if (user && user.role !== "student") navigate("/login")
  }, [user, navigate])

  // Loading screen
  if (loadingUser) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    )
  }

  // Safety check
  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen text-gray-600">
        Redirecting to login...
      </div>
    )
  }

  // Greeting message
  const hours = new Date().getHours()
  const greeting =
    hours < 12 ? "Good Morning" : hours < 18 ? "Good Afternoon" : "Good Evening"

  // If a tab is active, show StudentTabs page
  if (activeTab) {
    return <StudentTabs activeTab={activeTab} setActiveTab={setActiveTab} user={user} />
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-50 via-white to-zinc-100 dark:from-zinc-900 dark:via-zinc-950 dark:to-black transition-colors">
      <Navbar showBack backTo="/" />

      <main className="container mx-auto px-4 py-8">
        {/* Header Card */}
        <Card className="mb-10 text-center border-0 shadow-md bg-gradient-to-r from-indigo-500 to-purple-500 dark:from-indigo-800 dark:to-purple-900 text-white rounded-2xl">
          <CardHeader>
            <CardTitle className="text-2xl md:text-3xl font-bold">
              👋 {greeting}, {user?.name}!
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="opacity-90">Group: {user?.branch}-{user?.year}</p>
          </CardContent>
        </Card>

        {/* Dashboard Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative">
          {/* Discussion */}
          <Card
            onClick={() => setActiveTab("discussion")}
            className="group cursor-pointer overflow-hidden rounded-2xl border-0 shadow-xl transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl bg-gradient-to-br from-blue-500 to-indigo-500 dark:from-blue-900 dark:to-indigo-950 text-white"
          >
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <MessageCircle className="h-5 w-5" /> Group Discussion
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-white/90">Chat and collaborate with your group.</p>
            </CardContent>
          </Card>

          {/* Announcements */}
          <Card
            onClick={() => setActiveTab("announcements")}
            className="group cursor-pointer overflow-hidden rounded-2xl border-0 shadow-xl transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl bg-gradient-to-br from-pink-500 to-rose-500 dark:from-pink-900 dark:to-rose-950 text-white"
          >
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <Megaphone className="h-5 w-5" /> Announcements
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-white/90">View study materials and upcoming events.</p>
            </CardContent>
          </Card>

          {/* Documents */}
          <div className="md:col-span-2 flex justify-center mt-2">
            <Card
              onClick={() => setActiveTab("documents")}
              className="group w-full md:w-1/2 cursor-pointer overflow-hidden rounded-2xl border-0 shadow-xl transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl bg-gradient-to-br from-green-500 to-emerald-500 dark:from-green-900 dark:to-emerald-950 text-white"
            >
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <FileText className="h-5 w-5" /> Document Signing
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-white/90">Review and sign important documents.</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      {/* Floating "People" Button */}
      <Button
        size="icon"
        variant="secondary"
        className="fixed bottom-6 right-6 rounded-full shadow-lg bg-indigo-600 hover:bg-indigo-700 text-white"
        onClick={() => {
          setShowGroupDialog(true)
          fetchGroupStats()
        }}
      >
        <Users className="h-5 w-5" />
      </Button>

      {/* Group Dialog */}
      <Dialog open={showGroupDialog} onOpenChange={setShowGroupDialog}>
        <DialogContent className="max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold text-gray-800 dark:text-gray-100">
              People in {user.branch}-{user.year}
            </DialogTitle>
          </DialogHeader>

          {loadingStats ? (
            <div className="flex justify-center py-6">
              <Loader2 className="h-6 w-6 animate-spin text-indigo-500" />
            </div>
          ) : groupStats ? (
            <div className="space-y-6 py-3">
              {/* Lecturers */}
              <div>
                <h3 className="text-sm font-semibold uppercase text-gray-500 mb-2">Lecturers</h3>
                <div className="space-y-2 max-h-40 overflow-y-auto pr-2">
                  {groupStats.lecturers.length > 0 ? (
                    [...groupStats.lecturers]
                      .sort((a, b) => a.name.localeCompare(b.name))
                      .map((lec, i) => (
                        <div
                          key={i}
                          className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition"
                        >
                          <div className="flex items-center justify-center h-8 w-8 rounded-full bg-indigo-500 text-white font-medium">
                            {lec.name.charAt(0).toUpperCase()}
                          </div>
                          <span className="text-gray-800 dark:text-gray-200">{lec.name}</span>
                        </div>
                      ))
                  ) : (
                    <p className="text-gray-500 text-sm">No lecturers found</p>
                  )}
                </div>
              </div>

              {/* Students */}
              <div>
                <h3 className="text-sm font-semibold uppercase text-gray-500 mb-2">Students</h3>
                <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
                  {groupStats.students.length > 0 ? (
                    [...groupStats.students]
                      .sort((a, b) => a.name.localeCompare(b.name))
                      .map((stu, i) => (
                        <div
                          key={i}
                          className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition"
                        >
                          <div className="flex items-center justify-center h-8 w-8 rounded-full bg-green-500 text-white font-medium">
                            {stu.name.charAt(0).toUpperCase()}
                          </div>
                          <span className="text-gray-800 dark:text-gray-200">{stu.name}</span>
                        </div>
                      ))
                  ) : (
                    <p className="text-gray-500 text-sm">No students found</p>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <p className="text-center text-red-500 py-4">Failed to load group info.</p>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
