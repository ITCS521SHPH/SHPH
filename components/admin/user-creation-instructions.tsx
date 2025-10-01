"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Copy, ExternalLink, CheckCircle } from "lucide-react"
import { useState } from "react"

interface UserCreationInstructionsProps {
  userData: {
    email: string
    password: string
    role: 'DOCTOR' | 'VHV'
    firstName: string
    lastName: string
  }
  onClose: () => void
}

export function UserCreationInstructions({ userData, onClose }: UserCreationInstructionsProps) {
  const [copied, setCopied] = useState(false)

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const sqlCommand = `-- Add this user to Supabase Auth and set role
INSERT INTO users (id, email, role)
SELECT id, '${userData.email}', '${userData.role}'::user_role
FROM auth.users 
WHERE email = '${userData.email}'
ON CONFLICT (id) DO UPDATE SET 
  email = EXCLUDED.email,
  role = '${userData.role}'::user_role;`

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-500" />
            User Creation Instructions
          </CardTitle>
          <CardDescription>
            Since we're using Supabase Auth, you need to create this user manually in the Supabase Dashboard.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Email</label>
              <div className="flex items-center gap-2 mt-1">
                <code className="px-2 py-1 bg-gray-100 rounded text-sm">{userData.email}</code>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => copyToClipboard(userData.email)}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium">Password</label>
              <div className="flex items-center gap-2 mt-1">
                <code className="px-2 py-1 bg-gray-100 rounded text-sm">{userData.password}</code>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => copyToClipboard(userData.password)}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          <div>
            <label className="text-sm font-medium">Role</label>
            <div className="mt-1">
              <Badge variant="secondary">{userData.role}</Badge>
            </div>
          </div>

          <div>
            <label className="text-sm font-medium">Name</label>
            <div className="mt-1">
              <span className="text-sm">{userData.firstName} {userData.lastName}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Step 1: Create User in Supabase Dashboard</CardTitle>
          <CardDescription>
            Go to your Supabase project dashboard and create this user in the Authentication section.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            onClick={() => window.open('https://supabase.com/dashboard/project/qhfhkcenynvxrpvfkyqd/auth/users', '_blank')}
            className="w-full"
          >
            <ExternalLink className="h-4 w-4 mr-2" />
            Open Supabase Dashboard
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Step 2: Set User Role</CardTitle>
          <CardDescription>
            After creating the user, run this SQL command in the Supabase SQL Editor to set the role.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">SQL Command</label>
              <Button
                size="sm"
                variant="outline"
                onClick={() => copyToClipboard(sqlCommand)}
              >
                {copied ? <CheckCircle className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                {copied ? 'Copied!' : 'Copy'}
              </Button>
            </div>
            <pre className="bg-gray-100 p-3 rounded text-xs overflow-x-auto">
              {sqlCommand}
            </pre>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={onClose}>
          Close
        </Button>
        <Button onClick={onClose}>
          Done
        </Button>
      </div>
    </div>
  )
}
