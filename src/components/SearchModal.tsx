import React, { useEffect, useState } from 'react';
import {
  X,
  Search,
  Clock,
  Hash,
  Users,
  Video,
  FileText,
  CheckCircle2,
} from 'lucide-react';
import { apiFetch } from '../services/api';
import { CommunityItem, PostItem, UserProfile } from '../types';
import { Avatar } from './Avatar';

interface SearchModalProps {
  initialQuery?: string;
  onClose: () => void;
  onSelectUser: (userId: string) => void;
  onSelectPost: (post: PostItem) => void;
}

const SUGGESTED_SEARCHES = [
  '#Music',
  '#Gaming',
  '#Technology',
  '#Creators',
  '#Football',
  '#Fitness',
];

export const SearchModal: React.FC<SearchModalProps> = ({
  initialQuery = '',
  onClose,
  onSelectUser,
  onSelectPost,
}) => {
  const [query, setQuery] = useState(initialQuery);
  const [activeCategory, setActiveCategory] = useState<
    'all' | 'people' | 'posts' | 'videos' | 'hashtags' | 'communities'
  >('all');
  const [loading, setLoading] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem('bh_recent_searches') || '[]');
    } catch {
      return [];
    }
  });

  const [results, setResults] = useState<{
    people: UserProfile[];
    posts: PostItem[];
    videos: PostItem[];
    hashtags: string[];
    communities: CommunityItem[];
  }>({
    people: [],
    posts: [],
    videos: [],
    hashtags: [],
    communities: [],
  });

  // Debounced search
  useEffect(() => {
    const trimmed = query.trim();
    if (!trimmed) {
      setResults({
        people: [],
        posts: [],
        videos: [],
        hashtags: [],
        communities: [],
      });
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await apiFetch<typeof results>(
          `/api/search?q=${encodeURIComponent(trimmed)}`
        );
        setResults(res);
        setRecentSearches((prev) => {
          const next = [trimmed, ...prev.filter((i) => i !== trimmed)].slice(0, 6);
          try {
            localStorage.setItem('bh_recent_searches', JSON.stringify(next));
          } catch {
            // ignore
          }
          return next;
        });
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    }, 280);

    return () => clearTimeout(timer);
  }, [query]);

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-start justify-center p-0 sm:p-6">
      <div className="w-full max-w-2xl h-full sm:h-[82vh] bg-[#0B1021] sm:border border-white/10 sm:rounded-3xl flex flex-col overflow-hidden shadow-2xl">
        {/* Search Input Header */}
        <div className="p-4 border-b border-white/10 flex items-center gap-3">
          <div className="flex-1 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              autoFocus
              placeholder="Search people, posts, Capshots, #hashtags, communities..."
              className="w-full bg-white/5 border border-white/10 rounded-2xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-400 focus:outline-none focus:border-blue-500"
            />
          </div>
          <button
            onClick={onClose}
            className="min-h-[44px] min-w-[44px] flex items-center justify-center text-slate-400 hover:text-white rounded-xl"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Category Filter Tabs */}
        <div className="flex items-center gap-1.5 px-4 py-2.5 border-b border-white/10 overflow-x-auto no-scrollbar">
          {(['all', 'people', 'posts', 'videos', 'hashtags', 'communities'] as const).map(
            (cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-medium capitalize whitespace-nowrap transition-colors ${
                  activeCategory === cat
                    ? 'bg-blue-600 text-white'
                    : 'bg-white/5 text-slate-400 hover:text-white'
                }`}
              >
                {cat}
              </button>
            )
          )}
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {!query.trim() ? (
            <div className="space-y-6">
              {recentSearches.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-2.5">
                    <h4 className="text-xs font-semibold text-slate-400">
                      Recent Searches
                    </h4>
                    <button
                      onClick={() => {
                        setRecentSearches([]);
                        localStorage.removeItem('bh_recent_searches');
                      }}
                      className="text-xs text-slate-500 hover:text-slate-300"
                    >
                      Clear
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {recentSearches.map((item) => (
                      <button
                        key={item}
                        onClick={() => setQuery(item)}
                        className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-xs text-slate-200 inline-flex items-center gap-1.5"
                      >
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        <span>{item}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <h4 className="text-xs font-semibold text-slate-400 mb-2.5">
                  Trending Suggestions
                </h4>
                <div className="flex flex-wrap gap-2">
                  {SUGGESTED_SEARCHES.map((tag) => (
                    <button
                      key={tag}
                      onClick={() => setQuery(tag)}
                      className="px-3.5 py-2 rounded-xl bg-blue-600/10 hover:bg-blue-600/20 border border-blue-500/20 text-xs text-blue-400 font-medium"
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : loading ? (
            <div className="py-12 text-center text-sm text-slate-400">
              Searching BoostHub...
            </div>
          ) : (
            <div className="space-y-6">
              {/* People */}
              {(activeCategory === 'all' || activeCategory === 'people') &&
                results.people.length > 0 && (
                  <div className="space-y-2.5">
                    <h4 className="text-xs font-semibold text-slate-400">People</h4>
                    {results.people.map((person) => (
                      <button
                        key={person.id}
                        onClick={() => {
                          onClose();
                          onSelectUser(person.id);
                        }}
                        className="w-full flex items-center justify-between p-3 rounded-2xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/5 text-left"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <Avatar
                            src={person.avatarUrl}
                            name={person.displayName}
                            size="sm"
                          />
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="text-sm font-semibold text-white truncate">
                                {person.displayName}
                              </span>
                              {person.isVerified && (
                                <CheckCircle2 className="w-3.5 h-3.5 text-blue-400" />
                              )}
                            </div>
                            <p className="text-xs text-slate-400 truncate">
                              @{person.username}
                            </p>
                          </div>
                        </div>
                        <span className="text-xs text-blue-400 font-medium">
                          View Profile
                        </span>
                      </button>
                    ))}
                  </div>
                )}

              {/* Hashtags */}
              {(activeCategory === 'all' || activeCategory === 'hashtags') &&
                results.hashtags.length > 0 && (
                  <div>
                    <h4 className="text-xs font-semibold text-slate-400 mb-2.5">
                      Hashtags
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {results.hashtags.map((tag) => (
                        <button
                          key={tag}
                          onClick={() => setQuery(tag)}
                          className="px-3 py-1.5 rounded-xl bg-purple-500/10 border border-purple-500/20 text-xs text-purple-300 inline-flex items-center gap-1"
                        >
                          <Hash className="w-3.5 h-3.5" />
                          <span>{tag.replace(/^#/, '')}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

              {/* Communities */}
              {(activeCategory === 'all' || activeCategory === 'communities') &&
                results.communities.length > 0 && (
                  <div className="space-y-2.5">
                    <h4 className="text-xs font-semibold text-slate-400">
                      Communities
                    </h4>
                    {results.communities.map((comm) => (
                      <div
                        key={comm.id}
                        className="p-3 rounded-2xl bg-white/[0.03] border border-white/5 flex items-center justify-between"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-10 h-10 rounded-2xl bg-blue-600/20 flex items-center justify-center text-blue-400 shrink-0">
                            <Users className="w-5 h-5" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-white truncate">
                              {comm.name}
                            </p>
                            <p className="text-xs text-slate-400 truncate">
                              {comm.category} · {comm.description}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

              {/* Videos */}
              {(activeCategory === 'all' || activeCategory === 'videos') &&
                results.videos.length > 0 && (
                  <div className="space-y-2.5">
                    <h4 className="text-xs font-semibold text-slate-400">
                      Videos & Capshots
                    </h4>
                    {results.videos.map((vid) => (
                      <button
                        key={vid.id}
                        onClick={() => {
                          onClose();
                          onSelectPost(vid);
                        }}
                        className="w-full p-3 rounded-2xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/5 flex items-center gap-3 text-left"
                      >
                        <Video className="w-5 h-5 text-pink-400 shrink-0" />
                        <div className="min-w-0 flex-1">
                          <p className="text-sm text-white truncate">
                            {vid.caption || 'Video post'}
                          </p>
                          <p className="text-xs text-slate-400">
                            @{vid.author.username} · {vid.viewsCount} views
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}

              {/* Posts */}
              {(activeCategory === 'all' || activeCategory === 'posts') &&
                results.posts.length > 0 && (
                  <div className="space-y-2.5">
                    <h4 className="text-xs font-semibold text-slate-400">Posts</h4>
                    {results.posts.map((post) => (
                      <button
                        key={post.id}
                        onClick={() => {
                          onClose();
                          onSelectPost(post);
                        }}
                        className="w-full p-3 rounded-2xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/5 flex items-center gap-3 text-left"
                      >
                        <FileText className="w-5 h-5 text-blue-400 shrink-0" />
                        <div className="min-w-0 flex-1">
                          <p className="text-sm text-white truncate">
                            {post.caption || 'Post'}
                          </p>
                          <p className="text-xs text-slate-400">
                            @{post.author.username} · {post.likesCount} likes
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}

              {results.people.length === 0 &&
                results.posts.length === 0 &&
                results.videos.length === 0 &&
                results.hashtags.length === 0 &&
                results.communities.length === 0 && (
                  <div className="py-12 text-center text-sm text-slate-500">
                    No matching results found for "{query}".
                  </div>
                )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
