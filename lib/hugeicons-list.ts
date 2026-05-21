"use client"

import {
  // General
  Home01Icon,
  Folder01Icon,
  Link01Icon,
  File02Icon,
  AlertCircleIcon,
  StarIcon,
  ZapIcon,
  FavouriteIcon,
  ThumbsUpIcon,
  NewReleasesIcon,
  Medal02Icon,
  ChampionIcon,
  // Media & Entertainment
  ComputerVideoIcon,
  PlayIcon,
  ImageIcon,
  MusicNote02Icon,
  PlayCircle02Icon,
  AiAudioIcon,
  DeviantartIcon,
  ColorsIcon,
  EaseCurveControlPointsIcon,
  // Communication
  Message02Icon,
  Mail01Icon,
  // Social Platforms
  Facebook02Icon,
  MessengerIcon,
  InstagramIcon,
  ThreadsIcon,
  RedditIcon,
  NewTwitterIcon,
  TiktokIcon,
  BlueskyIcon,
  SnapchatIcon,
  TelegramIcon,
  SignalIcon,
  // AI & Technology
  ArtificialIntelligence02Icon,
  ArtificialIntelligence04Icon,
  ArtificialIntelligence05Icon,
  MagicWand01Icon,
  AiNetworkIcon,
  PerplexityAiIcon,
  AiMagicIcon,
  RoboticIcon,
  Robot01Icon,
  // Google Services
  GoogleIcon,
  GoogleDocIcon,
  GoogleSheetIcon,
  GoogleGeminiIcon,
  GoogleDriveIcon,
  GoogleMapsIcon,
  GooglePhotosIcon,
  ChromeIcon,
  // Jobs & Career
  PermanentJobIcon,
  JobSearchIcon,
  NewJobIcon,
  BriefcaseIcon,
  // Education & Learning
  Backpack03Icon,
  GlobalEducationIcon,
  BookOpen02Icon,
  Books01Icon,
  Book03Icon,
  Mortarboard01Icon,
  Notebook02Icon,
  Quiz03Icon,
  BookOpen01Icon,
  // Programming & Development
  LaptopProgrammingIcon,
  WebProgrammingIcon,
  ComputerProgramming01Icon,
  JavaScriptIcon,
  CProgrammingIcon,
  SqlIcon,
  CodeSimpleIcon,
  Bug01Icon,
  CppIcon,
  ServerStack03Icon,
  PhpIcon,
  CommandLineIcon,
  ApiIcon,
  PythonIcon,
  CodeIcon,
  GithubIcon,
  VisualStudioCodeIcon,
  // User & Interface
  UserIcon,
  UserDollarIcon,
  SidebarLeft01Icon,
  GridIcon,
  Layout06Icon,
  // Gaming
  AircraftGameIcon,
  GameController03Icon,
  ChessPawnIcon,
  Chess02Icon,
  SkullIcon,
  Sword03Icon,
  GameController01Icon,
  // Tools & Settings
  Wrench01Icon,
  ToolsIcon,
  Settings01Icon,
  Settings04Icon,
  // Religion & Spirituality
  Quran01Icon,
  // Sports & Fitness
  WorkoutSportIcon,
  FootballIcon,
  FootballPitchIcon,
  AmericanFootballIcon,
  TennisBallIcon,
  // Places & Buildings
  ApartmentIcon,
  BeachIcon,
  Building01Icon,
  Mosque05Icon,
  // Finance & Business
  BalanceScaleIcon,
  BankIcon,
  Cash01Icon,
  LaborIcon,
  PieChart02Icon,
  SaveMoneyDollarIcon,
  StartUp02Icon,
  WaterfallDown01Icon,
  // Fashion
  BabyBoyDressIcon,
  Dress01Icon,
  HoodieIcon,
  // Other
  Globe02Icon,
  ShoppingCart01Icon,
  Target01Icon,
  NewsIcon,
  SpotifyIcon,
} from "@hugeicons/core-free-icons"

// Type for icons
type IconType = typeof Folder01Icon

// Icon category definition
export interface IconCategory {
  name: string
  icons: { name: string; icon: IconType }[]
}

