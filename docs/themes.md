## Theme 1: Milka

```json
:root {
  --background: oklch(0.9777 0.0041 301.4256);
  --foreground: oklch(0.3651 0.0325 287.0807);
  --card: oklch(1.0000 0 0);
  --card-foreground: oklch(0.3651 0.0325 287.0807);
  --popover: oklch(1.0000 0 0);
  --popover-foreground: oklch(0.3651 0.0325 287.0807);
  --primary: oklch(0.6104 0.0767 299.7335);
  --primary-foreground: oklch(0.9777 0.0041 301.4256);
  --secondary: oklch(0.8957 0.0265 300.2416);
  --secondary-foreground: oklch(0.3651 0.0325 287.0807);
  --muted: oklch(0.8906 0.0139 299.7754);
  --muted-foreground: oklch(0.5288 0.0375 290.7895);
  --accent: oklch(0.7889 0.0802 359.9375);
  --accent-foreground: oklch(0.3394 0.0441 1.7583);
  --destructive: oklch(0.6332 0.1578 22.6734);
  --destructive-foreground: oklch(0.9777 0.0041 301.4256);
  --border: oklch(0.8447 0.0226 300.1421);
  --input: oklch(0.9329 0.0124 301.2783);
  --ring: oklch(0.6104 0.0767 299.7335);
  --chart-1: oklch(0.6104 0.0767 299.7335);
  --chart-2: oklch(0.7889 0.0802 359.9375);
  --chart-3: oklch(0.7321 0.0749 169.8670);
  --chart-4: oklch(0.8540 0.0882 76.8292);
  --chart-5: oklch(0.7857 0.0645 258.0839);
  --sidebar: oklch(0.9554 0.0082 301.3541);
  --sidebar-foreground: oklch(0.3651 0.0325 287.0807);
  --sidebar-primary: oklch(0.6104 0.0767 299.7335);
  --sidebar-primary-foreground: oklch(0.9777 0.0041 301.4256);
  --sidebar-accent: oklch(0.7889 0.0802 359.9375);
  --sidebar-accent-foreground: oklch(0.3394 0.0441 1.7583);
  --sidebar-border: oklch(0.8719 0.0198 302.1690);
  --sidebar-ring: oklch(0.6104 0.0767 299.7335);
  --font-sans: Geist, sans-serif;
  --font-serif: "Lora", Georgia, serif;
  --font-mono: "Fira Code", "Courier New", monospace;
  --radius: 0.5rem;
  --shadow-x: 1px;
  --shadow-y: 2px;
  --shadow-blur: 5px;
  --shadow-spread: 1px;
  --shadow-opacity: 0.06;
  --shadow-color: hsl(0 0% 0%);
  --shadow-2xs: 1px 2px 5px 1px hsl(0 0% 0% / 0.03);
  --shadow-xs: 1px 2px 5px 1px hsl(0 0% 0% / 0.03);
  --shadow-sm: 1px 2px 5px 1px hsl(0 0% 0% / 0.06), 1px 1px 2px 0px hsl(0 0% 0% / 0.06);
  --shadow: 1px 2px 5px 1px hsl(0 0% 0% / 0.06), 1px 1px 2px 0px hsl(0 0% 0% / 0.06);
  --shadow-md: 1px 2px 5px 1px hsl(0 0% 0% / 0.06), 1px 2px 4px 0px hsl(0 0% 0% / 0.06);
  --shadow-lg: 1px 2px 5px 1px hsl(0 0% 0% / 0.06), 1px 4px 6px 0px hsl(0 0% 0% / 0.06);
  --shadow-xl: 1px 2px 5px 1px hsl(0 0% 0% / 0.06), 1px 8px 10px 0px hsl(0 0% 0% / 0.06);
  --shadow-2xl: 1px 2px 5px 1px hsl(0 0% 0% / 0.15);
  --tracking-normal: 0em;
  --spacing: 0.25rem;
}

.dark {
  --background: oklch(0.2166 0.0215 292.8474);
  --foreground: oklch(0.9053 0.0245 293.5570);
  --card: oklch(0.2544 0.0301 292.7315);
  --card-foreground: oklch(0.9053 0.0245 293.5570);
  --popover: oklch(0.2544 0.0301 292.7315);
  --popover-foreground: oklch(0.9053 0.0245 293.5570);
  --primary: oklch(0.7058 0.0777 302.0489);
  --primary-foreground: oklch(0.2166 0.0215 292.8474);
  --secondary: oklch(0.4604 0.0472 295.5578);
  --secondary-foreground: oklch(0.9053 0.0245 293.5570);
  --muted: oklch(0.2560 0.0320 294.8380);
  --muted-foreground: oklch(0.6974 0.0282 300.0614);
  --accent: oklch(0.3181 0.0321 308.6149);
  --accent-foreground: oklch(0.8391 0.0692 2.6681);
  --destructive: oklch(0.6875 0.1420 21.4566);
  --destructive-foreground: oklch(0.2166 0.0215 292.8474);
  --border: oklch(0.3063 0.0359 293.3367);
  --input: oklch(0.2847 0.0346 291.2726);
  --ring: oklch(0.7058 0.0777 302.0489);
  --chart-1: oklch(0.7058 0.0777 302.0489);
  --chart-2: oklch(0.8391 0.0692 2.6681);
  --chart-3: oklch(0.7321 0.0749 169.8670);
  --chart-4: oklch(0.8540 0.0882 76.8292);
  --chart-5: oklch(0.7857 0.0645 258.0839);
  --sidebar: oklch(0.1985 0.0200 293.6639);
  --sidebar-foreground: oklch(0.9053 0.0245 293.5570);
  --sidebar-primary: oklch(0.7058 0.0777 302.0489);
  --sidebar-primary-foreground: oklch(0.2166 0.0215 292.8474);
  --sidebar-accent: oklch(0.3181 0.0321 308.6149);
  --sidebar-accent-foreground: oklch(0.8391 0.0692 2.6681);
  --sidebar-border: oklch(0.2847 0.0346 291.2726);
  --sidebar-ring: oklch(0.7058 0.0777 302.0489);
  --font-sans: Geist, sans-serif;
  --font-serif: "Lora", Georgia, serif;
  --font-mono: "Fira Code", "Courier New", monospace;
  --radius: 0.5rem;
  --shadow-x: 1px;
  --shadow-y: 2px;
  --shadow-blur: 5px;
  --shadow-spread: 1px;
  --shadow-opacity: 0.06;
  --shadow-color: hsl(0 0% 0%);
  --shadow-2xs: 1px 2px 5px 1px hsl(0 0% 0% / 0.03);
  --shadow-xs: 1px 2px 5px 1px hsl(0 0% 0% / 0.03);
  --shadow-sm: 1px 2px 5px 1px hsl(0 0% 0% / 0.06), 1px 1px 2px 0px hsl(0 0% 0% / 0.06);
  --shadow: 1px 2px 5px 1px hsl(0 0% 0% / 0.06), 1px 1px 2px 0px hsl(0 0% 0% / 0.06);
  --shadow-md: 1px 2px 5px 1px hsl(0 0% 0% / 0.06), 1px 2px 4px 0px hsl(0 0% 0% / 0.06);
  --shadow-lg: 1px 2px 5px 1px hsl(0 0% 0% / 0.06), 1px 4px 6px 0px hsl(0 0% 0% / 0.06);
  --shadow-xl: 1px 2px 5px 1px hsl(0 0% 0% / 0.06), 1px 8px 10px 0px hsl(0 0% 0% / 0.06);
  --shadow-2xl: 1px 2px 5px 1px hsl(0 0% 0% / 0.15);
}

@theme inline {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --color-card: var(--card);
  --color-card-foreground: var(--card-foreground);
  --color-popover: var(--popover);
  --color-popover-foreground: var(--popover-foreground);
  --color-primary: var(--primary);
  --color-primary-foreground: var(--primary-foreground);
  --color-secondary: var(--secondary);
  --color-secondary-foreground: var(--secondary-foreground);
  --color-muted: var(--muted);
  --color-muted-foreground: var(--muted-foreground);
  --color-accent: var(--accent);
  --color-accent-foreground: var(--accent-foreground);
  --color-destructive: var(--destructive);
  --color-destructive-foreground: var(--destructive-foreground);
  --color-border: var(--border);
  --color-input: var(--input);
  --color-ring: var(--ring);
  --color-chart-1: var(--chart-1);
  --color-chart-2: var(--chart-2);
  --color-chart-3: var(--chart-3);
  --color-chart-4: var(--chart-4);
  --color-chart-5: var(--chart-5);
  --color-sidebar: var(--sidebar);
  --color-sidebar-foreground: var(--sidebar-foreground);
  --color-sidebar-primary: var(--sidebar-primary);
  --color-sidebar-primary-foreground: var(--sidebar-primary-foreground);
  --color-sidebar-accent: var(--sidebar-accent);
  --color-sidebar-accent-foreground: var(--sidebar-accent-foreground);
  --color-sidebar-border: var(--sidebar-border);
  --color-sidebar-ring: var(--sidebar-ring);

  --font-sans: var(--font-sans);
  --font-mono: var(--font-mono);
  --font-serif: var(--font-serif);

  --radius-sm: calc(var(--radius) - 4px);
  --radius-md: calc(var(--radius) - 2px);
  --radius-lg: var(--radius);
  --radius-xl: calc(var(--radius) + 4px);

  --shadow-2xs: var(--shadow-2xs);
  --shadow-xs: var(--shadow-xs);
  --shadow-sm: var(--shadow-sm);
  --shadow: var(--shadow);
  --shadow-md: var(--shadow-md);
  --shadow-lg: var(--shadow-lg);
  --shadow-xl: var(--shadow-xl);
  --shadow-2xl: var(--shadow-2xl);
}
```

