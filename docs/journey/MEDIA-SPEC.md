# Snow Crystal Journey media specification

**Status:** exploratory house specification. It defines publication candidates; it does not
authorize publishing, automated posting, or a scientific claim. Platform limits were last checked
on **2026-08-09** and must be checked again before a publishing integration is built.

This specification is designed for a slow, year-long-or-longer investigation. It optimizes for one
honest, sustainable step at a time, not for filling every channel every day.

Stable entry, artifact, release, and destination-publication identities are governed by the
[numbering and reconstruction specification](NUMBERING.md). Every outward piece remains traceable
to one primary `SCJ-` entry.

## How to use this specification

A day chooses **one primary artifact**: perhaps a video, image, diagram, research note, model,
interactive, audio recording, correction, or failed experiment. It does not need to satisfy every
section below. Apply only the packet for the artifact that actually exists, then prepare renditions
only for destinations selected that day.

In this document:

- **Required** means the piece should not be published without it.
- **Default** means use it unless the content gives a concrete reason to differ.
- **Optional** means make it only for a selected destination or editorial purpose.

The required daily minimum is the Journey entry, one approved primary artifact, and the
accessibility, provenance, claim, rights, and privacy work applicable to that artifact. Everything
else can be marked **N/A**. No platform derivative is required merely because the channel is on the
retained list.

## Daily defaults at a glance

| Decision | Default |
|---|---|
| Primary artifact | One; a journal note alone is valid |
| Ordinary video | 21–45 seconds; 15–59 seconds allowed |
| Voice | Maker's voice, 120–140 spoken words per minute |
| Visual master | 1080 × 1920, 9:16, 30 fps for a generated daily short |
| Idea count | One principal question, movement, or result |
| Speech access | Reviewed captions plus transcript |
| Music | Off for explanations, research, corrections, and demos |
| Permanent home | Journey entry with source, status, and next question |
| Public identity | `SCJ 0042` on the artifact; “Snow Crystal Journey 0042” in searchable copy |

The decision order is:

1. Preserve what actually happened and the confidence of the claim.
2. Meet accessibility, disclosure, and rights requirements.
3. Make one clean house master or source artifact.
4. Derive only the destination versions that are useful that day.
5. Check each destination's live composer before posting.

The website Journey entry is the chronological record. Social copies point back to it; they do not
become a competing archive.

```text
question or event -> primary artifact -> reviewed source or clean master -> selected renditions
                           |                       |                   |
                           |                       |                   +-> social publication URLs
                           |                       +-> archive files
                           +-> Journey entry, sources, status, and next question
```

## House duration ladder

Platform maximum durations are compatibility ceilings, not creative targets.

| Piece | House duration | Use |
|---|---:|---|
| **Pulse** | 15–20 seconds | One striking observation, turn, failure, or crystal view |
| **Daily short** | 21–45 seconds | Default: one question, one movement, one useful result |
| **Full daily short** | 46–59 seconds | A step that genuinely needs context or demonstration |
| **Extended update** | 60–180 seconds | A guided demo, correction, or explanation; not a universal daily asset |
| **Arc recap** | 3–8 minutes | Several connected entries and what changed across them |
| **Chapter video** | 8–20 minutes | A durable synthesis after the underlying work exists |
| **Live session** | Event-specific | Specify separately when a real live session is planned |

The ordinary daily-video boundary is **15–59 seconds**. This deliberately avoids an exact 60.0-second
export that one encoder or upload route may round above a one-minute boundary. Do not pad a
15-second result to make it look more substantial, and do not compress a real three-minute
explanation until it becomes misleading. A text note or still image may be the entire artifact for
a day.

For a short, show the meaningful object, question, or change within the first two seconds. Do not
spend that time on a greeting or logo bumper. Deliver the principal result by roughly 60–75% of the
runtime, then use the final seconds for the next honest question, a concise result, or at most one
action. Do not manufacture a cliffhanger or withhold a result merely to create a second post.

## Voice and spoken-word budget

The maker's own recorded voice is the default because the Journey is a first-person record of
learning. A synthetic voice is reserved for an accessibility need, a disclosed localization test,
or a temporary prototype; it is never used to imitate a person.

