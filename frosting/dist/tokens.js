/* frosting tokens v1.3.0 — generated from tokens.json; do not edit. Plain script: window.FrostingTokens, or require()-able. */
(function (root) {
  var api = {
  "version": "1.3.0",
  "prefix": "fr",
  "groups": {
    "core": "Always present. Every frosted page uses these.",
    "status": "Optional. Dashboards and monitors: dots, meters, badges.",
    "series": "Optional. Chart lines and bars, in order of use.",
    "tag": "Optional. Telling projects or categories apart: a strip, an underline, a dot. Shapes, not text."
  },
  "roles": [
    {
      "name": "bg",
      "group": "core",
      "label": "Background",
      "use": "The page or window background.",
      "light": "#FFFFFF",
      "dark": "#0F1115"
    },
    {
      "name": "surface",
      "group": "core",
      "label": "Surface",
      "use": "Cards, panels, soft surfaces that sit on the background.",
      "light": "#F5F3EF",
      "dark": "#171A21"
    },
    {
      "name": "border",
      "group": "core",
      "label": "Border",
      "use": "Lines, dividers, card edges.",
      "light": "#E3DED6",
      "dark": "#262B36"
    },
    {
      "name": "text",
      "group": "core",
      "label": "Text",
      "use": "Main reading text.",
      "light": "#1C1B19",
      "dark": "#E6E8EE"
    },
    {
      "name": "muted",
      "group": "core",
      "label": "Quiet text",
      "use": "Secondary text, labels, captions. Still has to be readable.",
      "light": "#5E5A53",
      "dark": "#8A92A6"
    },
    {
      "name": "accent",
      "group": "core",
      "label": "Accent",
      "use": "Shapes, icons, highlights, the logo. Not for body text.",
      "light": "#2E7D4F",
      "dark": "#9D7BFF"
    },
    {
      "name": "accent-text",
      "group": "core",
      "label": "Accent text",
      "use": "Accent-coloured text and links. A readable cousin of accent.",
      "light": "#22603C",
      "dark": "#B9A3FF"
    },
    {
      "name": "button",
      "group": "core",
      "label": "Button",
      "use": "Primary action fill.",
      "light": "#2E7D4F",
      "dark": "#9D7BFF"
    },
    {
      "name": "button-text",
      "group": "core",
      "label": "Button text",
      "use": "Text on the primary button.",
      "light": "#FFFFFF",
      "dark": "#0F1115"
    },
    {
      "name": "progress-fill",
      "group": "core",
      "label": "Progress fill",
      "use": "The filled part of meters and progress bars.",
      "light": "#2E7D4F",
      "dark": "#9D7BFF"
    },
    {
      "name": "progress-track",
      "group": "core",
      "label": "Progress track",
      "use": "The empty part of meters and progress bars.",
      "light": "#E7E3DC",
      "dark": "#262B36"
    },
    {
      "name": "ok",
      "group": "status",
      "label": "OK",
      "use": "Healthy, up, done. Dots, meters, badge fills.",
      "light": "#2E7D4F",
      "dark": "#3DDC84"
    },
    {
      "name": "warn",
      "group": "status",
      "label": "Warning",
      "use": "Needs attention soon.",
      "light": "#B45309",
      "dark": "#FFCC4D"
    },
    {
      "name": "bad",
      "group": "status",
      "label": "Bad",
      "use": "Down, failed, over the line.",
      "light": "#C8402F",
      "dark": "#FF5C6C"
    },
    {
      "name": "series-1",
      "group": "series",
      "label": "Series 1",
      "use": "First chart line or bar.",
      "light": "#1F5F8B",
      "dark": "#4FB3FF"
    },
    {
      "name": "series-2",
      "group": "series",
      "label": "Series 2",
      "use": "Second chart line or bar.",
      "light": "#D9622B",
      "dark": "#FFB454"
    },
    {
      "name": "series-3",
      "group": "series",
      "label": "Series 3",
      "use": "Third chart line or bar.",
      "light": "#6B2D5C",
      "dark": "#C084FC"
    },
    {
      "name": "series-4",
      "group": "series",
      "label": "Series 4",
      "use": "Fourth chart line or bar.",
      "light": "#5C6B3A",
      "dark": "#5FE0A8"
    },
    {
      "name": "tag-1",
      "group": "tag",
      "label": "Tag 1",
      "use": "Project or category tag 1 (blue). Strips, underlines, dots.",
      "light": "#1D4ED8",
      "dark": "#60A5FA"
    },
    {
      "name": "tag-2",
      "group": "tag",
      "label": "Tag 2",
      "use": "Project or category tag 2 (orange). Strips, underlines, dots.",
      "light": "#C2410C",
      "dark": "#FB923C"
    },
    {
      "name": "tag-3",
      "group": "tag",
      "label": "Tag 3",
      "use": "Project or category tag 3 (violet). Strips, underlines, dots.",
      "light": "#7C3AED",
      "dark": "#A78BFA"
    },
    {
      "name": "tag-4",
      "group": "tag",
      "label": "Tag 4",
      "use": "Project or category tag 4 (green). Strips, underlines, dots.",
      "light": "#047857",
      "dark": "#34D399"
    },
    {
      "name": "tag-5",
      "group": "tag",
      "label": "Tag 5",
      "use": "Project or category tag 5 (magenta). Strips, underlines, dots.",
      "light": "#A21CAF",
      "dark": "#E879F9"
    },
    {
      "name": "tag-6",
      "group": "tag",
      "label": "Tag 6",
      "use": "Project or category tag 6 (cyan). Strips, underlines, dots.",
      "light": "#0E7490",
      "dark": "#22D3EE"
    },
    {
      "name": "tag-7",
      "group": "tag",
      "label": "Tag 7",
      "use": "Project or category tag 7 (amber). Strips, underlines, dots.",
      "light": "#A16207",
      "dark": "#FACC15"
    },
    {
      "name": "tag-8",
      "group": "tag",
      "label": "Tag 8",
      "use": "Project or category tag 8 (lime). Strips, underlines, dots.",
      "light": "#4D7C0F",
      "dark": "#A3E635"
    },
    {
      "name": "text-secondary",
      "group": "core",
      "label": "Secondary text",
      "use": "Text between main and quiet text: descriptions, sub-headings. Calculated from text and muted unless a look sets it.",
      "light": "#3D3B36",
      "dark": "#B8BDCA",
      "calc": {
        "from": "text",
        "to": "muted",
        "weight": 50,
        "rules": [
          [
            "bg",
            7
          ],
          [
            "surface",
            7
          ]
        ]
      }
    },
    {
      "name": "accent-text-hover",
      "group": "core",
      "label": "Accent text hover",
      "use": "Accent-coloured text and links while hovered. Calculated from accent-text unless a look sets it.",
      "light": "#214F33",
      "dark": "#C4B4FB",
      "calc": {
        "from": "accent-text",
        "to": "text",
        "weight": 25,
        "rules": [
          [
            "bg",
            4.5
          ],
          [
            "surface",
            4.5
          ]
        ]
      }
    },
    {
      "name": "button-hover",
      "group": "core",
      "label": "Button hover",
      "use": "Primary button fill while hovered. Calculated from button unless a look sets it.",
      "light": "#2C7149",
      "dark": "#A688FD",
      "calc": {
        "from": "button",
        "to": "text",
        "weight": 12,
        "rules": [
          [
            "bg",
            3
          ],
          [
            "button-text",
            4.5
          ]
        ],
        "alt": "bg",
        "minWeight": 4
      }
    },
    {
      "name": "border-strong",
      "group": "core",
      "label": "Strong border",
      "use": "An emphasised divider or outline that reads as a boundary, such as an input edge. Calculated unless a look sets it.",
      "light": "#8D8881",
      "dark": "#676E7F",
      "calc": {
        "from": "border",
        "to": "muted",
        "weight": 65,
        "rules": [
          [
            "bg",
            3
          ],
          [
            "surface",
            3
          ]
        ]
      }
    },
    {
      "name": "ok-soft",
      "group": "status",
      "label": "OK tint",
      "use": "Tinted ground for an OK message or badge. Main text stays readable on it.",
      "light": "#E6EFEA",
      "dark": "#152922",
      "calc": {
        "from": "bg",
        "to": "ok",
        "weight": 12,
        "rules": [
          [
            "text",
            7
          ]
        ]
      }
    },
    {
      "name": "ok-text",
      "group": "status",
      "label": "OK text",
      "use": "Text in the OK hue, readable on the OK tint and on the background.",
      "light": "#254C34",
      "dark": "#92E2B9",
      "calc": {
        "from": "ok",
        "to": "text",
        "weight": 50,
        "rules": [
          [
            "bg",
            4.5
          ],
          [
            "surface",
            4.5
          ],
          [
            "ok-soft",
            4.5
          ]
        ]
      }
    },
    {
      "name": "ok-border",
      "group": "status",
      "label": "OK border",
      "use": "Edge of an OK message or badge.",
      "light": "#589772",
      "dark": "#34B36E",
      "calc": {
        "from": "bg",
        "to": "ok",
        "weight": 80,
        "rules": [
          [
            "bg",
            3
          ]
        ]
      }
    },
    {
      "name": "warn-soft",
      "group": "status",
      "label": "Warning tint",
      "use": "Tinted ground for a warning message or badge. Main text stays readable on it.",
      "light": "#F6EAE1",
      "dark": "#2C271C",
      "calc": {
        "from": "bg",
        "to": "warn",
        "weight": 12,
        "rules": [
          [
            "text",
            7
          ]
        ]
      }
    },
    {
      "name": "warn-text",
      "group": "status",
      "label": "Warning text",
      "use": "Text in the warning hue, readable on the warning tint and on the background.",
      "light": "#683711",
      "dark": "#F3DA9E",
      "calc": {
        "from": "warn",
        "to": "text",
        "weight": 50,
        "rules": [
          [
            "bg",
            4.5
          ],
          [
            "surface",
            4.5
          ],
          [
            "warn-soft",
            4.5
          ]
        ]
      }
    },
    {
      "name": "warn-border",
      "group": "status",
      "label": "Warning border",
      "use": "Edge of a warning message or badge.",
      "light": "#C3753A",
      "dark": "#CFA742",
      "calc": {
        "from": "bg",
        "to": "warn",
        "weight": 80,
        "rules": [
          [
            "bg",
            3
          ]
        ]
      }
    },
    {
      "name": "bad-soft",
      "group": "status",
      "label": "Bad tint",
      "use": "Tinted ground for an error message or badge. Main text stays readable on it.",
      "light": "#F8E8E6",
      "dark": "#2C1A1F",
      "calc": {
        "from": "bg",
        "to": "bad",
        "weight": 12,
        "rules": [
          [
            "text",
            7
          ]
        ]
      }
    },
    {
      "name": "bad-text",
      "group": "status",
      "label": "Bad text",
      "use": "Text in the bad hue (error headings and bodies), readable on the bad tint and on the background.",
      "light": "#722E24",
      "dark": "#F3A2AD",
      "calc": {
        "from": "bad",
        "to": "text",
        "weight": 50,
        "rules": [
          [
            "bg",
            4.5
          ],
          [
            "surface",
            4.5
          ],
          [
            "bad-soft",
            4.5
          ]
        ]
      }
    },
    {
      "name": "bad-border",
      "group": "status",
      "label": "Bad border",
      "use": "Edge of an error message or badge.",
      "light": "#D36659",
      "dark": "#CF4D5B",
      "calc": {
        "from": "bg",
        "to": "bad",
        "weight": 80,
        "rules": [
          [
            "bg",
            3
          ]
        ]
      }
    }
  ],
  "contracts": [
    {
      "label": "Text on background",
      "role": "text",
      "against": "bg",
      "min": 7
    },
    {
      "label": "Text on surfaces",
      "role": "text",
      "against": "surface",
      "min": 7
    },
    {
      "label": "Quiet text",
      "role": "muted",
      "against": "bg",
      "min": 4.5
    },
    {
      "label": "Quiet text on surfaces",
      "role": "muted",
      "against": "surface",
      "min": 4.5
    },
    {
      "label": "Accent text",
      "role": "accent-text",
      "against": "bg",
      "min": 4.5
    },
    {
      "label": "Accent text on surfaces",
      "role": "accent-text",
      "against": "surface",
      "min": 4.5
    },
    {
      "label": "Accent shapes",
      "role": "accent",
      "against": "bg",
      "min": 3
    },
    {
      "label": "Button shape",
      "role": "button",
      "against": "bg",
      "min": 3
    },
    {
      "label": "Button text",
      "role": "button-text",
      "against": "button",
      "min": 4.5
    },
    {
      "label": "Progress bar",
      "role": "progress-fill",
      "against": "progress-track",
      "min": 3
    },
    {
      "label": "Progress on background",
      "role": "progress-fill",
      "against": "bg",
      "min": 3
    },
    {
      "label": "OK dot",
      "role": "ok",
      "against": "bg",
      "min": 3
    },
    {
      "label": "OK dot on surfaces",
      "role": "ok",
      "against": "surface",
      "min": 3
    },
    {
      "label": "Warning dot",
      "role": "warn",
      "against": "bg",
      "min": 3
    },
    {
      "label": "Warning dot on surfaces",
      "role": "warn",
      "against": "surface",
      "min": 3
    },
    {
      "label": "Bad dot",
      "role": "bad",
      "against": "bg",
      "min": 3
    },
    {
      "label": "Bad dot on surfaces",
      "role": "bad",
      "against": "surface",
      "min": 3
    },
    {
      "label": "Series 1",
      "role": "series-1",
      "against": "bg",
      "min": 3
    },
    {
      "label": "Series 2",
      "role": "series-2",
      "against": "bg",
      "min": 3
    },
    {
      "label": "Series 3",
      "role": "series-3",
      "against": "bg",
      "min": 3
    },
    {
      "label": "Series 4",
      "role": "series-4",
      "against": "bg",
      "min": 3
    },
    {
      "label": "Tag 1",
      "role": "tag-1",
      "against": "bg",
      "min": 3
    },
    {
      "label": "Tag 1 on surfaces",
      "role": "tag-1",
      "against": "surface",
      "min": 3
    },
    {
      "label": "Tag 2",
      "role": "tag-2",
      "against": "bg",
      "min": 3
    },
    {
      "label": "Tag 2 on surfaces",
      "role": "tag-2",
      "against": "surface",
      "min": 3
    },
    {
      "label": "Tag 3",
      "role": "tag-3",
      "against": "bg",
      "min": 3
    },
    {
      "label": "Tag 3 on surfaces",
      "role": "tag-3",
      "against": "surface",
      "min": 3
    },
    {
      "label": "Tag 4",
      "role": "tag-4",
      "against": "bg",
      "min": 3
    },
    {
      "label": "Tag 4 on surfaces",
      "role": "tag-4",
      "against": "surface",
      "min": 3
    },
    {
      "label": "Tag 5",
      "role": "tag-5",
      "against": "bg",
      "min": 3
    },
    {
      "label": "Tag 5 on surfaces",
      "role": "tag-5",
      "against": "surface",
      "min": 3
    },
    {
      "label": "Tag 6",
      "role": "tag-6",
      "against": "bg",
      "min": 3
    },
    {
      "label": "Tag 6 on surfaces",
      "role": "tag-6",
      "against": "surface",
      "min": 3
    },
    {
      "label": "Tag 7",
      "role": "tag-7",
      "against": "bg",
      "min": 3
    },
    {
      "label": "Tag 7 on surfaces",
      "role": "tag-7",
      "against": "surface",
      "min": 3
    },
    {
      "label": "Tag 8",
      "role": "tag-8",
      "against": "bg",
      "min": 3
    },
    {
      "label": "Tag 8 on surfaces",
      "role": "tag-8",
      "against": "surface",
      "min": 3
    },
    {
      "label": "Secondary text",
      "role": "text-secondary",
      "against": "bg",
      "min": 7
    },
    {
      "label": "Secondary text on surfaces",
      "role": "text-secondary",
      "against": "surface",
      "min": 7
    },
    {
      "label": "Accent text hover",
      "role": "accent-text-hover",
      "against": "bg",
      "min": 4.5
    },
    {
      "label": "Accent text hover on surfaces",
      "role": "accent-text-hover",
      "against": "surface",
      "min": 4.5
    },
    {
      "label": "Button hover shape",
      "role": "button-hover",
      "against": "bg",
      "min": 3
    },
    {
      "label": "Button hover text",
      "role": "button-text",
      "against": "button-hover",
      "min": 4.5
    },
    {
      "label": "Strong border",
      "role": "border-strong",
      "against": "bg",
      "min": 3
    },
    {
      "label": "Strong border on surfaces",
      "role": "border-strong",
      "against": "surface",
      "min": 3
    },
    {
      "label": "OK text",
      "role": "ok-text",
      "against": "bg",
      "min": 4.5
    },
    {
      "label": "OK text on surfaces",
      "role": "ok-text",
      "against": "surface",
      "min": 4.5
    },
    {
      "label": "OK text on tint",
      "role": "ok-text",
      "against": "ok-soft",
      "min": 4.5
    },
    {
      "label": "Text on OK tint",
      "role": "ok-soft",
      "against": "text",
      "min": 7
    },
    {
      "label": "OK border",
      "role": "ok-border",
      "against": "bg",
      "min": 3
    },
    {
      "label": "Warning text",
      "role": "warn-text",
      "against": "bg",
      "min": 4.5
    },
    {
      "label": "Warning text on surfaces",
      "role": "warn-text",
      "against": "surface",
      "min": 4.5
    },
    {
      "label": "Warning text on tint",
      "role": "warn-text",
      "against": "warn-soft",
      "min": 4.5
    },
    {
      "label": "Text on warning tint",
      "role": "warn-soft",
      "against": "text",
      "min": 7
    },
    {
      "label": "Warning border",
      "role": "warn-border",
      "against": "bg",
      "min": 3
    },
    {
      "label": "Bad text",
      "role": "bad-text",
      "against": "bg",
      "min": 4.5
    },
    {
      "label": "Bad text on surfaces",
      "role": "bad-text",
      "against": "surface",
      "min": 4.5
    },
    {
      "label": "Bad text on tint",
      "role": "bad-text",
      "against": "bad-soft",
      "min": 4.5
    },
    {
      "label": "Text on bad tint",
      "role": "bad-soft",
      "against": "text",
      "min": 7
    },
    {
      "label": "Bad border",
      "role": "bad-border",
      "against": "bg",
      "min": 3
    }
  ],
  "channels": {
    "accent-h": {
      "from": "accent",
      "channel": "h",
      "unit": "",
      "light": "145.1",
      "dark": "255.5"
    },
    "accent-s": {
      "from": "accent",
      "channel": "s",
      "unit": "%",
      "light": "46.2",
      "dark": "100"
    },
    "accent-l": {
      "from": "accent",
      "channel": "l",
      "unit": "%",
      "light": "33.5",
      "dark": "74.1"
    }
  },
  "light": {
    "bg": "#FFFFFF",
    "surface": "#F5F3EF",
    "border": "#E3DED6",
    "text": "#1C1B19",
    "muted": "#5E5A53",
    "accent": "#2E7D4F",
    "accent-text": "#22603C",
    "button": "#2E7D4F",
    "button-text": "#FFFFFF",
    "progress-fill": "#2E7D4F",
    "progress-track": "#E7E3DC",
    "ok": "#2E7D4F",
    "warn": "#B45309",
    "bad": "#C8402F",
    "series-1": "#1F5F8B",
    "series-2": "#D9622B",
    "series-3": "#6B2D5C",
    "series-4": "#5C6B3A",
    "tag-1": "#1D4ED8",
    "tag-2": "#C2410C",
    "tag-3": "#7C3AED",
    "tag-4": "#047857",
    "tag-5": "#A21CAF",
    "tag-6": "#0E7490",
    "tag-7": "#A16207",
    "tag-8": "#4D7C0F",
    "text-secondary": "#3D3B36",
    "accent-text-hover": "#214F33",
    "button-hover": "#2C7149",
    "border-strong": "#8D8881",
    "ok-soft": "#E6EFEA",
    "ok-text": "#254C34",
    "ok-border": "#589772",
    "warn-soft": "#F6EAE1",
    "warn-text": "#683711",
    "warn-border": "#C3753A",
    "bad-soft": "#F8E8E6",
    "bad-text": "#722E24",
    "bad-border": "#D36659"
  },
  "dark": {
    "bg": "#0F1115",
    "surface": "#171A21",
    "border": "#262B36",
    "text": "#E6E8EE",
    "muted": "#8A92A6",
    "accent": "#9D7BFF",
    "accent-text": "#B9A3FF",
    "button": "#9D7BFF",
    "button-text": "#0F1115",
    "progress-fill": "#9D7BFF",
    "progress-track": "#262B36",
    "ok": "#3DDC84",
    "warn": "#FFCC4D",
    "bad": "#FF5C6C",
    "series-1": "#4FB3FF",
    "series-2": "#FFB454",
    "series-3": "#C084FC",
    "series-4": "#5FE0A8",
    "tag-1": "#60A5FA",
    "tag-2": "#FB923C",
    "tag-3": "#A78BFA",
    "tag-4": "#34D399",
    "tag-5": "#E879F9",
    "tag-6": "#22D3EE",
    "tag-7": "#FACC15",
    "tag-8": "#A3E635",
    "text-secondary": "#B8BDCA",
    "accent-text-hover": "#C4B4FB",
    "button-hover": "#A688FD",
    "border-strong": "#676E7F",
    "ok-soft": "#152922",
    "ok-text": "#92E2B9",
    "ok-border": "#34B36E",
    "warn-soft": "#2C271C",
    "warn-text": "#F3DA9E",
    "warn-border": "#CFA742",
    "bad-soft": "#2C1A1F",
    "bad-text": "#F3A2AD",
    "bad-border": "#CF4D5B"
  }
};
  root.FrostingTokens = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