## Theme 2: Claude

```json
:root {
  --background: oklch(0.9818 0.0054 95.0986);
  --foreground: oklch(0.3438 0.0269 95.7226);
  --card: oklch(0.9818 0.0054 95.0986);
  --card-foreground: oklch(0.1908 0.0020 106.5859);
  --popover: oklch(1.0000 0 0);
  --popover-foreground: oklch(0.2671 0.0196 98.9390);
  --primary: oklch(0.6171 0.1375 39.0427);
  --primary-foreground: oklch(1.0000 0 0);
  --secondary: oklch(0.9245 0.0138 92.9892);
  --secondary-foreground: oklch(0.4334 0.0177 98.6048);
  --muted: oklch(0.9341 0.0153 90.2390);
  --muted-foreground: oklch(0.6059 0.0075 97.4233);
  --accent: oklch(0.9245 0.0138 92.9892);
  --accent-foreground: oklch(0.2671 0.0196 98.9390);
  --destructive: oklch(0.1908 0.0020 106.5859);
  --destructive-foreground: oklch(1.0000 0 0);
  --border: oklch(0.8847 0.0069 97.3627);
  --input: oklch(0.7621 0.0156 98.3528);
  --ring: oklch(0.6171 0.1375 39.0427);
  --chart-1: oklch(0.5583 0.1276 42.9956);
  --chart-2: oklch(0.6898 0.1581 290.4107);
  --chart-3: oklch(0.8816 0.0276 93.1280);
  --chart-4: oklch(0.8822 0.0403 298.1792);
  --chart-5: oklch(0.5608 0.1348 42.0584);
  --sidebar: oklch(0.9663 0.0080 98.8792);
  --sidebar-foreground: oklch(0.3590 0.0051 106.6524);
  --sidebar-primary: oklch(0.6171 0.1375 39.0427);
  --sidebar-primary-foreground: oklch(0.9881 0 0);
  --sidebar-accent: oklch(0.9245 0.0138 92.9892);
  --sidebar-accent-foreground: oklch(0.3250 0 0);
  --sidebar-border: oklch(0.9401 0 0);
  --sidebar-ring: oklch(0.7731 0 0);
  --font-sans: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, 'Noto Sans', sans-serif, 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol', 'Noto Color Emoji';
  --font-serif: ui-serif, Georgia, Cambria, "Times New Roman", Times, serif;
  --font-mono: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
  --radius: 0.5rem;
  --shadow-x: 0;
  --shadow-y: 1px;
  --shadow-blur: 3px;
  --shadow-spread: 0px;
  --shadow-opacity: 0.1;
  --shadow-color: oklch(0 0 0);
  --shadow-2xs: 0 1px 3px 0px hsl(0 0% 0% / 0.05);
  --shadow-xs: 0 1px 3px 0px hsl(0 0% 0% / 0.05);
  --shadow-sm: 0 1px 3px 0px hsl(0 0% 0% / 0.10), 0 1px 2px -1px hsl(0 0% 0% / 0.10);
  --shadow: 0 1px 3px 0px hsl(0 0% 0% / 0.10), 0 1px 2px -1px hsl(0 0% 0% / 0.10);
  --shadow-md: 0 1px 3px 0px hsl(0 0% 0% / 0.10), 0 2px 4px -1px hsl(0 0% 0% / 0.10);
  --shadow-lg: 0 1px 3px 0px hsl(0 0% 0% / 0.10), 0 4px 6px -1px hsl(0 0% 0% / 0.10);
  --shadow-xl: 0 1px 3px 0px hsl(0 0% 0% / 0.10), 0 8px 10px -1px hsl(0 0% 0% / 0.10);
  --shadow-2xl: 0 1px 3px 0px hsl(0 0% 0% / 0.25);
  --tracking-normal: 0em;
  --spacing: 0.25rem;
}

.dark {
  --background: oklch(0.2679 0.0036 106.6427);
  --foreground: oklch(0.8074 0.0142 93.0137);
  --card: oklch(0.2679 0.0036 106.6427);
  --card-foreground: oklch(0.9818 0.0054 95.0986);
  --popover: oklch(0.3085 0.0035 106.6039);
  --popover-foreground: oklch(0.9211 0.0040 106.4781);
  --primary: oklch(0.6724 0.1308 38.7559);
  --primary-foreground: oklch(1.0000 0 0);
  --secondary: oklch(0.9818 0.0054 95.0986);
  --secondary-foreground: oklch(0.3085 0.0035 106.6039);
  --muted: oklch(0.2213 0.0038 106.7070);
  --muted-foreground: oklch(0.7713 0.0169 99.0657);
  --accent: oklch(0.2130 0.0078 95.4245);
  --accent-foreground: oklch(0.9663 0.0080 98.8792);
  --destructive: oklch(0.6368 0.2078 25.3313);
  --destructive-foreground: oklch(1.0000 0 0);
  --border: oklch(0.3618 0.0101 106.8928);
  --input: oklch(0.4336 0.0113 100.2195);
  --ring: oklch(0.6724 0.1308 38.7559);
  --chart-1: oklch(0.5583 0.1276 42.9956);
  --chart-2: oklch(0.6898 0.1581 290.4107);
  --chart-3: oklch(0.2130 0.0078 95.4245);
  --chart-4: oklch(0.3074 0.0516 289.3230);
  --chart-5: oklch(0.5608 0.1348 42.0584);
  --sidebar: oklch(0.2357 0.0024 67.7077);
  --sidebar-foreground: oklch(0.8074 0.0142 93.0137);
  --sidebar-primary: oklch(0.3250 0 0);
  --sidebar-primary-foreground: oklch(0.9881 0 0);
  --sidebar-accent: oklch(0.1680 0.0020 106.6177);
  --sidebar-accent-foreground: oklch(0.8074 0.0142 93.0137);
  --sidebar-border: oklch(0.9401 0 0);
  --sidebar-ring: oklch(0.7731 0 0);
  --font-sans: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, 'Noto Sans', sans-serif, 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol', 'Noto Color Emoji';
  --font-serif: ui-serif, Georgia, Cambria, "Times New Roman", Times, serif;
  --font-mono: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
  --radius: 0.5rem;
  --shadow-x: 0;
  --shadow-y: 1px;
  --shadow-blur: 3px;
  --shadow-spread: 0px;
  --shadow-opacity: 0.1;
  --shadow-color: oklch(0 0 0);
  --shadow-2xs: 0 1px 3px 0px hsl(0 0% 0% / 0.05);
  --shadow-xs: 0 1px 3px 0px hsl(0 0% 0% / 0.05);
  --shadow-sm: 0 1px 3px 0px hsl(0 0% 0% / 0.10), 0 1px 2px -1px hsl(0 0% 0% / 0.10);
  --shadow: 0 1px 3px 0px hsl(0 0% 0% / 0.10), 0 1px 2px -1px hsl(0 0% 0% / 0.10);
  --shadow-md: 0 1px 3px 0px hsl(0 0% 0% / 0.10), 0 2px 4px -1px hsl(0 0% 0% / 0.10);
  --shadow-lg: 0 1px 3px 0px hsl(0 0% 0% / 0.10), 0 4px 6px -1px hsl(0 0% 0% / 0.10);
  --shadow-xl: 0 1px 3px 0px hsl(0 0% 0% / 0.10), 0 8px 10px -1px hsl(0 0% 0% / 0.10);
  --shadow-2xl: 0 1px 3px 0px hsl(0 0% 0% / 0.25);
}

@theme inline {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --color-card: var(--card);
  --color-card-foreground: var(--card-foreground);
  --color-popover: var(--popover);
  --color-popover-foreground: var(--popover-foreground);
  --color-primary: var(--primary);
  --color-primary-foreground: var(--primary-foreground);
  --color-secondary: var(--secondary);
  --color-secondary-foreground: var(--secondary-foreground);
  --color-muted: var(--muted);
  --color-muted-foreground: var(--muted-foreground);
  --color-accent: var(--accent);
  --color-accent-foreground: var(--accent-foreground);
  --color-destructive: var(--destructive);
  --color-destructive-foreground: var(--destructive-foreground);
  --color-border: var(--border);
  --color-input: var(--input);
  --color-ring: var(--ring);
  --color-chart-1: var(--chart-1);
  --color-chart-2: var(--chart-2);
  --color-chart-3: var(--chart-3);
  --color-chart-4: var(--chart-4);
  --color-chart-5: var(--chart-5);
  --color-sidebar: var(--sidebar);
  --color-sidebar-foreground: var(--sidebar-foreground);
  --color-sidebar-primary: var(--sidebar-primary);
  --color-sidebar-primary-foreground: var(--sidebar-primary-foreground);
  --color-sidebar-accent: var(--sidebar-accent);
  --color-sidebar-accent-foreground: var(--sidebar-accent-foreground);
  --color-sidebar-border: var(--sidebar-border);
  --color-sidebar-ring: var(--sidebar-ring);

  --font-sans: var(--font-sans);
  --font-mono: var(--font-mono);
  --font-serif: var(--font-serif);

  --radius-sm: calc(var(--radius) - 4px);
  --radius-md: calc(var(--radius) - 2px);
  --radius-lg: var(--radius);
  --radius-xl: calc(var(--radius) + 4px);

  --shadow-2xs: var(--shadow-2xs);
  --shadow-xs: var(--shadow-xs);
  --shadow-sm: var(--shadow-sm);
  --shadow: var(--shadow);
  --shadow-md: var(--shadow-md);
  --shadow-lg: var(--shadow-lg);
  --shadow-xl: var(--shadow-xl);
  --shadow-2xl: var(--shadow-2xl);
}
```

## Theme 3: Twitter

