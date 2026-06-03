import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/router";
import Layout from "@/components/layout/Layout";
import api from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { getSocket } from "@/lib/socket";

function detectAttachmentType(url: string, filename?: string): "image" | "video" | "document" | "file" | "link" {
  try {
    // Check filename first if provided
    const nameToCheck = filename || url;
    const ext = (nameToCheck.split(".").pop() || "").toLowerCase();
    
    // Image types
    if (["png", "jpg", "jpeg", "gif", "webp", "bmp", "svg"].includes(ext)) return "image";
    
    // Video types
    if (["mp4", "webm", "ogg", "mov", "avi", "mkv"].includes(ext)) return "video";
    
    // Document types
    if (["pdf", "doc", "docx", "ppt", "pptx", "xls", "xlsx", "txt", "csv"].includes(ext)) return "document";
    
    // Try parsing as URL
    if (url.startsWith("http") || url.startsWith("data:")) {
      const u = new URL(url);
      const urlExt = (u.pathname.split(".").pop() || "").toLowerCase();
      if (["png", "jpg", "jpeg", "gif", "webp", "bmp", "svg"].includes(urlExt)) return "image";
      if (["mp4", "webm", "ogg", "mov", "avi", "mkv"].includes(urlExt)) return "video";
      if (["pdf", "doc", "docx", "ppt", "pptx", "xls", "xlsx", "txt", "csv"].includes(urlExt)) return "document";
      if (urlExt) return "file";
      return "link";
    }
    
    if (ext) return "file";
    return "link";
  } catch {
    return "link";
  }
}

function getFileIcon(type: string) {
  switch (type) {
    case "image":
      return "🖼️";
    case "video":
      return "🎥";
    case "document":
      return "📄";
    default:
      return "📎";
  }
}

interface FileAttachment {
  type: "image" | "video" | "document" | "file" | "link";
  url: string;
  filename?: string;
}

