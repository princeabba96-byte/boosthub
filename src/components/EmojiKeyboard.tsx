import React, { useState, useMemo } from 'react';
import { Search, X, Flame, Smile, ThumbsUp, Heart, Sparkles, Gamepad2, Utensils, Cat, Flag, Clock } from 'lucide-react';

export interface EmojiKeyboardProps {
  onSelectEmoji: (emoji: string) => void;
  onClose?: () => void;
  className?: string;
  variant?: 'compact' | 'full';
}

interface EmojiCategory {
  id: string;
  name: string;
  icon: React.ReactNode;
  emojis: Array<{ char: string; name: string }>;
}

export const EMOJI_CATEGORIES: EmojiCategory[] = [
  {
    id: 'popular',
    name: 'Top Reactions',
    icon: <Flame className="w-4 h-4 text-amber-400" />,
    emojis: [
      { char: '🔥', name: 'fire flame lit hot' },
      { char: '❤️', name: 'red heart love' },
      { char: '😂', name: 'face with tears of joy laugh funny' },
      { char: '🤣', name: 'rolling on the floor laughing rofl' },
      { char: '👏', name: 'clapping hands applause' },
      { char: '🚀', name: 'rocket boost launch fast' },
      { char: '🎉', name: 'party popper celebrate celebration' },
      { char: '🙌', name: 'raising hands praise hooray' },
      { char: '💯', name: 'hundred points perfect score real' },
      { char: '⚡', name: 'high voltage lightning bolt flash' },
      { char: '✨', name: 'sparkles sparkle magic shiny' },
      { char: '😍', name: 'smiling face with heart eyes love' },
      { char: '😎', name: 'smiling face with sunglasses cool boss' },
      { char: '🤩', name: 'star struck excited amazing' },
      { char: '🥳', name: 'partying face celebrate horn' },
      { char: '🤯', name: 'exploding head mind blown shocked' },
      { char: '👑', name: 'crown king queen royal founder abba' },
      { char: '💎', name: 'gem stone diamond crystal precious' },
      { char: '🏆', name: 'trophy champion winner gold cup' },
      { char: '🌟', name: 'glowing star shine bright' },
      { char: '💀', name: 'skull dead dying funny laugh' },
      { char: '😭', name: 'loudly crying face tears sob' },
      { char: '🥹', name: 'face holding back tears emotional proud' },
      { char: '🙏', name: 'folded hands pray please thank you blessings' },
    ],
  },
  {
    id: 'smileys',
    name: 'Smileys & Faces',
    icon: <Smile className="w-4 h-4 text-yellow-400" />,
    emojis: [
      { char: '😀', name: 'grinning face happy smile' },
      { char: '😃', name: 'grinning face with big eyes' },
      { char: '😄', name: 'grinning face with smiling eyes' },
      { char: '😁', name: 'beaming face with smiling eyes grin' },
      { char: '😆', name: 'grinning squinting face laugh haha' },
      { char: '😅', name: 'grinning face with sweat phew' },
      { char: '🤣', name: 'rolling on the floor laughing rofl' },
      { char: '😂', name: 'face with tears of joy funny lol' },
      { char: '🙂', name: 'slightly smiling face nice' },
      { char: '🙃', name: 'upside down face silly ironic' },
      { char: '😉', name: 'winking face flirt joke' },
      { char: '😊', name: 'smiling face with smiling eyes warm blush' },
      { char: '😇', name: 'smiling face with halo angel innocent' },
      { char: '🥰', name: 'smiling face with hearts adore in love' },
      { char: '😍', name: 'heart eyes romantic crush' },
      { char: '🤩', name: 'star eyes wow superstar' },
      { char: '😘', name: 'face blowing a kiss mwah love' },
      { char: '😗', name: 'kissing face whistle' },
      { char: '😚', name: 'kissing face with closed eyes blush' },
      { char: '😋', name: 'face savoring food delicious yum' },
      { char: '😛', name: 'face with tongue playful' },
      { char: '😜', name: 'winking face with tongue crazy wink' },
      { char: '🤪', name: 'zany face goofy wild' },
      { char: '😝', name: 'squinting face with tongue silly' },
      { char: '🤑', name: 'money mouth face rich cash wealth' },
      { char: '🤗', name: 'smiling face with open hands hug' },
      { char: '🤭', name: 'face with hand over mouth giggle oops' },
      { char: '🤫', name: 'shushing face quiet secret shh' },
      { char: '🤔', name: 'thinking face hmm wonder consider' },
      { char: '🤐', name: 'zipper mouth face silent quiet' },
      { char: '🤨', name: 'face with raised eyebrow suspicious skept' },
      { char: '😐', name: 'neutral face straight poker' },
      { char: '😑', name: 'expressionless face tired flat' },
      { char: '😶', name: 'face without mouth speechless' },
      { char: '😏', name: 'smirking face sly confident' },
      { char: '😒', name: 'unamused face annoyed bored' },
      { char: '🙄', name: 'face with rolling eyes whatever duh' },
      { char: '😬', name: 'grimacing face awkward eek yikes' },
      { char: '🤥', name: 'lying face pinocchio liar' },
      { char: '😌', name: 'relieved face peaceful calm' },
      { char: '😔', name: 'pensive face sad regret down' },
      { char: '😪', name: 'sleepy face tired tear' },
      { char: '🤤', name: 'drooling face craving tasty hungry' },
      { char: '😴', name: 'sleeping face zzz goodnight' },
      { char: '😷', name: 'face with medical mask sick healthy' },
      { char: '🤒', name: 'face with thermometer fever sick' },
      { char: '🤕', name: 'face with head bandage hurt injured' },
      { char: '🤢', name: 'nauseated face sick gross' },
      { char: '🤮', name: 'face vomiting barf gross' },
      { char: '🤧', name: 'sneezing face achoo allergy' },
      { char: '🥵', name: 'hot face sweating summer heat' },
      { char: '🥶', name: 'cold face freezing winter ice' },
      { char: '🥴', name: 'woozy face dizzy drunk tip' },
      { char: '😵', name: 'knocked out face dizzy dead' },
      { char: '🤯', name: 'exploding head shocked mind blown' },
      { char: '🤠', name: 'cowboy hat face yeehaw western' },
      { char: '🥳', name: 'partying face horn confetti celebration' },
      { char: '🥸', name: 'disguised face glasses mustache spy' },
      { char: '😎', name: 'sunglasses cool stylish' },
      { char: '🤓', name: 'nerd face smart geek study' },
      { char: '🧐', name: 'face with monocle inspect classy' },
    ],
  },
  {
    id: 'gestures',
    name: 'Hands & Gestures',
    icon: <ThumbsUp className="w-4 h-4 text-emerald-400" />,
    emojis: [
      { char: '👍', name: 'thumbs up good like agree ok yes' },
      { char: '👎', name: 'thumbs down bad dislike no' },
      { char: '👊', name: 'oncoming fist brofist punch strike' },
      { char: '✊', name: 'raised fist solidarity power strength' },
      { char: '🤛', name: 'left facing fist bump' },
      { char: '🤜', name: 'right facing fist bump' },
      { char: '🤞', name: 'crossed fingers luck wish hope' },
      { char: '✌️', name: 'victory hand peace sign two' },
      { char: '🫰', name: 'hand with index finger and thumb crossed finger heart korean' },
      { char: '🤟', name: 'love you gesture rock sign' },
      { char: '🤘', name: 'sign of the horns rock metal cool' },
      { char: '👌', name: 'ok hand perfect nice correct zero' },
      { char: '🤌', name: 'pinched fingers italian what do you want' },
      { char: '🤏', name: 'pinching hand small little tiny bit' },
      { char: '👈', name: 'backhand index pointing left' },
      { char: '👉', name: 'backhand index pointing right' },
      { char: '👆', name: 'backhand index pointing up' },
      { char: '👇', name: 'backhand index pointing down look here' },
      { char: '☝️', name: 'index pointing up one first listen' },
      { char: '✋', name: 'raised hand stop high five five' },
      { char: '🤚', name: 'raised back of hand' },
      { char: '🖐️', name: 'hand with fingers splayed palm' },
      { char: '🖖', name: 'vulcan salute live long and prosper' },
      { char: '👋', name: 'waving hand hello hi goodbye bye' },
      { char: '🤙', name: 'call me hand shaka hang loose phone' },
      { char: '👏', name: 'clapping hands applause bravo nice' },
      { char: '🙌', name: 'raising hands celebrate praise hooray' },
      { char: '👐', name: 'open hands welcome hug offer' },
      { char: '🤲', name: 'palms up together pray bless request' },
      { char: '🤝', name: 'handshake deal agreement partner friends' },
      { char: '🙏', name: 'folded hands pray thank you please bless' },
      { char: '✍️', name: 'writing hand author edit pen note' },
      { char: '💅', name: 'nail polish sassy glam care' },
      { char: '🤳', name: 'selfie photo camera mobile snap' },
      { char: '💪', name: 'flexed biceps strong muscle workout boost' },
    ],
  },
  {
    id: 'hearts',
    name: 'Hearts & Love',
    icon: <Heart className="w-4 h-4 text-rose-500" />,
    emojis: [
      { char: '❤️', name: 'red heart true love affection' },
      { char: '🧡', name: 'orange heart friendship warmth' },
      { char: '💛', name: 'yellow heart sunshine happiness loyalty' },
      { char: '💚', name: 'green heart nature growth money health' },
      { char: '💙', name: 'blue heart trust peace loyalty cool' },
      { char: '💜', name: 'purple heart royalty luxury magic' },
      { char: '🖤', name: 'black heart dark chic grief aesthetic' },
      { char: '🤍', name: 'white heart pure angel peace clarity' },
      { char: '🤎', name: 'brown heart earth solid chocolate' },
      { char: '💔', name: 'broken heart heartbroken sad grief' },
      { char: '❤️‍🔥', name: 'heart on fire passionate burning love desire' },
      { char: '❤️‍🩹', name: 'mending heart healing recovery better' },
      { char: '❣️', name: 'heart exclamation mark emphatic love' },
      { char: '💕', name: 'two hearts floating love cute' },
      { char: '💞', name: 'revolving hearts love connection' },
      { char: '💓', name: 'beating heart pulse alive excited' },
      { char: '💗', name: 'growing heart expanding love blush' },
      { char: '💖', name: 'sparkling heart shiny love special' },
      { char: '💘', name: 'heart with arrow cupid crush fell in love' },
      { char: '💝', name: 'heart with ribbon gift present love package' },
      { char: '💟', name: 'heart decoration symbol lovely' },
      { char: '💌', name: 'love letter envelope message note' },
      { char: '💋', name: 'kiss mark lips lipstick romantic' },
      { char: '🫂', name: 'people hugging embrace friendship support' },
    ],
  },
  {
    id: 'boost',
    name: 'Boost & Fire',
    icon: <Sparkles className="w-4 h-4 text-cyan-400" />,
    emojis: [
      { char: '🚀', name: 'rocket boost supersonic fast scale to the moon' },
      { char: '⚡', name: 'high voltage electricity lightning energy flash zap' },
      { char: '💥', name: 'collision explosion burst blast boom' },
      { char: '✨', name: 'sparkles magic glow star shine brilliant' },
      { char: '🌟', name: 'glowing star shine bright superstar' },
      { char: '⭐', name: 'star rating favorite gold' },
      { char: '💫', name: 'dizzy star shooting streak cosmic' },
      { char: '🔥', name: 'fire flame lit hot trend viral' },
      { char: '👑', name: 'crown royalty monarch king queen boss winner' },
      { char: '💎', name: 'gem stone diamond prestige rich rare' },
      { char: '🏆', name: 'trophy champion tournament victory number one' },
      { char: '🥇', name: '1st place medal gold first winner' },
      { char: '🥈', name: '2nd place medal silver second' },
      { char: '🥉', name: '3rd place medal bronze third' },
      { char: '🏅', name: 'sports medal award honor recognition' },
      { char: '🎖️', name: 'military medal badge hero achievement' },
      { char: '🎁', name: 'wrapped gift present box surprise reward' },
      { char: '🎉', name: 'party popper celebrate celebration confetti' },
      { char: '🎊', name: 'confetti ball festival party' },
      { char: '🎈', name: 'balloon birthday celebration fly' },
      { char: '🪄', name: 'magic wand wizard fairy miracle edit' },
      { char: '🔮', name: 'crystal ball future fortune fortune psychic' },
      { char: '🧿', name: 'nazar amulet evil eye protection blue' },
      { char: '💰', name: 'money bag cash dollars coins wealth rich' },
      { char: '💵', name: 'dollar banknote cash money paper' },
      { char: '💸', name: 'money with wings flying spending cash' },
      { char: '📈', name: 'chart increasing trend growth success viral' },
      { char: '🎯', name: 'direct hit bullseye target accurate goal' },
    ],
  },
  {
    id: 'gaming',
    name: 'Gaming & Vibes',
    icon: <Gamepad2 className="w-4 h-4 text-purple-400" />,
    emojis: [
      { char: '🎮', name: 'video game controller joystick player gamer play' },
      { char: '🕹️', name: 'joystick arcade retro game play' },
      { char: '🎲', name: 'game die dice roll luck gamble' },
      { char: '♟️', name: 'chess pawn strategy game' },
      { char: '🎳', name: 'bowling strike pins sport' },
      { char: '⚽', name: 'soccer ball football match sport goal' },
      { char: '🏀', name: 'basketball hoop court dunk sport' },
      { char: '🏈', name: 'american football touchdown sport' },
      { char: '🎾', name: 'tennis ball racket court match' },
      { char: '🥊', name: 'boxing glove fight combat knockout punch' },
      { char: '🥋', name: 'martial arts uniform karate judo taekwondo' },
      { char: '🛹', name: 'skateboard skate street grind trick' },
      { char: '🎬', name: 'clapper board cinema movie film video shoot' },
      { char: '🎤', name: 'microphone sing podcast voice rap music' },
      { char: '🎧', name: 'headphone music audio listen podcast track' },
      { char: '🎼', name: 'musical score notes sheet melody' },
      { char: '🎹', name: 'musical keyboard piano keys play' },
      { char: '🥁', name: 'drum beat percussion rhythm' },
      { char: '🎷', name: 'saxophone jazz brass instrument' },
      { char: '🎸', name: 'guitar rock acoustic electric music' },
      { char: '🎨', name: 'artist palette painting art colors design' },
      { char: '📸', name: 'camera with flash photography snap photo picture' },
      { char: '📹', name: 'video camera record camcorder movie' },
      { char: '📱', name: 'mobile phone smartphone screen capshot app' },
      { char: '💻', name: 'laptop computer code tech dev' },
      { char: '🕶️', name: 'dark sunglasses shades cool fashion' },
      { char: '🤖', name: 'robot bot ai automated tech' },
      { char: '👽', name: 'alien extraterrestrial space ufo cosmic' },
    ],
  },
  {
    id: 'food',
    name: 'Food & Drinks',
    icon: <Utensils className="w-4 h-4 text-orange-400" />,
    emojis: [
      { char: '🍕', name: 'pizza slice cheese pepperoni fast food delicious' },
      { char: '🍔', name: 'hamburger burger beef cheese fast food' },
      { char: '🍟', name: 'french fries potato snack salty crisp' },
      { char: '🌭', name: 'hot dog sausage bun snack' },
      { char: '🍿', name: 'popcorn movie snack buttery crisp' },
      { char: '🥓', name: 'bacon meat breakfast strip crisp' },
      { char: '🍳', name: 'cooking fried egg breakfast pan skillet' },
      { char: '🧇', name: 'waffle breakfast syrup sweet grid' },
      { char: '🥞', name: 'pancakes stack breakfast maple butter' },
      { char: '🍗', name: 'poultry leg fried chicken drumstick tasty meat' },
      { char: '🌮', name: 'taco mexican food crispy shell' },
      { char: '🌯', name: 'burrito wrap mexican food roll' },
      { char: '🍜', name: 'steaming bowl ramen noodles soup broth' },
      { char: '🍣', name: 'sushi raw fish rice japanese rolls' },
      { char: '🍩', name: 'doughnut donut glaze sweet pastry' },
      { char: '🍪', name: 'cookie chocolate chip baked biscuit' },
      { char: '🎂', name: 'birthday cake celebration candles frosting' },
      { char: '🍰', name: 'shortcake pastry strawberry sweet slice' },
      { char: '🧁', name: 'cupcake sweet muffin frosting treat' },
      { char: '🍫', name: 'chocolate bar sweet cacao candy' },
      { char: '🍬', name: 'candy sweet sugar wrapper treat' },
      { char: '🍭', name: 'lollipop candy sweet spiral swirl' },
      { char: '🍹', name: 'tropical drink cocktail beach vacation' },
      { char: '🧃', name: 'beverage box juice straw drink' },
      { char: '🥤', name: 'cup with straw soda drink soft drink' },
      { char: '🧋', name: 'bubble tea boba tapioca milk tea' },
      { char: '☕', name: 'hot beverage coffee tea espresso morning' },
      { char: '🥂', name: 'clinking glasses cheers celebration toast champagne' },
    ],
  },
  {
    id: 'animals',
    name: 'Animals & Nature',
    icon: <Cat className="w-4 h-4 text-emerald-400" />,
    emojis: [
      { char: '🦁', name: 'lion king jungle brave pride predator' },
      { char: '🐯', name: 'tiger face wild stripe fierce power' },
      { char: '🦅', name: 'eagle bird prey majestic freedom sky' },
      { char: '🐉', name: 'dragon mythical fire flying beast oriental' },
      { char: '🐍', name: 'snake serpent venom reptile slither' },
      { char: '🐺', name: 'wolf howling moon wild pack alpha' },
      { char: '🦊', name: 'fox face cunning red sly animal' },
      { char: '🐱', name: 'cat face kitten cute pet meow' },
      { char: '🐶', name: 'dog face puppy cute pet bark loyalty' },
      { char: '🦄', name: 'unicorn mythical horn magic fantasy' },
      { char: '🐼', name: 'panda face bamboo bear cute china' },
      { char: '🐨', name: 'koala bear cute australia marsupial' },
      { char: '🐵', name: 'monkey face playful jungle cute' },
      { char: '🦍', name: 'gorilla silverback strong ape wild' },
      { char: '🐘', name: 'elephant trunk giant mammal memory' },
      { char: '🦏', name: 'rhinoceros rhino horn armor wild' },
      { char: '🦒', name: 'giraffe tall safari savannah wild' },
      { char: '🦘', name: 'kangaroo joey hop australia outback' },
      { char: '🐊', name: 'crocodile alligator swamp reptile jaw' },
      { char: '🐢', name: 'turtle tortoise shell slow reptile' },
      { char: '🦈', name: 'shark predator ocean marine teeth' },
      { char: '🐬', name: 'dolphin ocean marine jump friendly smart' },
      { char: '🐳', name: 'spouting whale ocean giant spout sea' },
      { char: '🌺', name: 'hibiscus flower tropical bloom aloha' },
      { char: '🌸', name: 'cherry blossom sakura flower spring pink' },
      { char: '🌹', name: 'rose red flower romance love bloom' },
      { char: '🍀', name: 'four leaf clover luck lucky irish fortune' },
      { char: '🌴', name: 'palm tree beach island tropical summer' },
    ],
  },
  {
    id: 'flags',
    name: 'Flags & Culture',
    icon: <Flag className="w-4 h-4 text-blue-400" />,
    emojis: [
      { char: '🇳🇬', name: 'nigeria flag naija green white 9ja lagos abuja igbo hausa yoruba' },
      { char: '🌍', name: 'globe showing europe africa earth world planet' },
      { char: '🇺🇸', name: 'united states flag america usa us star' },
      { char: '🇬🇧', name: 'united kingdom flag uk britain union jack london' },
      { char: '🇨🇦', name: 'canada flag maple leaf toronto' },
      { char: '🇬🇭', name: 'ghana flag accra black star africa' },
      { char: '🇿🇦', name: 'south africa flag rainbow nation johannesburg' },
      { char: '🇰🇪', name: 'kenya flag nairobi africa' },
      { char: '🇯🇵', name: 'japan flag tokyo rising sun nihon' },
      { char: '🇫🇷', name: 'france flag paris french' },
      { char: '🇩🇪', name: 'germany flag berlin german' },
      { char: '🇧🇷', name: 'brazil flag samba rio' },
      { char: '🇮🇳', name: 'india flag delhi' },
      { char: '🇦🇪', name: 'united arab emirates dubai uae' },
      { char: '🏁', name: 'chequered flag finish race formula motorsport' },
      { char: '🚩', name: 'triangular flag post marker goal' },
      { char: '🎌', name: 'crossed flags celebration japan' },
      { char: '🏴‍☠️', name: 'pirate flag skull crossbones jolly roger' },
      { char: '🛡️', name: 'shield protect defense security armor' },
      { char: '⚔️', name: 'crossed swords fight battle clash weapon' },
      { char: '🗡️', name: 'dagger blade knife sword rogue' },
      { char: '🏹', name: 'bow and arrow archery hunt target' },
      { char: '⚖️', name: 'balance scale justice law fairness' },
      { char: '🗝️', name: 'old key lock secret unlock password' },
    ],
  },
];