// Icons organized by category
export const ICON_CATEGORIES: IconCategory[] = [
  {
    name: "General",
    icons: [
      { name: "folder", icon: Folder01Icon },
      { name: "link", icon: Link01Icon },
      { name: "home", icon: Home01Icon },
      { name: "document", icon: File02Icon },
      { name: "alert-circle", icon: AlertCircleIcon },
      { name: "star", icon: StarIcon },
      { name: "ZapIcon", icon: ZapIcon },
      { name: "heart", icon: FavouriteIcon },
      { name: "thumbs-up", icon: ThumbsUpIcon },
      { name: "new-releases", icon: NewReleasesIcon },
      { name: "medal", icon: Medal02Icon },
      { name: "champion", icon: ChampionIcon },
    ],
  },
  {
    name: "Media & Entertainment",
    icons: [
      { name: "computer-video", icon: ComputerVideoIcon },
      { name: "play", icon: PlayIcon },
      { name: "play-circle", icon: PlayCircle02Icon },
      { name: "image", icon: ImageIcon },
      { name: "music", icon: MusicNote02Icon },
      { name: "ai-audio", icon: AiAudioIcon },
      { name: "deviantart", icon: DeviantartIcon },
      { name: "colors", icon: ColorsIcon },
      { name: "curves", icon: EaseCurveControlPointsIcon },
    ],
  },
  {
    name: "Communication",
    icons: [
      { name: "message", icon: Message02Icon },
      { name: "mail", icon: Mail01Icon },
    ],
  },
  {
    name: "Social Platforms",
    icons: [
      { name: "facebook", icon: Facebook02Icon },
      { name: "messenger", icon: MessengerIcon },
      { name: "instagram", icon: InstagramIcon },
      { name: "threads", icon: ThreadsIcon },
      { name: "reddit", icon: RedditIcon },
      { name: "twitter", icon: NewTwitterIcon },
      { name: "tiktok", icon: TiktokIcon },
      { name: "bluesky", icon: BlueskyIcon },
      { name: "snapchat", icon: SnapchatIcon },
      { name: "telegram", icon: TelegramIcon },
      { name: "signal", icon: SignalIcon },
    ],
  },
  {
    name: "AI & Technology",
    icons: [
      { name: "ai-02", icon: ArtificialIntelligence02Icon },
      { name: "ai-04", icon: ArtificialIntelligence04Icon },
      { name: "ai-05", icon: ArtificialIntelligence05Icon },
      { name: "magic-wand", icon: MagicWand01Icon },
      { name: "ai-network", icon: AiNetworkIcon },
      { name: "perplexity", icon: PerplexityAiIcon },
      { name: "ai-magic", icon: AiMagicIcon },
      { name: "robotic", icon: RoboticIcon },
      { name: "robot", icon: Robot01Icon },
    ],
  },
  {
    name: "Google Services",
    icons: [
      { name: "google", icon: GoogleIcon },
      { name: "google-doc", icon: GoogleDocIcon },
      { name: "google-sheet", icon: GoogleSheetIcon },
      { name: "google-gemini", icon: GoogleGeminiIcon },
      { name: "google-drive", icon: GoogleDriveIcon },
      { name: "google-maps", icon: GoogleMapsIcon },
      { name: "google-photos", icon: GooglePhotosIcon },
      { name: "chrome", icon: ChromeIcon },
    ],
  },
  {
    name: "Jobs & Career",
    icons: [
      { name: "permanent-job", icon: PermanentJobIcon },
      { name: "job-search", icon: JobSearchIcon },
      { name: "new-job", icon: NewJobIcon },
      { name: "briefcase", icon: BriefcaseIcon },
    ],
  },
  {
    name: "Education & Learning",
    icons: [
      { name: "backpack", icon: Backpack03Icon },
      { name: "global-education", icon: GlobalEducationIcon },
      { name: "book-open", icon: BookOpen02Icon },
      { name: "books", icon: Books01Icon },
      { name: "book", icon: Book03Icon },
      { name: "mortarboard", icon: Mortarboard01Icon },
      { name: "notebook", icon: Notebook02Icon },
      { name: "quiz", icon: Quiz03Icon },
      { name: "reading", icon: BookOpen01Icon },
    ],
  },
  {
    name: "Programming & Development",
    icons: [
      { name: "laptop-programming", icon: LaptopProgrammingIcon },
      { name: "web-programming", icon: WebProgrammingIcon },
      { name: "computer-programming", icon: ComputerProgramming01Icon },
      { name: "javascript", icon: JavaScriptIcon },
      { name: "c-programming", icon: CProgrammingIcon },
      { name: "sql", icon: SqlIcon },
      { name: "code-simple", icon: CodeSimpleIcon },
      { name: "bug", icon: Bug01Icon },
      { name: "cpp", icon: CppIcon },
      { name: "server-stack", icon: ServerStack03Icon },
      { name: "php", icon: PhpIcon },
      { name: "command-line", icon: CommandLineIcon },
      { name: "api", icon: ApiIcon },
      { name: "python", icon: PythonIcon },
      { name: "code", icon: CodeIcon },
      { name: "github", icon: GithubIcon },
      { name: "vscode", icon: VisualStudioCodeIcon },
    ],
  },
  {
    name: "User & Interface",
    icons: [
      { name: "user", icon: UserIcon },
      { name: "user-dollar", icon: UserDollarIcon },
      { name: "sidebar", icon: SidebarLeft01Icon },
      { name: "grid", icon: GridIcon },
      { name: "layout", icon: Layout06Icon },
    ],
  },
  {
    name: "Gaming",
    icons: [
      { name: "aircraft-game", icon: AircraftGameIcon },
      { name: "game-controller", icon: GameController03Icon },
      { name: "controller", icon: GameController01Icon },
      { name: "chess-pawn", icon: ChessPawnIcon },
      { name: "chess", icon: Chess02Icon },
      { name: "skull", icon: SkullIcon },
      { name: "sword", icon: Sword03Icon },
    ],
  },
  {
    name: "Tools & Settings",
    icons: [
      { name: "wrench", icon: Wrench01Icon },
      { name: "tools", icon: ToolsIcon },
      { name: "settings", icon: Settings01Icon },
      { name: "settings-alt", icon: Settings04Icon },
    ],
  },
  {
    name: "Religion & Spirituality",
    icons: [{ name: "quran", icon: Quran01Icon }],
  },
  {
    name: "Sports & Fitness",
    icons: [
      { name: "workout", icon: WorkoutSportIcon },
      { name: "football", icon: FootballIcon },
      { name: "football-pitch", icon: FootballPitchIcon },
      { name: "american-football", icon: AmericanFootballIcon },
      { name: "tennis", icon: TennisBallIcon },
    ],
  },
  {
    name: "Places & Buildings",
    icons: [
      { name: "apartment", icon: ApartmentIcon },
      { name: "beach", icon: BeachIcon },
      { name: "building", icon: Building01Icon },
      { name: "mosque", icon: Mosque05Icon },
    ],
  },
  {
    name: "Finance & Business",
    icons: [
      { name: "balance-scale", icon: BalanceScaleIcon },
      { name: "bank", icon: BankIcon },
      { name: "cash", icon: Cash01Icon },
      { name: "labor", icon: LaborIcon },
      { name: "pie-chart", icon: PieChart02Icon },
      { name: "save-money", icon: SaveMoneyDollarIcon },
      { name: "startup", icon: StartUp02Icon },
      { name: "waterfall", icon: WaterfallDown01Icon },
    ],
  },
  {
    name: "Fashion",
    icons: [
      { name: "baby-dress", icon: BabyBoyDressIcon },
      { name: "dress", icon: Dress01Icon },
      { name: "hoodie", icon: HoodieIcon },
    ],
  },
  {
    name: "Other",
    icons: [
      { name: "globe", icon: Globe02Icon },
      { name: "shopping", icon: ShoppingCart01Icon },
      { name: "target", icon: Target01Icon },
      { name: "news", icon: NewsIcon },
      { name: "spotify", icon: SpotifyIcon },
    ],
  },
]

// Flat list of all icons for backward compatibility
export const CATEGORY_ICONS: { name: string; icon: IconType }[] = ICON_CATEGORIES.flatMap(
  (category) => category.icons,
)

export const ALL_ICONS_MAP = ICON_CATEGORIES.reduce(
  (acc, category) => {
    category.icons.forEach((icon) => {
      acc[icon.name] = icon.icon
    })
    return acc
  },
  {} as Record<string, IconType>,
)

// Get icon by name
export function getCategoryIcon(iconName: string): IconType {
  const found = CATEGORY_ICONS.find((i) => i.name === iconName)
  return found?.icon || Folder01Icon
}
