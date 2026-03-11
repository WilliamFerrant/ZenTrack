// Project selector component for timer
'use client'

import { useEffect, useState } from 'react'
import { useTimerStore, useDataStore } from '@/stores'
import type { Project } from '@/types'

interface ProjectSelectorProps {
  className?: string
}

export function ProjectSelector({ className = '' }: ProjectSelectorProps) {
  const {
    selectedProject,
    setSelectedProject,
    description,
    updateDescription,
    error: timerError
  } = useTimerStore()

  const {
    projects,
    isLoadingProjects,
    fetchProjects,
    error: dataError
  } = useDataStore()

  const [isOpen, setIsOpen] = useState(false)

  // Load projects when component mounts
  useEffect(() => {
    if (projects.length === 0 && !isLoadingProjects) {
      fetchProjects()
    }
  }, [projects.length, isLoadingProjects, fetchProjects])

  const handleProjectSelect = (project: Project | null) => {
    setSelectedProject(project)
    setIsOpen(false)
  }

  const filteredProjects = projects.filter(project => project.is_active)

  if (isLoadingProjects) {
    return (
      <div className={`space-y-4 ${className}`}>
        <div className="animate-pulse">
          <div className="h-12 bg-gray-200 rounded-md"></div>
        </div>
      </div>
    )
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Project Selection */}
      <div>
        <label htmlFor="project-select" className="block text-sm font-medium text-gray-700 mb-2">
          Project (optional)
        </label>
        <div className="relative">
          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            className="w-full bg-white border border-gray-300 rounded-md px-3 py-2 text-left shadow-sm focus:border-blue-500 focus:ring-blue-500 focus:outline-none focus:ring-2"
          >
            {selectedProject ? (
              <div className="flex items-center space-x-2">
                <div
                  className="w-3 h-3 rounded-full flex-shrink-0"
                  style={{ backgroundColor: selectedProject.color }}
                />
                <span className="text-gray-900 truncate">{selectedProject.name}</span>
              </div>
            ) : (
              <span className="text-gray-500">Select a project...</span>
            )}
            <div className="absolute inset-y-0 right-0 flex items-center pr-2">
              <svg
                className={`w-5 h-5 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </button>

          {/* Project Dropdown */}
          {isOpen && (
            <div className="absolute z-10 mt-1 w-full bg-white shadow-lg max-h-60 rounded-md py-1 text-base ring-1 ring-black ring-opacity-5 overflow-auto focus:outline-none sm:text-sm">
              {/* Clear selection option */}
              <button
                type="button"
                onClick={() => handleProjectSelect(null)}
                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 focus:bg-gray-100 focus:outline-none"
              >
                <span className="text-gray-500 italic">No project</span>
              </button>

              {/* Project options */}
              {filteredProjects.map((project) => (
                <button
                  key={project.id}
                  type="button"
                  onClick={() => handleProjectSelect(project)}
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 focus:bg-gray-100 focus:outline-none"
                >
                  <div className="flex items-center space-x-2">
                    <div
                      className="w-3 h-3 rounded-full flex-shrink-0"
                      style={{ backgroundColor: project.color }}
                    />
                    <span className="text-gray-900">{project.name}</span>
                    {project.description && (
                      <span className="text-gray-500 text-xs truncate">
                        {project.description}
                      </span>
                    )}
                  </div>
                </button>
              ))}

              {filteredProjects.length === 0 && (
                <div className="px-4 py-2 text-sm text-gray-500 italic">
                  No active projects available
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Description Input */}
      <div>
        <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
          Description (optional)
        </label>
        <textarea
          id="description"
          rows={2}
          value={description}
          onChange={(e) => updateDescription(e.target.value)}
          placeholder="What are you working on?"
          className="w-full border border-gray-300 rounded-md px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-blue-500 focus:outline-none focus:ring-2 resize-none"
          maxLength={500}
        />
        <div className="mt-1 text-xs text-gray-500">
          {description.length}/500 characters
        </div>
      </div>

      {/* Error Messages */}
      {(dataError && projects.length === 0) && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-800">
            Failed to load projects. You can still start a timer without selecting a project.
          </p>
        </div>
      )}

      {/* Close dropdown when clicking outside */}
      {isOpen && (
        <div
          className="fixed inset-0 z-0"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  )
}