export const EmojiKeyboard: React.FC<EmojiKeyboardProps> = ({
  onSelectEmoji,
  onClose,
  className = '',
  variant = 'compact',
}) => {
  const [activeTab, setActiveTab] = useState<string>('popular');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const searchResults = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return null;
    const matches: Array<{ char: string; name: string }> = [];
    const seen = new Set<string>();

    for (const cat of EMOJI_CATEGORIES) {
      for (const em of cat.emojis) {
        if (!seen.has(em.char) && (em.name.includes(q) || em.char.includes(q))) {
          seen.add(em.char);
          matches.push(em);
          if (matches.length >= 60) break;
        }
      }
      if (matches.length >= 60) break;
    }
    return matches;
  }, [searchQuery]);

  const activeCategory = useMemo(() => {
    return EMOJI_CATEGORIES.find((c) => c.id === activeTab) || EMOJI_CATEGORIES[0];
  }, [activeTab]);

  return (
    <div
      className={`bg-[#0A0F24] border border-blue-500/25 rounded-2xl shadow-2xl flex flex-col overflow-hidden select-none animate-in fade-in duration-150 z-30 ${className}`}
      style={{ maxHeight: variant === 'full' ? '340px' : '280px' }}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Top Header: Search & Close */}
      <div className="p-2 border-b border-white/10 flex items-center gap-2 bg-[#080C1C]">
        <div className="relative flex-1">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search emojis (fire, heart, lol, nigerian, crown)..."
            className="w-full bg-white/5 border border-white/10 rounded-xl pl-8 pr-7 py-1.5 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-blue-500"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>

        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10"
            title="Close emoji keyboard"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Category Tabs (hidden when searching) */}
      {!searchResults && (
        <div className="px-2 py-1.5 border-b border-white/10 bg-[#060A18] flex items-center gap-1 overflow-x-auto no-scrollbar">
          {EMOJI_CATEGORIES.map((cat) => {
            const isSelected = activeTab === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setActiveTab(cat.id)}
                className={`px-2.5 py-1 rounded-xl text-xs font-semibold flex items-center gap-1.5 whitespace-nowrap shrink-0 transition-colors ${
                  isSelected
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
                }`}
                title={cat.name}
              >
                {cat.icon}
                <span className="text-[11px]">{cat.name}</span>
              </button>
            );
          })}
        </div>
      )}

      {/* Emoji Grid Area */}
      <div className="flex-1 overflow-y-auto p-2.5 custom-scrollbar">
        {searchResults ? (
          <div>
            <div className="text-[11px] font-bold text-slate-400 px-1 mb-2">
              Found {searchResults.length} emojis for "{searchQuery}"
            </div>
            {searchResults.length === 0 ? (
              <div className="text-center py-8 text-xs text-slate-400">
                No matching emojis found. Try "fire", "heart", "smile", "game", or "dog".
              </div>
            ) : (
              <div className="grid grid-cols-7 sm:grid-cols-8 gap-1.5">
                {searchResults.map((em, idx) => (
                  <button
                    key={`${em.char}_${idx}`}
                    type="button"
                    onClick={() => onSelectEmoji(em.char)}
                    className="aspect-square text-2xl hover:scale-125 hover:bg-white/10 rounded-xl flex items-center justify-center transition-transform active:scale-95"
                    title={em.name}
                  >
                    {em.char}
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div>
            <div className="text-[11px] font-bold text-slate-400 px-1 mb-2 flex items-center justify-between">
              <span>{activeCategory.name}</span>
              <span className="text-[10px] text-slate-500 font-normal">Tap to insert</span>
            </div>
            <div className="grid grid-cols-7 sm:grid-cols-8 gap-1.5">
              {activeCategory.emojis.map((em, idx) => (
                <button
                  key={`${em.char}_${idx}`}
                  type="button"
                  onClick={() => onSelectEmoji(em.char)}
                  className="aspect-square text-2xl hover:scale-125 hover:bg-white/10 rounded-xl flex items-center justify-center transition-transform active:scale-95"
                  title={em.name}
                >
                  {em.char}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Quick Access Popular Row at Bottom */}
      <div className="px-2.5 py-1.5 bg-[#060914] border-t border-white/10 flex items-center justify-between gap-1">
        <span className="text-[10px] font-bold text-slate-400 shrink-0">Quick:</span>
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          {['🔥', '❤️', '😂', '👏', '🚀', '🎉', '💯', '⚡', '✨', '👑', '🇳🇬'].map((qEm) => (
            <button
              key={qEm}
              type="button"
              onClick={() => onSelectEmoji(qEm)}
              className="text-base hover:scale-130 transition-transform active:scale-90 px-0.5"
            >
              {qEm}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