Aim for a calm **120–140 spoken words per minute**. The table leaves room for breath, visual
inspection, and unfamiliar scientific terms.

| Runtime | Target words | Rewrite above |
|---:|---:|---:|
| 15 seconds | 25–30 | 32 |
| 30 seconds | 55–65 | 70 |
| 45 seconds | 80–95 | 100 |
| About 59 seconds | 105–125 | 130 |

“Rewrite above” is a clarity warning, not a technical upload limit. Prefer removing a thought or
making the piece longer to speeding up the reading.

Voice rules:

- Write for speech, then read the script aloud before recording.
- Pronounce symbols, units, and temperatures unambiguously.
- Let the viewer inspect a crystal, field, or diagram without continuous narration.
- Record a clean voice track even when ambience or music will be considered later.
- Keep the approved script and final transcript with the artifact.

## Text budgets

These are house limits. A platform may allow more; extra capacity does not need to be filled.

| Text element | House limit |
|---|---:|
| On-frame hook or title | 6 words |
| Supporting on-frame callout | 6 words while a title is visible; 12 when alone |
| Combined ordinary non-caption text visible at one time | 12 words |
| Thumbnail or poster title | 6 words |
| Durable title | 70 characters |
| Universal short-video logline | 150 characters including tags |
| Core conversational field note | 220 characters including tags, followed by at most one link |
| General video caption or description | 500 characters; first 120 must make sense alone |
| Journey entry summary | 50–150 words, followed by sources and artifact links as needed |
| Hashtags or topic tags | 0–3; normally 0 or 1 specific tag |
| Call to action | 0 or 1, and specific to the work |

One callout should carry one thought. Equations, axes, and diagrams may exceed the ordinary visible
word limit only when the edit pauses long enough to inspect them and captions do not compete for the
same space. Do not reproduce the entire narration as decorative text in addition to captions. A
useful call to action is “rotate the model in the Journey entry” or “what should I test next?”, not
an automatic request to like, follow, and share.

Character counting differs by destination, language, links, and emoji. The live composer is the
final authority. The 220-character core exists so the same thought can fit a standard X post with
room for a link, while Threads and other destinations can receive a more conversational addition.

## Video and image masters

### Short vertical video

- **Canvas:** 1080 × 1920 pixels, 9:16, progressive, Rec. 709 SDR. Still-image derivatives use
  sRGB.
- **Frame rate:** 30 frames per second by default. Use 60 only when motion inspection materially
  benefits; do not synthesize extra frames merely to claim a higher rate.
- **Delivery file:** MP4 with H.264 video and AAC-LC stereo audio at 48 kHz.
- **Distribution target:** under 100 MB for an ordinary daily short.
- **Master:** clean, without a platform watermark, platform UI, music-library sticker, or baked-in
  destination branding.
- **Cover:** compose at least one strong selectable frame inside the video, then export a separate
  poster for destinations that accept one. Keep its subject recognizable in a centered 4:5 crop.

For a 1080 × 1920 vertical frame, keep essential text and controls inside the conservative house
rectangle **x = 80–860, y = 270–1480**. Important imagery may extend outside it, but no conclusion,
axis label, unit, or control may depend on the obscured edges. This is a house safety margin, not a
promise about every platform UI; preview the actual post before release.

### Horizontal video and screen capture

- Use 1920 × 1080, 16:9 for long-form chapters, full demo recordings, and screen captures that need
  horizontal space.
- Make a separate guided 9:16 cut only when the interaction and labels remain legible. Do not crop
  away the vapor field, controls, axes, or other context needed to interpret a result.
- A recording of an interactive is explicitly a **demo recording**, not a substitute for the linked
  interactive experience.

### Stills, diagrams, and carousels

- Keep the original or highest-quality source.
- Use 1080 × 1350, 4:5 as the general social portrait derivative.
- Use 1000 × 1500, 2:3 as the Pinterest derivative.
- Prefer 3–6 carousel cards. Each card carries one claim or visual step, with no more than about
  25 body words.
- Put sources, status, and the next question on the final card or in the linked Journey entry rather
  than shrinking them into illegibility.

