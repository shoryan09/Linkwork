import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Layout from "@/components/layout/Layout";
import { useAuth } from "@/context/AuthContext";
import api from "@/lib/api";

interface Chat {
  _id: string;
  projectId: string;
  projectTitle: string;
  projectStatus: string;
  otherParticipant: {
    _id: string;
    displayName: string;
    avatar?: string;
  } | null;
  unreadCount: number;
  lastMessage: {
    text: string;
    createdAt: string;
    senderId: string;
  } | null;
  updatedAt: string;
}

export default function ChatsPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [chats, setChats] = useState<Chat[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
      return;
    }
    if (user) {
      fetchChats();
    }
  }, [user, authLoading, router]);

  const fetchChats = async () => {
    try {
      setLoading(true);
      const response = await api.get("/chats");
      setChats(response.data.chats || []);
    } catch (err: any) {
      setError(err.message || "Failed to load chats");
      console.error("Error fetching chats:", err);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) {
      return date.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      });
    } else if (days === 1) {
      return "Yesterday";
    } else if (days < 7) {
      return `${days} days ago`;
    } else {
      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      });
    }
  };

  const formatUnreadCount = (count: number) => {
    if (count === 0) return null;
    if (count > 4) return "4+";
    return count.toString();
  };

  if (authLoading || loading) {
    return (
      <Layout>
        <div className="max-w-4xl mx-auto px-4 py-12">
          <p className="text-center text-gray-600 dark:text-gray-400">
            Loading chats...
          </p>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <div className="max-w-4xl mx-auto px-4 py-12">
          <p className="text-center text-red-600 dark:text-red-400">
            Error: {error}
          </p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-4xl mx-auto px-4 py-12">
        <h1 className="text-4xl font-bold mb-8 text-gray-900 dark:text-white">
          My Chats
        </h1>

        {chats.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-600 dark:text-gray-400 text-lg">
              No chats yet.
            </p>
            <p className="text-gray-500 dark:text-gray-500 mt-2">
              Start a conversation by accepting a proposal or having your proposal accepted!
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {chats.map((chat) => (
              <button
                key={chat._id}
                onClick={() => router.push(`/chat/${chat.projectId}`)}
                className="w-full bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md hover:shadow-lg transition-all text-left border border-gray-200 dark:border-gray-700 hover:border-blue-500 dark:hover:border-blue-500"
              >
                <div className="flex items-center gap-4">
                  {/* Avatar */}
                  <div className="flex-shrink-0">
                    {chat.otherParticipant?.avatar ? (
                      <img
                        src={chat.otherParticipant.avatar}
                        alt={chat.otherParticipant.displayName}
                        className="w-12 h-12 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-blue-500 flex items-center justify-center text-white font-semibold text-lg">
                        {chat.otherParticipant?.displayName?.charAt(0).toUpperCase() || "?"}
                      </div>
                    )}
                  </div>

                  {/* Chat Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white truncate">
                        {chat.otherParticipant?.displayName || "Unknown User"}
                      </h3>
                      {chat.lastMessage && (
                        <span className="text-xs text-gray-500 dark:text-gray-400 flex-shrink-0 ml-2">
                          {formatTime(chat.lastMessage.createdAt)}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                        <span className="font-medium text-gray-700 dark:text-gray-300">
                          {chat.projectTitle}
                        </span>
                        {chat.lastMessage && (
                          <>
                            {" • "}
                            <span className="text-gray-500 dark:text-gray-500">
                              {chat.lastMessage.text || "Attachment"}
                            </span>
                          </>
                        )}
                      </p>
                      {formatUnreadCount(chat.unreadCount) && (
                        <span className="ml-2 bg-green-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center flex-shrink-0">
                          {formatUnreadCount(chat.unreadCount)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}

