import OpenAI from "openai"

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export interface AIMessage {
  role: "user" | "assistant" | "system"
  content: string
}

export async function generateAIResponse(messages: AIMessage[]): Promise<string> {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("OpenAI API key is not set")
  }

  const response = await openai.chat.completions.create({
    model: "gpt-4-turbo",
    messages: messages.map((m) => ({
      role: m.role as "user" | "assistant" | "system",
      content: m.content,
    })),
    temperature: 0.7,
  })

  return response.choices[0]?.message?.content || "(no response)"
}