```json
:root {
  --background: oklch(1.0000 0 0);
  --foreground: oklch(0.3211 0 0);
  --card: oklch(1.0000 0 0);
  --card-foreground: oklch(0.3211 0 0);
  --popover: oklch(1.0000 0 0);
  --popover-foreground: oklch(0.3211 0 0);
  --primary: oklch(0.6231 0.1880 259.8145);
  --primary-foreground: oklch(1.0000 0 0);
  --secondary: oklch(0.9670 0.0029 264.5419);
  --secondary-foreground: oklch(0.4461 0.0263 256.8018);
  --muted: oklch(0.9846 0.0017 247.8389);
  --muted-foreground: oklch(0.5510 0.0234 264.3637);
  --accent: oklch(0.9514 0.0250 236.8242);
  --accent-foreground: oklch(0.3791 0.1378 265.5222);
  --destructive: oklch(0.6368 0.2078 25.3313);
  --destructive-foreground: oklch(1.0000 0 0);
  --border: oklch(0.9276 0.0058 264.5313);
  --input: oklch(0.9276 0.0058 264.5313);
  --ring: oklch(0.6231 0.1880 259.8145);
  --chart-1: oklch(0.6231 0.1880 259.8145);
  --chart-2: oklch(0.5461 0.2152 262.8809);
  --chart-3: oklch(0.4882 0.2172 264.3763);
  --chart-4: oklch(0.4244 0.1809 265.6377);
  --chart-5: oklch(0.3791 0.1378 265.5222);
  --sidebar: oklch(0.9846 0.0017 247.8389);
  --sidebar-foreground: oklch(0.3211 0 0);
  --sidebar-primary: oklch(0.6231 0.1880 259.8145);
  --sidebar-primary-foreground: oklch(1.0000 0 0);
  --sidebar-accent: oklch(0.9514 0.0250 236.8242);
  --sidebar-accent-foreground: oklch(0.3791 0.1378 265.5222);
  --sidebar-border: oklch(0.9276 0.0058 264.5313);
  --sidebar-ring: oklch(0.6231 0.1880 259.8145);
  --font-sans: Inter, sans-serif;
  --font-serif: Source Serif 4, serif;
  --font-mono: JetBrains Mono, monospace;
  --radius: 0.375rem;
  --shadow-x: 0;
  --shadow-y: 1px;
  --shadow-blur: 3px;
  --shadow-spread: 0px;
  --shadow-opacity: 0.1;
  --shadow-color: oklch(0 0 0);
  --shadow-2xs: 0 1px 3px 0px hsl(0 0% 0% / 0.05);
  --shadow-xs: 0 1px 3px 0px hsl(0 0% 0% / 0.05);
  --shadow-sm: 0 1px 3px 0px hsl(0 0% 0% / 0.10), 0 1px 2px -1px hsl(0 0% 0% / 0.10);
  --shadow: 0 1px 3px 0px hsl(0 0% 0% / 0.10), 0 1px 2px -1px hsl(0 0% 0% / 0.10);
  --shadow-md: 0 1px 3px 0px hsl(0 0% 0% / 0.10), 0 2px 4px -1px hsl(0 0% 0% / 0.10);
  --shadow-lg: 0 1px 3px 0px hsl(0 0% 0% / 0.10), 0 4px 6px -1px hsl(0 0% 0% / 0.10);
  --shadow-xl: 0 1px 3px 0px hsl(0 0% 0% / 0.10), 0 8px 10px -1px hsl(0 0% 0% / 0.10);
  --shadow-2xl: 0 1px 3px 0px hsl(0 0% 0% / 0.25);
  --tracking-normal: 0em;
  --spacing: 0.25rem;
}

.dark {
  --background: oklch(0.2046 0 0);
  --foreground: oklch(0.9219 0 0);
  --card: oklch(0.2686 0 0);
  --card-foreground: oklch(0.9219 0 0);
  --popover: oklch(0.2686 0 0);
  --popover-foreground: oklch(0.9219 0 0);
  --primary: oklch(0.6231 0.1880 259.8145);
  --primary-foreground: oklch(1.0000 0 0);
  --secondary: oklch(0.2686 0 0);
  --secondary-foreground: oklch(0.9219 0 0);
  --muted: oklch(0.2393 0 0);
  --muted-foreground: oklch(0.7155 0 0);
  --accent: oklch(0.3791 0.1378 265.5222);
  --accent-foreground: oklch(0.8823 0.0571 254.1284);
  --destructive: oklch(0.6368 0.2078 25.3313);
  --destructive-foreground: oklch(1.0000 0 0);
  --border: oklch(0.3715 0 0);
  --input: oklch(0.3715 0 0);
  --ring: oklch(0.6231 0.1880 259.8145);
  --chart-1: oklch(0.7137 0.1434 254.6240);
  --chart-2: oklch(0.6231 0.1880 259.8145);
  --chart-3: oklch(0.5461 0.2152 262.8809);
  --chart-4: oklch(0.4882 0.2172 264.3763);
  --chart-5: oklch(0.4244 0.1809 265.6377);
  --sidebar: oklch(0.2046 0 0);
  --sidebar-foreground: oklch(0.9219 0 0);
  --sidebar-primary: oklch(0.6231 0.1880 259.8145);
  --sidebar-primary-foreground: oklch(1.0000 0 0);
  --sidebar-accent: oklch(0.3791 0.1378 265.5222);
  --sidebar-accent-foreground: oklch(0.8823 0.0571 254.1284);
  --sidebar-border: oklch(0.3715 0 0);
  --sidebar-ring: oklch(0.6231 0.1880 259.8145);
  --font-sans: Inter, sans-serif;
  --font-serif: Source Serif 4, serif;
  --font-mono: JetBrains Mono, monospace;
  --radius: 0.375rem;
  --shadow-x: 0;
  --shadow-y: 1px;
  --shadow-blur: 3px;
  --shadow-spread: 0px;
  --shadow-opacity: 0.1;
  --shadow-color: oklch(0 0 0);
  --shadow-2xs: 0 1px 3px 0px hsl(0 0% 0% / 0.05);
  --shadow-xs: 0 1px 3px 0px hsl(0 0% 0% / 0.05);
  --shadow-sm: 0 1px 3px 0px hsl(0 0% 0% / 0.10), 0 1px 2px -1px hsl(0 0% 0% / 0.10);
  --shadow: 0 1px 3px 0px hsl(0 0% 0% / 0.10), 0 1px 2px -1px hsl(0 0% 0% / 0.10);
  --shadow-md: 0 1px 3px 0px hsl(0 0% 0% / 0.10), 0 2px 4px -1px hsl(0 0% 0% / 0.10);
  --shadow-lg: 0 1px 3px 0px hsl(0 0% 0% / 0.10), 0 4px 6px -1px hsl(0 0% 0% / 0.10);
  --shadow-xl: 0 1px 3px 0px hsl(0 0% 0% / 0.10), 0 8px 10px -1px hsl(0 0% 0% / 0.10);
  --shadow-2xl: 0 1px 3px 0px hsl(0 0% 0% / 0.25);
}

@theme inline {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --color-card: var(--card);
  --color-card-foreground: var(--card-foreground);
  --color-popover: var(--popover);
  --color-popover-foreground: var(--popover-foreground);
  --color-primary: var(--primary);
  --color-primary-foreground: var(--primary-foreground);
  --color-secondary: var(--secondary);
  --color-secondary-foreground: var(--secondary-foreground);
  --color-muted: var(--muted);
  --color-muted-foreground: var(--muted-foreground);
  --color-accent: var(--accent);
  --color-accent-foreground: var(--accent-foreground);
  --color-destructive: var(--destructive);
  --color-destructive-foreground: var(--destructive-foreground);
  --color-border: var(--border);
  --color-input: var(--input);
  --color-ring: var(--ring);
  --color-chart-1: var(--chart-1);
  --color-chart-2: var(--chart-2);
  --color-chart-3: var(--chart-3);
  --color-chart-4: var(--chart-4);
  --color-chart-5: var(--chart-5);
  --color-sidebar: var(--sidebar);
  --color-sidebar-foreground: var(--sidebar-foreground);
  --color-sidebar-primary: var(--sidebar-primary);
  --color-sidebar-primary-foreground: var(--sidebar-primary-foreground);
  --color-sidebar-accent: var(--sidebar-accent);
  --color-sidebar-accent-foreground: var(--sidebar-accent-foreground);
  --color-sidebar-border: var(--sidebar-border);
  --color-sidebar-ring: var(--sidebar-ring);

  --font-sans: var(--font-sans);
  --font-mono: var(--font-mono);
  --font-serif: var(--font-serif);

  --radius-sm: calc(var(--radius) - 4px);
  --radius-md: calc(var(--radius) - 2px);
  --radius-lg: var(--radius);
  --radius-xl: calc(var(--radius) + 4px);

  --shadow-2xs: var(--shadow-2xs);
  --shadow-xs: var(--shadow-xs);
  --shadow-sm: var(--shadow-sm);
  --shadow: var(--shadow);
  --shadow-md: var(--shadow-md);
  --shadow-lg: var(--shadow-lg);
  --shadow-xl: var(--shadow-xl);
  --shadow-2xl: var(--shadow-2xl);
}
```

## Theme 4: Zed

