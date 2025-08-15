'use client';

import { useAuth } from '@/contexts/AuthProvider';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  FileText,
  Clock,
  TrendingUp,
  ArrowRight,
  CheckCircle,
  Send
} from 'lucide-react';
import { Bar, BarChart, ResponsiveContainer, XAxis, Tooltip, Cell } from 'recharts';

// Mock data for the chart
const chartData = [
  { month: 'Jan', earnings: 12000, isSelected: false },
  { month: 'Feb', earnings: 15000, isSelected: false },
  { month: 'Mar', earnings: 11000, isSelected: false },
  { month: 'Apr', earnings: 18000, isSelected: false },
  { month: 'May', earnings: 22000, isSelected: false },
  { month: 'Jun', earnings: 19000, isSelected: true },
  { month: 'Jul', earnings: 25000, isSelected: false },
  { month: 'Aug', earnings: 16000, isSelected: false },
  { month: 'Sep', earnings: 20000, isSelected: false },
  { month: 'Oct', earnings: 17000, isSelected: false },
  { month: 'Nov', earnings: 21000, isSelected: false },
  { month: 'Dec', earnings: 23000, isSelected: false }
];

// Mock recent activities
const recentActivities = [
  {
    id: 1,
    user: 'Flight Operations',
    message: 'New roster uploaded for December',
    time: '2:15 PM',
    avatar: '/api/placeholder/32/32'
  },
  {
    id: 2,
    user: 'Payroll System',
    message: 'Salary calculation completed',
    time: '11:30 AM',
    avatar: '/api/placeholder/32/32'
  }
];

