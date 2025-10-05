import * as React from "react"
import { cn } from "../lib/utils"

interface ChatWidgetProps extends React.HTMLAttributes<HTMLDivElement> {
    messages?: Array<{ id: string; content: string; sender: string }>
    onSendMessage?: (message: string) => void
}

const ChatWidget = React.forwardRef<HTMLDivElement, ChatWidgetProps>(
    ({ className, messages = [], onSendMessage, ...props }, ref) => {
        const [inputMessage, setInputMessage] = React.useState("")

        const handleSend = () => {
            if (inputMessage.trim() && onSendMessage) {
                onSendMessage(inputMessage.trim())
                setInputMessage("")
            }
        }

        const handleKeyPress = (e: React.KeyboardEvent) => {
            if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault()
                handleSend()
            }
        }

        return (
            <div
                ref={ref}
                className={cn(
                    "flex h-96 flex-col rounded-lg border bg-background p-4",
                    className
                )}
                {...props}
            >
                <div className="flex-1 overflow-y-auto space-y-2 mb-4">
                    {messages.length === 0 ? (
                        <p className="text-muted-foreground text-sm">No messages yet...</p>
                    ) : (
                        messages.map((message) => (
                            <div
                                key={message.id}
                                className="p-2 rounded bg-muted/50 text-sm"
                            >
                                <strong>{message.sender}:</strong> {message.content}
                            </div>
                        ))
                    )}
                </div>
                <div className="flex gap-2">
                    <input
                        type="text"
                        placeholder="Type a message..."
                        value={inputMessage}
                        onChange={(e) => setInputMessage(e.target.value)}
                        onKeyDown={handleKeyPress}
                        className="flex-1 px-3 py-2 text-sm border rounded-md bg-background"
                    />
                    <button
                        onClick={handleSend}
                        disabled={!inputMessage.trim()}
                        className="px-4 py-2 text-sm font-medium rounded-md bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:pointer-events-none"
                    >
                        Send
                    </button>
                </div>
            </div>
        )
    }
)
ChatWidget.displayName = "ChatWidget"

export { ChatWidget }