```json
:root {
  --background: oklch(93.137% 0.01393 88.675);
  --foreground: oklch(0.235 0 0);
  --card: oklch(0.953 0.0156 86.4257);
  --card-foreground: oklch(0.235 0 0);
  --popover: oklch(0.953 0.0156 86.4257);
  --popover-foreground: oklch(0.235 0 0);
  --primary: oklch(48.857% 0.09963 78.89);
  --primary-foreground: oklch(0.9169 0.0175 99.616);
  --secondary: oklch(0.8647 0.0201 87.5232);
  --secondary-foreground: oklch(0.3012 0 0);
  --muted: oklch(0.834 0.0232 87.163);
  --muted-foreground: oklch(0.4688 0.0136 84.5932);
  --accent: oklch(0.9169 0.0175 99.616);
  --accent-foreground: oklch(0.3012 0 0);
  --destructive: oklch(0.5771 0.2152 27.325);
  --destructive-foreground: oklch(1 0 0);
  --border: oklch(0.8434 0.0231 87.1621);
  --input: oklch(0.8434 0.0231 87.1621);
  --ring: oklch(0.3012 0 0);
  --chart-1: oklch(0.6863 0.1743 34.2614);
  --chart-2: oklch(0.235 0 0);
  --chart-3: oklch(0.4688 0.0136 84.5932);
  --chart-4: oklch(0.7057 0.025 82.0932);
  --chart-5: oklch(0.834 0.0232 87.163);
  --sidebar: oklch(0.8985 0.0199 87.5195);
  --sidebar-foreground: oklch(0.235 0 0);
  --sidebar-primary: oklch(0.3012 0 0);
  --sidebar-primary-foreground: oklch(0.9169 0.0175 99.616);
  --sidebar-accent: oklch(0.9169 0.0175 99.616);
  --sidebar-accent-foreground: oklch(0.3012 0 0);
  --sidebar-border: oklch(0.8434 0.0231 87.1621);
  --sidebar-ring: oklch(0.3012 0 0);
  --font-sans: Geist Mono, monospace;
  --font-serif: Geist Mono, monospace;
  --font-mono: Geist Mono, monospace;
  --radius: 0px;
  --shadow-x: 0px;
  --shadow-y: 2px;
  --shadow-blur: 4px;
  --shadow-spread: 0px;
  --shadow-opacity: 0.2;
  --shadow-color: #AAAAAA;
  --shadow-2xs: 0px 2px 4px 0px hsl(0 0% 66.6667% / 0.10);
  --shadow-xs: 0px 2px 4px 0px hsl(0 0% 66.6667% / 0.10);
  --shadow-sm: 0px 2px 4px 0px hsl(0 0% 66.6667% / 0.20), 0px 1px 2px -1px hsl(0 0% 66.6667% / 0.20);
  --shadow: 0px 2px 4px 0px hsl(0 0% 66.6667% / 0.20), 0px 1px 2px -1px hsl(0 0% 66.6667% / 0.20);
  --shadow-md: 0px 2px 4px 0px hsl(0 0% 66.6667% / 0.20), 0px 2px 4px -1px hsl(0 0% 66.6667% / 0.20);
  --shadow-lg: 0px 2px 4px 0px hsl(0 0% 66.6667% / 0.20), 0px 4px 6px -1px hsl(0 0% 66.6667% / 0.20);
  --shadow-xl: 0px 2px 4px 0px hsl(0 0% 66.6667% / 0.20), 0px 8px 10px -1px hsl(0 0% 66.6667% / 0.20);
  --shadow-2xl: 0px 2px 4px 0px hsl(0 0% 66.6667% / 0.50);
  --tracking-normal: 0px;
  --spacing: 0.25rem;
}

.dark {
  --background: oklch(0.2891 0 0);
  --foreground: oklch(0.8945 0 0);
  --card: oklch(0.3211 0 0);
  --card-foreground: oklch(0.8945 0 0);
  --popover: oklch(0.3211 0 0);
  --popover-foreground: oklch(0.8945 0 0);
  --primary: oklch(0.8422 0.1255 83.85);
  --primary-foreground: oklch(0.2891 0 0);
  --secondary: oklch(0.4676 0 0);
  --secondary-foreground: oklch(0.8078 0 0);
  --muted: oklch(0.3904 0 0);
  --muted-foreground: oklch(0.7058 0 0);
  --accent: oklch(0.9067 0 0);
  --accent-foreground: oklch(0.3211 0 0);
  --destructive: oklch(0.7915 0.0491 18.241);
  --destructive-foreground: oklch(0.2891 0 0);
  --border: oklch(0.4276 0 0);
  --input: oklch(0.3211 0 0);
  --ring: oklch(0.8078 0 0);
  --chart-1: oklch(0.9521 0 0);
  --chart-2: oklch(0.8576 0 0);
  --chart-3: oklch(0.7572 0 0);
  --chart-4: oklch(0.6534 0 0);
  --chart-5: oklch(0.5452 0 0);
  --sidebar: oklch(0.2478 0 0);
  --sidebar-foreground: oklch(0.8945 0 0);
  --sidebar-primary: oklch(0.7572 0 0);
  --sidebar-primary-foreground: oklch(0.2478 0 0);
  --sidebar-accent: oklch(0.9067 0 0);
  --sidebar-accent-foreground: oklch(0.3211 0 0);
  --sidebar-border: oklch(0.4276 0 0);
  --sidebar-ring: oklch(0.8078 0 0);
  --font-sans: Geist Mono, monospace;
  --font-serif: Geist Mono, monospace;
  --font-mono: Geist Mono, monospace;
  --radius: 0px;
  --shadow-x: 0px;
  --shadow-y: 2px;
  --shadow-blur: 4px;
  --shadow-spread: 0px;
  --shadow-opacity: 0.2;
  --shadow-color: #222222;
  --shadow-2xs: 0px 2px 4px 0px hsl(0 0% 13.3333% / 0.10);
  --shadow-xs: 0px 2px 4px 0px hsl(0 0% 13.3333% / 0.10);
  --shadow-sm: 0px 2px 4px 0px hsl(0 0% 13.3333% / 0.20), 0px 1px 2px -1px hsl(0 0% 13.3333% / 0.20);
  --shadow: 0px 2px 4px 0px hsl(0 0% 13.3333% / 0.20), 0px 1px 2px -1px hsl(0 0% 13.3333% / 0.20);
  --shadow-md: 0px 2px 4px 0px hsl(0 0% 13.3333% / 0.20), 0px 2px 4px -1px hsl(0 0% 13.3333% / 0.20);
  --shadow-lg: 0px 2px 4px 0px hsl(0 0% 13.3333% / 0.20), 0px 4px 6px -1px hsl(0 0% 13.3333% / 0.20);
  --shadow-xl: 0px 2px 4px 0px hsl(0 0% 13.3333% / 0.20), 0px 8px 10px -1px hsl(0 0% 13.3333% / 0.20);
  --shadow-2xl: 0px 2px 4px 0px hsl(0 0% 13.3333% / 0.50);
}

@theme inline {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --color-card: var(--card);
  --color-card-foreground: var(--card-foreground);
  --color-popover: var(--popover);
  --color-popover-foreground: var(--popover-foreground);
  --color-primary: var(--primary);
  --color-primary-foreground: var(--primary-foreground);
  --color-secondary: var(--secondary);
  --color-secondary-foreground: var(--secondary-foreground);
  --color-muted: var(--muted);
  --color-muted-foreground: var(--muted-foreground);
  --color-accent: var(--accent);
  --color-accent-foreground: var(--accent-foreground);
  --color-destructive: var(--destructive);
  --color-destructive-foreground: var(--destructive-foreground);
  --color-border: var(--border);
  --color-input: var(--input);
  --color-ring: var(--ring);
  --color-chart-1: var(--chart-1);
  --color-chart-2: var(--chart-2);
  --color-chart-3: var(--chart-3);
  --color-chart-4: var(--chart-4);
  --color-chart-5: var(--chart-5);
  --color-sidebar: var(--sidebar);
  --color-sidebar-foreground: var(--sidebar-foreground);
  --color-sidebar-primary: var(--sidebar-primary);
  --color-sidebar-primary-foreground: var(--sidebar-primary-foreground);
  --color-sidebar-accent: var(--sidebar-accent);
  --color-sidebar-accent-foreground: var(--sidebar-accent-foreground);
  --color-sidebar-border: var(--sidebar-border);
  --color-sidebar-ring: var(--sidebar-ring);

  --font-sans: var(--font-sans);
  --font-mono: var(--font-mono);
  --font-serif: var(--font-serif);

  --radius-sm: calc(var(--radius) - 4px);
  --radius-md: calc(var(--radius) - 2px);
  --radius-lg: var(--radius);
  --radius-xl: calc(var(--radius) + 4px);

  --shadow-2xs: var(--shadow-2xs);
  --shadow-xs: var(--shadow-xs);
  --shadow-sm: var(--shadow-sm);
  --shadow: var(--shadow);
  --shadow-md: var(--shadow-md);
  --shadow-lg: var(--shadow-lg);
  --shadow-xl: var(--shadow-xl);
  --shadow-2xl: var(--shadow-2xl);

  --tracking-tighter: calc(var(--tracking-normal) - 0.05em);
  --tracking-tight: calc(var(--tracking-normal) - 0.025em);
  --tracking-normal: var(--tracking-normal);
  --tracking-wide: calc(var(--tracking-normal) + 0.025em);
  --tracking-wider: calc(var(--tracking-normal) + 0.05em);
  --tracking-widest: calc(var(--tracking-normal) + 0.1em);
}

body {
  letter-spacing: var(--tracking-normal);
}
```

## Theme 5: Supabase

