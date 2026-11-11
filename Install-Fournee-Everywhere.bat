<# : batch launcher (this top part runs in cmd, the rest is PowerShell)
@echo off
set "FOURNEE_BAT_DIR=%~dp0"
powershell -NoProfile -ExecutionPolicy Bypass -STA -Command "iex ([IO.File]::ReadAllText('%~f0'))"
if errorlevel 1 if not "%FOURNEE_UNATTENDED%"=="1" pause
exit /b
#>

# ---------------------------------------------------------------------------
# Fournee -> Claude, everywhere
#  1. Installs the "fournee" skill for Claude Code (colour + type; applies to every project)
#     and archives an old "frosting" skill, if there is one, to ~\.claude\_archive\claude-skill-frosting
#  2. Writes the "Design system: Fournee" rule into your global CLAUDE.md (backup made first),
#     replacing the old Frosting rule if it is there
#  3. Builds fournee-skill.zip on your Desktop to upload to claude.ai
# Safe to re-run any time Fournee changes: it refreshes everything.
# Keep this file plain ASCII: Windows PowerShell 5.1 runs it.
# ---------------------------------------------------------------------------

$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Windows.Forms
Add-Type -AssemblyName System.IO.Compression
Add-Type -AssemblyName System.IO.Compression.FileSystem

$Title = 'Fournee setup'
$Utf8 = New-Object System.Text.UTF8Encoding $false
# FOURNEE_UNATTENDED=1 answers Yes to every step and prints instead of showing dialogs (for scripted installs).
$Unattended = $env:FOURNEE_UNATTENDED -eq '1'
function Ask($msg) { if ($Unattended) { return $true }; [System.Windows.Forms.MessageBox]::Show($msg, $Title, 'YesNo', 'Question') -eq 'Yes' }
function Say($msg) { if ($Unattended) { Write-Output $msg; return }; [void][System.Windows.Forms.MessageBox]::Show($msg, $Title, 'OK', 'Information') }
function ReadUtf8($path) { [IO.File]::ReadAllText($path, $Utf8) }
function WriteUtf8($path, $text) { [IO.File]::WriteAllText($path, $text, $Utf8) }
function Names($text, $pattern) { @([regex]::Matches($text, $pattern, 'Multiline') | ForEach-Object { $_.Groups[1].Value } | Select-Object -Unique) }
function Ticks($names) { ($names | ForEach-Object { [char]96 + $_ + [char]96 }) -join ' ' }

