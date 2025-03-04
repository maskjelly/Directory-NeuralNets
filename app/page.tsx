import Dashboard from "@/app/dashboard/page"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"

export default function Home() {
  return (
    <div className="relative">
      <Button asChild className="fixed bottom-6 right-6 rounded-full shadow-lg z-50">
        <a href="/add">
          <Plus className="w-4 h-4 mr-2" />
          Add Resource
        </a>
      </Button>
      <Dashboard />
    </div>
  )
}

