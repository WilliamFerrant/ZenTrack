'use client'

import { motion } from 'framer-motion'
import { Play, FolderOpen } from 'lucide-react'
import Link from 'next/link'
import { useDataStore, useTimerStore } from '@/stores'
import type { Project } from '@/types'

function fmtHM(sec: number) {
  const h = String(Math.floor(sec / 3600)).padStart(2, '0')
  const m = String(Math.floor((sec % 3600) / 60)).padStart(2, '0')
  return `${h}:${m}`
}

export default function ProjectsGrid() {
  const { projects, isLoadingProjects } = useDataStore()
  const { isRunning, setSelectedProject, startTimer } = useTimerStore()

  const quickStart = async (p: Project) => {
    setSelectedProject(p)
    if (!isRunning) {
      try { await startTimer({ project_id: p.id }) } catch {}
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.15, ease: [0.32, 0.72, 0, 1] }}
    >
      <h2 className="text-lg font-medium text-foreground mb-4">Quick Start</h2>

      {isLoadingProjects ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="glass-card h-32 animate-pulse" />
          ))}
        </div>
      ) : projects.length === 0 ? (
        <div className="glass-card p-8 flex flex-col items-center gap-3">
          <FolderOpen size={32} className="text-muted-foreground" />
          <p className="text-sm text-muted-foreground">No projects yet</p>
          <Link href="/app/projects"
            className="text-xs px-4 py-2 rounded-lg font-medium transition-colors hover:opacity-80"
            style={{ background: 'hsl(var(--primary))', color: 'hsl(var(--primary-foreground))' }}>
            Create project
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {projects.slice(0, 6).map((p, i) => (
            <motion.button
              key={p.id}
              whileHover={{ y: -3 }}
              transition={{ duration: 0.2 }}
              onClick={() => quickStart(p)}
              className="glass-card p-4 flex flex-col items-start text-left h-32 justify-between group relative overflow-hidden"
            >
              <div>
                <div className="w-2.5 h-2.5 rounded-full mb-2"
                  style={{ backgroundColor: p.color || 'hsl(var(--primary))' }} />
                <p className="font-medium text-sm text-foreground">{p.name}</p>
              </div>
              <div className="flex items-end justify-between w-full">
                <div>
                  <p className="text-[11px] text-muted-foreground">Today</p>
                  <p className="font-mono text-sm text-foreground tabular-nums">
                    {fmtHM(p.total_time ?? 0)}
                  </p>
                </div>
                <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                  <Play size={14} className="text-primary" fill="currentColor" />
                </div>
              </div>
            </motion.button>
          ))}
        </div>
      )}
    </motion.div>
  )
}
