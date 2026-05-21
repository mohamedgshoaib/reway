import {
  Idea01Icon,
  ComputerIcon,
  Download01Icon,
  Folder01Icon,
  NewTwitterIcon,
} from "@hugeicons/core-free-icons"
import { EXTENSION_DOWNLOAD_URL, EXTENSION_TUTORIAL_VIDEO_URL } from "@/lib/extension"

export const features = [
  {
    title: "Smart Link Extraction",
    description:
      "Paste raw notes or code directly into Reway. Our engine extracts every URL instantly, letting you batch-save research without the manual chore.",
    demo: "extract",
  },
  {
    title: "Groups That Stay Organized",
    description:
      "Organize your library into dedicated groups for research, inspiration, and active builds with real-time counts and visual separators.",
    demo: "groups",
  },
  {
    title: "Keyboard-First Navigation",
    description:
      "Move through your entire library without touching your mouse. Arrow keys, hotkeys, and the command bar keep you in full flow.",
    demo: "keyboard",
  },
  {
    title: "Flexible View Modes",
    description:
      "Switch between high-density lists, visual cards, and organized folder views. Every view is optimized for rapid scanning and clarity.",
    demo: "views",
  },
] as const

export const demoLinks = [
  {
    title: "Linear",
    domain: "linear.app",
    url: "https://linear.app",
    group: "Research",
    favicon: "https://www.google.com/s2/favicons?domain=linear.app&sz=64",
  },
  {
    title: "Vercel",
    domain: "vercel.com",
    url: "https://vercel.com",
    group: "Inspiration",
    favicon: "https://www.google.com/s2/favicons?domain=vercel.com&sz=64",
  },
  {
    title: "shadcn/ui",
    domain: "ui.shadcn.com",
    url: "https://ui.shadcn.com",
    group: "Build",
    favicon: "https://www.google.com/s2/favicons?domain=ui.shadcn.com&sz=64",
  },
] as const

export const demoVideos = [
  {
    title: "Install Extension",
    description: "",
    steps: [
      "Download the ZIP from Google Drive and unzip it on your computer.",
      "Open chrome://extensions/ and enable Developer mode (top right).",
      "Click Load unpacked (top left) and select the unzipped folder.",
      "Log in from the extension or the dashboard.",
    ],
    link: EXTENSION_DOWNLOAD_URL,
    src: EXTENSION_TUTORIAL_VIDEO_URL,
    blurDataURL: undefined,
    icon: Idea01Icon,
  },
  {
    title: "Save a Page",
    description:
      "Bookmark a page by saving it to the dashboard. Customize the title, description, and group of the page before saving it.",
    src: "/assets/videos/save-page.mp4",
    blurDataURL: undefined,
    icon: ComputerIcon,
  },
  {
    title: "Collect Multiple Links",
    description:
      "Collect multiple links at once, use it for collecting resources while you browse. It gets saved to a group of your choice.",
    src: "/assets/videos/save-links.mp4",
    blurDataURL: undefined,
    icon: Download01Icon,
  },
  {
    title: "Save Open Tabs as Session",
    description:
      "Save all your current open tabs as a session. Open the session later with one click or keep it saved for later use.",
    src: "/assets/videos/tab-sessions.mp4",
    blurDataURL: undefined,
    icon: Folder01Icon,
  },
  {
    title: "X Bookmarks Integration",
    description:
      "Reway saves bookmarks you save on X, it adds the url automatically to your Reway dashboard in X Bookmarks group, it saves the post text as the title, and the user profile picture as the favicon.",
    src: "/assets/videos/x-bookmarks.mp4",
    blurDataURL: undefined,
    icon: NewTwitterIcon,
  },
] as const