```json
:root {
  --background: oklch(0.9911 0 0);
  --foreground: oklch(0.2046 0 0);
  --card: oklch(0.9911 0 0);
  --card-foreground: oklch(0.2046 0 0);
  --popover: oklch(0.9911 0 0);
  --popover-foreground: oklch(0.4386 0 0);
  --primary: oklch(0.8348 0.1302 160.9080);
  --primary-foreground: oklch(0.2626 0.0147 166.4589);
  --secondary: oklch(0.9940 0 0);
  --secondary-foreground: oklch(0.2046 0 0);
  --muted: oklch(0.9461 0 0);
  --muted-foreground: oklch(0.2435 0 0);
  --accent: oklch(0.9461 0 0);
  --accent-foreground: oklch(0.2435 0 0);
  --destructive: oklch(0.5523 0.1927 32.7272);
  --destructive-foreground: oklch(0.9934 0.0032 17.2118);
  --border: oklch(0.9037 0 0);
  --input: oklch(0.9731 0 0);
  --ring: oklch(0.8348 0.1302 160.9080);
  --chart-1: oklch(0.8348 0.1302 160.9080);
  --chart-2: oklch(0.6231 0.1880 259.8145);
  --chart-3: oklch(0.6056 0.2189 292.7172);
  --chart-4: oklch(0.7686 0.1647 70.0804);
  --chart-5: oklch(0.6959 0.1491 162.4796);
  --sidebar: oklch(0.9911 0 0);
  --sidebar-foreground: oklch(0.5452 0 0);
  --sidebar-primary: oklch(0.8348 0.1302 160.9080);
  --sidebar-primary-foreground: oklch(0.2626 0.0147 166.4589);
  --sidebar-accent: oklch(0.9461 0 0);
  --sidebar-accent-foreground: oklch(0.2435 0 0);
  --sidebar-border: oklch(0.9037 0 0);
  --sidebar-ring: oklch(0.8348 0.1302 160.9080);
  --font-sans: Outfit, sans-serif;
  --font-serif: ui-serif, Georgia, Cambria, "Times New Roman", Times, serif;
  --font-mono: monospace;
  --radius: 0.5rem;
  --shadow-x: 0px;
  --shadow-y: 1px;
  --shadow-blur: 3px;
  --shadow-spread: 0px;
  --shadow-opacity: 0.17;
  --shadow-color: #000000;
  --shadow-2xs: 0px 1px 3px 0px hsl(0 0% 0% / 0.09);
  --shadow-xs: 0px 1px 3px 0px hsl(0 0% 0% / 0.09);
  --shadow-sm: 0px 1px 3px 0px hsl(0 0% 0% / 0.17), 0px 1px 2px -1px hsl(0 0% 0% / 0.17);
  --shadow: 0px 1px 3px 0px hsl(0 0% 0% / 0.17), 0px 1px 2px -1px hsl(0 0% 0% / 0.17);
  --shadow-md: 0px 1px 3px 0px hsl(0 0% 0% / 0.17), 0px 2px 4px -1px hsl(0 0% 0% / 0.17);
  --shadow-lg: 0px 1px 3px 0px hsl(0 0% 0% / 0.17), 0px 4px 6px -1px hsl(0 0% 0% / 0.17);
  --shadow-xl: 0px 1px 3px 0px hsl(0 0% 0% / 0.17), 0px 8px 10px -1px hsl(0 0% 0% / 0.17);
  --shadow-2xl: 0px 1px 3px 0px hsl(0 0% 0% / 0.43);
  --tracking-normal: 0.025em;
  --spacing: 0.25rem;
}

.dark {
  --background: oklch(0.1822 0 0);
  --foreground: oklch(0.9288 0.0126 255.5078);
  --card: oklch(0.2046 0 0);
  --card-foreground: oklch(0.9288 0.0126 255.5078);
  --popover: oklch(0.2603 0 0);
  --popover-foreground: oklch(0.7348 0 0);
  --primary: oklch(0.4365 0.1044 156.7556);
  --primary-foreground: oklch(0.9213 0.0135 167.1556);
  --secondary: oklch(0.2603 0 0);
  --secondary-foreground: oklch(0.9851 0 0);
  --muted: oklch(0.2393 0 0);
  --muted-foreground: oklch(0.7122 0 0);
  --accent: oklch(0.3132 0 0);
  --accent-foreground: oklch(0.9851 0 0);
  --destructive: oklch(0.3123 0.0852 29.7877);
  --destructive-foreground: oklch(0.9368 0.0045 34.3092);
  --border: oklch(0.2809 0 0);
  --input: oklch(0.2603 0 0);
  --ring: oklch(0.8003 0.1821 151.7110);
  --chart-1: oklch(0.8003 0.1821 151.7110);
  --chart-2: oklch(0.7137 0.1434 254.6240);
  --chart-3: oklch(0.7090 0.1592 293.5412);
  --chart-4: oklch(0.8369 0.1644 84.4286);
  --chart-5: oklch(0.7845 0.1325 181.9120);
  --sidebar: oklch(0.1822 0 0);
  --sidebar-foreground: oklch(0.6301 0 0);
  --sidebar-primary: oklch(0.4365 0.1044 156.7556);
  --sidebar-primary-foreground: oklch(0.9213 0.0135 167.1556);
  --sidebar-accent: oklch(0.3132 0 0);
  --sidebar-accent-foreground: oklch(0.9851 0 0);
  --sidebar-border: oklch(0.2809 0 0);
  --sidebar-ring: oklch(0.8003 0.1821 151.7110);
  --font-sans: Outfit, sans-serif;
  --font-serif: ui-serif, Georgia, Cambria, "Times New Roman", Times, serif;
  --font-mono: monospace;
  --radius: 0.5rem;
  --shadow-x: 0px;
  --shadow-y: 1px;
  --shadow-blur: 3px;
  --shadow-spread: 0px;
  --shadow-opacity: 0.17;
  --shadow-color: #000000;
  --shadow-2xs: 0px 1px 3px 0px hsl(0 0% 0% / 0.09);
  --shadow-xs: 0px 1px 3px 0px hsl(0 0% 0% / 0.09);
  --shadow-sm: 0px 1px 3px 0px hsl(0 0% 0% / 0.17), 0px 1px 2px -1px hsl(0 0% 0% / 0.17);
  --shadow: 0px 1px 3px 0px hsl(0 0% 0% / 0.17), 0px 1px 2px -1px hsl(0 0% 0% / 0.17);
  --shadow-md: 0px 1px 3px 0px hsl(0 0% 0% / 0.17), 0px 2px 4px -1px hsl(0 0% 0% / 0.17);
  --shadow-lg: 0px 1px 3px 0px hsl(0 0% 0% / 0.17), 0px 4px 6px -1px hsl(0 0% 0% / 0.17);
  --shadow-xl: 0px 1px 3px 0px hsl(0 0% 0% / 0.17), 0px 8px 10px -1px hsl(0 0% 0% / 0.17);
  --shadow-2xl: 0px 1px 3px 0px hsl(0 0% 0% / 0.43);
}

@theme inline {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --color-card: var(--card);
  --color-card-foreground: var(--card-foreground);
  --color-popover: var(--popover);
  --color-popover-foreground: var(--popover-foreground);
  --color-primary: var(--primary);
  --color-primary-foreground: var(--primary-foreground);
  --color-secondary: var(--secondary);
  --color-secondary-foreground: var(--secondary-foreground);
  --color-muted: var(--muted);
  --color-muted-foreground: var(--muted-foreground);
  --color-accent: var(--accent);
  --color-accent-foreground: var(--accent-foreground);
  --color-destructive: var(--destructive);
  --color-destructive-foreground: var(--destructive-foreground);
  --color-border: var(--border);
  --color-input: var(--input);
  --color-ring: var(--ring);
  --color-chart-1: var(--chart-1);
  --color-chart-2: var(--chart-2);
  --color-chart-3: var(--chart-3);
  --color-chart-4: var(--chart-4);
  --color-chart-5: var(--chart-5);
  --color-sidebar: var(--sidebar);
  --color-sidebar-foreground: var(--sidebar-foreground);
  --color-sidebar-primary: var(--sidebar-primary);
  --color-sidebar-primary-foreground: var(--sidebar-primary-foreground);
  --color-sidebar-accent: var(--sidebar-accent);
  --color-sidebar-accent-foreground: var(--sidebar-accent-foreground);
  --color-sidebar-border: var(--sidebar-border);
  --color-sidebar-ring: var(--sidebar-ring);

  --font-sans: var(--font-sans);
  --font-mono: var(--font-mono);
  --font-serif: var(--font-serif);

  --radius-sm: calc(var(--radius) - 4px);
  --radius-md: calc(var(--radius) - 2px);
  --radius-lg: var(--radius);
  --radius-xl: calc(var(--radius) + 4px);

  --shadow-2xs: var(--shadow-2xs);
  --shadow-xs: var(--shadow-xs);
  --shadow-sm: var(--shadow-sm);
  --shadow: var(--shadow);
  --shadow-md: var(--shadow-md);
  --shadow-lg: var(--shadow-lg);
  --shadow-xl: var(--shadow-xl);
  --shadow-2xl: var(--shadow-2xl);

  --tracking-tighter: calc(var(--tracking-normal) - 0.05em);
  --tracking-tight: calc(var(--tracking-normal) - 0.025em);
  --tracking-normal: var(--tracking-normal);
  --tracking-wide: calc(var(--tracking-normal) + 0.025em);
  --tracking-wider: calc(var(--tracking-normal) + 0.05em);
  --tracking-widest: calc(var(--tracking-normal) + 0.1em);
}

body {
  letter-spacing: var(--tracking-normal);
}
```

## Theme 6: T3 Chat

