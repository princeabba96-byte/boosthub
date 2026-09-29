import React, { useEffect, useState, useCallback } from 'react';
import {
  BarChart3,
  TrendingUp,
  Eye,
  Heart,
  Share2,
  MessageCircle,
  Bookmark,
  Award,
  Target,
  Sparkles,
  CheckCircle2,
  RefreshCw,
  ArrowUpRight,
  Clock,
  Activity,
} from 'lucide-react';
import { UserProfile } from '../types';
import { apiFetch } from '../services/api';
import { useAuth } from '../state/AuthContext';
import { formatCompactNumber } from '../utils/format';

interface CreatorDashboardProps {
  profile: UserProfile;
  isOwnProfile: boolean;
  onProfileUpdated?: () => void;
}

interface DailyPoint {
  dateKey: string;
  label: string;
  shortLabel?: string;
  views: number;
  likes: number;
  shares: number;
  comments: number;
  watchDurationSeconds?: number;
  avgCompletionPercentage?: number;
  cumulativeViews?: number;
  cumulativeLikes?: number;
  viewsDelta?: number;
  likesDelta?: number;
  viewsGrowthPct?: number;
  likesGrowthPct?: number;
  engagementGrowthPct?: number;
}

interface PostPoint {
  postId: number;
  label: string;
  caption: string;
  postType: string;
  views: number;
  likes: number;
  shares: number;
  comments: number;
  saves: number;
  createdAt: string;
}

