'use client'

import { inviteUserAction } from '@/lib/actions/admin-invite'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useState } from 'react'

export default function TestInvitePage() {
  const [message, setMessage] = useState('')

  async function handleSubmit(formData: FormData) {
    const result = await inviteUserAction(formData)
    if (result.error) {
      setMessage(`Error: ${result.error}`)
    } else {
      setMessage(`Success: ${result.message}`)
    }
  }

  return (
    <div className="p-10 max-w-md mx-auto space-y-4">
      <h1 className="text-2xl font-bold">Admin Invite Test</h1>
      
      <form action={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium">Email Address</label>
          <Input name="email" type="email" placeholder="colleague@example.com" required />
        </div>
        
        <div>
          <label className="block text-sm font-medium">Role</label>
          <select name="role" className="w-full border rounded p-2 bg-background">
            <option value="user">User</option>
            <option value="recruiter">Recruiter</option>
            <option value="admin">Admin</option>
          </select>
        </div>

        <Button type="submit">Send Invite</Button>
      </form>

      {message && (
        <div className="p-4 bg-slate-800 text-white rounded">
          {message}
        </div>
      )}
    </div>
  )
}