```json
:root {
  --background: oklch(0.9754 0.0084 325.6414);
  --foreground: oklch(0.3257 0.1161 325.0372);
  --card: oklch(0.9754 0.0084 325.6414);
  --card-foreground: oklch(0.3257 0.1161 325.0372);
  --popover: oklch(1.0000 0 0);
  --popover-foreground: oklch(0.3257 0.1161 325.0372);
  --primary: oklch(0.5316 0.1409 355.1999);
  --primary-foreground: oklch(1.0000 0 0);
  --secondary: oklch(0.8696 0.0675 334.8991);
  --secondary-foreground: oklch(0.4448 0.1341 324.7991);
  --muted: oklch(0.9395 0.0260 331.5454);
  --muted-foreground: oklch(0.4924 0.1244 324.4523);
  --accent: oklch(0.8696 0.0675 334.8991);
  --accent-foreground: oklch(0.4448 0.1341 324.7991);
  --destructive: oklch(0.5248 0.1368 20.8317);
  --destructive-foreground: oklch(1.0000 0 0);
  --border: oklch(0.8568 0.0829 328.9110);
  --input: oklch(0.8517 0.0558 336.6002);
  --ring: oklch(0.5916 0.2180 0.5844);
  --chart-1: oklch(0.6038 0.2363 344.4657);
  --chart-2: oklch(0.4445 0.2251 300.6246);
  --chart-3: oklch(0.3790 0.0438 226.1538);
  --chart-4: oklch(0.8330 0.1185 88.3461);
  --chart-5: oklch(0.7843 0.1256 58.9964);
  --sidebar: oklch(0.9360 0.0288 320.5788);
  --sidebar-foreground: oklch(0.4948 0.1909 354.5435);
  --sidebar-primary: oklch(0.3963 0.0251 285.1962);
  --sidebar-primary-foreground: oklch(0.9668 0.0124 337.5228);
  --sidebar-accent: oklch(0.9789 0.0013 106.4235);
  --sidebar-accent-foreground: oklch(0.3963 0.0251 285.1962);
  --sidebar-border: oklch(0.9383 0.0026 48.7178);
  --sidebar-ring: oklch(0.5916 0.2180 0.5844);
  --font-sans: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, 'Noto Sans', sans-serif, 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol', 'Noto Color Emoji';
  --font-serif: ui-serif, Georgia, Cambria, "Times New Roman", Times, serif;
  --font-mono: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
  --radius: 0.5rem;
  --shadow-x: 0;
  --shadow-y: 1px;
  --shadow-blur: 3px;
  --shadow-spread: 0px;
  --shadow-opacity: 0.1;
  --shadow-color: oklch(0 0 0);
  --shadow-2xs: 0 1px 3px 0px hsl(0 0% 0% / 0.05);
  --shadow-xs: 0 1px 3px 0px hsl(0 0% 0% / 0.05);
  --shadow-sm: 0 1px 3px 0px hsl(0 0% 0% / 0.10), 0 1px 2px -1px hsl(0 0% 0% / 0.10);
  --shadow: 0 1px 3px 0px hsl(0 0% 0% / 0.10), 0 1px 2px -1px hsl(0 0% 0% / 0.10);
  --shadow-md: 0 1px 3px 0px hsl(0 0% 0% / 0.10), 0 2px 4px -1px hsl(0 0% 0% / 0.10);
  --shadow-lg: 0 1px 3px 0px hsl(0 0% 0% / 0.10), 0 4px 6px -1px hsl(0 0% 0% / 0.10);
  --shadow-xl: 0 1px 3px 0px hsl(0 0% 0% / 0.10), 0 8px 10px -1px hsl(0 0% 0% / 0.10);
  --shadow-2xl: 0 1px 3px 0px hsl(0 0% 0% / 0.25);
  --tracking-normal: 0em;
  --spacing: 0.25rem;
}

.dark {
  --background: oklch(0.2409 0.0201 307.5346);
  --foreground: oklch(0.8398 0.0387 309.5391);
  --card: oklch(0.2803 0.0232 307.5413);
  --card-foreground: oklch(0.8456 0.0302 341.4597);
  --popover: oklch(0.1548 0.0132 338.9015);
  --popover-foreground: oklch(0.9647 0.0091 341.8035);
  --primary: oklch(0.4607 0.1853 4.0994);
  --primary-foreground: oklch(0.8560 0.0618 346.3684);
  --secondary: oklch(0.3137 0.0306 310.0610);
  --secondary-foreground: oklch(0.8483 0.0382 307.9613);
  --muted: oklch(0.2634 0.0219 309.4748);
  --muted-foreground: oklch(0.7940 0.0372 307.1032);
  --accent: oklch(0.3649 0.0508 308.4911);
  --accent-foreground: oklch(0.9647 0.0091 341.8035);
  --destructive: oklch(0.2258 0.0524 12.6119);
  --destructive-foreground: oklch(1.0000 0 0);
  --border: oklch(0.3286 0.0154 343.4461);
  --input: oklch(0.3387 0.0195 332.8347);
  --ring: oklch(0.5916 0.2180 0.5844);
  --chart-1: oklch(0.5316 0.1409 355.1999);
  --chart-2: oklch(0.5633 0.1912 306.8561);
  --chart-3: oklch(0.7227 0.1502 60.5799);
  --chart-4: oklch(0.6193 0.2029 312.7422);
  --chart-5: oklch(0.6118 0.2093 6.1387);
  --sidebar: oklch(0.1893 0.0163 331.0475);
  --sidebar-foreground: oklch(0.8607 0.0293 343.6612);
  --sidebar-primary: oklch(0.4882 0.2172 264.3763);
  --sidebar-primary-foreground: oklch(1.0000 0 0);
  --sidebar-accent: oklch(0.2337 0.0261 338.1961);
  --sidebar-accent-foreground: oklch(0.9674 0.0013 286.3752);
  --sidebar-border: oklch(0 0 0);
  --sidebar-ring: oklch(0.5916 0.2180 0.5844);
  --font-sans: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, 'Noto Sans', sans-serif, 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol', 'Noto Color Emoji';
  --font-serif: ui-serif, Georgia, Cambria, "Times New Roman", Times, serif;
  --font-mono: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
  --radius: 0.5rem;
  --shadow-x: 0;
  --shadow-y: 1px;
  --shadow-blur: 3px;
  --shadow-spread: 0px;
  --shadow-opacity: 0.1;
  --shadow-color: oklch(0 0 0);
  --shadow-2xs: 0 1px 3px 0px hsl(0 0% 0% / 0.05);
  --shadow-xs: 0 1px 3px 0px hsl(0 0% 0% / 0.05);
  --shadow-sm: 0 1px 3px 0px hsl(0 0% 0% / 0.10), 0 1px 2px -1px hsl(0 0% 0% / 0.10);
  --shadow: 0 1px 3px 0px hsl(0 0% 0% / 0.10), 0 1px 2px -1px hsl(0 0% 0% / 0.10);
  --shadow-md: 0 1px 3px 0px hsl(0 0% 0% / 0.10), 0 2px 4px -1px hsl(0 0% 0% / 0.10);
  --shadow-lg: 0 1px 3px 0px hsl(0 0% 0% / 0.10), 0 4px 6px -1px hsl(0 0% 0% / 0.10);
  --shadow-xl: 0 1px 3px 0px hsl(0 0% 0% / 0.10), 0 8px 10px -1px hsl(0 0% 0% / 0.10);
  --shadow-2xl: 0 1px 3px 0px hsl(0 0% 0% / 0.25);
}

@theme inline {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --color-card: var(--card);
  --color-card-foreground: var(--card-foreground);
  --color-popover: var(--popover);
  --color-popover-foreground: var(--popover-foreground);
  --color-primary: var(--primary);
  --color-primary-foreground: var(--primary-foreground);
  --color-secondary: var(--secondary);
  --color-secondary-foreground: var(--secondary-foreground);
  --color-muted: var(--muted);
  --color-muted-foreground: var(--muted-foreground);
  --color-accent: var(--accent);
  --color-accent-foreground: var(--accent-foreground);
  --color-destructive: var(--destructive);
  --color-destructive-foreground: var(--destructive-foreground);
  --color-border: var(--border);
  --color-input: var(--input);
  --color-ring: var(--ring);
  --color-chart-1: var(--chart-1);
  --color-chart-2: var(--chart-2);
  --color-chart-3: var(--chart-3);
  --color-chart-4: var(--chart-4);
  --color-chart-5: var(--chart-5);
  --color-sidebar: var(--sidebar);
  --color-sidebar-foreground: var(--sidebar-foreground);
  --color-sidebar-primary: var(--sidebar-primary);
  --color-sidebar-primary-foreground: var(--sidebar-primary-foreground);
  --color-sidebar-accent: var(--sidebar-accent);
  --color-sidebar-accent-foreground: var(--sidebar-accent-foreground);
  --color-sidebar-border: var(--sidebar-border);
  --color-sidebar-ring: var(--sidebar-ring);

  --font-sans: var(--font-sans);
  --font-mono: var(--font-mono);
  --font-serif: var(--font-serif);

  --radius-sm: calc(var(--radius) - 4px);
  --radius-md: calc(var(--radius) - 2px);
  --radius-lg: var(--radius);
  --radius-xl: calc(var(--radius) + 4px);

  --shadow-2xs: var(--shadow-2xs);
  --shadow-xs: var(--shadow-xs);
  --shadow-sm: var(--shadow-sm);
  --shadow: var(--shadow);
  --shadow-md: var(--shadow-md);
  --shadow-lg: var(--shadow-lg);
  --shadow-xl: var(--shadow-xl);
  --shadow-2xl: var(--shadow-2xl);
}
```

## Theme 7: Perplexity