export default function DesignTestPage() {
  const { user } = useAuth();

  // Get current day info
  const now = new Date();
  const dayName = now.toLocaleDateString('en-US', { weekday: 'long' });
  const dayNumber = now.getDate();

  // Get selected month and calculate next month for salary expectation
  const selectedMonth = chartData.find(item => item.isSelected)?.month || 'Jun';
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const fullMonthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const selectedMonthIndex = monthNames.indexOf(selectedMonth);
  const nextMonthIndex = (selectedMonthIndex + 1) % 12;
  const nextMonthName = fullMonthNames[nextMonthIndex];
  const currentYear = new Date().getFullYear();
  const salaryYear = selectedMonthIndex === 11 ? currentYear + 1 : currentYear; // If December is selected, salary is paid in January of next year

  return (
    <div className="bg-gradient-to-br from-primary/3 to-primary/4 -m-6 min-h-[calc(100vh+3rem)] -mt-6">
      <div className="pt-6 px-6">
        {/* Main Content */}
        <div className="p-2">
          {/* Header Section */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-4xl font-bold text-gray-900 mb-2">Good Morning, Rafael</h1>
                <p className="text-lg text-gray-600">
                  {dayName} {dayNumber}
                </p>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <img
                      src={user?.user_metadata?.avatar_url || '/api/placeholder/48/48'}
                      alt="Profile"
                      className="w-10 h-10 rounded-full object-cover"
                    />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">
                      {user?.user_metadata?.first_name} {user?.user_metadata?.last_name}
                    </p>
                    <p className="text-sm text-gray-500">
                      {user?.user_metadata?.position || 'Crew Member'}
                    </p>
                  </div>
                </div>
                <ArrowRight className="h-5 w-5 text-gray-400" />
              </div>
            </div>
          </div>

          {/* Main Dashboard Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
            {/* Left Column - Balance & Chart */}
            <div className="lg:col-span-2">
              <Card className="bg-white border-none shadow-none rounded-3xl h-full">
                <CardHeader className="pb-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-2xl font-bold text-gray-900 mb-4">Overview</CardTitle>
                      <div className="text-5xl font-bold text-gray-900 mb-2">
                        $595,196 <span className="text-xl font-normal text-gray-500">(USD)</span>
                      </div>
                      <p className="text-sm text-gray-500">Expected salary for {nextMonthName}, {salaryYear}</p>
                    </div>
                    <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                      <Send className="h-5 w-5 text-gray-600" />
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {/* MAX Line */}
                  <div className="relative mb-4">
                    <div className="border-t border-dashed border-gray-300 w-full"></div>
                    <span className="absolute right-0 -top-3 text-xs text-gray-500 bg-white px-2">MAX</span>
                  </div>

                  {/* Chart */}
                  <div className="h-48">
                    <style dangerouslySetInnerHTML={{
                      __html: `
                        .recharts-bar-rectangle:hover {
                          filter: none !important;
                          opacity: 1 !important;
                          background: none !important;
                          background-color: inherit !important;
                        }
                        .recharts-active-bar {
                          filter: none !important;
                          opacity: 1 !important;
                          background: none !important;
                          background-color: inherit !important;
                        }
                        .recharts-bar-rectangle {
                          transition: none !important;
                        }
                      `
                    }} />
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                        <XAxis
                          dataKey="month"
                          axisLine={false}
                          tickLine={false}
                          tick={{ fontSize: 12, fill: '#6B7280' }}
                        />
                        <Tooltip
                          formatter={(value) => [`$${value.toLocaleString()}`, 'Earnings']}
                          labelStyle={{ color: '#374151' }}
                          contentStyle={{
                            backgroundColor: 'white',
                            border: 'none',
                            borderRadius: '12px',
                            boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                          }}
                        />
                        <Bar
                          dataKey="earnings"
                          radius={[8, 8, 0, 0]}
                          cursor="pointer"
                          onMouseEnter={() => {}}
                          onMouseLeave={() => {}}
                        >
                          {chartData.map((entry, index) => (
                            <Cell
                              key={`cell-${index}`}
                              fill={entry.isSelected ? '#4C49ED' : 'rgba(76, 73, 237, 0.08)'}
                              style={{
                                cursor: 'pointer',
                                fill: entry.isSelected ? '#4C49ED' : 'rgba(76, 73, 237, 0.08)'
                              }}
                            />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Right Column - Metrics */}
            <div className="space-y-6">
              {/* Metric Card 1 */}
              <Card className="bg-white border-none shadow-none rounded-3xl">
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-blue-500/20 rounded-2xl flex items-center justify-center">
                      <Clock className="h-8 w-8 text-blue-600" />
                    </div>
                    <div>
                      <div className="text-3xl font-bold text-blue-900">12</div>
                      <div className="text-sm text-blue-700">Flight Hours</div>
                      <div className="text-xs text-blue-600">This week</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Metric Card 2 */}
              <Card className="bg-white border-none shadow-none rounded-3xl">
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-purple-500/20 rounded-2xl flex items-center justify-center">
                      <CheckCircle className="h-8 w-8 text-purple-600" />
                    </div>
                    <div>
                      <div className="text-3xl font-bold text-purple-900">4</div>
                      <div className="text-sm text-purple-700">Completed</div>
                      <div className="text-xs text-purple-600">This month</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Metric Card 3 */}
              <Card className="bg-white border-none shadow-none rounded-3xl">
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-accent/30 rounded-2xl flex items-center justify-center">
                      <TrendingUp className="h-8 w-8 text-green-700" />
                    </div>
                    <div>
                      <div className="text-3xl font-bold text-green-900">38</div>
                      <div className="text-sm text-green-700">Flights</div>
                      <div className="text-xs text-green-600">Total this year</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Bottom Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Recent Activities */}
            <Card className="bg-white border-none shadow-none rounded-3xl">
              <CardHeader className="pb-4">
                <CardTitle className="text-xl font-bold text-gray-900">Recent Activities</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentActivities.map((activity) => (
                    <div key={activity.id} className="flex items-center gap-4 p-3 rounded-2xl hover:bg-gray-50 transition-colors">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <FileText className="h-5 w-5 text-primary" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{activity.user}</p>
                        <p className="text-sm text-gray-600">{activity.message}</p>
                      </div>
                      <div className="text-sm text-gray-500">{activity.time}</div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Goals Progress */}
            <Card className="bg-white border-none shadow-none rounded-3xl">
              <CardHeader className="pb-4">
                <CardTitle className="text-xl font-bold text-gray-900">Monthly Goals</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center">
                  <div className="relative w-32 h-32 mx-auto mb-4">
                    <svg className="w-32 h-32 transform -rotate-90" viewBox="0 0 36 36">
                      <path
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                        fill="none"
                        stroke="#E5E7EB"
                        strokeWidth="2"
                      />
                      <path
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                        fill="none"
                        stroke="#4C49ED"
                        strokeWidth="2"
                        strokeDasharray="72, 100"
                        strokeLinecap="round"
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-center">
                        <div className="text-3xl font-bold text-primary">72%</div>
                        <div className="text-xs text-gray-500">completed</div>
                      </div>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">Flight hours goal achieved</p>
                  <Badge variant="secondary" className="bg-accent/20 text-accent-foreground">
                    On Track
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