## Captions and accessibility

Every prerecorded video containing meaningful speech or sound has accurate captions. Automatic
captions are a draft; a person checks scientific terms, names, units, punctuation, and timing.

- Each short-platform rendition uses reviewed open captions **or** a dependable native caption
  track. Do not display both and create duplicate captions. Keep a captioned derivative available
  for destinations whose native presentation is unknown or unreliable.
- Keep an SRT or VTT file and a plain transcript. On the website, provide a descriptive transcript
  when important visual information is not already spoken.
- Use no more than two caption lines, normally about 32–42 English characters per line. Recompose
  for the language rather than applying an English character count mechanically.
- On a 1080 × 1920 canvas, captions are normally 54–64 pixels high, small labels at least 44 pixels,
  and primary titles at least 72 pixels. Test on a phone at normal viewing distance.
- Text and essential graphics meet at least 4.5:1 contrast against their immediate background. A
  solid or translucent backing is preferable to a fragile shadow over a complex crystal.
- Color is never the only carrier of meaning. Use a label, shape, texture, or line style as well.
- Do not include flashes more than three times in one second. Avoid unnecessary camera motion; the
  website experience also needs a reduced-motion path.
- Write useful alt text for stills, diagrams, carousel cards, and poster images. Do not repeat the
  caption verbatim when the image contributes different information.
- Compose narration so essential visible changes are described when that can be done naturally.
  Otherwise provide adjacent visual description, alt text, or a descriptive transcript. Reserve a
  separate audio-described cut for a substantial piece whose important visuals still cannot be
  accessed through those paths.