```json
:root {
  --background: oklch(0.9902 0.0039 106.4715);
  --foreground: oklch(0.3043 0.0394 214.0798);
  --card: oklch(0.9992 0.0039 106.4707);
  --card-foreground: oklch(0.0000 0.0000 0.0000);
  --popover: oklch(0.9992 0.0039 106.4707);
  --popover-foreground: oklch(0.0000 0.0000 0.0000);
  --primary: oklch(0.5322 0.0910 205.7465);
  --primary-foreground: oklch(1.0000 0.0000 0.0000);
  --secondary: oklch(0.9004 0.0101 212.5234);
  --secondary-foreground: oklch(0.3043 0.0394 214.0798);
  --muted: oklch(0.9297 0.0066 208.7822);
  --muted-foreground: oklch(0.5292 0.0153 214.4327);
  --accent: oklch(0.9410 0.0159 196.8866);
  --accent-foreground: oklch(0.0000 0.0000 0.0000);
  --destructive: oklch(0.6337 0.1570 54.9611);
  --destructive-foreground: oklch(0.0000 0.0000 0.0000);
  --border: oklch(0.9289 0.0034 145.5484);
  --input: oklch(0.9902 0.0039 106.4715);
  --ring: oklch(0.6312 0.0912 206.5386);
  --sidebar: oklch(0.9628 0.0066 106.5233);
  --sidebar-foreground: oklch(0.0000 0.0000 0.0000);
  --sidebar-primary: oklch(0.5322 0.0910 205.7465);
  --sidebar-primary-foreground: oklch(1.0000 0.0000 0.0000);
  --sidebar-accent: oklch(0.9992 0.0039 106.4707);
  --sidebar-accent-foreground: oklch(0.0000 0.0000 0.0000);
  --sidebar-border: oklch(0.8736 0.0091 214.3465);
  --sidebar-ring: oklch(0.6312 0.0912 206.5386);
  --chart-1: oklch(0.6267 0.1054 204.7118);
  --chart-2: oklch(0.5443 0.1104 255.9391);
  --chart-3: oklch(0.7877 0.0910 204.4517);
  --chart-4: oklch(0.3858 0.0942 255.9170);
  --chart-5: oklch(0.4406 0.0756 207.3871);
  --radius: 0.75rem;
  --letter-spacing: 0em;
  --font-sans: Inter, ui-sans-serif, system-ui, sans-serif;
  --font-mono: JetBrains Mono, ui-monospace, SFMono-Regular, monospace;
  --font-serif: Georgia, Cambria, "Times New Roman", serif;
  --radius-sm: 0.563rem;
  --radius-md: 0.75rem;
  --radius-lg: 1.125rem;
  --radius-xl: 1.500rem;
  --shadow-x: 0px;
  --shadow-y: 0px;
  --shadow-blur: 1px;
  --shadow-spread: 0px;
  --shadow-opacity: 0.07;
  --shadow-color: oklch(0.0000 0.0000 0.0000);
  --tracking-normal: 0em;
  --spacing: 0.25rem;
  --shadow-2xs: 0px 0px 1px 0px oklch(0.0000 0.0000 0.0000 / 0.04);
  --shadow-xs: 0px 0px 1px 0px oklch(0.0000 0.0000 0.0000 / 0.04);
  --shadow-sm: 0px 0px 1px 0px oklch(0.0000 0.0000 0.0000 / 0.07), 0px 1px 2px -1px oklch(0.0000 0.0000 0.0000 / 0.07);
  --shadow: 0px 0px 1px 0px oklch(0.0000 0.0000 0.0000 / 0.07), 0px 1px 2px -1px oklch(0.0000 0.0000 0.0000 / 0.07);
  --shadow-md: 0px 0px 1px 0px oklch(0.0000 0.0000 0.0000 / 0.07), 0px 2px 4px -1px oklch(0.0000 0.0000 0.0000 / 0.07);
  --shadow-lg: 0px 0px 1px 0px oklch(0.0000 0.0000 0.0000 / 0.07), 0px 4px 6px -1px oklch(0.0000 0.0000 0.0000 / 0.07);
  --shadow-xl: 0px 0px 1px 0px oklch(0.0000 0.0000 0.0000 / 0.07), 0px 8px 10px -1px oklch(0.0000 0.0000 0.0000 / 0.07);
  --shadow-2xl: 0px 0px 1px 0px oklch(0.0000 0.0000 0.0000 / 0.18);
}

.dark {
  --background: oklch(0.2167 0.0015 197.0427);
  --foreground: oklch(0.9836 0.0021 197.1231);
  --card: oklch(0.2167 0.0015 197.0427);
  --card-foreground: oklch(1.0000 0.0000 0.0000);
  --popover: oklch(0.1856 0.0016 197.0184);
  --popover-foreground: oklch(1.0000 0.0000 0.0000);
  --primary: oklch(0.7216 0.1120 204.7055);
  --primary-foreground: oklch(0.0000 0.0000 0.0000);
  --secondary: oklch(0.3697 0.0080 196.8121);
  --secondary-foreground: oklch(0.9836 0.0021 197.1231);
  --muted: oklch(0.3123 0.0069 196.8025);
  --muted-foreground: oklch(0.7138 0.0023 197.1059);
  --accent: oklch(0.3030 0.0352 216.5952);
  --accent-foreground: oklch(1.0000 0.0000 0.0000);
  --destructive: oklch(0.7297 0.1130 55.5280);
  --destructive-foreground: oklch(0.0000 0.0000 0.0000);
  --border: oklch(0.2972 0.0056 196.8536);
  --input: oklch(0.2457 0.0030 196.9624);
  --ring: oklch(0.6234 0.1065 205.4181);
  --sidebar: oklch(0.2457 0.0030 196.9624);
  --sidebar-foreground: oklch(1.0000 0.0000 0.0000);
  --sidebar-primary: oklch(0.7216 0.1120 204.7055);
  --sidebar-primary-foreground: oklch(0.0000 0.0000 0.0000);
  --sidebar-accent: oklch(0.1765 0.0016 197.0094);
  --sidebar-accent-foreground: oklch(1.0000 0.0000 0.0000);
  --sidebar-border: oklch(0.2624 0.0029 196.9776);
  --sidebar-ring: oklch(0.6234 0.1065 205.4181);
  --chart-1: oklch(0.6267 0.1054 204.7118);
  --chart-2: oklch(0.6074 0.0517 245.8473);
  --chart-3: oklch(0.7877 0.0910 204.4517);
  --chart-4: oklch(0.4214 0.0452 246.6475);
  --chart-5: oklch(0.4406 0.0756 207.3871);
  --radius: 0.75rem;
  --letter-spacing: 0em;
  --font-sans: Inter, ui-sans-serif, system-ui, sans-serif;
  --font-mono: JetBrains Mono, ui-monospace, SFMono-Regular, monospace;
  --font-serif: Georgia, Cambria, "Times New Roman", serif;
  --radius-sm: 0.563rem;
  --radius-md: 0.75rem;
  --radius-lg: 1.125rem;
  --radius-xl: 1.500rem;
  --shadow-x: 0px;
  --shadow-y: 0px;
  --shadow-blur: 15px;
  --shadow-spread: 0px;
  --shadow-opacity: 0.17;
  --shadow-color: oklch(0.0000 0.0000 0.0000);
  --tracking-normal: 0em;
  --spacing: 0.25rem;
  --shadow-2xs: 0px 0px 15px 0px oklch(0.0000 0.0000 0.0000 / 0.09);
  --shadow-xs: 0px 0px 15px 0px oklch(0.0000 0.0000 0.0000 / 0.09);
  --shadow-sm: 0px 0px 15px 0px oklch(0.0000 0.0000 0.0000 / 0.17), 0px 1px 2px -1px oklch(0.0000 0.0000 0.0000 / 0.17);
  --shadow: 0px 0px 15px 0px oklch(0.0000 0.0000 0.0000 / 0.17), 0px 1px 2px -1px oklch(0.0000 0.0000 0.0000 / 0.17);
  --shadow-md: 0px 0px 15px 0px oklch(0.0000 0.0000 0.0000 / 0.17), 0px 2px 4px -1px oklch(0.0000 0.0000 0.0000 / 0.17);
  --shadow-lg: 0px 0px 15px 0px oklch(0.0000 0.0000 0.0000 / 0.17), 0px 4px 6px -1px oklch(0.0000 0.0000 0.0000 / 0.17);
  --shadow-xl: 0px 0px 15px 0px oklch(0.0000 0.0000 0.0000 / 0.17), 0px 8px 10px -1px oklch(0.0000 0.0000 0.0000 / 0.17);
  --shadow-2xl: 0px 0px 15px 0px oklch(0.0000 0.0000 0.0000 / 0.43);
}

@theme inline {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --color-card: var(--card);
  --color-card-foreground: var(--card-foreground);
  --color-popover: var(--popover);
  --color-popover-foreground: var(--popover-foreground);
  --color-primary: var(--primary);
  --color-primary-foreground: var(--primary-foreground);
  --color-secondary: var(--secondary);
  --color-secondary-foreground: var(--secondary-foreground);
  --color-muted: var(--muted);
  --color-muted-foreground: var(--muted-foreground);
  --color-accent: var(--accent);
  --color-accent-foreground: var(--accent-foreground);
  --color-destructive: var(--destructive);
  --color-destructive-foreground: var(--destructive-foreground);
  --color-border: var(--border);
  --color-input: var(--input);
  --color-ring: var(--ring);
  --color-chart-1: var(--chart-1);
  --color-chart-2: var(--chart-2);
  --color-chart-3: var(--chart-3);
  --color-chart-4: var(--chart-4);
  --color-chart-5: var(--chart-5);
  --color-sidebar: var(--sidebar);
  --color-sidebar-foreground: var(--sidebar-foreground);
  --color-sidebar-primary: var(--sidebar-primary);
  --color-sidebar-primary-foreground: var(--sidebar-primary-foreground);
  --color-sidebar-accent: var(--sidebar-accent);
  --color-sidebar-accent-foreground: var(--sidebar-accent-foreground);
  --color-sidebar-border: var(--sidebar-border);
  --color-sidebar-ring: var(--sidebar-ring);

  --font-sans: var(--font-sans);
  --font-mono: var(--font-mono);
  --font-serif: var(--font-serif);

  --radius-sm: calc(var(--radius) - 4px);
  --radius-md: calc(var(--radius) - 2px);
  --radius-lg: var(--radius);
  --radius-xl: calc(var(--radius) + 4px);

  --shadow-2xs: var(--shadow-2xs);
  --shadow-xs: var(--shadow-xs);
  --shadow-sm: var(--shadow-sm);
  --shadow: var(--shadow);
  --shadow-md: var(--shadow-md);
  --shadow-lg: var(--shadow-lg);
  --shadow-xl: var(--shadow-xl);
  --shadow-2xl: var(--shadow-2xl);
}
```

