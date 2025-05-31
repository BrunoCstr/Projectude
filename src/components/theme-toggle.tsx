
"use client"

import * as React from "react"
import { Moon, Sun, Coffee } from "lucide-react" // Added Coffee icon
import { useTheme } from "next-themes"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Skeleton } from "@/components/ui/skeleton" // Import Skeleton

export function ThemeToggle() {
  const { setTheme, theme } = useTheme()
  const [mounted, setMounted] = React.useState(false)

  // Ensure the component is mounted before rendering theme-specific icons
  React.useEffect(() => {
    setMounted(true)
  }, [])

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon">
          {!mounted ? (
             <Skeleton className="h-[1.2rem] w-[1.2rem] rounded-full" /> // Placeholder while not mounted
           ) : theme === 'dark' ? (
             <Moon className="h-[1.2rem] w-[1.2rem]" />
          ) : theme === 'cafe' ? (
              <Coffee className="h-[1.2rem] w-[1.2rem]" />
           ) : (
              <Sun className="h-[1.2rem] w-[1.2rem]" />
           )}
          <span className="sr-only">Toggle theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => setTheme("dark")}>
           <Moon className="mr-2 h-4 w-4" /> Dark
        </DropdownMenuItem>
         <DropdownMenuItem onClick={() => setTheme("cafe")}>
           <Coffee className="mr-2 h-4 w-4" /> Café {/* Add Cafe option */}
         </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("system")}>
          System
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

