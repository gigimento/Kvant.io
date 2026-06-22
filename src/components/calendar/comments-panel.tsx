"use client"

import { useState, useEffect } from "react"
import { MessageSquare, Send } from "lucide-react"

interface Comment {
  id: string
  entry_id: string
  user_id: string
  comment: string
  created_at: string
}

interface Props {
  entryId: string
}

export function CommentsPanel({ entryId }: Props) {
  const [comments, setComments] = useState<Comment[]>([])
  const [text, setText] = useState("")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/content-calendar/${entryId}/comments`)
      .then(r => r.json())
      .then(d => { setComments(d.comments || []); setLoading(false) })
  }, [entryId])

  async function addComment() {
    if (!text.trim()) return
    const res = await fetch(`/api/content-calendar/${entryId}/comments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ comment: text }),
    })
    const data = await res.json()
    if (data.comment) {
      setComments(prev => [...prev, data.comment])
      setText("")
    }
  }

  return (
    <div className="mt-4">
      <h4 className="text-sm font-medium text-muted-foreground flex items-center gap-2 mb-3">
        <MessageSquare className="h-4 w-4" /> Comments ({comments.length})
      </h4>
      <div className="space-y-2 max-h-40 overflow-y-auto mb-3">
        {comments.map(c => (
          <div key={c.id} className="rounded-lg bg-white/5 px-3 py-2 text-sm">
            <p className="text-xs text-muted-foreground mb-1">{c.user_id.slice(0, 8)} · {new Date(c.created_at).toLocaleDateString()}</p>
            <p>{c.comment}</p>
          </div>
        ))}
        {!loading && comments.length === 0 && <p className="text-xs text-muted-foreground">No comments yet</p>}
      </div>
      <div className="flex gap-2">
        <input className="flex-1 rounded-lg border border-border bg-white/5 px-3 py-2 text-sm" value={text} onChange={e => setText(e.target.value)}
          placeholder="Add a comment..." onKeyDown={e => e.key === "Enter" && addComment()} />
        <button onClick={addComment} className="rounded-lg bg-accent p-2 text-white hover:bg-accent/90"><Send className="h-4 w-4" /></button>
      </div>
    </div>
  )
}