## Theme 8: Cyberpunk

```json
:root {
  --background: oklch(1.0000 0 0);
  --foreground: oklch(0.1448 0 0);
  --card: oklch(1.0000 0 0);
  --card-foreground: oklch(0.1448 0 0);
  --popover: oklch(1.0000 0 0);
  --popover-foreground: oklch(0.1448 0 0);
  --primary: oklch(0.8535 0.1744 88.7734);
  --primary-foreground: oklch(0.9873 0.0262 102.2125);
  --secondary: oklch(0.7484 0.1551 233.2517);
  --secondary-foreground: oklch(0.9771 0.0125 236.6197);
  --muted: oklch(0.9702 0 0);
  --muted-foreground: oklch(0.5555 0 0);
  --accent: oklch(0.9702 0 0);
  --accent-foreground: oklch(0.2046 0 0);
  --destructive: oklch(0.5830 0.2387 28.4765);
  --destructive-foreground: oklch(1.0000 0 0);
  --border: oklch(0.9219 0 0);
  --input: oklch(0.9219 0 0);
  --ring: oklch(0.7090 0 0);
  --chart-1: oklch(0.8088 0.0991 251.7533);
  --chart-2: oklch(0.6207 0.1894 259.9358);
  --chart-3: oklch(0.5495 0.2202 263.0917);
  --chart-4: oklch(0.4893 0.2202 264.0405);
  --chart-5: oklch(0.4210 0.1792 266.0094);
  --sidebar: oklch(0.9851 0 0);
  --sidebar-foreground: oklch(0.1448 0 0);
  --sidebar-primary: oklch(0.2046 0 0);
  --sidebar-primary-foreground: oklch(0.9851 0 0);
  --sidebar-accent: oklch(0.9702 0 0);
  --sidebar-accent-foreground: oklch(0.2046 0 0);
  --sidebar-border: oklch(0.9219 0 0);
  --sidebar-ring: oklch(0.7090 0 0);
  --font-sans: Poppins, ui-sans-serif, sans-serif, system-ui;
  --font-serif: Playfair Display, ui-serif, serif;
  --font-mono: JetBrains Mono, ui-monospace, monospace;
  --radius: 0.625rem;
  --shadow-x: 3px;
  --shadow-y: 3px;
  --shadow-blur: 3px;
  --shadow-spread: 0px;
  --shadow-opacity: 0.1;
  --shadow-color: #000000;
  --shadow-2xs: 3px 3px 3px 0px hsl(0 0% 0% / 0.05);
  --shadow-xs: 3px 3px 3px 0px hsl(0 0% 0% / 0.05);
  --shadow-sm: 3px 3px 3px 0px hsl(0 0% 0% / 0.10), 3px 1px 2px -1px hsl(0 0% 0% / 0.10);
  --shadow: 3px 3px 3px 0px hsl(0 0% 0% / 0.10), 3px 1px 2px -1px hsl(0 0% 0% / 0.10);
  --shadow-md: 3px 3px 3px 0px hsl(0 0% 0% / 0.10), 3px 2px 4px -1px hsl(0 0% 0% / 0.10);
  --shadow-lg: 3px 3px 3px 0px hsl(0 0% 0% / 0.10), 3px 4px 6px -1px hsl(0 0% 0% / 0.10);
  --shadow-xl: 3px 3px 3px 0px hsl(0 0% 0% / 0.10), 3px 8px 10px -1px hsl(0 0% 0% / 0.10);
  --shadow-2xl: 3px 3px 3px 0px hsl(0 0% 0% / 0.25);
  --tracking-normal: 0em;
  --spacing: 0.25rem;
}

.dark {
  --background: oklch(0.1448 0 0);
  --foreground: oklch(0.9851 0 0);
  --card: oklch(0.2046 0 0);
  --card-foreground: oklch(0.9851 0 0);
  --popover: oklch(0.2686 0 0);
  --popover-foreground: oklch(0.9851 0 0);
  --primary: oklch(0.9032 0.1817 98.2711);
  --primary-foreground: oklch(0.2871 0.0662 54.5884);
  --secondary: oklch(0.8271 0.1090 229.1984);
  --secondary-foreground: oklch(0.2932 0.0658 242.9090);
  --muted: oklch(0.2686 0 0);
  --muted-foreground: oklch(0.7090 0 0);
  --accent: oklch(0.3715 0 0);
  --accent-foreground: oklch(0.9851 0 0);
  --destructive: oklch(0.7022 0.1892 22.2279);
  --destructive-foreground: oklch(0.9851 0 0);
  --border: oklch(0.2768 0 0);
  --input: oklch(0.3250 0 0);
  --ring: oklch(0.5555 0 0);
  --chart-1: oklch(0.8088 0.0991 251.7533);
  --chart-2: oklch(0.6207 0.1894 259.9358);
  --chart-3: oklch(0.5495 0.2202 263.0917);
  --chart-4: oklch(0.4893 0.2202 264.0405);
  --chart-5: oklch(0.4210 0.1792 266.0094);
  --sidebar: oklch(0.2046 0 0);
  --sidebar-foreground: oklch(0.9851 0 0);
  --sidebar-primary: oklch(0.4878 0.2432 264.4045);
  --sidebar-primary-foreground: oklch(0.9851 0 0);
  --sidebar-accent: oklch(0.2686 0 0);
  --sidebar-accent-foreground: oklch(0.9851 0 0);
  --sidebar-border: oklch(0.2768 0 0);
  --sidebar-ring: oklch(0.4386 0 0);
  --font-sans: Poppins, ui-sans-serif, sans-serif, system-ui;
  --font-serif: Playfair Display, ui-serif, serif;
  --font-mono: JetBrains Mono, ui-monospace, monospace;
  --radius: 0.625rem;
  --shadow-x: 3px;
  --shadow-y: 3px;
  --shadow-blur: 3px;
  --shadow-spread: 0px;
  --shadow-opacity: 0.1;
  --shadow-color: #000000;
  --shadow-2xs: 3px 3px 3px 0px hsl(0 0% 0% / 0.05);
  --shadow-xs: 3px 3px 3px 0px hsl(0 0% 0% / 0.05);
  --shadow-sm: 3px 3px 3px 0px hsl(0 0% 0% / 0.10), 3px 1px 2px -1px hsl(0 0% 0% / 0.10);
  --shadow: 3px 3px 3px 0px hsl(0 0% 0% / 0.10), 3px 1px 2px -1px hsl(0 0% 0% / 0.10);
  --shadow-md: 3px 3px 3px 0px hsl(0 0% 0% / 0.10), 3px 2px 4px -1px hsl(0 0% 0% / 0.10);
  --shadow-lg: 3px 3px 3px 0px hsl(0 0% 0% / 0.10), 3px 4px 6px -1px hsl(0 0% 0% / 0.10);
  --shadow-xl: 3px 3px 3px 0px hsl(0 0% 0% / 0.10), 3px 8px 10px -1px hsl(0 0% 0% / 0.10);
  --shadow-2xl: 3px 3px 3px 0px hsl(0 0% 0% / 0.25);
}

@theme inline {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --color-card: var(--card);
  --color-card-foreground: var(--card-foreground);
  --color-popover: var(--popover);
  --color-popover-foreground: var(--popover-foreground);
  --color-primary: var(--primary);
  --color-primary-foreground: var(--primary-foreground);
  --color-secondary: var(--secondary);
  --color-secondary-foreground: var(--secondary-foreground);
  --color-muted: var(--muted);
  --color-muted-foreground: var(--muted-foreground);
  --color-accent: var(--accent);
  --color-accent-foreground: var(--accent-foreground);
  --color-destructive: var(--destructive);
  --color-destructive-foreground: var(--destructive-foreground);
  --color-border: var(--border);
  --color-input: var(--input);
  --color-ring: var(--ring);
  --color-chart-1: var(--chart-1);
  --color-chart-2: var(--chart-2);
  --color-chart-3: var(--chart-3);
  --color-chart-4: var(--chart-4);
  --color-chart-5: var(--chart-5);
  --color-sidebar: var(--sidebar);
  --color-sidebar-foreground: var(--sidebar-foreground);
  --color-sidebar-primary: var(--sidebar-primary);
  --color-sidebar-primary-foreground: var(--sidebar-primary-foreground);
  --color-sidebar-accent: var(--sidebar-accent);
  --color-sidebar-accent-foreground: var(--sidebar-accent-foreground);
  --color-sidebar-border: var(--sidebar-border);
  --color-sidebar-ring: var(--sidebar-ring);

  --font-sans: var(--font-sans);
  --font-mono: var(--font-mono);
  --font-serif: var(--font-serif);

  --radius-sm: calc(var(--radius) - 4px);
  --radius-md: calc(var(--radius) - 2px);
  --radius-lg: var(--radius);
  --radius-xl: calc(var(--radius) + 4px);

  --shadow-2xs: var(--shadow-2xs);
  --shadow-xs: var(--shadow-xs);
  --shadow-sm: var(--shadow-sm);
  --shadow: var(--shadow);
  --shadow-md: var(--shadow-md);
  --shadow-lg: var(--shadow-lg);
  --shadow-xl: var(--shadow-xl);
  --shadow-2xl: var(--shadow-2xl);
}
```