export const CreatorDashboard: React.FC<CreatorDashboardProps> = ({
  profile,
  isOwnProfile,
  onProfileUpdated,
}) => {
  const { showToast, refreshProfile } = useAuth();
  const [data, setData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [activating, setActivating] = useState(false);

  // Default to Trend Analysis View ('line' chart on 'daily' 7-day data source)
  const [dashboardView, setDashboardView] = useState<'trend' | 'breakdown'>(
    'trend'
  );
  const [growthCurveMode, setGrowthCurveMode] = useState<
    'daily' | 'cumulative'
  >('daily');
  const [chartType, setChartType] = useState<'line' | 'bar'>('line');
  const [dataSource, setDataSource] = useState<'daily' | 'posts' | 'summary'>(
    'daily'
  );
  const [metricFilter, setMetricFilter] = useState<
    'likes_views' | 'all' | 'views' | 'likes' | 'shares'
  >('likes_views');
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const fetchDashboard = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiFetch(
        `/api/creator-dashboard?userId=${encodeURIComponent(profile.id)}`
      );
      setData(res);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [profile.id]);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  const hasCreatorStatus = Boolean(
    data?.hasCreatorStatus !== undefined
      ? data.hasCreatorStatus
      : profile.role === 'creator' || profile.role === 'admin'
  );

  const handleSetCreatorStatus = async (enabled: boolean) => {
    setActivating(true);
    try {
      const updated = await apiFetch('/api/creator-dashboard/activate', {
        method: 'POST',
        body: JSON.stringify({ enabled }),
      });
      setData(updated);
      await refreshProfile();
      onProfileUpdated?.();
      showToast(
        enabled
          ? 'Creator status activated! Analytics unlocked.'
          : 'Switched to standard user mode.',
        'info'
      );
    } catch (err: any) {
      showToast(err.message || 'Could not update creator status.', 'error');
    } finally {
      setActivating(false);
    }
  };

  if (loading && !data) {
    return (
      <div className="bg-[#0B1021] border border-white/10 rounded-3xl p-6 space-y-6 animate-pulse">
        <div className="h-5 w-48 bg-white/10 rounded" />
        <div className="grid grid-cols-3 gap-4">
          <div className="h-20 bg-white/5 rounded-2xl" />
          <div className="h-20 bg-white/5 rounded-2xl" />
          <div className="h-20 bg-white/5 rounded-2xl" />
        </div>
        <div className="h-64 bg-white/5 rounded-2xl" />
      </div>
    );
  }

  // Gate: Require Creator Status
  if (!hasCreatorStatus) {
    return (
      <section className="bg-[#0B1021] border border-white/10 rounded-3xl p-8 text-center space-y-5">
        <div className="w-12 h-12 rounded-2xl bg-blue-600/15 border border-blue-500/30 text-blue-400 flex items-center justify-center mx-auto">
          <BarChart3 className="w-6 h-6" />
        </div>
        <div className="max-w-md mx-auto space-y-2">
          <h2 className="font-display text-xl font-bold text-white">
            Creator Status Required
          </h2>
          <p className="text-xs text-slate-400 leading-relaxed">
            The Creator Dashboard aggregates real-time database engagement
            metrics (Views, Likes, and Shares) and 7-day trend analysis
            exclusively for accounts with Creator status.
          </p>
        </div>
        {isOwnProfile ? (
          <button
            onClick={() => handleSetCreatorStatus(true)}
            disabled={activating}
            className="px-6 py-3 rounded-2xl bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white text-xs font-semibold inline-flex items-center gap-2 transition-all"
          >
            <Sparkles className="w-4 h-4" />
            <span>
              {activating
                ? 'Activating Creator Status...'
                : 'Enable Creator Status'}
            </span>
          </button>
        ) : (
          <p className="text-xs text-slate-500">
            @{profile.username} has not enabled Creator Status yet.
          </p>
        )}
      </section>
    );
  }

  const stats = data?.stats || {
    views: 0,
    likes: 0,
    shares: 0,
    comments: 0,
    saves: 0,
    followers: 0,
    postsCount: 0,
    watchTimeSeconds: 0,
    engagementRate: 0,
    xp: profile.xp || 0,
    boostPoints: profile.boostPoints || 0,
  };

  const dailySeries: DailyPoint[] = data?.dailySeries || [];
  const postSeries: PostPoint[] = data?.postSeries || [];
  const trendAnalysis = data?.trendAnalysis || {
    periodLabel: 'Last 7 Days',
    total7DayViews: dailySeries.reduce((s, d) => s + d.views, 0),
    total7DayLikes: dailySeries.reduce((s, d) => s + d.likes, 0),
    total7DayWatchSeconds: dailySeries.reduce(
      (s, d) => s + (d.watchDurationSeconds || 0),
      0
    ),
    avg7DayCompletion: 0,
    views7DayGrowthPct: 0,
    likes7DayGrowthPct: 0,
    combined7DayGrowthPct: 0,
    avgDailyViews: 0,
    avgDailyLikes: 0,
    likeToViewRatio: 0,
    peakDay: dailySeries[dailySeries.length - 1] || null,
  };

  // Prepare active chart dataset
  const chartItems: Array<{
    label: string;
    subtitle?: string;
    views: number;
    likes: number;
    shares: number;
    comments: number;
    viewsDelta?: number;
    likesDelta?: number;
    viewsGrowthPct?: number;
    likesGrowthPct?: number;
    watchDurationSeconds?: number;
    avgCompletionPercentage?: number;
  }> =
    dataSource === 'daily'
      ? dailySeries.map((d) => ({
          label: d.shortLabel || d.label.split(',')[0] || d.label,
          subtitle: d.label,
          views:
            growthCurveMode === 'cumulative'
              ? (d.cumulativeViews ?? d.views)
              : d.views,
          likes:
            growthCurveMode === 'cumulative'
              ? (d.cumulativeLikes ?? d.likes)
              : d.likes,
          shares: d.shares,
          comments: d.comments,
          viewsDelta: d.viewsDelta ?? 0,
          likesDelta: d.likesDelta ?? 0,
          viewsGrowthPct: d.viewsGrowthPct ?? 0,
          likesGrowthPct: d.likesGrowthPct ?? 0,
          watchDurationSeconds: d.watchDurationSeconds ?? 0,
          avgCompletionPercentage: d.avgCompletionPercentage ?? 0,
        }))
      : dataSource === 'posts' && postSeries.length > 0
        ? [...postSeries].reverse().map((p) => ({
            label: p.label,
            subtitle: `[${p.postType.toUpperCase()}] ${p.caption}`,
            views: p.views,
            likes: p.likes,
            shares: p.shares,
            comments: p.comments,
          }))
        : [
            {
              label: 'Total Views',
              subtitle: 'Cumulative post & video views',
              views: stats.views,
              likes: 0,
              shares: 0,
              comments: 0,
            },
            {
              label: 'Total Likes',
              subtitle: 'Cumulative post & video likes',
              views: 0,
              likes: stats.likes,
              shares: 0,
              comments: 0,
            },
            {
              label: 'Total Shares',
              subtitle: 'Cumulative content shares',
              views: 0,
              likes: 0,
              shares: stats.shares,
              comments: 0,
            },
          ];

  const showViewsSeries =
    metricFilter === 'likes_views' ||
    metricFilter === 'all' ||
    metricFilter === 'views';
  const showLikesSeries =
    metricFilter === 'likes_views' ||
    metricFilter === 'all' ||
    metricFilter === 'likes';
  const showSharesSeries =
    metricFilter === 'all' || metricFilter === 'shares';

  const getMaxVal = () => {
    let m = 1;
    for (const item of chartItems) {
      if (showViewsSeries && item.views > m) m = item.views;
      if (showLikesSeries && item.likes > m) m = item.likes;
      if (showSharesSeries && item.shares > m) m = item.shares;
    }
    return m;
  };

  const maxChartValue = getMaxVal();
  const yTicks = [
    maxChartValue,
    Math.round(maxChartValue * 0.75),
    Math.round(maxChartValue * 0.5),
    Math.round(maxChartValue * 0.25),
    0,
  ];

  // SVG Geometry Constants
  const svgWidth = 760;
  const svgHeight = 280;
  const padLeft = 48;
  const padRight = 28;
  const padTop = 26;
  const padBottom = 42;
  const plotWidth = svgWidth - padLeft - padRight;
  const plotHeight = svgHeight - padTop - padBottom;

  const getPointX = (idx: number) =>
    padLeft +
    (chartItems.length <= 1
      ? plotWidth / 2
      : (idx / (chartItems.length - 1)) * plotWidth);

  const getPointY = (val: number) =>
    padTop + plotHeight - (val / maxChartValue) * plotHeight;

  const buildPolyline = (key: 'views' | 'likes' | 'shares') => {
    if (chartItems.length === 0) return '';
    return chartItems
      .map((item, idx) => `${getPointX(idx)},${getPointY(item[key])}`)
      .join(' ');
  };

  const buildAreaPath = (key: 'views' | 'likes' | 'shares') => {
    if (chartItems.length === 0) return '';
    const points = chartItems.map((item, idx) => ({
      x: getPointX(idx),
      y: getPointY(item[key]),
    }));
    const firstX = points[0].x;
    const lastX = points[points.length - 1].x;
    const baselineY = padTop + plotHeight;
    const lineCoords = points.map((p) => `${p.x},${p.y}`).join(' L ');
    return `M ${firstX},${baselineY} L ${lineCoords} L ${lastX},${baselineY} Z`;
  };

  return (
    <div className="space-y-6">
      {/* Header & Primary Engagement KPI Strip */}
      <section className="bg-[#0B1021] border border-white/10 rounded-3xl p-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
          <div>
            <div className="flex items-center gap-2 text-xs text-blue-400 font-semibold">
              <BarChart3 className="w-4 h-4" />
              <span>Verified Creator Studio</span>
              <span>·</span>
              <span className="capitalize text-slate-300">
                Role: {profile.role}
              </span>
            </div>
            <h2 className="font-display text-xl font-bold text-white mt-1">
              Creator Engagement Dashboard
            </h2>
          </div>

          <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
            {/* Primary View Mode Switcher */}
            <div className="flex items-center p-1 bg-white/5 border border-white/10 rounded-xl">
              <button
                onClick={() => {
                  setDashboardView('trend');
                  setDataSource('daily');
                  setChartType('line');
                  setMetricFilter('likes_views');
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 transition-colors ${
                  dashboardView === 'trend'
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <TrendingUp className="w-3.5 h-3.5" />
                <span>7-Day Trend Analysis</span>
              </button>
              <button
                onClick={() => {
                  setDashboardView('breakdown');
                  setMetricFilter('all');
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 transition-colors ${
                  dashboardView === 'breakdown'
                    ? 'bg-purple-600 text-white'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <BarChart3 className="w-3.5 h-3.5" />
                <span>Content Breakdown</span>
              </button>
            </div>

            {isOwnProfile && (
              <button
                onClick={() => handleSetCreatorStatus(false)}
                disabled={activating}
                className="min-h-[38px] px-3 py-1.5 rounded-xl bg-blue-600/15 hover:bg-blue-600/25 border border-blue-500/30 text-xs font-medium text-blue-300 inline-flex items-center gap-1.5 whitespace-nowrap"
                title="Toggle Creator Status"
              >
                <Sparkles className="w-3.5 h-3.5 text-blue-400" />
                <span>Creator Status: Active</span>
              </button>
            )}
            <button
              onClick={fetchDashboard}
              className="min-h-[38px] px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-medium text-slate-200 inline-flex items-center gap-1.5 whitespace-nowrap"
            >
              <RefreshCw className="w-3.5 h-3.5 text-blue-400" />
              <span>Sync Metrics</span>
            </button>
          </div>
        </div>

        {/* Core Engagement Metrics (Views, Likes, Shares + Supporting KPIs) */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/10">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>Views</span>
              <Eye className="w-4 h-4 text-blue-400" />
            </div>
            <p className="font-mono text-2xl font-bold text-white mt-2 tabular-nums">
              {formatCompactNumber(stats.views)}
            </p>
            <p className="text-[11px] text-slate-400 mt-1 tabular-nums">
              {stats.watchTimeSeconds}s watch time
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/10">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>Likes</span>
              <Heart className="w-4 h-4 text-purple-400" />
            </div>
            <p className="font-mono text-2xl font-bold text-white mt-2 tabular-nums">
              {formatCompactNumber(stats.likes)}
            </p>
            <p className="text-[11px] text-slate-400 mt-1 tabular-nums">
              Across {stats.postsCount} posts
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/10">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>Shares</span>
              <Share2 className="w-4 h-4 text-pink-400" />
            </div>
            <p className="font-mono text-2xl font-bold text-white mt-2 tabular-nums">
              {formatCompactNumber(stats.shares)}
            </p>
            <p className="text-[11px] text-slate-400 mt-1">
              Direct & story shares
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/10">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>Comments</span>
              <MessageCircle className="w-4 h-4 text-sky-400" />
            </div>
            <p className="font-mono text-2xl font-bold text-white mt-2 tabular-nums">
              {formatCompactNumber(stats.comments)}
            </p>
            <p className="text-[11px] text-slate-400 mt-1">
              Community replies
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/10">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>Saves</span>
              <Bookmark className="w-4 h-4 text-indigo-400" />
            </div>
            <p className="font-mono text-2xl font-bold text-white mt-2 tabular-nums">
              {formatCompactNumber(stats.saves)}
            </p>
            <p className="text-[11px] text-slate-400 mt-1">
              Private bookmarks
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/10">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>Engagement</span>
              <TrendingUp className="w-4 h-4 text-emerald-400" />
            </div>
            <p className="font-mono text-2xl font-bold text-white mt-2 tabular-nums">
              {stats.engagementRate}%
            </p>
            <p className="text-[11px] text-slate-400 mt-1 tabular-nums">
              {stats.followers} followers
            </p>
          </div>
        </div>
      </section>

      {/* 7-DAY TREND ANALYSIS & LINE CHART SECTION */}
      <section className="bg-[#0B1021] border border-white/10 rounded-3xl p-6 space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs text-emerald-400 font-semibold">
              <Activity className="w-3.5 h-3.5" />
              <span>
                7-Day Trend Analysis · Powered by post_likes &
                video_watch_history
              </span>
            </div>
            <h3 className="text-base font-semibold text-white mt-1">
              Daily Engagement Growth Line Chart (Likes & Views — Last 7 Days)
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Tracking daily and cumulative growth in video watch views (
              <code className="text-blue-400">video_watch_history</code>) and
              post likes (<code className="text-purple-400">post_likes</code>)
              over the past 7 days.
            </p>
          </div>

          {/* Interactive Filter & Chart Type Controls */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Growth Curve Mode Selector (Daily vs Cumulative) */}
            {dataSource === 'daily' && (
              <div className="flex items-center p-1 bg-white/5 border border-white/10 rounded-xl">
                <button
                  onClick={() => setGrowthCurveMode('daily')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                    growthCurveMode === 'daily'
                      ? 'bg-emerald-600 text-white'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Daily Growth
                </button>
                <button
                  onClick={() => setGrowthCurveMode('cumulative')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                    growthCurveMode === 'cumulative'
                      ? 'bg-emerald-600 text-white'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  7-Day Cumulative
                </button>
              </div>
            )}

            {/* Data Source Selector */}
            <div className="flex items-center p-1 bg-white/5 border border-white/10 rounded-xl">
              {(
                [
                  { id: 'daily', label: 'Last 7 Days' },
                  { id: 'posts', label: 'By Post' },
                  { id: 'summary', label: 'Totals' },
                ] as const
              ).map((src) => (
                <button
                  key={src.id}
                  onClick={() => {
                    setDataSource(src.id);
                    setHoveredIndex(null);
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                    dataSource === src.id
                      ? 'bg-blue-600 text-white'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {src.label}
                </button>
              ))}
            </div>

            {/* Metric Filter Selector */}
            <div className="flex items-center p-1 bg-white/5 border border-white/10 rounded-xl">
              {(
                [
                  { id: 'likes_views', label: 'Likes & Views' },
                  { id: 'views', label: 'Views' },
                  { id: 'likes', label: 'Likes' },
                  { id: 'all', label: 'All (+Shares)' },
                ] as const
              ).map((m) => (
                <button
                  key={m.id}
                  onClick={() => setMetricFilter(m.id)}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                    metricFilter === m.id
                      ? 'bg-white/15 text-white'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>

            {/* Chart Mode Toggle */}
            <div className="flex items-center p-1 bg-white/5 border border-white/10 rounded-xl">
              <button
                onClick={() => setChartType('line')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                  chartType === 'line'
                    ? 'bg-purple-600 text-white'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Line Chart
              </button>
              <button
                onClick={() => setChartType('bar')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                  chartType === 'bar'
                    ? 'bg-purple-600 text-white'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Bar Chart
              </button>
            </div>
          </div>
        </div>

        {/* 7-Day Growth Velocity Summary Cards (from post_likes & video_watch_history) */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 rounded-2xl bg-blue-950/25 border border-blue-500/20 flex items-start justify-between">
            <div>
              <p className="text-xs text-slate-400 flex items-center gap-1.5">
                <Eye className="w-3.5 h-3.5 text-blue-400" />
                <span>7-Day Views (video_watch_history)</span>
              </p>
              <div className="flex items-baseline gap-2.5 mt-1.5">
                <span className="font-mono text-2xl font-bold text-white tabular-nums">
                  {trendAnalysis.total7DayViews}
                </span>
                <span className="font-mono text-xs font-semibold text-emerald-400 inline-flex items-center gap-0.5 tabular-nums">
                  <ArrowUpRight className="w-3.5 h-3.5" />+
                  {trendAnalysis.views7DayGrowthPct}% (7d growth)
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1 tabular-nums">
                Avg {trendAnalysis.avgDailyViews} views/day ·{' '}
                {trendAnalysis.total7DayWatchSeconds}s watch time (
                {trendAnalysis.avg7DayCompletion}% completion)
              </p>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-purple-950/25 border border-purple-500/20 flex items-start justify-between">
            <div>
              <p className="text-xs text-slate-400 flex items-center gap-1.5">
                <Heart className="w-3.5 h-3.5 text-purple-400" />
                <span>7-Day Likes (post_likes)</span>
              </p>
              <div className="flex items-baseline gap-2.5 mt-1.5">
                <span className="font-mono text-2xl font-bold text-white tabular-nums">
                  {trendAnalysis.total7DayLikes}
                </span>
                <span className="font-mono text-xs font-semibold text-emerald-400 inline-flex items-center gap-0.5 tabular-nums">
                  <ArrowUpRight className="w-3.5 h-3.5" />+
                  {trendAnalysis.likes7DayGrowthPct}% (7d growth)
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1 tabular-nums">
                Avg {trendAnalysis.avgDailyLikes} likes/day ·{' '}
                {trendAnalysis.likeToViewRatio}% Like-to-View conversion
              </p>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-emerald-950/20 border border-emerald-500/20 flex items-start justify-between">
            <div>
              <p className="text-xs text-slate-400 flex items-center gap-1.5">
                <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
                <span>7-Day Engagement Velocity</span>
              </p>
              <div className="flex items-baseline gap-2.5 mt-1.5">
                <span className="font-mono text-2xl font-bold text-white tabular-nums">
                  +{trendAnalysis.combined7DayGrowthPct}%
                </span>
                <span className="text-xs text-slate-300">
                  Daily Growth Trajectory
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1 tabular-nums">
                Peak Day: {trendAnalysis.peakDay?.label || 'Today'} (
                {(trendAnalysis.peakDay?.views || 0) +
                  (trendAnalysis.peakDay?.likes || 0)}{' '}
                interactions)
              </p>
            </div>
          </div>
        </div>

        {/* Chart Legend & Active Hover Readout */}
        <div className="flex flex-wrap items-center justify-between gap-4 pt-1 text-xs">
          <div className="flex items-center gap-5">
            {showViewsSeries && (
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-xs bg-blue-500 inline-block" />
                <span className="text-slate-300">
                  Views (video_watch_history)
                </span>
                <span className="font-mono text-white font-semibold tabular-nums">
                  (
                  {dataSource === 'daily'
                    ? trendAnalysis.total7DayViews
                    : stats.views}
                  )
                </span>
              </div>
            )}
            {showLikesSeries && (
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-xs bg-purple-500 inline-block" />
                <span className="text-slate-300">Likes (post_likes)</span>
                <span className="font-mono text-white font-semibold tabular-nums">
                  (
                  {dataSource === 'daily'
                    ? trendAnalysis.total7DayLikes
                    : stats.likes}
                  )
                </span>
              </div>
            )}
            {showSharesSeries && (
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-xs bg-pink-500 inline-block" />
                <span className="text-slate-300">Shares</span>
                <span className="font-mono text-white font-semibold tabular-nums">
                  ({stats.shares})
                </span>
              </div>
            )}
          </div>

          {hoveredIndex !== null && chartItems[hoveredIndex] && (
            <div className="font-mono text-xs text-slate-200 bg-white/5 border border-white/10 px-3.5 py-1.5 rounded-xl tabular-nums">
              <span className="text-white font-semibold">
                {chartItems[hoveredIndex].subtitle ||
                  chartItems[hoveredIndex].label}
              </span>
              {' · '}
              <span className="text-blue-400">
                Views: {chartItems[hoveredIndex].views}
                {chartItems[hoveredIndex].viewsDelta !== undefined &&
                  chartItems[hoveredIndex].viewsDelta! >= 0 &&
                  ` (+${chartItems[hoveredIndex].viewsDelta})`}
              </span>
              {' · '}
              <span className="text-purple-400">
                Likes: {chartItems[hoveredIndex].likes}
                {chartItems[hoveredIndex].likesDelta !== undefined &&
                  chartItems[hoveredIndex].likesDelta! >= 0 &&
                  ` (+${chartItems[hoveredIndex].likesDelta})`}
              </span>
              {showSharesSeries && (
                <>
                  {' · '}
                  <span className="text-pink-400">
                    Shares: {chartItems[hoveredIndex].shares}
                  </span>
                </>
              )}
            </div>
          )}
        </div>

        {/* SVG Line / Bar Chart Canvas */}
        <div className="w-full overflow-x-auto">
          <svg
            viewBox={`0 0 ${svgWidth} ${svgHeight}`}
            className="w-full h-72 min-w-[540px] select-none"
            role="img"
            aria-label="7-Day daily engagement growth line chart showing likes and views"
          >
            <defs>
              <linearGradient id="gradViews" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.42" />
                <stop offset="100%" stopColor="#3B82F6" stopOpacity="0.0" />
              </linearGradient>
              <linearGradient id="gradLikes" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#A855F7" stopOpacity="0.42" />
                <stop offset="100%" stopColor="#A855F7" stopOpacity="0.0" />
              </linearGradient>
              <linearGradient id="gradShares" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#EC4899" stopOpacity="0.38" />
                <stop offset="100%" stopColor="#EC4899" stopOpacity="0.0" />
              </linearGradient>
            </defs>

            {/* Horizontal Grid Lines & Y-Axis Labels */}
            {yTicks.map((tickVal, i) => {
              const y = padTop + (i / (yTicks.length - 1)) * plotHeight;
              return (
                <g key={i}>
                  <line
                    x1={padLeft}
                    y1={y}
                    x2={svgWidth - padRight}
                    y2={y}
                    stroke="rgba(255,255,255,0.07)"
                    strokeDasharray={i === yTicks.length - 1 ? undefined : '4 4'}
                  />
                  <text
                    x={padLeft - 10}
                    y={y + 4}
                    textAnchor="end"
                    className="fill-slate-500 text-[10px] font-mono"
                  >
                    {tickVal}
                  </text>
                </g>
              );
            })}

            {/* LINE CHART MODE (Default for 7-Day Trend Analysis) */}
            {chartType === 'line' && (
              <>
                {showViewsSeries && (
                  <>
                    <path d={buildAreaPath('views')} fill="url(#gradViews)" />
                    <polyline
                      fill="none"
                      stroke="#3B82F6"
                      strokeWidth="3"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      points={buildPolyline('views')}
                    />
                  </>
                )}
                {showLikesSeries && (
                  <>
                    <path d={buildAreaPath('likes')} fill="url(#gradLikes)" />
                    <polyline
                      fill="none"
                      stroke="#A855F7"
                      strokeWidth="3"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      points={buildPolyline('likes')}
                    />
                  </>
                )}
                {showSharesSeries && (
                  <>
                    <path d={buildAreaPath('shares')} fill="url(#gradShares)" />
                    <polyline
                      fill="none"
                      stroke="#EC4899"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      points={buildPolyline('shares')}
                    />
                  </>
                )}

                {chartItems.map((item, idx) => {
                  const x = getPointX(idx);
                  const yViews = getPointY(item.views);
                  const yLikes = getPointY(item.likes);
                  const yShares = getPointY(item.shares);
                  const isHovered = hoveredIndex === idx;

                  return (
                    <g
                      key={idx}
                      onMouseEnter={() => setHoveredIndex(idx)}
                      onMouseLeave={() => setHoveredIndex(null)}
                      className="cursor-pointer"
                    >
                      {/* Invisible wide hit target for easy hover */}
                      <rect
                        x={x - plotWidth / Math.max(2, chartItems.length * 2)}
                        y={padTop}
                        width={plotWidth / Math.max(1, chartItems.length)}
                        height={plotHeight}
                        fill="transparent"
                      />

                      {/* Hover Crosshair Guide Line */}
                      {isHovered && (
                        <line
                          x1={x}
                          y1={padTop}
                          x2={x}
                          y2={padTop + plotHeight}
                          stroke="rgba(255,255,255,0.22)"
                          strokeWidth="1.5"
                          strokeDasharray="3 3"
                        />
                      )}

                      {showViewsSeries && (
                        <>
                          <circle
                            cx={x}
                            cy={yViews}
                            r={isHovered ? 6 : 4.5}
                            fill="#3B82F6"
                            stroke="#0B1021"
                            strokeWidth="2"
                          />
                          <text
                            x={x}
                            y={Math.max(14, yViews - 9)}
                            textAnchor="middle"
                            className="fill-blue-300 text-[10px] font-mono font-semibold"
                          >
                            {item.views}
                          </text>
                        </>
                      )}

                      {showLikesSeries && (
                        <>
                          <circle
                            cx={x}
                            cy={yLikes}
                            r={isHovered ? 6 : 4.5}
                            fill="#A855F7"
                            stroke="#0B1021"
                            strokeWidth="2"
                          />
                          <text
                            x={x}
                            y={Math.min(padTop + plotHeight - 4, yLikes + 14)}
                            textAnchor="middle"
                            className="fill-purple-300 text-[10px] font-mono font-semibold"
                          >
                            {item.likes}
                          </text>
                        </>
                      )}

                      {showSharesSeries && (
                        <circle
                          cx={x}
                          cy={yShares}
                          r={isHovered ? 5.5 : 3.5}
                          fill="#EC4899"
                          stroke="#0B1021"
                          strokeWidth="1.5"
                        />
                      )}

                      <text
                        x={x}
                        y={svgHeight - 14}
                        textAnchor="middle"
                        className="fill-slate-300 text-[10px] font-medium"
                      >
                        {item.label}
                      </text>
                    </g>
                  );
                })}
              </>
            )}

            {/* BAR CHART MODE */}
            {chartType === 'bar' &&
              chartItems.map((item, idx) => {
                const groupWidth = plotWidth / Math.max(1, chartItems.length);
                const groupX = padLeft + idx * groupWidth;
                const activeSeries: Array<{
                  key: 'views' | 'likes' | 'shares';
                  color: string;
                  value: number;
                }> = [];

                if (showViewsSeries) {
                  activeSeries.push({
                    key: 'views',
                    color: '#3B82F6',
                    value: item.views,
                  });
                }
                if (showLikesSeries) {
                  activeSeries.push({
                    key: 'likes',
                    color: '#A855F7',
                    value: item.likes,
                  });
                }
                if (showSharesSeries) {
                  activeSeries.push({
                    key: 'shares',
                    color: '#EC4899',
                    value: item.shares,
                  });
                }

                const barWidth = Math.min(
                  24,
                  Math.max(8, (groupWidth * 0.68) / activeSeries.length)
                );
                const totalBarsWidth = barWidth * activeSeries.length;
                const startX = groupX + (groupWidth - totalBarsWidth) / 2;

                return (
                  <g
                    key={idx}
                    onMouseEnter={() => setHoveredIndex(idx)}
                    onMouseLeave={() => setHoveredIndex(null)}
                    className="cursor-pointer"
                  >
                    <rect
                      x={groupX + 2}
                      y={padTop}
                      width={Math.max(0, groupWidth - 4)}
                      height={plotHeight}
                      rx={8}
                      fill={
                        hoveredIndex === idx
                          ? 'rgba(255,255,255,0.04)'
                          : 'transparent'
                      }
                    />

                    {activeSeries.map((s, sIdx) => {
                      const barH = Math.max(
                        3,
                        (s.value / maxChartValue) * plotHeight
                      );
                      const x = startX + sIdx * barWidth;
                      const y = padTop + plotHeight - barH;
                      return (
                        <rect
                          key={s.key}
                          x={x}
                          y={y}
                          width={Math.max(4, barWidth - 2)}
                          height={barH}
                          rx={4}
                          fill={s.color}
                        />
                      );
                    })}

                    <text
                      x={groupX + groupWidth / 2}
                      y={svgHeight - 14}
                      textAnchor="middle"
                      className="fill-slate-300 text-[10px]"
                    >
                      {item.label}
                    </text>
                  </g>
                );
              })}
          </svg>
        </div>

        {/* 7-Day Daily Growth Breakdown Table */}
        <div className="pt-2 border-t border-white/10 overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/10 text-[11px] font-semibold text-slate-400">
                <th className="py-2.5 pr-4">
                  {dataSource === 'daily'
                    ? 'Date (Last 7 Days)'
                    : dataSource === 'posts'
                      ? 'Post / Video'
                      : 'Metric Category'}
                </th>
                <th className="py-2.5 px-3 text-right">
                  Views (video_watch_history)
                </th>
                {dataSource === 'daily' && (
                  <th className="py-2.5 px-3 text-right">Views Growth</th>
                )}
                <th className="py-2.5 px-3 text-right">Likes (post_likes)</th>
                {dataSource === 'daily' && (
                  <th className="py-2.5 px-3 text-right">Likes Growth</th>
                )}
                {dataSource === 'daily' ? (
                  <th className="py-2.5 pl-3 text-right">Watch Time</th>
                ) : (
                  <th className="py-2.5 pl-3 text-right">Shares</th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-xs">
              {chartItems.map((row, idx) => (
                <tr
                  key={idx}
                  onMouseEnter={() => setHoveredIndex(idx)}
                  onMouseLeave={() => setHoveredIndex(null)}
                  className="h-10 hover:bg-white/[0.03] transition-colors"
                >
                  <td className="py-2 pr-4 font-medium text-white truncate max-w-[220px]">
                    {row.subtitle || row.label}
                  </td>
                  <td className="py-2 px-3 text-right font-mono text-blue-400 font-semibold tabular-nums">
                    {row.views}
                  </td>
                  {dataSource === 'daily' && (
                    <td className="py-2 px-3 text-right font-mono text-emerald-400 tabular-nums">
                      {idx === 0
                        ? 'Baseline'
                        : `${(row.viewsDelta || 0) >= 0 ? '+' : ''}${row.viewsDelta || 0} (${(row.viewsGrowthPct || 0) >= 0 ? '+' : ''}${row.viewsGrowthPct || 0}%)`}
                    </td>
                  )}
                  <td className="py-2 px-3 text-right font-mono text-purple-400 font-semibold tabular-nums">
                    {row.likes}
                  </td>
                  {dataSource === 'daily' && (
                    <td className="py-2 px-3 text-right font-mono text-emerald-400 tabular-nums">
                      {idx === 0
                        ? 'Baseline'
                        : `${(row.likesDelta || 0) >= 0 ? '+' : ''}${row.likesDelta || 0} (${(row.likesGrowthPct || 0) >= 0 ? '+' : ''}${row.likesGrowthPct || 0}%)`}
                    </td>
                  )}
                  {dataSource === 'daily' ? (
                    <td className="py-2 pl-3 text-right font-mono text-slate-300 tabular-nums">
                      <span className="inline-flex items-center gap-1 justify-end">
                        <Clock className="w-3 h-3 text-slate-500" />
                        {row.watchDurationSeconds || 0}s (
                        {row.avgCompletionPercentage || 0}%)
                      </span>
                    </td>
                  ) : (
                    <td className="py-2 pl-3 text-right font-mono text-pink-400 tabular-nums">
                      {row.shares}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Best-Performing Content */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-[#0B1021] border border-white/10 rounded-3xl p-5 space-y-3">
          <h3 className="text-sm font-semibold text-white">
            Best-Performing Posts
          </h3>
          {data?.bestPosts?.length === 0 ? (
            <p className="text-xs text-slate-500">
              Publish photo or text posts to rank top performers.
            </p>
          ) : (
            data?.bestPosts?.map((p: any) => (
              <div
                key={p.id}
                className="h-10 px-3 rounded-xl bg-white/[0.02] border border-white/5 flex items-center justify-between text-xs"
              >
                <span className="text-white truncate max-w-[55%]">
                  {p.caption || `Post #${p.id}`}
                </span>
                <span className="font-mono text-slate-400 tabular-nums">
                  {p.viewsCount} views · {p.likesCount} likes · {p.sharesCount}{' '}
                  shares
                </span>
              </div>
            ))
          )}
        </div>

        <div className="bg-[#0B1021] border border-white/10 rounded-3xl p-5 space-y-3">
          <h3 className="text-sm font-semibold text-white">
            Best-Performing Videos & Capshots
          </h3>
          {data?.bestVideos?.length === 0 ? (
            <p className="text-xs text-slate-500">
              Publish Capshots or videos to rank video telemetry.
            </p>
          ) : (
            data?.bestVideos?.map((v: any) => (
              <div
                key={v.id}
                className="h-10 px-3 rounded-xl bg-white/[0.02] border border-white/5 flex items-center justify-between text-xs"
              >
                <span className="text-white truncate max-w-[55%]">
                  {v.caption || `Video #${v.id}`}
                </span>
                <span className="font-mono text-slate-400 tabular-nums">
                  {v.viewsCount} views · {v.likesCount} likes · {v.sharesCount}{' '}
                  shares
                </span>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Daily & Weekly Creator Missions */}
      {isOwnProfile && data?.missions && (
        <section className="bg-[#0B1021] border border-white/10 rounded-3xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <Target className="w-4 h-4 text-blue-400" />
              <span>Daily & Weekly Creator Missions</span>
            </h3>
            <span className="font-mono text-xs text-purple-400 font-semibold tabular-nums">
              {stats.xp} XP · {stats.boostPoints} Boost Points
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {data.missions.map((m: any) => {
              const pct = Math.min(
                100,
                Math.round((m.progress / m.targetCount) * 100)
              );
              return (
                <div
                  key={m.id}
                  className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 space-y-2"
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-white">
                      {m.title} ({m.missionType})
                    </span>
                    {m.completed ? (
                      <span className="text-emerald-400 inline-flex items-center gap-1 font-medium">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Completed
                      </span>
                    ) : (
                      <span className="font-mono text-slate-400 tabular-nums">
                        {m.progress}/{m.targetCount}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-400">{m.description}</p>
                  <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-blue-500 to-purple-500"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <div className="font-mono text-[11px] text-blue-400 tabular-nums">
                    Reward: +{m.xpReward} XP · +{m.boostPointsReward} Boost
                    Points
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Achievement Badges & Monetization Foundation */}
      {isOwnProfile && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <section className="bg-[#0B1021] border border-white/10 rounded-3xl p-6 space-y-4">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <Award className="w-4 h-4 text-purple-400" />
              <span>Achievement Badges</span>
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {data?.badges?.map((b: any) => (
                <div
                  key={b.id}
                  className={`p-3.5 rounded-2xl border ${
                    b.unlocked
                      ? 'bg-purple-600/10 border-purple-500/30'
                      : 'bg-white/[0.02] border-white/5 opacity-60'
                  }`}
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-white">{b.name}</span>
                    <span className="text-purple-300">
                      {b.unlocked ? 'Unlocked ✓' : 'Locked'}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">
                    {b.description}
                  </p>
                </div>
              ))}
            </div>
          </section>

          <section className="bg-[#0B1021] border border-white/10 rounded-3xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-emerald-400" />
                  <span>Monetization Foundation</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Eligibility milestones (payouts require a connected payment
                  provider).
                </p>
              </div>
              <span className="text-xs font-semibold text-slate-300">
                {data?.monetization?.isEligible ? 'Eligible' : 'In Progress'}
              </span>
            </div>

            <div className="space-y-2.5">
              {data?.monetization?.requirements?.map((req: any) => (
                <div
                  key={req.id}
                  className="p-3 rounded-2xl bg-white/[0.02] border border-white/5 flex items-center justify-between"
                >
                  <div>
                    <p className="text-xs font-semibold text-white">
                      {req.title}
                    </p>
                    <p className="text-[11px] text-slate-400">
                      {req.description}
                    </p>
                  </div>
                  <span className="font-mono text-xs font-bold text-blue-400 tabular-nums">
                    {req.currentValue}/{req.requiredValue}
                  </span>
                </div>
              ))}
            </div>
          </section>
        </div>
      )}
    </div>
  );
};
