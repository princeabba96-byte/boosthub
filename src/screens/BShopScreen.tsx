import React, { useState, useEffect, useCallback } from 'react';
import {
  ShoppingBag,
  Gift,
  Send,
  Check,
  Clock,
  Flame,
  PackageOpen,
  UserCheck,
  ArrowUpRight,
  Search,
  CheckCircle2,
  X,
} from 'lucide-react';
import {
  BSHOP_CATALOG,
  BShopCatalogItem,
  getBShopItemByCode,
} from '../data/bshopCatalog';
import { BShopUserState, UserProfile } from '../types';
import { apiFetch } from '../services/api';
import { useAuth } from '../state/AuthContext';
import { Avatar } from '../components/Avatar';

interface BShopScreenProps {
  onSelectUser: (userId: string) => void;
  onGoToMyGifts: () => void;
  initialRecipient?: UserProfile | null;
}

type ShopFilterTab =
  | 'all'
  | 'featured'
  | 'limited'
  | 'gift'
  | 'mystery_box'
  | 'cosmetics'
  | 'inventory';

export const BShopScreen: React.FC<BShopScreenProps> = ({
  onSelectUser,
  onGoToMyGifts,
  initialRecipient,
}) => {
  const { userProfile, refreshProfile, showToast } = useAuth();
  const [shopState, setShopState] = useState<BShopUserState | null>(null);
  const [creators, setCreators] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<ShopFilterTab>('all');

  // Modal state for buying or sending a gift
  const [selectedGiftModalItem, setSelectedGiftModalItem] =
    useState<BShopCatalogItem | null>(null);
  const [giftActionMode, setGiftActionMode] = useState<'send' | 'buy'>('send');
  const [selectedRecipientId, setSelectedRecipientId] = useState<string>(
    initialRecipient?.id || ''
  );
  const [recipientSearchQuery, setRecipientSearchQuery] = useState<string>('');
  const [searchedUsers, setSearchedUsers] = useState<UserProfile[]>([]);
  const [searchingUsers, setSearchingUsers] = useState<boolean>(false);
  const [giftQuantity, setGiftQuantity] = useState<number>(1);
  const [giftMessage, setGiftMessage] = useState<string>('');
  const [useOwnedInventory, setUseOwnedInventory] = useState<boolean>(false);
  const [submittingAction, setSubmittingAction] = useState<boolean>(false);

  // Mystery Box Unboxing Reveal Modal
  const [unboxingBusy, setUnboxingBusy] = useState(false);
  const [unboxedResult, setUnboxedResult] = useState<{
    code: string;
    name: string;
    icon: string;
    rarity: string;
    quantity: number;
  } | null>(null);

  const loadShopData = useCallback(async () => {
    try {
      const [stateRes, friendsRes, directoryRes] = await Promise.all([
        apiFetch<BShopUserState>('/api/bshop/state'),
        apiFetch<{
          friends?: Array<UserProfile | { friendshipId?: number; profile?: UserProfile }>;
          suggestions?: UserProfile[];
        }>('/api/friends').catch(() => ({ friends: [], suggestions: [] })),
        apiFetch<{
          people?: UserProfile[];
          users?: UserProfile[];
        }>('/api/search?q=').catch(() => ({ people: [], users: [] })),
      ]);
      setShopState(stateRes);

      const map = new Map<string, UserProfile>();
      if (initialRecipient && initialRecipient.id !== userProfile?.id) {
        map.set(initialRecipient.id, initialRecipient);
      }
      const rawCandidates = [
        ...(friendsRes?.friends || []).map((f: any) => f?.profile || f),
        ...(friendsRes?.suggestions || []),
        ...(directoryRes?.people || []),
        ...(directoryRes?.users || []),
      ];
      for (const u of rawCandidates) {
        if (
          u &&
          u.id &&
          u.id !== userProfile?.id &&
          u.id !== 'boost_bot_official'
        ) {
          map.set(u.id, u);
        }
      }
      const list = Array.from(map.values());
      setCreators(list);
      if (!selectedRecipientId && list.length > 0) {
        setSelectedRecipientId(list[0].id);
      }
    } catch (err: any) {
      showToast(err.message || 'Could not load B-Shop.', 'error');
    } finally {
      setLoading(false);
    }
  }, [initialRecipient, selectedRecipientId, showToast, userProfile?.id]);

  useEffect(() => {
    loadShopData();
  }, [loadShopData]);

  useEffect(() => {
    if (initialRecipient && initialRecipient.id !== userProfile?.id) {
      setSelectedRecipientId(initialRecipient.id);
    }
  }, [initialRecipient, userProfile?.id]);

  // Live search for users when typing in the Send Gift modal
  useEffect(() => {
    if (!selectedGiftModalItem || giftActionMode !== 'send') return;
    const q = recipientSearchQuery.trim();
    if (!q) {
      setSearchedUsers([]);
      setSearchingUsers(false);
      return;
    }

    let cancelled = false;
    setSearchingUsers(true);
    const timer = setTimeout(async () => {
      try {
        const res = await apiFetch<{
          people?: UserProfile[];
          users?: UserProfile[];
        }>(`/api/search?q=${encodeURIComponent(q)}`);
        if (cancelled) return;
        const found = (res?.people || res?.users || []).filter(
          (u) => u && u.id && u.id !== userProfile?.id && u.id !== 'boost_bot_official'
        );
        setSearchedUsers(found);
        if (found.length > 0) {
          setCreators((prev) => {
            const merged = new Map<string, UserProfile>();
            prev.forEach((p) => merged.set(p.id, p));
            found.forEach((p) => merged.set(p.id, p));
            return Array.from(merged.values());
          });
        }
      } catch {
        // ignore search error and rely on local filter
      } finally {
        if (!cancelled) setSearchingUsers(false);
      }
    }, 200);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [
    giftActionMode,
    recipientSearchQuery,
    selectedGiftModalItem,
    userProfile?.id,
  ]);

  const isOwnerAdmin =
    userProfile?.email?.trim().toLowerCase() === 'princeabba96@gmail.com';
  const currentBp = isOwnerAdmin
    ? 999999999
    : shopState?.boostPoints ?? userProfile?.boostPoints ?? 0;

  const getOwnedCount = (code: string): number => {
    if (isOwnerAdmin) return 999999;
    if (!shopState) return 0;
    const found = shopState.inventory.find((i) => i.itemCode === code);
    return found?.quantity || 0;
  };

  const isCosmeticEquipped = (item: BShopCatalogItem): boolean => {
    if (!shopState) return false;
    if (item.category === 'frame') return shopState.equippedFrame === item.code;
    if (item.category === 'badge') return shopState.equippedBadge === item.code;
    if (item.category === 'name_style')
      return shopState.equippedNameStyle === item.code;
    return false;
  };

  const handleOpenGiftModal = (
    item: BShopCatalogItem,
    defaultMode: 'send' | 'buy'
  ) => {
    const owned = getOwnedCount(item.code);
    setSelectedGiftModalItem(item);
    setGiftActionMode(defaultMode);
    setRecipientSearchQuery('');
    setGiftQuantity(1);
    setGiftMessage('');
    setUseOwnedInventory(defaultMode === 'send' && owned > 0);
  };

  const handleBuyOrOpenMysteryBox = async (
    item: BShopCatalogItem,
    qty = 1
  ) => {
    setSubmittingAction(true);
    if (item.category === 'mystery_box') {
      setUnboxingBusy(true);
    }
    try {
      const res = await apiFetch<{
        state: BShopUserState;
        unboxedReward?: {
          code: string;
          name: string;
          icon: string;
          rarity: string;
          quantity: number;
        } | null;
        message: string;
      }>('/api/bshop/buy', {
        method: 'POST',
        body: JSON.stringify({ itemCode: item.code, quantity: qty }),
      });
      setShopState(res.state);
      await refreshProfile();
      if (res.unboxedReward) {
        setUnboxedResult(res.unboxedReward);
      } else {
        showToast(res.message, 'success');
      }
      setSelectedGiftModalItem(null);
    } catch (err: any) {
      showToast(err.message || 'Purchase could not be completed.', 'error');
    } finally {
      setSubmittingAction(false);
      setUnboxingBusy(false);
    }
  };

  const handleConfirmSendGift = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedGiftModalItem) return;

    if (giftActionMode === 'buy') {
      await handleBuyOrOpenMysteryBox(selectedGiftModalItem, giftQuantity);
      return;
    }

    if (!selectedRecipientId) {
      showToast('Please select a creator to receive this gift.', 'error');
      return;
    }

    setSubmittingAction(true);
    try {
      const res = await apiFetch<{
        state: BShopUserState;
        message: string;
      }>('/api/bshop/send-gift', {
        method: 'POST',
        body: JSON.stringify({
          receiverId: selectedRecipientId,
          itemCode: selectedGiftModalItem.code,
          quantity: giftQuantity,
          message: giftMessage,
          useInventory: useOwnedInventory,
        }),
      });
      setShopState(res.state);
      await refreshProfile();
      showToast(res.message, 'success');
      setSelectedGiftModalItem(null);
    } catch (err: any) {
      showToast(err.message || 'Could not send gift.', 'error');
    } finally {
      setSubmittingAction(false);
    }
  };

  const handleToggleEquipCosmetic = async (item: BShopCatalogItem) => {
    const currentlyEquipped = isCosmeticEquipped(item);
    const payload: Record<string, string> = {};
    if (item.category === 'frame') {
      payload.equippedFrame = currentlyEquipped ? '' : item.code;
    } else if (item.category === 'badge') {
      payload.equippedBadge = currentlyEquipped ? '' : item.code;
    } else if (item.category === 'name_style') {
      payload.equippedNameStyle = currentlyEquipped ? '' : item.code;
    }

    try {
      const updated = await apiFetch<BShopUserState>('/api/bshop/settings', {
        method: 'PUT',
        body: JSON.stringify(payload),
      });
      setShopState(updated);
      await refreshProfile();
      showToast(
        currentlyEquipped
          ? `Unequipped ${item.name}.`
          : `Equipped ${item.icon} ${item.name} on your profile!`,
        'success'
      );
    } catch (err: any) {
      showToast(err.message || 'Could not update cosmetic.', 'error');
    }
  };

  const filteredItems = BSHOP_CATALOG.filter((item) => {
    if (activeFilter === 'all') return true;
    if (activeFilter === 'featured') return Boolean(item.isFeatured);
    if (activeFilter === 'limited') return Boolean(item.isLimitedTime);
    if (activeFilter === 'gift') return item.category === 'gift';
    if (activeFilter === 'mystery_box') return item.category === 'mystery_box';
    if (activeFilter === 'cosmetics')
      return (
        item.category === 'frame' ||
        item.category === 'badge' ||
        item.category === 'name_style'
      );
    if (activeFilter === 'inventory') return getOwnedCount(item.code) > 0;
    return true;
  });

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10 space-y-6">
        <div className="h-44 rounded-3xl bg-white/[0.03] border border-white/10 animate-pulse" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((n) => (
            <div
              key={n}
              className="h-56 rounded-3xl bg-white/[0.03] border border-white/10 animate-pulse"
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-8">
      {/* Hero Banner & Boost Points Balance */}
      <section className="bg-gradient-to-br from-[#0F1734] via-[#0B1021] to-[#150E2E] border border-white/10 rounded-3xl p-6 sm:p-8 space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <p className="text-xs font-medium text-blue-400">
              BoostHub Creator Economy · In-App Reward Store
            </p>
            <h1 className="font-display text-2xl sm:text-4xl font-bold text-white tracking-tight">
              🛍️ B-Shop
            </h1>
            <p className="text-sm text-slate-300 leading-relaxed">
              Spend the Boost Points you earn from missions, Capshots, and
              community engagement on virtual gifts for creators, Mystery Boxes,
              profile frames, limited-time badges, and name decorations.
            </p>
            <p className="text-xs text-slate-400 pt-1">
              Boost Points are earned purely through in-app activity and cannot
              be purchased with real money. When you send a gift, your BP turns
              into permanent Gift Collection prestige & Creator Standing for the
              recipient.
            </p>
          </div>

          <div className="bg-[#070B18] border border-white/10 rounded-2xl p-5 min-w-[250px] space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-400">Available Balance</span>
              <span className="text-xs text-emerald-400 font-medium">
                {isOwnerAdmin ? 'Admin Vault' : 'Earned In-App'}
              </span>
            </div>
            <div className="font-display text-3xl font-bold text-white tabular-nums">
              {isOwnerAdmin ? '∞ Unlimited' : currentBp.toLocaleString()}{' '}
              <span className="text-base font-semibold text-purple-400">BP</span>
            </div>
            <div className="flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-white/10">
              <span>
                Gifts Received:{' '}
                {isOwnerAdmin
                  ? '∞ All Gifts'
                  : shopState?.giftsReceivedCount || 0}
              </span>
              <span aria-hidden="true">·</span>
              <span>
                Gift Score:{' '}
                {(shopState?.giftRecognitionScore || 0).toLocaleString()}
              </span>
            </div>
            <button
              onClick={onGoToMyGifts}
              className="w-full py-2.5 px-4 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-semibold inline-flex items-center justify-center gap-2 transition-colors"
            >
              <Gift className="w-4 h-4 text-purple-400" />
              <span>View My Gifts & Showcase</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Featured & Limited-Time Highlights Strip */}
        <div className="pt-4 border-t border-white/10 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-300">
          <div className="flex flex-wrap items-center gap-3">
            <span className="inline-flex items-center gap-1.5 text-amber-300 font-semibold">
              <Flame className="w-4 h-4" /> Featured: 🔥 Fire · 🚀 Rocket · 👑
              Crown · 🎁 Mystery Box
            </span>
            <span aria-hidden="true" className="text-slate-600">
              ·
            </span>
            <span className="inline-flex items-center gap-1.5 text-cyan-300 font-semibold">
              <Clock className="w-4 h-4" /> Limited-Time Rotation: 💎 Diamond ·
              🏆 Trophy · ✨ Imperial Gold
            </span>
          </div>
          {!isOwnerAdmin && (
            <span className="text-slate-400">
              Earn BP to unlock gifts: Publish Post (+25 BP) · Comment (+10 BP) ·
              Like/Watch (+5 BP) · Daily Missions (+30–100 BP)
            </span>
          )}
        </div>
      </section>

      {/* Interactive Category Filter Bar */}
      <div className="flex items-center gap-1.5 p-1.5 bg-[#0B1021] border border-white/10 rounded-2xl overflow-x-auto">
        {(
          [
            { id: 'all', label: 'All B-Shop Items' },
            { id: 'featured', label: '🔥 Featured Items' },
            { id: 'limited', label: '⏳ Limited-Time' },
            { id: 'gift', label: '🌹 Virtual Gifts' },
            { id: 'mystery_box', label: '🎁 Mystery Box' },
            { id: 'cosmetics', label: '✨ Frames, Badges & Styles' },
            {
              id: 'inventory',
              label: isOwnerAdmin
                ? '🎒 My Inventory (∞ Unlimited)'
                : `🎒 My Inventory (${shopState?.inventory.reduce((s, i) => s + i.quantity, 0) || 0})`,
            },
          ] as Array<{ id: ShopFilterTab; label: string }>
        ).map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveFilter(tab.id)}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${
              activeFilter === tab.id
                ? 'bg-blue-600 text-white'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* B-Shop Catalog Grid */}
      {filteredItems.length === 0 ? (
        <div className="bg-[#0B1021] border border-white/10 rounded-3xl p-10 text-center space-y-3">
          <ShoppingBag className="w-8 h-8 text-slate-500 mx-auto" />
          <p className="text-sm font-semibold text-white">
            No items in this category yet
          </p>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            Switch back to All B-Shop Items to unlock virtual gifts, Mystery
            Boxes, or profile cosmetics with your Boost Points.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredItems.map((item) => {
            const ownedCount = getOwnedCount(item.code);
            const equipped = isCosmeticEquipped(item);
            const canAfford = currentBp >= item.costBp;

            return (
              <div
                key={item.code}
                className={`bg-gradient-to-b ${item.accentGradient} bg-[#0B1021] border border-white/10 rounded-3xl p-5 flex flex-col justify-between space-y-5 transition-transform duration-150 hover:-translate-y-0.5`}
              >
                <div className="space-y-3">
                  {/* Top Metadata Line (Clean unboxed typography per design rules) */}
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <div className="flex items-center gap-1.5">
                      <span
                        className={
                          item.rarity === 'Mythic'
                            ? 'text-amber-300 font-semibold'
                            : item.rarity === 'Legendary'
                              ? 'text-cyan-300 font-semibold'
                              : item.rarity === 'Epic'
                                ? 'text-purple-300 font-semibold'
                                : item.rarity === 'Rare'
                                  ? 'text-blue-300 font-semibold'
                                  : 'text-slate-300 font-medium'
                        }
                      >
                        {item.rarity}
                      </span>
                      {item.isFeatured && (
                        <>
                          <span aria-hidden="true">·</span>
                          <span className="text-orange-300">🔥 Featured</span>
                        </>
                      )}
                      {item.isLimitedTime && (
                        <>
                          <span aria-hidden="true">·</span>
                          <span className="text-amber-300">
                            ⏳ {item.limitedEndsLabel || 'Limited'}
                          </span>
                        </>
                      )}
                    </div>

                    {ownedCount > 0 && (
                      <span className="text-emerald-400 font-semibold tabular-nums">
                        {isOwnerAdmin
                          ? 'Owned ×∞ Unlimited'
                          : `Owned ×${ownedCount}`}
                      </span>
                    )}
                  </div>

                  {/* Icon & Item Name */}
                  <div className="flex items-center gap-4 pt-1">
                    <div className="w-16 h-16 rounded-2xl bg-[#070B17] border border-white/10 flex items-center justify-center text-3xl select-none shrink-0">
                      {item.icon}
                    </div>
                    <div className="min-w-0">
                      <h3
                        className={`font-display text-lg font-bold truncate ${
                          item.category === 'name_style' && item.previewClass
                            ? item.previewClass
                            : 'text-white'
                        }`}
                      >
                        {item.name}
                      </h3>
                      <p className="text-sm font-bold text-purple-300 tabular-nums mt-0.5">
                        {item.costBp.toLocaleString()} BP
                      </p>
                      <p className="text-[11px] text-slate-400 mt-0.5 tabular-nums">
                        +{item.creatorXpBonus} XP · +{item.recognitionPoints}{' '}
                        Gift Score
                      </p>
                    </div>
                  </div>

                  <p className="text-xs text-slate-300 leading-relaxed">
                    {item.description}
                  </p>
                </div>

                {/* Action Buttons */}
                <div className="pt-2 space-y-2">
                  {item.category === 'gift' && (
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => handleOpenGiftModal(item, 'send')}
                        className="py-2.5 px-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold inline-flex items-center justify-center gap-1.5 transition-colors"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>
                          {ownedCount > 0 ? 'Send Gift' : 'Buy & Send'}
                        </span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleOpenGiftModal(item, 'buy')}
                        disabled={!canAfford}
                        className="py-2.5 px-3 rounded-xl bg-white/10 hover:bg-white/15 disabled:opacity-40 text-white text-xs font-semibold inline-flex items-center justify-center gap-1.5 transition-colors"
                      >
                        <ShoppingBag className="w-3.5 h-3.5" />
                        <span>Buy to Bag</span>
                      </button>
                    </div>
                  )}

                  {item.category === 'mystery_box' && (
                    <button
                      type="button"
                      disabled={!canAfford || unboxingBusy}
                      onClick={() => handleBuyOrOpenMysteryBox(item, 1)}
                      className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 disabled:opacity-40 text-white text-xs font-semibold inline-flex items-center justify-center gap-2 transition-colors"
                    >
                      <PackageOpen className="w-4 h-4" />
                      <span>
                        {unboxingBusy
                          ? 'Opening Mystery Box...'
                          : `Open Mystery Box (${item.costBp} BP)`}
                      </span>
                    </button>
                  )}

                  {(item.category === 'frame' ||
                    item.category === 'badge' ||
                    item.category === 'name_style') && (
                    <>
                      {ownedCount > 0 ? (
                        <button
                          type="button"
                          onClick={() => handleToggleEquipCosmetic(item)}
                          className={`w-full py-2.5 px-4 rounded-xl text-xs font-semibold inline-flex items-center justify-center gap-1.5 transition-colors ${
                            equipped
                              ? 'bg-emerald-600/25 border border-emerald-500/40 text-emerald-300'
                              : 'bg-blue-600 hover:bg-blue-500 text-white'
                          }`}
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>
                            {equipped
                              ? 'Equipped on Profile (Tap to Remove)'
                              : 'Equip on Profile'}
                          </span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          disabled={!canAfford || submittingAction}
                          onClick={() => handleBuyOrOpenMysteryBox(item, 1)}
                          className="w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white text-xs font-semibold inline-flex items-center justify-center gap-1.5 transition-colors"
                        >
                          <ShoppingBag className="w-3.5 h-3.5" />
                          <span>
                            Unlock & Equip ({item.costBp.toLocaleString()} BP)
                          </span>
                        </button>
                      )}
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Buy / Send Gift Modal */}
      {selectedGiftModalItem && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-[#0B1021] border border-white/15 rounded-3xl p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-3xl">{selectedGiftModalItem.icon}</span>
                <div>
                  <h3 className="font-display text-lg font-bold text-white">
                    {selectedGiftModalItem.name}
                  </h3>
                  <p className="text-xs text-slate-400 tabular-nums">
                    {selectedGiftModalItem.costBp.toLocaleString()} BP each ·{' '}
                    {selectedGiftModalItem.rarity}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedGiftModalItem(null)}
                className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Mode Switcher: Send to Creator vs Buy to Inventory */}
            <div className="grid grid-cols-2 p-1 bg-white/5 border border-white/10 rounded-xl">
              <button
                type="button"
                onClick={() => setGiftActionMode('send')}
                className={`py-2 rounded-lg text-xs font-semibold transition-colors ${
                  giftActionMode === 'send'
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Send to a Creator
              </button>
              <button
                type="button"
                onClick={() => setGiftActionMode('buy')}
                className={`py-2 rounded-lg text-xs font-semibold transition-colors ${
                  giftActionMode === 'buy'
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Buy to My Inventory
              </button>
            </div>

            <form onSubmit={handleConfirmSendGift} className="space-y-4">
              {giftActionMode === 'send' && (
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-medium text-slate-300">
                      Search & Select Recipient User
                    </label>
                    {searchingUsers && (
                      <span className="text-[11px] text-blue-400">
                        Searching users...
                      </span>
                    )}
                  </div>

                  {/* Search Input */}
                  <div className="relative">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="text"
                      value={recipientSearchQuery}
                      onChange={(e) => setRecipientSearchQuery(e.target.value)}
                      placeholder="Search user by name, @username, or email..."
                      className="w-full bg-[#070B17] border border-white/15 rounded-2xl pl-10 pr-9 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                    />
                    {recipientSearchQuery && (
                      <button
                        type="button"
                        onClick={() => setRecipientSearchQuery('')}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                        title="Clear search"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  {/* Currently Selected Recipient Summary */}
                  {(() => {
                    const selectedUser = creators.find(
                      (c) => c.id === selectedRecipientId
                    );
                    if (!selectedUser) return null;
                    return (
                      <div className="p-2.5 rounded-2xl bg-blue-600/15 border border-blue-500/40 flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <Avatar
                            src={selectedUser.avatarUrl}
                            name={selectedUser.displayName}
                            size="sm"
                          />
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-white truncate flex items-center gap-1">
                              <span>{selectedUser.displayName}</span>
                              {selectedUser.isVerified && (
                                <CheckCircle2 className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                              )}
                            </p>
                            <p className="text-[11px] text-blue-300 truncate">
                              @{selectedUser.username}
                            </p>
                          </div>
                        </div>
                        <span className="text-[11px] font-semibold text-blue-300 shrink-0">
                          Recipient ✓
                        </span>
                      </div>
                    );
                  })()}

                  {/* Scrollable Matching Users List */}
                  <div className="max-h-40 overflow-y-auto rounded-2xl bg-[#070B17] border border-white/10 divide-y divide-white/5">
                    {(() => {
                      const cleanQ = recipientSearchQuery
                        .trim()
                        .toLowerCase()
                        .replace(/^@+/, '');
                      const poolMap = new Map<string, UserProfile>();
                      creators.forEach((c) => poolMap.set(c.id, c));
                      searchedUsers.forEach((c) => poolMap.set(c.id, c));
                      const allPool = Array.from(poolMap.values());
                      const matchingList = cleanQ
                        ? allPool.filter(
                            (u) =>
                              u.displayName.toLowerCase().includes(cleanQ) ||
                              u.username.toLowerCase().includes(cleanQ) ||
                              (u.email || '').toLowerCase().includes(cleanQ)
                          )
                        : allPool;

                      if (matchingList.length === 0) {
                        return (
                          <div className="p-4 text-center text-xs text-slate-400">
                            {searchingUsers
                              ? 'Searching BoostHub users...'
                              : `No users found matching "${recipientSearchQuery}".`}
                          </div>
                        );
                      }

                      return matchingList.map((u) => {
                        const isSelected = u.id === selectedRecipientId;
                        return (
                          <button
                            key={u.id}
                            type="button"
                            onClick={() => setSelectedRecipientId(u.id)}
                            className={`w-full px-3.5 py-2.5 flex items-center justify-between gap-3 text-left transition-colors ${
                              isSelected
                                ? 'bg-blue-600/20 text-white'
                                : 'hover:bg-white/5 text-slate-200'
                            }`}
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <Avatar
                                src={u.avatarUrl}
                                name={u.displayName}
                                size="sm"
                              />
                              <div className="min-w-0">
                                <p className="text-xs font-semibold text-white truncate flex items-center gap-1">
                                  <span>{u.displayName}</span>
                                  {u.isVerified && (
                                    <CheckCircle2 className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                                  )}
                                </p>
                                <p className="text-[11px] text-slate-400 truncate">
                                  @{u.username}
                                </p>
                              </div>
                            </div>
                            {isSelected ? (
                              <span className="text-xs font-semibold text-blue-400 shrink-0">
                                Selected ✓
                              </span>
                            ) : (
                              <span className="text-[11px] text-slate-400 shrink-0">
                                Select
                              </span>
                            )}
                          </button>
                        );
                      });
                    })()}
                  </div>
                </div>
              )}

              {/* Quantity Selector */}
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Select Quantity
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {[1, 3, 5, 10].map((q) => (
                    <button
                      key={q}
                      type="button"
                      onClick={() => setGiftQuantity(q)}
                      className={`py-2 rounded-xl text-xs font-semibold tabular-nums border transition-colors ${
                        giftQuantity === q
                          ? 'bg-blue-600 border-blue-500 text-white'
                          : 'bg-white/5 border-white/10 text-slate-300 hover:text-white'
                      }`}
                    >
                      ×{q}
                    </button>
                  ))}
                </div>
              </div>

              {giftActionMode === 'send' &&
                getOwnedCount(selectedGiftModalItem.code) > 0 && (
                  <label className="flex items-center gap-2.5 text-xs text-slate-200 cursor-pointer p-3 rounded-2xl bg-white/5 border border-white/10">
                    <input
                      type="checkbox"
                      checked={useOwnedInventory}
                      onChange={(e) => setUseOwnedInventory(e.target.checked)}
                      className="rounded border-white/20"
                    />
                    <span>
                      Use my owned inventory first (You own ×
                      {getOwnedCount(selectedGiftModalItem.code)})
                    </span>
                  </label>
                )}

              {giftActionMode === 'send' && (
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    Supporter Note (Optional)
                  </label>
                  <input
                    type="text"
                    maxLength={140}
                    value={giftMessage}
                    onChange={(e) => setGiftMessage(e.target.value)}
                    placeholder="Say something encouraging with your gift..."
                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                  />
                </div>
              )}

              <div className="p-3.5 rounded-2xl bg-[#070B17] border border-white/10 flex items-center justify-between text-xs">
                <span className="text-slate-400">Total Cost</span>
                <span className="font-bold text-purple-300 tabular-nums">
                  {giftActionMode === 'send' &&
                  useOwnedInventory &&
                  getOwnedCount(selectedGiftModalItem.code) >= giftQuantity
                    ? '0 BP (From Inventory)'
                    : `${(
                        selectedGiftModalItem.costBp *
                        Math.max(
                          0,
                          giftQuantity -
                            (giftActionMode === 'send' && useOwnedInventory
                              ? getOwnedCount(selectedGiftModalItem.code)
                              : 0)
                        )
                      ).toLocaleString()} BP`}
                </span>
              </div>

              <button
                type="submit"
                disabled={submittingAction}
                className="w-full py-3 rounded-2xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-bold inline-flex items-center justify-center gap-2 transition-colors"
              >
                <Send className="w-4 h-4" />
                <span>
                  {submittingAction
                    ? 'Processing...'
                    : giftActionMode === 'send'
                      ? `Send ${selectedGiftModalItem.icon} ${selectedGiftModalItem.name} ×${giftQuantity}`
                      : `Purchase ${selectedGiftModalItem.icon} ${selectedGiftModalItem.name} ×${giftQuantity}`}
                </span>
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Mystery Box Unboxed Reward Modal */}
      {unboxedResult && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-gradient-to-b from-purple-950/90 to-[#0B1021] border border-purple-500/40 rounded-3xl p-7 text-center space-y-5 shadow-2xl">
            <div className="w-20 h-20 rounded-3xl bg-white/10 border border-white/15 flex items-center justify-center text-5xl mx-auto animate-bounce">
              {unboxedResult.icon}
            </div>
            <div className="space-y-1">
              <p className="text-xs font-semibold text-purple-300">
                🎁 Mystery Box Unboxed · {unboxedResult.rarity}
              </p>
              <h3 className="font-display text-2xl font-bold text-white">
                {unboxedResult.name} ×{unboxedResult.quantity}
              </h3>
              <p className="text-xs text-slate-300 pt-1">
                Added to your Gift Inventory! You can now send it to any creator
                on BoostHub.
              </p>
            </div>
            <button
              onClick={() => setUnboxedResult(null)}
              className="w-full py-2.5 rounded-2xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold"
            >
              Awesome!
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
