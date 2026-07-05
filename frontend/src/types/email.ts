export interface Email {
  id: string
  subject: string
  sender: string
  date: string
  category?: string
}

export interface EmailDetail extends Email {
  body?: string
  threadId?: string
}