try {
    # ---- Find the repo -----------------------------------------------------
    # This file sits at the root of the Fournee repo, so the repo is wherever it was cloned. FOURNEE_HOME overrides.
    $repo = if ($env:FOURNEE_HOME) { $env:FOURNEE_HOME } else { $env:FOURNEE_BAT_DIR }
    if (-not (Test-Path -LiteralPath (Join-Path $repo 'frosting\tokens.json'))) {
        if ($Unattended) { throw "Could not find the repo at $repo (set FOURNEE_HOME)" }
        $dlg = New-Object System.Windows.Forms.FolderBrowserDialog
        $dlg.Description = "Could not find Fournee at $repo. Pick your Fournee repo folder (the one with frosting, fontdant and kitchen in it)."
        if ($dlg.ShowDialog() -ne 'OK') { exit 0 }
        $repo = $dlg.SelectedPath
    }
    $repo = (Resolve-Path -LiteralPath $repo).Path.TrimEnd('\')

    # ---- The files the skill bundles ---------------------------------------
    $tokenSrc = [ordered]@{
        'frosting__dist__frosting.css' = 'frosting\dist\frosting.css'
        'fontdant__dist__fontdant.css' = 'fontdant\dist\fontdant.css'
    }
    $refSrc = [ordered]@{
        'README.md'          = 'README.md'
        'frosting-README.md' = 'frosting\README.md'
        'fontdant-README.md' = 'fontdant\README.md'
        'kitchen-README.md'  = 'kitchen\README.md'
    }
    $missing = @()
    foreach ($rel in @($tokenSrc.Values) + @($refSrc.Values)) {
        if (-not (Test-Path -LiteralPath (Join-Path $repo $rel))) { $missing += $rel }
    }
    if ($missing.Count) {
        throw ("These Fournee files are missing:`n  " + ($missing -join "`n  ") + "`n`nBuild Fournee first (npm test in $repo), then run this again.")
    }

    $commit = 'unknown'
    try {
        $c = & git -C $repo rev-parse --short HEAD 2>$null
        if ($LASTEXITCODE -eq 0 -and $c) { $commit = "$c".Trim() }
    } catch { }

    # Colour roles: the first :root block of frosting.css (the roles and the derived roles; not the gradient fills).
    # It ends at the first line that is just "}" (a comment inside it mentions "{p}").
    $frCss = ReadUtf8 (Join-Path $repo 'frosting\dist\frosting.css')
    $rootEnd = ([regex]::Match($frCss, '(?m)^\}')).Index
    $frRoot = if ($rootEnd -gt 0) { $frCss.Substring(0, $rootEnd) } else { $frCss }
    $frNames = Names $frRoot '(--fr-[A-Za-z0-9-]+)\s*:'
    # Type: the role classes, steps, faces and weights of fontdant.css.
    $fdCss = ReadUtf8 (Join-Path $repo 'fontdant\dist\fontdant.css')
    $fdClasses = Names $fdCss '^(\.fd-[A-Za-z0-9-]+)\b'
    $fdSteps = Names $fdCss '(--fd-step-[A-Za-z0-9-]+)\s*:'
    $fdFaces = Names $fdCss '(--fd-face-[A-Za-z0-9-]+)\s*:'
    $fdWeights = Names $fdCss '(--fd-weight-[A-Za-z0-9-]+)\s*:'
    if ($frNames.Count -lt 10 -or $fdClasses.Count -lt 5) { throw "Could not read the token names from Fournee's dist files. Rebuild Fournee (npm test) and try again." }

    $claudeDir = Join-Path $env:USERPROFILE '.claude'
    $skillDir  = Join-Path $claudeDir 'skills\fournee'
    $legacyDir = Join-Path $claudeDir 'skills\mise'
    $legacyArchive = Join-Path $claudeDir '_archive\claude-skill-mise'
    $oldSkill  = Join-Path $claudeDir 'skills\frosting'
    $archive   = Join-Path $claudeDir '_archive\claude-skill-frosting'

    # ---- Step 1: skill -------------------------------------------------------
    $msg1 = "Repo: $repo  (commit $commit)`n`nFound $($frNames.Count) colour roles and $($fdClasses.Count) type classes.`n`n" +
            "STEP 1 of 3`nInstall the Fournee skill for Claude Code, so every project uses it?`n`nWrites to: $skillDir" +
            $(if (Test-Path -LiteralPath $skillDir) { "`n(An existing copy will be refreshed.)" } else { '' }) +
            $(if (Test-Path -LiteralPath $oldSkill) { "`n`nThe old Frosting skill will be moved to:`n$archive" } else { '' })
    $didSkill = $false
    $archivedTo = ''
    if (Ask $msg1) {
        if (Test-Path -LiteralPath $skillDir) { Remove-Item -LiteralPath $skillDir -Recurse -Force }
        New-Item -ItemType Directory -Force -Path (Join-Path $skillDir 'tokens') | Out-Null
        New-Item -ItemType Directory -Force -Path (Join-Path $skillDir 'reference') | Out-Null
        foreach ($k in $tokenSrc.Keys) { Copy-Item -LiteralPath (Join-Path $repo $tokenSrc[$k]) -Destination (Join-Path $skillDir "tokens\$k") }
        foreach ($k in $refSrc.Keys) { Copy-Item -LiteralPath (Join-Path $repo $refSrc[$k]) -Destination (Join-Path $skillDir "reference\$k") }

        $frList = ($frNames | ForEach-Object { '- ' + [char]96 + $_ + [char]96 }) -join "`n"

        $skillTemplate = @'
---
name: fournee
description: The Fournee design system (Frosting colour + Fontdant type). Use for ANY UI, front-end, styling, theming, CSS, Tailwind, design, mockup, web page, app or component work in any project, and for anything about fonts, typography, font sizes, type scales or line height, or when Fournee, Frosting or Fontdant is mentioned, so colours come from Frosting role tokens and type from Fontdant roles instead of hard-coded values.
---

# Fournee: colour (Frosting) and type (Fontdant)

A page never names a colour or a font; it names the **role**. A project's saved **recipe** supplies the values for every role. Nothing picks its own colours, fonts or sizes.

Fournee has four parts: `frosting/` (colour roles, `--fr-*`), `fontdant/` (type roles, `--fd-*` and `.fd-*` classes), `kitchen/` (recipe, store, the pass checks, standards, Sprinkles, the panel shell and the four-step panel), `delivery/` (wrappers for HTML, React, Svelte, Electron, pywebview, Qt, tkinter; DTCG export).

Code-level names keep their original `mise` prefix for compatibility: `MiseApply`, `MiseProvider`, `.mise-*` classes, `data-mise-*`, `mise.js` / `mise.css`, the generated `mise-type.css` / `mise-color.css` and the `mise/` output folder. Use them as they are.

## Colour rules (Frosting)
1. Never hard-code a colour in UI code: no hex, rgb(), hsl(), oklch(), named colours, or framework palette colours (for example Tailwind bg-blue-500). Use Frosting role tokens, for example `var(--fr-surface)`. In Tailwind, map theme colours to the `--fr-*` variables.
2. Choose tokens by role (what the element is: surface, text, accent, border, state, series), not by how the colour looks.
3. If no existing role fits, stop and propose a new role name to the user instead of inventing a one-off colour.
4. Light/dark and theme switching come from Frosting (`data-theme`, the recipe). Do not build a separate palette.
5. Status (`ok` `warn` `bad`) and series roles are shape colours (dots, bars, lines), not text colours.
6. Gradients: paint `background-color: var(--fr-<role>); background-image: var(--fr-<role>-fill, none)`.
7. In existing code, flag hard-coded colours and suggest the matching role.

## Type rules (Fontdant)
1. No literal font sizes, font-family stacks, weights or line heights in UI code. Use a role class (`.fd-body`, `.fd-heading-md`, `.fd-ui--button`) or its variables (`var(--fd-body-size)`, `var(--fd-ui-family)`...). Faces come from `--fd-face-display / -text / -mono`, sizes from the `--fd-step-*` ladder via the roles.
2. Nothing under 12px. Floors by mode: body 16px in `reading` (default), 14px in `dense` (`data-fd-mode="dense"`); ui 14px reading, 12px dense.
3. Fonts are self-hosted from Fournee's font library (`fontdant/fonts/`, copied in by the project's build). No Google Fonts links or other font CDNs.
4. No `font:` shorthand; the role classes set `font-synthesis: none`. Use `data-fd-scope="embedded"` for headings inside cards and messages.
5. If no role fits, propose an extension role in the project's recipe; do not invent a one-off size.

## How a project consumes Fournee
- The project keeps a **recipe** (for example `type/recipe.json`: name, scheme, `frosting.colors`, `fontdant` faces/mode/dials/roles/fonts) and a build script (for example `type/build-type.mjs`) that runs `fournee/delivery/scripts/project.mjs` and copies the built Fournee files (`frosting/dist/frosting.css`, `fontdant/dist/fontdant.css`, the recipe CSS, fonts, panel scripts) into the project, which commits them so it builds without Fournee.
- Record the Fournee commit the copy came from (in the project's NOW/HANDOFF notes or the build output) so it is pinned.
- Never edit the vendored copies. Change Fournee, rebuild Fournee (`npm test` in the repo), then re-run the project's build script.
- A new project: bring Fournee in first, before writing any styles.

## The panel (projects that offer theming)
Use kitchen's four-step panel (`kitchen/src/steps.js`, `KitchenSteps.mount`): **1 Frosting** (colour) - **2 Fontdant** (type) - **3 Spec** (the standard the look is held to; House spec by default, Sprinkles here) - **4 Expo** (colour and type checked together, with links back to fixes), and **one Publish** for all of it. Do not build a separate colour or font picker. Where a look can't be published to a project (a playground such as the catalog's four-step page), pass `handoff: true`: Expo then offers **Take it with you** (a plain summary, Download recipe.json, Copy instructions for Claude, Load a recipe). A recipe.json from there becomes a project's `type/recipe.json`; then run its `type/build-type.mjs`.

## Source of truth
- Local repo: {{REPO}} (GitHub fournee/fournee). Prefer it over this snapshot when reachable.
- Catalog: catalog/site/index.html in the repo (build it with node catalog/build.mjs)
- Snapshot bundled here on {{DATE}} from Fournee commit {{COMMIT}}: `tokens/frosting__dist__frosting.css`, `tokens/fontdant__dist__fontdant.css`; READMEs in `reference/` (Fournee, frosting, fontdant, kitchen). Read the relevant README before your first Fournee work in a session.
- Edit roles only in `frosting/tokens.json` and `fontdant/type-tokens.json`; `dist/` is generated.

## Colour tokens (snapshot)
{{FR_TOKENS}}

## Type tokens (snapshot)
- Classes: {{FD_CLASSES}}
- Each role has variables `--fd-<role>-family / -size / -weight / -leading / -tracking / -numeric / -transform / -style` (for example `--fd-heading-lg-size`).
- Steps: {{FD_STEPS}}
- Faces: {{FD_FACES}}
- Weights: {{FD_WEIGHTS}}
'@
        $skillMd = $skillTemplate.Replace('{{REPO}}', $repo).
            Replace('{{DATE}}', (Get-Date -Format 'yyyy-MM-dd')).
            Replace('{{COMMIT}}', $commit).
            Replace('{{FR_TOKENS}}', $frList).
            Replace('{{FD_CLASSES}}', (Ticks $fdClasses)).
            Replace('{{FD_STEPS}}', (Ticks $fdSteps)).
            Replace('{{FD_FACES}}', (Ticks $fdFaces)).
            Replace('{{FD_WEIGHTS}}', (Ticks $fdWeights))
        WriteUtf8 (Join-Path $skillDir 'SKILL.md') ($skillMd.Replace("`r`n", "`n"))
        $didSkill = $true

        # The skill used to be called "mise". Keep that name as a pointer so older project notes still work.
        $aliasMd = Join-Path $legacyDir 'SKILL.md'
        $isAlias = (Test-Path -LiteralPath $aliasMd) -and ((ReadUtf8 $aliasMd) -match 'Old name of the fournee skill')
        if ((Test-Path -LiteralPath $legacyDir) -and -not $isAlias) {
            $dest = $legacyArchive
            if (Test-Path -LiteralPath $dest) { $dest = $legacyArchive + '-' + (Get-Date -Format 'yyyyMMdd-HHmmss') }
            New-Item -ItemType Directory -Force -Path (Split-Path -Parent $dest) | Out-Null
            Move-Item -LiteralPath $legacyDir -Destination $dest
            $archivedTo = $dest
        }
        if (Test-Path -LiteralPath (Join-Path $claudeDir 'skills')) {
            New-Item -ItemType Directory -Force -Path $legacyDir | Out-Null
            WriteUtf8 $aliasMd ("---`nname: mise`ndescription: Old name of the fournee skill (the design system was called Mise before it was renamed Fournee). Whenever Mise is mentioned, load and follow the fournee skill instead.`n---`n`n# Mise is now Fournee`n`nLoad the **fournee** skill (~/.claude/skills/fournee/SKILL.md) and follow it. Paths and code names that still say mise (the repo folder, MiseApply, .mise-* classes, mise.js) are the same thing.`n")
        }

        # Archive the old Frosting skill (moved, never deleted).
        if (Test-Path -LiteralPath $oldSkill) {
            $dest = $archive
            if (Test-Path -LiteralPath $dest) { $dest = $archive + '-' + (Get-Date -Format 'yyyyMMdd-HHmmss') }
            New-Item -ItemType Directory -Force -Path (Split-Path -Parent $dest) | Out-Null
            Move-Item -LiteralPath $oldSkill -Destination $dest
            $archivedTo = $dest
        }
    }

    # ---- Step 2: global CLAUDE.md -----------------------------------------
    $claudeMd = Join-Path $claudeDir 'CLAUDE.md'
    $didRule = $false
    $msg2 = "STEP 2 of 3`nWrite the Fournee rule into your global CLAUDE.md (loads in every Claude Code session)?`n`nFile: $claudeMd" +
            $(if (Test-Path -LiteralPath $claudeMd) { "`n(A backup copy is made first. The old Frosting rule is replaced; your other rules are kept as they are.)" } else { "`n(File will be created.)" })
    if (Ask $msg2) {
        New-Item -ItemType Directory -Force -Path $claudeDir | Out-Null
        $existing = ''
        if (Test-Path -LiteralPath $claudeMd) {
            $stamp = Get-Date -Format 'yyyyMMdd-HHmmss'
            Copy-Item -LiteralPath $claudeMd -Destination "$claudeMd.bak-$stamp"
            $existing = ReadUtf8 $claudeMd
        }
        $nl = if ($existing.Contains("`r`n")) { "`r`n" } else { "`n" }
        $repoFwd = $repo.Replace('\', '/')
        $block = (@(
            '<!-- FOURNEE:BEGIN (managed by Install-Fournee-Everywhere; re-run to update) -->',
            '## Design system: Fournee',
            'All UI, styling and theming work takes colour from Frosting role tokens (`--fr-*`) and type from Fontdant roles, steps and faces (`--fd-*`, `.fd-*`): never hard-coded colours, font sizes or font stacks; nothing under 12px; fonts self-hosted from Fournee.',
            'Full rules and token lists: the "fournee" skill (~/.claude/skills/fournee/SKILL.md). Use it for any front-end or typography work.',
            "Source of truth: $repoFwd (GitHub fournee/fournee)",
            '<!-- FOURNEE:END -->'
        ) -join $nl)

        $mine  = '(?s)<!-- FOURNEE:BEGIN.*?<!-- FOURNEE:END -->'
        $mise  = '(?s)<!-- MISE:BEGIN.*?<!-- MISE:END -->'
        $frost = '(?s)<!-- FROSTING:BEGIN.*?<!-- FROSTING:END -->'
        $eval  = [System.Text.RegularExpressions.MatchEvaluator] { param($m) $block }
        $old = $null
        foreach ($rx in @($mine, $mise, $frost)) { if (-not $old -and [regex]::IsMatch($existing, $rx)) { $old = $rx } }
        if ($old) {
            # Refresh the block in place (an older Mise or Frosting block becomes the Fournee block); drop any other leftovers.
            $new = ([regex]::new($old)).Replace($existing, $eval, 1)
            foreach ($rx in @($mise, $frost)) { if ($rx -ne $old) { $new = [regex]::Replace($new, '(\r?\n)*' + $rx, '') } }
        } elseif ($existing.Trim()) {
            $new = $existing.TrimEnd() + $nl + $nl + $block + $nl
        } else {
            $new = $block + $nl
        }
        WriteUtf8 $claudeMd $new
        $didRule = $true
    }

    # ---- Step 3: zip for claude.ai ----------------------------------------
    $desktop = [Environment]::GetFolderPath('Desktop')
    if (-not $desktop) { $desktop = Join-Path $env:USERPROFILE 'Desktop' }
    New-Item -ItemType Directory -Force -Path $desktop | Out-Null
    $zip = Join-Path $desktop 'fournee-skill.zip'
    $didZip = $false
    if ($didSkill -or (Test-Path -LiteralPath (Join-Path $skillDir 'SKILL.md'))) {
        $msg3 = "STEP 3 of 3`nMake fournee-skill.zip on your Desktop, to upload to claude.ai so chats and artifacts use Fournee too?`n`n(If you uploaded the old Frosting skill there, remove it in claude.ai's Skills settings.)"
        if (Ask $msg3) {
            if (Test-Path -LiteralPath $zip) { Remove-Item -LiteralPath $zip -Force }
            $zs = [System.IO.Compression.ZipFile]::Open($zip, 'Create')
            try {
                Get-ChildItem -LiteralPath $skillDir -Recurse -File | ForEach-Object {
                    $entry = 'fournee/' + $_.FullName.Substring($skillDir.Length).TrimStart('\').Replace('\', '/')
                    [void][System.IO.Compression.ZipFileExtensions]::CreateEntryFromFile($zs, $_.FullName, $entry)
                }
            } finally { $zs.Dispose() }
            $didZip = $true
        }
    }

    # ---- Done ---------------------------------------------------------------
    $lines = @()
    $lines += $(if ($didSkill) { "[done] Claude Code skill installed: $skillDir  (Fournee $commit)" } else { '[skipped] Claude Code skill' })
    if ($archivedTo) { $lines += "[done] Old skill archived to: $archivedTo" }
    $lines += $(if ($didRule)  { "[done] Global rule written: $claudeMd" } else { '[skipped] Global CLAUDE.md rule' })
    $lines += $(if ($didZip)   { "[done] Upload file: $zip`n        Upload it in Claude's Skills settings on claude.ai." } else { '[skipped] claude.ai upload zip' })
    $lines += ''
    $lines += 'New Claude Code sessions pick this up automatically. Re-run this file whenever Fournee changes.'
    Say ($lines -join "`n")
    if ($didZip -and -not $Unattended) { Start-Process explorer.exe "/select,`"$zip`"" }
}
catch {
    if ($Unattended) { Write-Error "Something went wrong: $($_.Exception.Message)"; exit 1 }
    [void][System.Windows.Forms.MessageBox]::Show("Something went wrong:`n`n$($_.Exception.Message)`n`nNothing after this point was changed.", $Title, 'OK', 'Error')
    exit 1
}