The accessibility baseline follows the W3C guidance for
[captions](https://www.w3.org/WAI/media/av/captions/),
[transcripts](https://www.w3.org/WAI/media/av/transcripts/), and
[minimum contrast](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html).

## Audio, music, ambience, and sound effects

### Default music decision

| Content type | House default |
|---|---|
| Research note, explanation, correction, or measured result | **No music** |
| Demo walkthrough or interface recording | **No music** |
| Raw experiment or workbench moment | Real room tone or silence; music normally off |
| Crystal reveal, turntable, or non-explanatory animation | Music optional if it adds a real mood or rhythm |
| Arc recap or chapter transition | Music optional |
| Live session | No background music unless the event-specific rights check clears it |

Music never carries scientific information and never makes a model result feel like natural
footage. There is no intro jingle on a 15-second piece. Do not place music under a material
correction, limitation, uncertainty statement, or source quotation when it changes the emotional
reading. When music is present under speech, prefer instrumental material and keep it clearly
subordinate to the voice.

### Rights rule

A cross-platform master may contain music only when it is:

1. wholly original with documented ownership;
2. confirmed public domain in the relevant territories; or
3. covered by a written license that permits the intended platforms, territories, editing,
   synchronization, commercial use if that may occur, and the required term.

Where applicable, clear and record the rights in both the musical composition and the particular
sound recording.

A song available in YouTube, TikTok, Meta, Snapchat, or another platform's music picker is treated
as licensed **only for the rendition made and used under that platform's terms**. Do not download,
rip, or carry it into the clean master or another destination. If the rights path is uncertain, use
no music. Availability can depend on account type, territory, commercial or branded use, and the
specific post; seeing a track in a picker is not proof that every intended use is permitted.

Keep a voice-only mix and, for substantial pieces, separate voice, music, and effects stems. The
rights record for any third-party sound names the asset, creator, source URL, license and version,
date obtained, proof of permission or purchase, required attribution, destinations, territories,
and term. “Royalty-free” by itself is not a license record.

Sound effects and ambience follow the same rights rule. They must also be semantically honest: do
not add an ice crack, wind gust, or laboratory sound in a way that implies it was produced by the
shown event. A mapping from model values to sound is labeled **SONIFICATION**; a constructed effect
is labeled **FOLEY** when a viewer might mistake it for observed sound. Generated music is off by
default and requires the same provenance and commercial-use review as any other third-party asset.

### Mix target

- Dialogue remains intelligible on a phone speaker and in mono.
- Aim for approximately **−16 to −14 LUFS integrated**, with true peaks no higher than **−1 dBTP**.
- When music is present, begin around 12–18 dB below the voice and adjust by listening, not by the
  number alone.
- Check once on headphones, once on a phone speaker, and once at low volume.

These are house delivery targets, not claims that every destination normalizes audio identically.

## Rights and privacy for all media

The sound policy is not the whole rights policy. Third-party photographs, paper figures, stock
footage, fonts, datasets, quotations, code excerpts, screenshots, and generated assets also need a
recorded path: original ownership, written permission, a compatible license, confirmed public-domain
status, or a documented lawful quotation or other exception appropriate to the actual use. A source
citation is not by itself permission to reproduce a work.

- Record creator, source URL, title, license/version, proof and date, required attribution,
  modification rights, platforms, territories, commercial status, and term when applicable.
- Preserve the license and attribution required by a dataset or code source used to create a
  visualization, even when the final pixels are newly rendered.
- Do not reuse a paper's figure merely because the paper is cited. Prefer a project-made diagram of
  the idea or secure the needed reuse permission.
- Review every capture for faces and voices, bystanders, names, email addresses, account handles,
  private messages, file paths, credentials, license keys, notifications, precise locations, and
  other personal or security-sensitive information.
- Obtain releases or consent when a recognizable person, private voice, property, or contribution
  requires it. Redact before export; do not rely on a social crop to hide private material.
- Keep the privacy and release result with the rights record.

## Visual provenance and scientific status

The viewer must be able to tell what kind of image they are seeing without opening a description.
Labels are stackable: one describes epistemic origin and another may describe presentation or
production method.

Use a visible label whenever origin could plausibly be mistaken. Ordinary face-to-camera footage
does not need a permanent **PHYSICAL FOOTAGE** bug merely to prove that a camera was used; a physical
snow-crystal image placed beside a photorealistic model does.

| Source of visual | Visible label |
|---|---|
| Camera or instrument record of a physical subject or apparatus | **PHYSICAL FOOTAGE** |
| Direct rendering of a named measured dataset | **MEASURED DATA** |
| Snow-crystal solver image, mesh, field, or animation | **MODEL** or **MODEL DATA** |
| Explanatory drawing or code-rendered construction | **DIAGRAM** |
| Screen recording of an interactive | Add **DEMO** to its origin, such as **DEMO · MODEL** |
| Constructed depiction of an event that was not directly recorded | **RECREATION** |
| Generative-image illustration that is not model output | **GENERATED ILLUSTRATION** plus **AI-GENERATED** |

The label stays legible long enough to register. The Journey entry carries the fuller provenance:
source, method, relevant run or artifact identifier, transformation or crop, date, rights, and the
current confidence status.

- Never present model output as observed ice or use natural-footage wording for it. Add the current
  model-status qualifier supplied by the governing project record—for example,
  **MODEL · NOT VALIDATED**—and never imply validation without naming the earned domain.
- State when playback is sped up, slowed down, interpolated, looped, or nonlinearly sampled. Keep
  playback duration distinct from simulated or observed time.
- Charts and fields retain legends, units, and scales needed for interpretation.
- Generated illustration may set mood or explain an idea, but it is not evidence.
- **AI-GENERATED** is an additional production-method disclosure for synthetic image, video, voice,
  or music; it never replaces the epistemic label. Code-generated output is labeled by what it is:
  MODEL, MODEL DATA, MEASURED DATA, or DIAGRAM.
- Apply each destination's own altered- or synthetic-media disclosure in addition to the house
  label when its policy calls for one. YouTube's current
  [altered or synthetic content policy](https://support.google.com/youtube/answer/14328491) is one
  example.
- An outward-facing scientific interpretation receives skeptical review before publication. A
  source link does not replace that review.
- If a claim is materially corrected, preserve the original entry and link both ways to the new
  correction entry. Mark the affected claim, artifact, and current-understanding status; call the
  whole original entry superseded only when the new entry actually replaces it as a whole. Do not
  silently swap the meaning of an old artifact.

## Artifact packets

Use only the packet matching the day's primary artifact. Within it, make the required core first;
add derivatives and copy only for destinations actually selected. A missing destination is **N/A**,
not unfinished work.

### Short-video packet

Required core:

- approved clean vertical master;
- reviewed captions and transcript when speech or meaningful sound exists;
- applicable provenance, claim, source, rights, and privacy record; and
- Journey entry linking the approved artifact.

Add only when selected:

- captioned vertical rendition and SRT/VTT sidecars for the chosen destinations;
- clean voice track and music/effects stems when those elements exist;
- poster image and alt text where a destination accepts or needs a poster;
- the shortest copy that destination needs: 70-character title, 150-character logline,
  220-character field note, or up-to-500-character description; and
- destination URL and exact uploaded rendition after publication.

### Still or carousel packet

Required core:

- approved original or clean source, alt text, applicable visible provenance, and rights/privacy
  record; and
- Journey entry linking the artifact.

Add only when selected: a 4:5 derivative, 2:3 Pinterest derivative, carousel card order and editable
text, destination caption, and publication URL.

### Model or interactive packet

Required core:

- canonical web URL and stable artifact or run identifier;
- parameters, current model status, provenance label, and context needed to understand the view;
- accessible instructions or text alternative for the interactive; and
- Journey entry linking it.

Add only when selected: a readable 16:9 capture, guided recording, vertical short if it remains
interpretable, poster and alt text, and the explicit statement that a recording is not interactive.

### Audio-note packet

Required core:

- approved clean recording, listening copy, transcript, description, and applicable source,
  provenance, rights, and privacy record; and
- Journey entry with the audio player and download or listening link.

Add a captioned audiogram, poster, waveform, or video rendition only when a selected visual
destination makes it useful. Do not turn every audio note into a video by default.

### Text or research-note packet

The required core is the Journey entry with the question, movement, source/status, underlying links,
and next question. Add a 220-character conversational version and one useful visual only when a
selected destination benefits. There is no forced video, voiceover, or decorative music.

### Long-video or chapter packet

Required core:

- approved clean 16:9 master and source project;
- reviewed captions, full transcript, descriptive support, sources, rights/privacy record, and
  correction path; and
- linked Journey entries showing where the synthesis came from.

Add destination chapters, thumbnail, durable title, description, and short extracts only after the
long piece is approved and their destinations are selected.

## Platform compatibility snapshot

The house short is deliberately narrower than most platform maxima. Numeric limits below are
current public platform facts, not reasons to make longer content. Features can vary by region,
account, device, subscription, and rollout; confirm them in the actual account before release.

Consumer composers and publishing APIs are separate routes and sometimes have different limits.
This specification does not authorize automated posting. A future destination adapter must name
the exact account type, region, API or manual route, permissions, numeric limits, disclosure
features, and human approval step. It must not infer an API allowance from a consumer help page.

The numeric snapshot emphasizes ordinary daily-feed routes. Secondary modes such as Stories,
long-form/community posts, and live sessions are listed as lightweight house roles rather than
fully frozen platform specifications. Ephemeral content never holds the only copy of a result.

### Video and visual destinations

| Destination | Current public constraint | House rendition |
|---|---|---|
| **Journey website** | No social-platform limit | Canonical artifact, transcript, provenance, sources, correction status, and selected media |
| **YouTube Shorts** | Square or vertical videos up to 3 minutes; title up to 100 characters | 15–59 second 9:16 master; house title at most 70 characters. Use longer Shorts only for an intentional extended update |
| **TikTok** | TikTok Studio web accepts MP4/WebM, at least 720 × 1280, up to 30 minutes and under 10 GB; app, account, and API routes can differ | 15–59 second 1080 × 1920 native upload; captioned and free of another platform's watermark |
| **Instagram Reels** | Reels can be up to 20 minutes, but Reels over 3 minutes are not recommended to new audiences; 1.91:1–9:16, at least 720 pixels and 30 fps | 15–59 second 9:16 upload; separate 4:5 still/carousel when the visual deserves it |
| **Facebook Reels/video** | Meta's current consumer help is transitional; the Page Reels publishing API is 3–90 seconds and the general video route is broader | Keep the shared discovery cut at 15–59 seconds so it fits the Page API and consumer state; preflight the Page/profile route |
| **Weixin Channels / WeChat** | No dependable, universal public numeric limit was found for the intended organic account path | Localized 15–59 second 9:16 upload, manually reviewed and manually published; preflight the exact Weixin or WeChat account |
| **Pinterest** | Organic Pin specs list video at 4 seconds–5 minutes, title up to 100 characters, and description up to 800; 2:3 is the preferred standard-Pin image ratio | 15–45 second vertical video or 1000 × 1500 still; use designed captions because generated video captions cannot currently be edited |
| **Snapchat Spotlight** | Snap's Public Profile API accepts MP4 at 6–60 seconds, at least 540 × 960, with a description up to 160 characters including hashtags; other organic details remain route-dependent | Selected 15–59 second 9:16 cut and 150-character logline; verify acceptance, captions, and safety zones in the live app |

Platform sources checked 2026-08-09:

- YouTube:
  [three-minute Shorts](https://support.google.com/youtube/answer/15424877),
  [Short creation and 100-character titles](https://support.google.com/youtube/answer/10059070),
  [encoding guidance](https://support.google.com/youtube/answer/1722171),
  [Short thumbnail selection](https://support.google.com/youtube/answer/72431),
  [Audio Library](https://support.google.com/youtube/answer/3376882), and
  [Creator Music restrictions](https://support.google.com/youtube/answer/11611019). A Short over one
  minute with an active Content ID claim is blocked globally; that is another reason not to place a
  platform-library track in the reusable master.
- TikTok:
  [TikTok Studio upload requirements](https://support.tiktok.com/en/using-tiktok/creating-videos/creator-tools-on-tiktok) and
  [commercial use of music](https://support.tiktok.com/en/business-and-creator/creator-and-business-accounts/commercial-use-of-music-on-tiktok).
  A future automated route must instead use the
  [Content Posting API media guide](https://developers.tiktok.com/doc/content-posting-api-media-transfer-guide)
  and the entitlement returned for the actual creator account.
- Instagram:
  [Reel duration](https://www.facebook.com/help/instagram/225190788256708) and
  [Reel size and frame rate](https://www.facebook.com/help/instagram/1038071743007909). The
  [Instagram media API](https://developers.facebook.com/documentation/instagram-platform/instagram-graph-api/reference/ig-user/media)
  is a separate automated route with its own duration, file-size, caption, and account rules.
- Facebook:
  [all-video-to-Reels announcement](https://about.fb.com/news/2025/06/making-it-easier-create-videos-facebook/),
  [Page Reels publishing API](https://developers.facebook.com/documentation/video-api/guides/reels-publishing),
  [general video upload](https://www.facebook.com/help/215726848451641), and
  [music in Facebook content](https://www.facebook.com/help/728395571305053/).
- Pinterest:
  [organic Pin specifications](https://help.pinterest.com/en/article/review-pin-specs),
  [distribution guidance](https://help.pinterest.com/en/business/article/pin-performance-and-distribution),
  [caption behavior](https://help.pinterest.com/en/article/interact-with-pins), and
  [music terms](https://policy.pinterest.com/en/music-terms-of-use).
- Snapchat:
  [Public Profile API asset requirements](https://developers.snap.com/marketing-api/Public-Profile-API/ProfileAssetManagement),
  [Creator Ads technical reference](https://developers.snap.com/marketing-api/Creator-Ads/TechnicalReference),
  and [music terms](https://www.snap.com/terms?lang=en-US).

### Conversation, community, and direct distribution

| Destination | Current public constraint or role | House rendition |
|---|---|---|
| **Threads** | Main post up to 500 characters and video up to 5 minutes; an optional text attachment can hold 10,000 characters | 220-character conversational thought plus one link or visual; up to 59-second clip. Use an attachment only when it is better than linking the canonical Journey note |
| **X** | Standard post up to 280 characters; every URL consumes 23 characters; non-Premium video up to 140 seconds and 512 MB. Published web video bounds top out at 1200 × 1900 and 40 fps | 220-character field note plus one link. Use a 30 fps, 1062 × 1888 9:16 derivative when the route enforces the published bound; do not design around Premium capacity |
| **YouTube long-form / Community** | Searchable chapter home and optional field-note surface; access and composer features vary by account | Use the long-video packet for 16:9 recaps/chapters and a short Journey-linked note for Community; neither is a daily requirement |
| **Instagram / Facebook still posts and Stories** | Visual derivatives and ephemeral reminders, not additional canonical records | Use the 4:5 still/carousel or a selected short excerpt. Never place unique evidence, a correction, or the only useful link solely in a Story |
| **Weixin Official Accounts / Moments** | The Official Account draft API lists title at 32 Chinese characters, author at 16, summary at 120, and body under 20,000 characters / 1 MB, but also contains a contradictory body-size clause. Channels and Moments have no dependable public universal limit | Fully localized, human-authored edition only when it is worth the editorial work. Prepare a draft, then require explicit human editorial control and approval; never unattended, bulk, or continuous publishing |
| **Discord** | Ordinary messages are up to 2,000 characters and free-account uploads up to 10 MB; API message content is also 2,000 characters, while upload capacity varies by route and tier | Up to 500 useful characters plus a Journey link and optional preview; do not make Discord the only copy of an artifact |
| **Twitch / YouTube Live** | Event medium, not a daily distribution requirement | Write an event-specific run-of-show, moderation, music-rights, caption, archive, and failure plan before the first session |
| **WhatsApp Channels** | No current official public hard character or media limit, or general-purpose Channel publishing API, was found; do not transfer ordinary chat or Status limits to Channels | Up to 500 characters plus a Journey link and native preview; publish manually or human-assisted until a supported route is confirmed |
| **Telegram channels** | Ordinary text is up to 4,096 characters; Bot API media captions are 1,024 and bot uploads 50 MB, while manual-client uploads are broader and tier-dependent | Up to 500 characters plus a Journey link and native preview. A future bot adapter must use the bot limits, not manual-client limits |
| **Email / RSS** | Owned digest; no useful universal social limit | Subject up to 50 characters, preview up to 100, digest 150–400 words, one leading image, alt text, and links to the Journey rather than oversized media attachments |

Conversation-platform sources checked 2026-08-09:

- Threads:
  [500-character posts and five-minute video](https://about.fb.com/news/2023/07/introducing-threads-new-app-text-sharing/),
  [10,000-character text attachments](https://about.fb.com/news/2025/09/attach-text-threads-posts-share-longer-perspectives/), and
  [copyright guidance](https://www.facebook.com/help/instagram/354736791367645).
- X:
  [standard post length](https://help.x.com/en/using-x/how-to-post) and
  [video limits](https://help.x.com/en/using-x/x-videos), plus
  [URL counting](https://help.x.com/en/using-x/how-to-post-a-link).
- Weixin / WeChat:
  [Tencent's product distinction](https://www.tencent.com/products/weixin-wechat/) and
  [Weixin Channels](https://www.tencent.net.cn/products/channels/), plus the
  [Official Account draft API](https://developers.weixin.qq.com/doc/service/api/draftbox/draftmanage/api_draft_add).
  Current reporting of Weixin
  Official Account operating rule §3.27 says AI, scripts, interfaces, or other automation may not
  replace real human participation in content creation and publishing, and forbids bulk continuous
  scripted publishing. The primary rule page was not publicly retrievable during this check, so
  this remains an operational warning and conservative house policy, not a verified primary-source
  platform fact or a claim that all API use is prohibited. Verify §3.27 directly in the account
  before use; the 2026-04-09 platform response is preserved in
  [The Paper's report](https://www.thepaper.cn/newsDetail_forward_32936905).
- Discord:
  [message API](https://docs.discord.com/developers/resources/message),
  [attachment limits](https://support.discord.com/hc/en-us/articles/25444343291031-File-Attachments-FAQ),
  and [Announcement Channels](https://support.discord.com/hc/en-us/articles/360032008192-Announcement-Channel-FAQ).
- WhatsApp Channels:
  [Channels overview](https://about.fb.com/news/2023/09/whatsapp-channels-heres-everything-you-need-to-know/)
  and [message translation](https://about.fb.com/news/2025/09/introducing-message-translations-whatsapp/).
- Telegram:
  [Channel FAQ](https://telegram.org/faq_channels/),
  [Bot API](https://core.telegram.org/bots/api), and
  [runtime limits](https://core.telegram.org/api/config).

## Localization

Until deliberately changed, English is the canonical script and Simplified Chinese is the first
Weixin localization.

- Bind every localization to an exact source release manifest and immutable entry snapshot.
- Translate the complete packet: narration, captions, on-frame copy, title, description, alt text,
  provenance labels, sources, and correction status.
- Maintain a reviewed snow-crystal terminology list. Machine translation may assist a draft but is
  never the only language or scientific review.
- Use a fluent human editorial review before publishing. Retime or recut for the language instead
  of accelerating speech or captions to preserve the English runtime.
- Record whether music rights cover the language edition's platform and territory.
- Synthetic dubbing or voice cloning requires the speaker's consent, provenance, and the visible
  disclosures required by the destination.

## Corrections and revisions

- Never silently rewrite the historical Journey.
- A spelling, caption-timing, or encoding repair creates a recorded patch revision.
- A material correction creates a dated correction entry that says what was wrong, what replaces
  it, why it changed, and which published derivatives are affected.
- Begin a material correction visibly—for example, “Correction to Journey 0042”—rather than hiding
  it at the bottom of a caption.
- Edit the original destination copy where possible. Otherwise add a pinned correction reply or a
  new correction artifact proportionate to the original piece's reach and severity.
- Preserve the original master beneath the original Journey artifact and release. A materially
  corrected master belongs to the correction entry's new artifact and release; only a technical
  repair uses a later release beneath the same Journey entry. Link the original and correction
  entries both ways.
- Delete a public artifact only for a legal, privacy, safety, rights, or serious-harm reason. Keep a
  private record and, when appropriate, a public tombstone explaining why it is unavailable.

## Daily pre-publication check

A daily check should take minutes, not become a second production.

Mark irrelevant lines **N/A**; do not manufacture an artifact to satisfy the checklist.

- [ ] This piece advances one question, even if the movement is failure or correction.
- [ ] It carries the visible and searchable `SCJ-` identity and resolves to the stable numbered
      Journey page.
- [ ] The Journey entry names what changed and the next question.
- [ ] Every outward claim matches its source, model status, and present confidence.
- [ ] Physical footage, measured data, model data, diagram, demo, recreation, and generated
      illustration are labeled without confusing their origin or current status.
- [ ] The runtime, spoken words, visible text, and title fit the relevant house band.
- [ ] Applicable captions, transcript, alt text, contrast, and important visual description are
      complete.
- [ ] Essential text and controls survive the house safe area and the destination preview.
- [ ] Speech is available through captions when muted; essential visuals have adjacent description
      or a descriptive transcript; text is readable at small-phone size.
- [ ] Voice is intelligible; music is off unless it earned a place and has a recorded rights path.
- [ ] Third-party media has a source, license or permission, attribution, and allowed-use record;
      privacy-sensitive capture and needed releases were checked.
- [ ] The clean master contains no destination watermark or platform-library track.
- [ ] The maker reviewed the exact rendition. Scientific interpretation received the required
      skeptical review before outward publication.
- [ ] When published, the URL, date, destination, and any later correction link return to the
      Journey entry.

## Archive minimum

For every published artifact, retain the applicable items and mark the rest **N/A**:

- a stable Journey identifier and date;
- the artifact, approved-release, destination-publication, and global history-event identifiers
  required by `NUMBERING.md`;
- the primary source artifact and clean approved master;
- the exact bytes uploaded to each destination;
- scripts, captions, transcripts, alt text, and poster or thumbnail;
- provenance, claim sources, scientific status, and rights evidence;
- destination-specific renditions and their publication URLs;
- maker approval and review state; and
- supersession or correction links.

Daily source recordings and project files may remain in working storage, but the clean master and
the records needed to understand and reuse it must not depend on a social platform remaining
available.