export default function ProjectChatPage() {
  const router = useRouter();
  const { projectId } = router.query as { projectId: string };
  const { user, loading: authLoading } = useAuth();
  const [chatId, setChatId] = useState<string>("");
  const [messages, setMessages] = useState<any[]>([]);
  const [text, setText] = useState("");
  const [attachments, setAttachments] = useState<FileAttachment[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [showAttachmentMenu, setShowAttachmentMenu] = useState(false);
  const endRef = useRef<HTMLDivElement | null>(null);
  const processedIdsRef = useRef<Set<string>>(new Set());
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [imageModalOpen, setImageModalOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState<{ url: string; filename?: string } | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    }
  }, [authLoading, user, router]);

  useEffect(() => {
    const fetchChat = async () => {
      if (!projectId) return;
      try {
        const res = await api.get(`/chats/project/${projectId}`);
        const chat = res.data.chat;
        setChatId(chat._id);
        const res2 = await api.get(`/chats/${chat._id}/messages`);
        const initial = res2.data.messages || [];
        // Prime processed set to avoid duplicates after history load
        initial.forEach((m: any) => {
          if (m?._id) processedIdsRef.current.add(m._id);
        });
        setMessages(initial);
      } catch (e) {
        // eslint-disable-next-line no-console
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchChat();
  }, [projectId, user?.id]);

  useEffect(() => {
    if (!chatId) return;
    const socket = getSocket();
    socket.emit("chat:join", chatId);
    
    // Mark messages as read when opening chat
    api.put(`/chats/${chatId}/read`).catch(console.error);
    
    const onNew = (payload: any) => {
      if (payload.chatId === chatId) {
        const msg = payload.message;
        const id = msg?._id;
        if (id && processedIdsRef.current.has(id)) {
          return;
        }
        if (id) processedIdsRef.current.add(id);
        setMessages((prev) => [...prev, msg]);
        // Mark new messages as read immediately since chat is open
        api.put(`/chats/${chatId}/read`).catch(console.error);
      }
    };
    socket.on("message:new", onNew);
    return () => {
      socket.emit("chat:leave", chatId);
      socket.off("message:new", onNew);
    };
  }, [chatId, user?.id]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Close attachment menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (showAttachmentMenu && !target.closest(".attachment-menu-container")) {
        setShowAttachmentMenu(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showAttachmentMenu]);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>, acceptType: string) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check file size (max 5MB to account for base64 encoding which increases size by ~33%)
    if (file.size > 5 * 1024 * 1024) {
      alert("File size must be less than 5MB");
      return;
    }

    setUploadingFile(true);
    try {
      // Convert file to base64
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = reader.result as string;
        const fileType = detectAttachmentType(file.name, file.name);
        setAttachments((prev) => [
          ...prev,
          {
            type: fileType,
            url: base64,
            filename: file.name,
          },
        ]);
        setShowAttachmentMenu(false);
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error("File upload error:", error);
      alert("Failed to upload file");
    } finally {
      setUploadingFile(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const removeAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatId) return;
    if (!text.trim() && attachments.length === 0) return;
    setSending(true);
    try {
      await api.post(`/chats/${chatId}/messages`, {
        text: text.trim(),
        attachments: attachments.map(a => ({
          type: a.type,
          url: a.url,
          filename: a.filename
        })),
      });
      setText("");
      setAttachments([]);
    } catch (error: any) {
      // eslint-disable-next-line no-console
      console.error("Error sending message:", error);
      const errorMessage = error.response?.data?.error || error.message || "Failed to send message";
      alert(`Failed to send message: ${errorMessage}`);
    } finally {
      setSending(false);
    }
  };

  if (authLoading || loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-screen">
          <p className="text-gray-600 dark:text-gray-400">Loading chat...</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">Project Chat</h1>
          </div>

          <div className="h-[60vh] overflow-y-auto p-6 space-y-4 bg-gray-50 dark:bg-gray-900">
            {messages.map((m) => {
              const isMine = m.senderId === user?.id || m.senderId?._id === user?.id;
              return (
                <div
                  key={m._id}
                  className={`max-w-[80%] p-3 rounded-lg ${
                    isMine
                      ? "ml-auto bg-blue-600 text-white"
                      : "mr-auto bg-white dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700"
                  }`}
                >
                  {m.text && <p className="whitespace-pre-wrap">{m.text}</p>}
                  {m.attachments?.length > 0 && (
                    <div className="mt-2 space-y-2">
                      {m.attachments.map((a: any, idx: number) => (
                        <div key={idx}>
                          {a.type === "image" ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img 
                              src={a.url} 
                              alt={a.filename || "attachment"} 
                              className="max-h-64 rounded cursor-pointer hover:opacity-90 transition-opacity" 
                              onClick={() => {
                                setSelectedImage({ url: a.url, filename: a.filename });
                                setImageModalOpen(true);
                              }}
                            />
                          ) : a.type === "video" ? (
                            <video 
                              src={a.url} 
                              controls 
                              className="max-h-64 rounded"
                            >
                              Your browser does not support the video tag.
                            </video>
                          ) : a.type === "document" || a.type === "file" ? (
                            <a
                              href={a.url}
                              download={a.filename}
                              className={`flex items-center gap-2 p-3 rounded-lg border ${
                                isMine
                                  ? "border-blue-400 bg-blue-500"
                                  : "border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-700"
                              } hover:opacity-80 transition-opacity`}
                            >
                              <span className="text-2xl">{getFileIcon(a.type)}</span>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium truncate">
                                  {a.filename || "Download file"}
                                </p>
                                <p className="text-xs opacity-75">
                                  {a.type === "document" ? "Document" : "File"}
                                </p>
                              </div>
                              <svg 
                                className="w-5 h-5 flex-shrink-0" 
                                fill="none" 
                                stroke="currentColor" 
                                viewBox="0 0 24 24"
                              >
                                <path 
                                  strokeLinecap="round" 
                                  strokeLinejoin="round" 
                                  strokeWidth={2} 
                                  d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" 
                                />
                              </svg>
                            </a>
                          ) : (
                            <a
                              href={a.url}
                              target="_blank"
                              rel="noreferrer"
                              className="underline break-all hover:opacity-80"
                            >
                              {a.url}
                            </a>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="text-xs opacity-75 mt-1">
                    {new Date(m.createdAt).toLocaleString()}
                  </div>
                </div>
              );
            })}
            <div ref={endRef} />
          </div>

          <form onSubmit={handleSend} className="p-4 border-t border-gray-200 dark:border-gray-700">
            {/* Hidden file inputs */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={(e) => handleFileSelect(e, "image")}
              className="hidden"
              id="image-upload"
            />
            <input
              type="file"
              accept="video/*"
              onChange={(e) => handleFileSelect(e, "video")}
              className="hidden"
              id="video-upload"
            />
            <input
              type="file"
              accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt,.csv"
              onChange={(e) => handleFileSelect(e, "document")}
              className="hidden"
              id="document-upload"
            />

            {/* Attachment preview */}
            {attachments.length > 0 && (
              <div className="mb-3 flex flex-wrap gap-2">
                {attachments.map((att, idx) => (
                  <div
                    key={idx}
                    className="relative flex items-center gap-2 bg-gray-100 dark:bg-gray-700 rounded-lg p-2 pr-8"
                  >
                    <span className="text-xl">{getFileIcon(att.type)}</span>
                    <span className="text-sm text-gray-700 dark:text-gray-300 max-w-[150px] truncate">
                      {att.filename || "Attachment"}
                    </span>
                    <button
                      type="button"
                      onClick={() => removeAttachment(idx)}
                      className="absolute top-1 right-1 text-gray-500 hover:text-red-500 dark:text-gray-400 dark:hover:text-red-400"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="flex gap-2 items-end">
              {/* Attachment button with dropdown */}
              <div className="relative attachment-menu-container">
                <button
                  type="button"
                  onClick={() => setShowAttachmentMenu(!showAttachmentMenu)}
                  disabled={uploadingFile}
                  className="p-3 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors disabled:opacity-50"
                  title="Add attachment"
                >
                  <svg className="w-6 h-6 text-gray-700 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                  </svg>
                </button>

                {/* Attachment menu */}
                {showAttachmentMenu && (
                  <div className="absolute bottom-full mb-2 left-0 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-2 min-w-[180px]">
                    <button
                      type="button"
                      onClick={() => document.getElementById("image-upload")?.click()}
                      className="w-full flex items-center gap-3 px-3 py-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    >
                      <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <span className="text-sm text-gray-700 dark:text-gray-300">Images</span>
                    </button>
                    
                    <button
                      type="button"
                      onClick={() => document.getElementById("video-upload")?.click()}
                      className="w-full flex items-center gap-3 px-3 py-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    >
                      <svg className="w-5 h-5 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                      <span className="text-sm text-gray-700 dark:text-gray-300">Videos</span>
                    </button>
                    
                    <button
                      type="button"
                      onClick={() => document.getElementById("document-upload")?.click()}
                      className="w-full flex items-center gap-3 px-3 py-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    >
                      <svg className="w-5 h-5 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <span className="text-sm text-gray-700 dark:text-gray-300">Documents</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Message input */}
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSend(e);
                  }
                }}
                rows={1}
                placeholder="Type your message..."
                className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 resize-none"
              />

              {/* Send button */}
              <button
                type="submit"
                disabled={sending || uploadingFile}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition-colors disabled:bg-gray-400 dark:disabled:bg-gray-600 flex items-center gap-2"
              >
                {sending ? (
                  <>
                    <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    <span className="hidden sm:inline">Sending...</span>
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                    </svg>
                    <span className="hidden sm:inline">Send</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Image Modal */}
      {imageModalOpen && selectedImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-90 p-4"
          onClick={() => {
            setImageModalOpen(false);
            setSelectedImage(null);
          }}
        >
          <div className="relative max-w-7xl max-h-[90vh] w-full h-full flex items-center justify-center">
            {/* Close button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                setImageModalOpen(false);
                setSelectedImage(null);
              }}
              className="absolute top-4 right-4 z-10 p-2 bg-gray-800 hover:bg-gray-700 text-white rounded-full transition-colors"
              aria-label="Close"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {/* Download button */}
            <a
              href={selectedImage.url}
              download={selectedImage.filename || "image"}
              onClick={(e) => e.stopPropagation()}
              className="absolute top-4 right-20 z-10 p-2 bg-gray-800 hover:bg-gray-700 text-white rounded-full transition-colors"
              aria-label="Download"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
            </a>

            {/* Image */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={selectedImage.url}
              alt={selectedImage.filename || "Full size image"}
              className="max-w-full max-h-full object-contain rounded-lg"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      )}
    </Layout>
  );
}


