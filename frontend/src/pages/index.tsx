import { useState } from 'react'
import Link from 'next/link'
import { ChartBarIcon, MapIcon, DocumentChartBarIcon, CogIcon } from '@heroicons/react/24/outline'

export default function HomePage() {
  const [stats, setStats] = useState({
    totalProperties: 47823,
    avgValue: 312450,
    recentValuations: 156,
    activeScenarios: 12
  })

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-gray-900">TerraBuild</h1>
            </div>
            <div className="flex items-center space-x-4">
              <Link href="/auth/login" className="text-gray-500 hover:text-gray-700">
                Login
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="text-center">
            <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
              Advanced Property Valuation Platform
            </h2>
            <p className="mt-3 max-w-2xl mx-auto text-xl text-gray-500 sm:mt-4">
              Comprehensive municipal property assessments with AI-powered analysis and geospatial visualization
            </p>
          </div>

          {/* Stats */}
          <div className="mt-10">
            <dl className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <ChartBarIcon className="h-6 w-6 text-gray-400" />
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">
                          Total Properties
                        </dt>
                        <dd className="text-lg font-medium text-gray-900">
                          {stats.totalProperties.toLocaleString()}
                        </dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <DocumentChartBarIcon className="h-6 w-6 text-gray-400" />
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">
                          Average Value
                        </dt>
                        <dd className="text-lg font-medium text-gray-900">
                          ${stats.avgValue.toLocaleString()}
                        </dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <MapIcon className="h-6 w-6 text-gray-400" />
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">
                          Recent Valuations
                        </dt>
                        <dd className="text-lg font-medium text-gray-900">
                          {stats.recentValuations}
                        </dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <CogIcon className="h-6 w-6 text-gray-400" />
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">
                          Active Scenarios
                        </dt>
                        <dd className="text-lg font-medium text-gray-900">
                          {stats.activeScenarios}
                        </dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>
            </dl>
          </div>

          {/* Feature Grid */}
          <div className="mt-16">
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              <Link href="/valuations" className="group relative bg-white p-6 focus-within:ring-2 focus-within:ring-inset focus-within:ring-indigo-500 rounded-lg shadow hover:shadow-md transition-shadow">
                <div>
                  <span className="rounded-lg inline-flex p-3 bg-indigo-50 text-indigo-600 ring-4 ring-white">
                    <ChartBarIcon className="h-6 w-6" />
                  </span>
                </div>
                <div className="mt-8">
                  <h3 className="text-lg font-medium">
                    Property Valuations
                  </h3>
                  <p className="mt-2 text-sm text-gray-500">
                    Calculate accurate property valuations using cost approach methodology with real-time market factors.
                  </p>
                </div>
              </Link>

              <Link href="/cost-tables" className="group relative bg-white p-6 focus-within:ring-2 focus-within:ring-inset focus-within:ring-indigo-500 rounded-lg shadow hover:shadow-md transition-shadow">
                <div>
                  <span className="rounded-lg inline-flex p-3 bg-green-50 text-green-600 ring-4 ring-white">
                    <DocumentChartBarIcon className="h-6 w-6" />
                  </span>
                </div>
                <div className="mt-8">
                  <h3 className="text-lg font-medium">
                    Cost Tables
                  </h3>
                  <p className="mt-2 text-sm text-gray-500">
                    Manage and update cost factors, depreciation schedules, and regional adjustments.
                  </p>
                </div>
              </Link>

              <Link href="/scenarios" className="group relative bg-white p-6 focus-within:ring-2 focus-within:ring-inset focus-within:ring-indigo-500 rounded-lg shadow hover:shadow-md transition-shadow">
                <div>
                  <span className="rounded-lg inline-flex p-3 bg-yellow-50 text-yellow-600 ring-4 ring-white">
                    <CogIcon className="h-6 w-6" />
                  </span>
                </div>
                <div className="mt-8">
                  <h3 className="text-lg font-medium">
                    Scenario Modeling
                  </h3>
                  <p className="mt-2 text-sm text-gray-500">
                    Run what-if scenarios with different market conditions and valuation parameters.
                  </p>
                </div>
              </Link>

              <Link href="/reports" className="group relative bg-white p-6 focus-within:ring-2 focus-within:ring-inset focus-within:ring-indigo-500 rounded-lg shadow hover:shadow-md transition-shadow">
                <div>
                  <span className="rounded-lg inline-flex p-3 bg-purple-50 text-purple-600 ring-4 ring-white">
                    <DocumentChartBarIcon className="h-6 w-6" />
                  </span>
                </div>
                <div className="mt-8">
                  <h3 className="text-lg font-medium">
                    Analytics & Reports
                  </h3>
                  <p className="mt-2 text-sm text-gray-500">
                    Generate comprehensive reports and analytics for municipal assessments.
                  </p>
                </div>
              </Link>

              <Link href="/gis" className="group relative bg-white p-6 focus-within:ring-2 focus-within:ring-inset focus-within:ring-indigo-500 rounded-lg shadow hover:shadow-md transition-shadow">
                <div>
                  <span className="rounded-lg inline-flex p-3 bg-blue-50 text-blue-600 ring-4 ring-white">
                    <MapIcon className="h-6 w-6" />
                  </span>
                </div>
                <div className="mt-8">
                  <h3 className="text-lg font-medium">
                    GIS Analysis
                  </h3>
                  <p className="mt-2 text-sm text-gray-500">
                    Spatial analysis, buffer zones, and geographic property insights.
                  </p>
                </div>
              </Link>

              <Link href="/batch" className="group relative bg-white p-6 focus-within:ring-2 focus-within:ring-inset focus-within:ring-indigo-500 rounded-lg shadow hover:shadow-md transition-shadow">
                <div>
                  <span className="rounded-lg inline-flex p-3 bg-red-50 text-red-600 ring-4 ring-white">
                    <DocumentChartBarIcon className="h-6 w-6" />
                  </span>
                </div>
                <div className="mt-8">
                  <h3 className="text-lg font-medium">
                    Batch Processing
                  </h3>
                  <p className="mt-2 text-sm text-gray-500">
                    Upload and process large datasets with comprehensive error handling.
                  </p>
                </div>
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}