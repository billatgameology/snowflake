# Education site — figure provenance

**Generated. Do not edit by hand** — run:

```
node docs/education/tools/build-figure-manifest.mjs
```

Every third-party figure the education site references, with the paper, page, and local sha256 it was recorded at. The images themselves are **not versioned** — they are Kenneth Libbrecht's copyrighted work, and [decision 0004](../decisions/0004-research-media-not-versioned.md) keeps research media out of git. This file is the tracked record; the bytes are a cache.

## Why a figure may not appear on the site

If you opened a chapter and saw a hatched placeholder instead of a figure, the local cache is missing that file. The site is fully usable without it: the explanation, the original diagrams, and every animation are ours and always render. Only the scanned source figures depend on the cache.

## How to restore the images locally

1. **Re-download the papers** listed in [`research/libbrecht-later-papers.md`](../../research/libbrecht-later-papers.md)
   and [`research/1910.06389v2-llm.md`](../../research/1910.06389v2-llm.md). Both carry every source URL and sha256.
2. **Rebuild the monograph figure bundle** (supplies `research/1910.06389v2-llm/figures/fig-*/visual.png`):
   ```
   python3 scripts/build_pdf_llm_bundle.py --force research/1910.06389v2.pdf
   ```
3. **Rebuild the post-monograph crops** (supplies `research/figures/*.png`):
   ```
   node app/scripts/phase6-crop-figures.mjs
   ```

## Status of this checkout

- Figures referenced by the site: **120**
- Present in the local cache right now: **120**
- Missing (will render as a cited placeholder): **0**

## The figures

| figure | source | page | used in | bytes | sha256 |
|---|---|---|---|---:|---|
| Figure 1.1 | Libbrecht, &ldquo;Snow Crystals&rdquo; (arXiv:1910.06389v2) | PDF p. 18 &middot; printed p. 17 | `01-not-a-frozen-raindrop.html`, `07-plates-columns-plates-columns.html`, `13-the-frontier.html` | 124,154 | `406f554f11cdab8a2e2a8b50aeb5d31140ffe413ea9c1cdabbd18a0aeb613881` |
| Figure 1.10 | Libbrecht, &ldquo;Snow Crystals&rdquo; (arXiv:1910.06389v2) | PDF p. 23 &middot; printed p. 22 | `08-a-snowflake-is-a-record.html` | 92,223 | `87bbb6527a966f63479e39d4b8aaabc42c0dfc19a1202ce74b5fc25704870874` |
| Figure 1.11 | Libbrecht, &ldquo;Snow Crystals&rdquo; (arXiv:1910.06389v2) | PDF p. 23 &middot; printed p. 22 | `01-not-a-frozen-raindrop.html`, `08-a-snowflake-is-a-record.html` | 181,984 | `64b996f9cc410d08be3f807c920ac0ca6ca1fb88ba34226d74fc6a50f1d0f3a4` |
| Figure 1.12 | Libbrecht, &ldquo;Snow Crystals&rdquo; (arXiv:1910.06389v2) | PDF p. 24 &middot; printed p. 23 | `07-plates-columns-plates-columns.html` | 101,521 | `51d7825338bd1612a6fe167d23d1751974cba849d9d6e44e3c3f6934fcc06151` |
| Figure 1.13 | Libbrecht, &ldquo;Snow Crystals&rdquo; (arXiv:1910.06389v2) | PDF p. 25 &middot; printed p. 24 | `02-four-hundred-years-of-looking.html` | 141,795 | `43e9bd023c22cecb57ee5aa65035eaa02ab44e6fba026fd6788a233b7d66d4f8` |
| Figure 1.14 | Libbrecht, &ldquo;Snow Crystals&rdquo; (arXiv:1910.06389v2) | PDF p. 26 &middot; printed p. 25 | `02-four-hundred-years-of-looking.html` | 61,555 | `c3279d5017f9c0283f67040c797cdbf5362328ba3296d926d3f4face3879192c` |
| Figure 1.15 | Libbrecht, &ldquo;Snow Crystals&rdquo; (arXiv:1910.06389v2) | PDF p. 27 &middot; printed p. 26 | `02-four-hundred-years-of-looking.html` | 56,359 | `a2a18b2538678d6a6fd3b6c5460e89d3969cb2a81382e19a4ae068cad933031a` |
| Figure 1.16 | Libbrecht, &ldquo;Snow Crystals&rdquo; (arXiv:1910.06389v2) | PDF p. 27 &middot; printed p. 26 | `02-four-hundred-years-of-looking.html` | 86,010 | `b60a38069280f73405feebac194a9c4de7dd96598bc61723101a7cedde4c7eae` |
| Figure 1.17 | Libbrecht, &ldquo;Snow Crystals&rdquo; (arXiv:1910.06389v2) | PDF p. 28 &middot; printed p. 27 | `02-four-hundred-years-of-looking.html` | 146,002 | `9d2411193dc4031843414e70de9eef796e932ad16ccaf6af8cc1bf8974be6214` |
| Figure 1.18 | Libbrecht, &ldquo;Snow Crystals&rdquo; (arXiv:1910.06389v2) | PDF p. 28 &middot; printed p. 27 | `02-four-hundred-years-of-looking.html` | 428,519 | `6f5fc9eade5de60d294baf402e19d7c84de91dce9807e68bc0f242e03d1317bd` |
| Figure 1.19 | Libbrecht, &ldquo;Snow Crystals&rdquo; (arXiv:1910.06389v2) | PDF p. 29 &middot; printed p. 28 | `02-four-hundred-years-of-looking.html` | 68,443 | `c4c8138504436812160594260e27dcce4ea88da70cf89b955301244afdac4ba6` |
| Figure 1.2 | Libbrecht, &ldquo;Snow Crystals&rdquo; (arXiv:1910.06389v2) | PDF p. 18 &middot; printed p. 17 | `01-not-a-frozen-raindrop.html`, `07-plates-columns-plates-columns.html` | 56,575 | `37637bd61aceb8b41c75530d9be6aaa09fcffd4df3b11fc341f8919978b71f8f` |
| Figure 1.20 | Libbrecht, &ldquo;Snow Crystals&rdquo; (arXiv:1910.06389v2) | PDF p. 30 &middot; printed p. 29 | `02-four-hundred-years-of-looking.html` | 220,700 | `d30c14433443396b699fa09d48ea08183a5599968eb83ff95da271cf61754361` |
| Figure 1.21 | Libbrecht, &ldquo;Snow Crystals&rdquo; (arXiv:1910.06389v2) | PDF p. 31 &middot; printed p. 30 | `02-four-hundred-years-of-looking.html` | 153,062 | `ccf8e82d15fb43a1a2c6e9875c18485992fc731933b800cdb4c141fb12c50179` |
| Figure 1.22 | Libbrecht, &ldquo;Snow Crystals&rdquo; (arXiv:1910.06389v2) | PDF p. 31 &middot; printed p. 30 | `02-four-hundred-years-of-looking.html`, `10-how-we-know.html` | 111,909 | `309d3899cd42e7b414a83c314cd51226967374af516f1d0114b77a3516ec2644` |
| Figure 1.23 | Libbrecht, &ldquo;Snow Crystals&rdquo; (arXiv:1910.06389v2) | PDF p. 32 &middot; printed p. 31 | `02-four-hundred-years-of-looking.html`, `10-how-we-know.html` | 139,141 | `1d4a09d229ed47ff2401549a2c4478ce6c998bbdbb4710468891e446ff4a59cc` |
| Figure 1.24 | Libbrecht, &ldquo;Snow Crystals&rdquo; (arXiv:1910.06389v2) | PDF p. 32 &middot; printed p. 31 | `07-plates-columns-plates-columns.html` | 79,386 | `2d0bd82559aa03308e623ad2ef946e94114b9d9db1ba34a903027ce383eea9e7` |
| Figure 1.25 | Libbrecht, &ldquo;Snow Crystals&rdquo; (arXiv:1910.06389v2) | PDF p. 33 &middot; printed p. 32 | `07-plates-columns-plates-columns.html`, `08-a-snowflake-is-a-record.html`, `12-why-the-shape-flips.html` | 436,086 | `e9907aeba190ed008d13130d52a0892c7d35fcd2f3d5a41362c46d5d94970361` |
| Figure 1.26 | Libbrecht, &ldquo;Snow Crystals&rdquo; (arXiv:1910.06389v2) | PDF p. 34 &middot; printed p. 33 | `01-not-a-frozen-raindrop.html` | 141,236 | `126c6e3759921f79592ae5e1084d111af4ac9eed69d1d336ba19510a137b54ed` |
| Figure 1.27 | Libbrecht, &ldquo;Snow Crystals&rdquo; (arXiv:1910.06389v2) | PDF p. 35 &middot; printed p. 34 | `06-the-runaway-bump.html` | 155,972 | `60f138d26c6f05966d462b1140375068289404997295881cc6dcf7dc7a5434ba` |
| Figure 1.28 | Libbrecht, &ldquo;Snow Crystals&rdquo; (arXiv:1910.06389v2) | PDF p. 43 &middot; printed p. 42 | `08-a-snowflake-is-a-record.html` | 16,838 | `45057d9dad28d5aab9ef9501a92f39787a93113c02cff41ff2d02203a891060e` |
| Figure 1.29 | Libbrecht, &ldquo;Snow Crystals&rdquo; (arXiv:1910.06389v2) | PDF p. 45 &middot; printed p. 44 | `08-a-snowflake-is-a-record.html`, `10-how-we-know.html` | 420,416 | `48ce1b7694c992c9d23f073ac5d157966f1ea2ce1e4254f9aeb0c39ef8f69291` |
| Figure 1.3 | Libbrecht, &ldquo;Snow Crystals&rdquo; (arXiv:1910.06389v2) | PDF p. 19 &middot; printed p. 18 | `01-not-a-frozen-raindrop.html`, `08-a-snowflake-is-a-record.html` | 150,417 | `3c89d414cc3bff870c43f23a511065d67b883c5e1cc7d91bab74206c6930551b` |
| Figure 1.4 | Libbrecht, &ldquo;Snow Crystals&rdquo; (arXiv:1910.06389v2) | PDF p. 19 &middot; printed p. 18 | `01-not-a-frozen-raindrop.html`, `02-four-hundred-years-of-looking.html`, `08-a-snowflake-is-a-record.html` | 85,607 | `49b25c9609dbb4f229e195bb7e297464f3ea8735b842609fec3be1bb325129f5` |
| Figure 1.5 | Libbrecht, &ldquo;Snow Crystals&rdquo; (arXiv:1910.06389v2) | PDF p. 20 &middot; printed p. 19 | `01-not-a-frozen-raindrop.html`, `04-the-fuel-supply.html` | 92,245 | `1fd9bf0fae2d7b4d64cf569eb5ed960a565287a5cafff5653d13f0b61ec4443e` |
| Figure 1.6 | Libbrecht, &ldquo;Snow Crystals&rdquo; (arXiv:1910.06389v2) | PDF p. 20 &middot; printed p. 19 | `01-not-a-frozen-raindrop.html`, `04-the-fuel-supply.html` | 112,713 | `4322d4427aa76b55719b39d5746385e88ea8f1c04716156145fb2ac9a74850f2` |
| Figure 1.7 | Libbrecht, &ldquo;Snow Crystals&rdquo; (arXiv:1910.06389v2) | PDF p. 21 &middot; printed p. 20 | `01-not-a-frozen-raindrop.html` | 210,036 | `7510897eb30a77fabdc39245022e62b3729f5fa708b24f11e9ff2af530eb9267` |
| Figure 1.8 | Libbrecht, &ldquo;Snow Crystals&rdquo; (arXiv:1910.06389v2) | PDF p. 22 &middot; printed p. 21 | `05-the-restless-surface.html` | 77,499 | `86a869e3aa94f914a74d5e30f5d5ad8dfd1db3ccf32d630b9b0d44a4ad703b97` |
| Figure 1.9 | Libbrecht, &ldquo;Snow Crystals&rdquo; (arXiv:1910.06389v2) | PDF p. 22 &middot; printed p. 21 | `06-the-runaway-bump.html` | 38,982 | `d6b12736f5bcd46d18c92d82ad8f8f03669ec65340251c45c367c92502692e90` |
| Figure 10.2 | Libbrecht, &ldquo;Snow Crystals&rdquo; (arXiv:1910.06389v2) | PDF p. 387 &middot; printed p. 386 | `09-the-menagerie.html` | 801,214 | `274ed152802116fe6499d9d65db8624c021879ea26401c2b37f5e3456ed5cbed` |
| Figure 10.3 | Libbrecht, &ldquo;Snow Crystals&rdquo; (arXiv:1910.06389v2) | PDF p. 388 &middot; printed p. 387 | `09-the-menagerie.html` | 820,075 | `1238f9afcc7c77a621f2580d3ec626d81f3268be2fadb92d354cb44b6e8f3529` |
| Figure 10.4 | Libbrecht, &ldquo;Snow Crystals&rdquo; (arXiv:1910.06389v2) | PDF p. 389 &middot; printed p. 388 | `02-four-hundred-years-of-looking.html`, `09-the-menagerie.html` | 116,616 | `661b1be4ccb12560d81c6cb789f7de95e59ec16b9b4ab185650f9902b32a03ee` |
| Figure 10.5 | Libbrecht, &ldquo;Snow Crystals&rdquo; (arXiv:1910.06389v2) | PDF p. 390 &middot; printed p. 389 | `09-the-menagerie.html` | 136,177 | `520946ebf5b5f004e5e53729c1c436846b12c0ed65c56011621ed2d93a3456bc` |
| Figure 10.6 | Libbrecht, &ldquo;Snow Crystals&rdquo; (arXiv:1910.06389v2) | PDF p. 391 &middot; printed p. 390 | `09-the-menagerie.html` | 190,868 | `4cd129e3a909cdedd5367e035aba0bf9c72d7161d3146769e41ef6d57b7e132f` |
| Figure 10.7 | Libbrecht, &ldquo;Snow Crystals&rdquo; (arXiv:1910.06389v2) | PDF p. 391 &middot; printed p. 390 | `08-a-snowflake-is-a-record.html`, `09-the-menagerie.html` | 157,740 | `b41cf9b9bd8da8ba6278ab4ff69887a05000a6dd8dd3c4d087fdc59739b50d72` |
| Figure 11.1 | Libbrecht, &ldquo;Snow Crystals&rdquo; (arXiv:1910.06389v2) | PDF p. 446 &middot; printed p. 445 | `10-how-we-know.html` | 37,159 | `8c78486c789732cf79eda20388f3390eafec5ac37724aaa8f362d4528c683927` |
| Figure 11.4 | Libbrecht, &ldquo;Snow Crystals&rdquo; (arXiv:1910.06389v2) | PDF p. 450 &middot; printed p. 449 | `10-how-we-know.html` | 174,312 | `0b2207ff3f782d8a8b221860fca4b8fbc9e63c99f309be3269b1c840c57845d2` |
| Figure 2.1 | Libbrecht, &ldquo;Snow Crystals&rdquo; (arXiv:1910.06389v2) | PDF p. 48 &middot; printed p. 47 | `03-why-six-sides.html` | 522,613 | `68fd34943e1c675f8c7ef4e024f808c8d0de2b45dcd4c7c7ddbf9da2f71218e6` |
| Figure 2.10 | Libbrecht, &ldquo;Snow Crystals&rdquo; (arXiv:1910.06389v2) | PDF p. 54 &middot; printed p. 53 | `03-why-six-sides.html`, `05-the-restless-surface.html` | 193,899 | `657222505197223cc145458a300da30ecd9c23062a6071af965285472cda780d` |
| Figure 2.12 | Libbrecht, &ldquo;Snow Crystals&rdquo; (arXiv:1910.06389v2) | PDF p. 55 &middot; printed p. 54 | `05-the-restless-surface.html`, `13-the-frontier.html` | 162,576 | `a13ce1f7c0a4d508834103f6969252fcbf0588a208d3cc5b3fb8da17f9607736` |
| Figure 2.13 | Libbrecht, &ldquo;Snow Crystals&rdquo; (arXiv:1910.06389v2) | PDF p. 59 &middot; printed p. 58 | `04-the-fuel-supply.html` | 52,178 | `2407d9b4bab03b2e016791d20cd92ad262b93799a958307ff45cd94103d7215e` |
| Figure 2.14 | Libbrecht, &ldquo;Snow Crystals&rdquo; (arXiv:1910.06389v2) | PDF p. 59 &middot; printed p. 58 | `04-the-fuel-supply.html` | 51,277 | `4476f11c850cab0079c8395a0f6e622f2b894f7283d24c8ba3e8c58c43255bf5` |
| Figure 2.15 | Libbrecht, &ldquo;Snow Crystals&rdquo; (arXiv:1910.06389v2) | PDF p. 61 &middot; printed p. 60 | `05-the-restless-surface.html`, `13-the-frontier.html` | 97,019 | `d034e474fedd9c646addd0ad1409c581b84a9e4dc40108b047395943bca95ea1` |
| Figure 2.16 | Libbrecht, &ldquo;Snow Crystals&rdquo; (arXiv:1910.06389v2) | PDF p. 62 &middot; printed p. 61 | `05-the-restless-surface.html` | 83,298 | `58f4e1c40942c337def6e2d345e89fb7f1373a248ebfff4f94dd4ec3b9fdf31f` |
| Figure 2.17 | Libbrecht, &ldquo;Snow Crystals&rdquo; (arXiv:1910.06389v2) | PDF p. 63 &middot; printed p. 62 | `05-the-restless-surface.html` | 18,926 | `41b42c51118e05600321346e47bf578c54644fd1b5895198daaec77064b8dadb` |
| Figure 2.18 | Libbrecht, &ldquo;Snow Crystals&rdquo; (arXiv:1910.06389v2) | PDF p. 64 &middot; printed p. 63 | `05-the-restless-surface.html` | 102,027 | `7f49e3cf9cf5ea8affaffa67253af000851500db319be2282d0419383e79fe42` |
| Figure 2.19 | Libbrecht, &ldquo;Snow Crystals&rdquo; (arXiv:1910.06389v2) | PDF p. 65 &middot; printed p. 64 | `05-the-restless-surface.html` | 35,660 | `7ea17695d7421984de7045488e7ecb8cbe274269c6057932db6468d900dc5fce` |
| Figure 2.2 | Libbrecht, &ldquo;Snow Crystals&rdquo; (arXiv:1910.06389v2) | PDF p. 49 &middot; printed p. 48 | `03-why-six-sides.html` | 147,092 | `1bdf811f02ebbf2cc253a79e774866b05bac196c0a141a36f7108bd1828545ff` |
| Figure 2.20 | Libbrecht, &ldquo;Snow Crystals&rdquo; (arXiv:1910.06389v2) | PDF p. 65 &middot; printed p. 64 | `13-the-frontier.html` | 42,927 | `cd18b0b1a588fc3104ece64321c84e915bbebe5e60a22f5fad02f57a88c471b6` |
| Figure 2.21 | Libbrecht, &ldquo;Snow Crystals&rdquo; (arXiv:1910.06389v2) | PDF p. 67 &middot; printed p. 66 | `03-why-six-sides.html`, `09-the-menagerie.html` | 66,594 | `bd0021c2e3a8a1417740d2f3d054c638a8dde11f478e2adb51ffc6d152124c01` |
| Figure 2.22 | Libbrecht, &ldquo;Snow Crystals&rdquo; (arXiv:1910.06389v2) | PDF p. 68 &middot; printed p. 67 | `03-why-six-sides.html`, `09-the-menagerie.html` | 128,099 | `77c2ffb72c885f83aaa10eaac65a481f5b1c1e2b7674b03cd91984af7cf23dd9` |
| Figure 2.26 | Libbrecht, &ldquo;Snow Crystals&rdquo; (arXiv:1910.06389v2) | PDF p. 70 &middot; printed p. 69 | `09-the-menagerie.html` | 256,147 | `c814de28cb02284812d6b29d23b3ea33b147bad9e5b02d7417e0445e6158a7be` |
| Figure 2.3 | Libbrecht, &ldquo;Snow Crystals&rdquo; (arXiv:1910.06389v2) | PDF p. 50 &middot; printed p. 49 | `03-why-six-sides.html` | 84,559 | `cdb8bd0be98d02d56d22ab795fd2ff8648aec27b1003ef4d53b106319cb1ff25` |
| Figure 2.30 | Libbrecht, &ldquo;Snow Crystals&rdquo; (arXiv:1910.06389v2) | PDF p. 72 &middot; printed p. 71 | `09-the-menagerie.html` | 148,831 | `48749248fe376c4e283417f081493059b7cb12045140a0cfb46294b71d81c3fd` |
| Figure 2.4 | Libbrecht, &ldquo;Snow Crystals&rdquo; (arXiv:1910.06389v2) | PDF p. 50 &middot; printed p. 49 | `03-why-six-sides.html`, `13-the-frontier.html` | 31,965 | `7bbea2232e484b05678f6d93cacd5d1357a7594bac9d2bf772fe0a5b646c0b57` |
| Figure 2.5 | Libbrecht, &ldquo;Snow Crystals&rdquo; (arXiv:1910.06389v2) | PDF p. 51 &middot; printed p. 50 | `03-why-six-sides.html` | 220,323 | `67199a41747f1636ab26285894fac3ae4f1a5a3c993754c167496f6124877d4b` |
| Figure 2.6 | Libbrecht, &ldquo;Snow Crystals&rdquo; (arXiv:1910.06389v2) | PDF p. 52 &middot; printed p. 51 | `03-why-six-sides.html`, `09-the-menagerie.html`, `13-the-frontier.html` | 161,212 | `e95ba63b2631efbab2f76393241b70b435ec202c4858fe69ca79e92beb29d180` |
| Figure 2.7 | Libbrecht, &ldquo;Snow Crystals&rdquo; (arXiv:1910.06389v2) | PDF p. 53 &middot; printed p. 52 | `03-why-six-sides.html` | 175,481 | `81b0a50413185f9cee5436a48ea2a074172d34c221c77ff262702747b38b280f` |
| Figure 2.8 | Libbrecht, &ldquo;Snow Crystals&rdquo; (arXiv:1910.06389v2) | PDF p. 53 &middot; printed p. 52 | `03-why-six-sides.html` | 131,011 | `2f13d77a242608491bc608db64d37f6db43512d645728267488c3d7d6946e9a5` |
| Figure 2.9 | Libbrecht, &ldquo;Snow Crystals&rdquo; (arXiv:1910.06389v2) | PDF p. 54 &middot; printed p. 53 | `03-why-six-sides.html`, `05-the-restless-surface.html` | 151,216 | `7f78541bdc122ff9e0558c8cb4111b87c0c8ba2fcdb6d79aef54bee674199ae4` |
| Figure 3.1 | Libbrecht, &ldquo;Snow Crystals&rdquo; (arXiv:1910.06389v2) | PDF p. 78 &middot; printed p. 77 | `04-the-fuel-supply.html` | 70,579 | `0ec2967b74b9292dc29ca8cbca354164d72cc9b25d4612d0911d5c2d8dcebf6d` |
| Figure 3.10 | Libbrecht, &ldquo;Snow Crystals&rdquo; (arXiv:1910.06389v2) | PDF p. 86 &middot; printed p. 85 | `07-plates-columns-plates-columns.html`, `10-how-we-know.html` | 55,316 | `75bdb2684bd6d454487c415bc22c0a6459aa57dd27ee7d732b7f2d2c75dcc464` |
| Figure 3.16 | Libbrecht, &ldquo;Snow Crystals&rdquo; (arXiv:1910.06389v2) | PDF p. 91 &middot; printed p. 90 | `06-the-runaway-bump.html` | 55,086 | `a25c1304339b95fc646e2040431021d929b4aef7c0b7ea8f1e345fb2f03a90db` |
| Figure 3.17 | Libbrecht, &ldquo;Snow Crystals&rdquo; (arXiv:1910.06389v2) | PDF p. 92 &middot; printed p. 91 | `06-the-runaway-bump.html` | 177,464 | `ab3e08926f634a613ebadd28b4c2c461f7edbe3ca4f482c88b3318b4493e2e79` |
| Figure 3.2 | Libbrecht, &ldquo;Snow Crystals&rdquo; (arXiv:1910.06389v2) | PDF p. 78 &middot; printed p. 77 | `04-the-fuel-supply.html` | 104,324 | `14600b82cdeb523037f9a5518ef9bff7d99ed29788a983f9076b1e9df72d2963` |
| Figure 3.22 | Libbrecht, &ldquo;Snow Crystals&rdquo; (arXiv:1910.06389v2) | PDF p. 103 &middot; printed p. 102 | `06-the-runaway-bump.html` | 23,236 | `ad8950ea6fbc39982116be9802893f9797036f2074a69b9bd17240108b12210c` |
| Figure 3.24 | Libbrecht, &ldquo;Snow Crystals&rdquo; (arXiv:1910.06389v2) | PDF p. 106 &middot; printed p. 105 | `06-the-runaway-bump.html` | 27,101 | `93d9afa5f225db24d01b61ce779cf3203abbefc8b28e380df4707c7df7de7333` |
| Figure 3.26 | Libbrecht, &ldquo;Snow Crystals&rdquo; (arXiv:1910.06389v2) | PDF p. 108 &middot; printed p. 107 | `06-the-runaway-bump.html` | 152,922 | `f658401fa9e9ae5f0e15e43379305d8cbe0ec149cd1ec42907b553d48bbe0c01` |
| Figure 3.27 | Libbrecht, &ldquo;Snow Crystals&rdquo; (arXiv:1910.06389v2) | PDF p. 109 &middot; printed p. 108 | `06-the-runaway-bump.html` | 94,953 | `5bd56a09deb34ecb04e20da99e173abe32681c3dfafcf821f1e411b3721d4dd3` |
| Figure 3.29 | Libbrecht, &ldquo;Snow Crystals&rdquo; (arXiv:1910.06389v2) | PDF p. 113 &middot; printed p. 112 | `04-the-fuel-supply.html`, `05-the-restless-surface.html`, `07-plates-columns-plates-columns.html` | 102,115 | `0ce5b10fcc0e442d885862a96d154db926c737c791bb1e42cc12406130434749` |
| Figure 3.3 | Libbrecht, &ldquo;Snow Crystals&rdquo; (arXiv:1910.06389v2) | PDF p. 79 &middot; printed p. 78 | `04-the-fuel-supply.html` | 212,234 | `a0338d4dd8571bc2071b2bdaf1e81cefac3198c365dc606dcd406cee094e21ac` |
| Figure 3.30 | Libbrecht, &ldquo;Snow Crystals&rdquo; (arXiv:1910.06389v2) | PDF p. 114 &middot; printed p. 113 | `07-plates-columns-plates-columns.html` | 101,033 | `376a1b69ef53f1df29c3715e656123f58a23ff504be6892090437c723b06d956` |
| Figure 3.31 | Libbrecht, &ldquo;Snow Crystals&rdquo; (arXiv:1910.06389v2) | PDF p. 115 &middot; printed p. 114 | `07-plates-columns-plates-columns.html` | 73,893 | `c1e16cb95e4f82724beccb25f5ca785a4764c1e5f7aa9b4a38478c827fd2219b` |
| Figure 3.32 | Libbrecht, &ldquo;Snow Crystals&rdquo; (arXiv:1910.06389v2) | PDF p. 116 &middot; printed p. 115 | `07-plates-columns-plates-columns.html` | 40,021 | `ff26280589cc981a3aa49fa3949fa25d721baf3722f08aa36fc89612398803f9` |
| Figure 3.33 | Libbrecht, &ldquo;Snow Crystals&rdquo; (arXiv:1910.06389v2) | PDF p. 116 &middot; printed p. 115 | `07-plates-columns-plates-columns.html` | 49,843 | `35a5766ebdea4595d20423ed24c4d6b33c666048e5a1cb2da65c6fd986f5433b` |
| Figure 3.4 | Libbrecht, &ldquo;Snow Crystals&rdquo; (arXiv:1910.06389v2) | PDF p. 80 &middot; printed p. 79 | `05-the-restless-surface.html` | 82,697 | `d0c0d344b85e15b1b258cef84647b4eb07f5d31c026cd8960ae1e97f12533955` |
| Figure 3.5 | Libbrecht, &ldquo;Snow Crystals&rdquo; (arXiv:1910.06389v2) | PDF p. 82 &middot; printed p. 81 | `06-the-runaway-bump.html`, `07-plates-columns-plates-columns.html` | 152,589 | `e2a368ea999f8a1392373eb085f21ba0f8afeb980a84e541b8db05444800006c` |
| Figure 3.53 | Libbrecht, &ldquo;Snow Crystals&rdquo; (arXiv:1910.06389v2) | PDF p. 127 &middot; printed p. 126 | `08-a-snowflake-is-a-record.html` | 77,273 | `55b5c5501e589ff253197d3930c14704369e2229486556cf6a126cb9ac59ffa3` |
| Figure 3.54 | Libbrecht, &ldquo;Snow Crystals&rdquo; (arXiv:1910.06389v2) | PDF p. 127 &middot; printed p. 126 | `08-a-snowflake-is-a-record.html` | 201,509 | `dc80908c431415da90e680c4319794ee21c904a707f330efe9575703cecb0913` |
| Figure 3.58 | Libbrecht, &ldquo;Snow Crystals&rdquo; (arXiv:1910.06389v2) | PDF p. 130 &middot; printed p. 129 | `09-the-menagerie.html` | 201,087 | `2259c50f6810cf3b0a3b49aeb24179668db2c157ad2addd3fee5d6ed261200cd` |
| Figure 3.6 | Libbrecht, &ldquo;Snow Crystals&rdquo; (arXiv:1910.06389v2) | PDF p. 83 &middot; printed p. 82 | `06-the-runaway-bump.html` | 120,392 | `8c57a165cd8ea6dd6b7254afade4e7ed70c107e70e81945e958b3ac874f8ebca` |
| Figure 3.7 | Libbrecht, &ldquo;Snow Crystals&rdquo; (arXiv:1910.06389v2) | PDF p. 84 &middot; printed p. 83 | `06-the-runaway-bump.html` | 69,573 | `5bab3e1d584fa738fae16c259fa4db63fff9863f3e7a2362898f6338ff38c9b3` |
| Figure 3.8 | Libbrecht, &ldquo;Snow Crystals&rdquo; (arXiv:1910.06389v2) | PDF p. 84 &middot; printed p. 83 | `06-the-runaway-bump.html`, `08-a-snowflake-is-a-record.html`, `13-the-frontier.html` | 145,770 | `8ed4e3d30b20b45b09fa2e4eb05e41bf3c3820b6335ebc958b7ac157ca15604e` |
| Figure 3.9 | Libbrecht, &ldquo;Snow Crystals&rdquo; (arXiv:1910.06389v2) | PDF p. 86 &middot; printed p. 85 | `06-the-runaway-bump.html` | 191,808 | `80161188c14d9d84fcd331f0a07d2852dc1d4e592c065487385d6f474b3fd983` |
| Figure 4.10 | Libbrecht, &ldquo;Snow Crystals&rdquo; (arXiv:1910.06389v2) | PDF p. 151 &middot; printed p. 150 | `12-why-the-shape-flips.html` | 139,947 | `9c511c05e2813fed6074399c05b80193d3b6b8ff8763793e007c7dc604ebaa4e` |
| Figure 4.11 | Libbrecht, &ldquo;Snow Crystals&rdquo; (arXiv:1910.06389v2) | PDF p. 152 &middot; printed p. 151 | `11-the-stickiness-of-ice.html`, `12-why-the-shape-flips.html` | 34,004 | `186a2a7afa25a82b16b3cdd6db9d1410234fbfb7265c4d46ecb1fc02a3390f90` |
| Figure 4.12 | Libbrecht, &ldquo;Snow Crystals&rdquo; (arXiv:1910.06389v2) | PDF p. 153 &middot; printed p. 152 | `12-why-the-shape-flips.html`, `13-the-frontier.html` | 76,538 | `d226c55edd8cfdf8a22df95179a1c71a6177e89a4c7a231362d864b49a04898f` |
| Figure 4.13 | Libbrecht, &ldquo;Snow Crystals&rdquo; (arXiv:1910.06389v2) | PDF p. 154 &middot; printed p. 153 | `12-why-the-shape-flips.html` | 66,881 | `ea51cc7b41529e5b719c15591d7f736dd0b08de0569e929bc4606f773c533843` |
| Figure 4.15 | Libbrecht, &ldquo;Snow Crystals&rdquo; (arXiv:1910.06389v2) | PDF p. 156 &middot; printed p. 155 | `12-why-the-shape-flips.html` | 109,962 | `ed9b27b24d8d92be963834a9fc825104ddccad3fbb2594c857a56ee618151154` |
| Figure 4.16 | Libbrecht, &ldquo;Snow Crystals&rdquo; (arXiv:1910.06389v2) | PDF p. 157 &middot; printed p. 156 | `12-why-the-shape-flips.html` | 49,218 | `6500a1a8b63dd76e7e28686f48447ea2e6d4f24eb0ed4296b44843f8420bfa0f` |
| Figure 4.18 | Libbrecht, &ldquo;Snow Crystals&rdquo; (arXiv:1910.06389v2) | PDF p. 163 &middot; printed p. 162 | `11-the-stickiness-of-ice.html` | 79,062 | `7db796cc7ddc18179ff6f1750c91372ae7deac5972afdb4b5c8645275528b469` |
| Figure 4.2 | Libbrecht, &ldquo;Snow Crystals&rdquo; (arXiv:1910.06389v2) | PDF p. 140 &middot; printed p. 139 | `11-the-stickiness-of-ice.html` | 91,639 | `e86e15c3b9009ab3135a5f7ac78066e3b2ca3b941999df6b138906e4defb0379` |
| Figure 4.24 | Libbrecht, &ldquo;Snow Crystals&rdquo; (arXiv:1910.06389v2) | PDF p. 169 &middot; printed p. 168 | `11-the-stickiness-of-ice.html` | 140,486 | `91051808f97ce0b23df367f10a975f6ef678d450269f96faa4c1ec266d78077c` |
| Figure 4.25 | Libbrecht, &ldquo;Snow Crystals&rdquo; (arXiv:1910.06389v2) | PDF p. 169 &middot; printed p. 168 | `11-the-stickiness-of-ice.html` | 88,803 | `ac1cab27584dce1805d8e2dfce15483fa64156cfeaa9a42a459e79c745e09633` |
| Figure 4.26 | Libbrecht, &ldquo;Snow Crystals&rdquo; (arXiv:1910.06389v2) | PDF p. 173 &middot; printed p. 172 | `12-why-the-shape-flips.html`, `13-the-frontier.html` | 95,811 | `ae4b7fb9e2dc134b1567f9394abd4473d0aa1a354100a29ea6053c243a69f90c` |
| Figure 4.27 | Libbrecht, &ldquo;Snow Crystals&rdquo; (arXiv:1910.06389v2) | PDF p. 173 &middot; printed p. 172 | `12-why-the-shape-flips.html`, `13-the-frontier.html` | 86,720 | `dd2b589ec03dee33c3d7e220636ce0307b735f20c6d1ab67bbe62789a8f3acfc` |
| Figure 4.3 | Libbrecht, &ldquo;Snow Crystals&rdquo; (arXiv:1910.06389v2) | PDF p. 141 &middot; printed p. 140 | `05-the-restless-surface.html`, `11-the-stickiness-of-ice.html` | 259,063 | `1687dc2eec9741baa798807ce24f3778ab1842f15e4aa8f4c88611a6710ba6a2` |
| Figure 4.4 | Libbrecht, &ldquo;Snow Crystals&rdquo; (arXiv:1910.06389v2) | PDF p. 145 &middot; printed p. 144 | `11-the-stickiness-of-ice.html` | 42,825 | `4199e5f37bd9b29b0e51456147d0c101398bb41a7aa4d9749dce3207f55166bf` |
| Figure 4.5 | Libbrecht, &ldquo;Snow Crystals&rdquo; (arXiv:1910.06389v2) | PDF p. 145 &middot; printed p. 144 | `11-the-stickiness-of-ice.html`, `12-why-the-shape-flips.html` | 73,619 | `dbf66a7d10eff1cff2d9f42511b409d3bc5dccd53d2be93ecaa8e737b914e551` |
| Figure 4.7 | Libbrecht, &ldquo;Snow Crystals&rdquo; (arXiv:1910.06389v2) | PDF p. 148 &middot; printed p. 147 | `11-the-stickiness-of-ice.html` | 80,462 | `9e06a163e60052b4565a16a30ee14636f8310b907eb484cbea6d24bd7517d629` |
| Figure 4.8 | Libbrecht, &ldquo;Snow Crystals&rdquo; (arXiv:1910.06389v2) | PDF p. 148 &middot; printed p. 147 | `11-the-stickiness-of-ice.html` | 31,423 | `42f56d990081e3f9396acda13fb09213ef4dac0a4ff554d8bf0548d3ff914a15` |
| Figure 4.9 | Libbrecht, &ldquo;Snow Crystals&rdquo; (arXiv:1910.06389v2) | PDF p. 150 &middot; printed p. 149 | `12-why-the-shape-flips.html` | 95,899 | `3db9eb08b5970c596db259f531d6f7d8b9e40b1d69ddc3420e1207e5c5e5e10b` |
| Figure 6.20 | Libbrecht, &ldquo;Snow Crystals&rdquo; (arXiv:1910.06389v2) | PDF p. 233 &middot; printed p. 232 | `05-the-restless-surface.html` | 227,381 | `98063ee446984f0e3c8e07156c529f62c159384c36286be9d18031cd13f60005` |
| Figure 6.22 | Libbrecht, &ldquo;Snow Crystals&rdquo; (arXiv:1910.06389v2) | PDF p. 235 &middot; printed p. 234 | `07-plates-columns-plates-columns.html` | 39,396 | `a1ad5eeea773ba4c5c431a52b8b1588c0223932a586a94ccc6ab269faa23ac0f` |
| Figure 6.3 | Libbrecht, &ldquo;Snow Crystals&rdquo; (arXiv:1910.06389v2) | PDF p. 217 &middot; printed p. 216 | `10-how-we-know.html` | 96,348 | `f1132989456fa7155f28e70195adf8dae564889773b14b2e7b80aed109475c77` |
| Figure 7.1 | Libbrecht, &ldquo;Snow Crystals&rdquo; (arXiv:1910.06389v2) | PDF p. 251 &middot; printed p. 250 | `10-how-we-know.html` | 23,867 | `c4f079bd74b0203e87bbeaec748767033e199f6a2f8c22289a2cb217d8fd2b5e` |
| Figure 7.10 | Libbrecht, &ldquo;Snow Crystals&rdquo; (arXiv:1910.06389v2) | PDF p. 260 &middot; printed p. 259 | `10-how-we-know.html` | 180,726 | `c87fa2d3834e2a3dc4c679bc1926c935acb9bffff186843ea28b42dad3f25beb` |
| Figure 7.11 | Libbrecht, &ldquo;Snow Crystals&rdquo; (arXiv:1910.06389v2) | PDF p. 261 &middot; printed p. 260 | `10-how-we-know.html` | 55,272 | `6a1dd22ab5dd88c435d58cb7448e81b7c58aacdf28967c1f64c482585af4ebbb` |
| Figure 7.2 | Libbrecht, &ldquo;Snow Crystals&rdquo; (arXiv:1910.06389v2) | PDF p. 252 &middot; printed p. 251 | `10-how-we-know.html` | 31,633 | `e39bfbd331b345d316cbf2c5cde7a1a1f56e41bdff7404a3dcdde9e1e0cd39e3` |
| Figure 7.5 | Libbrecht, &ldquo;Snow Crystals&rdquo; (arXiv:1910.06389v2) | PDF p. 255 &middot; printed p. 254 | `10-how-we-know.html` | 41,094 | `436cda0850b9e1491166884daeb3088dc8499e3e6a160b6382e320da7c98fdf6` |
| Figure 7.6 | Libbrecht, &ldquo;Snow Crystals&rdquo; (arXiv:1910.06389v2) | PDF p. 256 &middot; printed p. 255 | `10-how-we-know.html` | 24,114 | `73b9cabd6cfc0ddb9d0387988d7a25f66effca8e2a9b043e0ddbe68563d53d9e` |
| Figure 7.8 | Libbrecht, &ldquo;Snow Crystals&rdquo; (arXiv:1910.06389v2) | PDF p. 259 &middot; printed p. 258 | `10-how-we-know.html` | 134,395 | `12cbf2f3ec775701669580ac063f2b1451fb32f7dc98c3e694b4bdf6bdcc5ab1` |
| Figure 8.1 | Libbrecht, &ldquo;Snow Crystals&rdquo; (arXiv:1910.06389v2) | PDF p. 280 &middot; printed p. 279 | `10-how-we-know.html` | 56,036 | `4d3d6c72fc962671862567645ccede87971fea9919f0e42cc424da31ceb79348` |
| Figure 8.2 | Libbrecht, &ldquo;Snow Crystals&rdquo; (arXiv:1910.06389v2) | PDF p. 280 &middot; printed p. 279 | `10-how-we-know.html` | 51,433 | `1faea81b008b7caeb562add1c518e5eb0d850c59f438bc54dde71c7debf95080` |
| Figure 9.1 | Libbrecht, &ldquo;Snow Crystals&rdquo; (arXiv:1910.06389v2) | PDF p. 330 &middot; printed p. 329 | `10-how-we-know.html` | 30,296 | `66d6cc4b6720b50658c4720f716ae8e9c40bd761ea0593907521289321a622cd` |
| Figure 9.16 | Libbrecht, &ldquo;Snow Crystals&rdquo; (arXiv:1910.06389v2) | PDF p. 346 &middot; printed p. 345 | `04-the-fuel-supply.html` | 258,686 | `688a47a4f2fa86073d10944030654c6848d8b6fdba73ad7ed28b7bc5fa435dc0` |
| Figure 9.17 | Libbrecht, &ldquo;Snow Crystals&rdquo; (arXiv:1910.06389v2) | PDF p. 347 &middot; printed p. 346 | `04-the-fuel-supply.html` | 257,979 | `6c7c5d31e7adbb3f10e08723600420033ccd2e7f1c027ab8c6fddfc4784f7b01` |
| Figure 9.27 | Libbrecht, &ldquo;Snow Crystals&rdquo; (arXiv:1910.06389v2) | PDF p. 354 &middot; printed p. 353 | `08-a-snowflake-is-a-record.html` | 139,392 | `be998f9ae9dc67ff2c07437928b6171bf5424b28471f0ee4e13f115fb41033ca` |
| Figure 9.28 | Libbrecht, &ldquo;Snow Crystals&rdquo; (arXiv:1910.06389v2) | PDF p. 355 &middot; printed p. 354 | `08-a-snowflake-is-a-record.html` | 142,836 | `4c5054d414d5d070dd04f0924b2555196596a1bb7dbb8fc407dddb7b55426917` |
| Figure 9.30 | Libbrecht, &ldquo;Snow Crystals&rdquo; (arXiv:1910.06389v2) | PDF p. 355 &middot; printed p. 354 | `08-a-snowflake-is-a-record.html` | 154,099 | `3d0856d7d546d3808be3aab472a7e5c55be6359444d732b0f895bdd1a03b9002` |

### Paths

| figure | path |
|---|---|
| Figure 1.1 | `research/1910.06389v2-llm/figures/fig-1.1/visual.png` |
| Figure 1.10 | `research/1910.06389v2-llm/figures/fig-1.10/visual.png` |
| Figure 1.11 | `research/1910.06389v2-llm/figures/fig-1.11/visual.png` |
| Figure 1.12 | `research/1910.06389v2-llm/figures/fig-1.12/visual.png` |
| Figure 1.13 | `research/1910.06389v2-llm/figures/fig-1.13/visual.png` |
| Figure 1.14 | `research/1910.06389v2-llm/figures/fig-1.14/visual.png` |
| Figure 1.15 | `research/1910.06389v2-llm/figures/fig-1.15/visual.png` |
| Figure 1.16 | `research/1910.06389v2-llm/figures/fig-1.16/visual.png` |
| Figure 1.17 | `research/1910.06389v2-llm/figures/fig-1.17/visual.png` |
| Figure 1.18 | `research/1910.06389v2-llm/figures/fig-1.18/visual.png` |
| Figure 1.19 | `research/1910.06389v2-llm/figures/fig-1.19/visual.png` |
| Figure 1.2 | `research/1910.06389v2-llm/figures/fig-1.2/visual.png` |
| Figure 1.20 | `research/1910.06389v2-llm/figures/fig-1.20/visual.png` |
| Figure 1.21 | `research/1910.06389v2-llm/figures/fig-1.21/visual.png` |
| Figure 1.22 | `research/1910.06389v2-llm/figures/fig-1.22/visual.png` |
| Figure 1.23 | `research/1910.06389v2-llm/figures/fig-1.23/visual.png` |
| Figure 1.24 | `research/1910.06389v2-llm/figures/fig-1.24/visual.png` |
| Figure 1.25 | `research/1910.06389v2-llm/figures/fig-1.25/visual.png` |
| Figure 1.26 | `research/1910.06389v2-llm/figures/fig-1.26/visual.png` |
| Figure 1.27 | `research/1910.06389v2-llm/figures/fig-1.27/visual.png` |
| Figure 1.28 | `research/1910.06389v2-llm/figures/fig-1.28/visual.png` |
| Figure 1.29 | `research/1910.06389v2-llm/figures/fig-1.29/visual.png` |
| Figure 1.3 | `research/1910.06389v2-llm/figures/fig-1.3/visual.png` |
| Figure 1.4 | `research/1910.06389v2-llm/figures/fig-1.4/visual.png` |
| Figure 1.5 | `research/1910.06389v2-llm/figures/fig-1.5/visual.png` |
| Figure 1.6 | `research/1910.06389v2-llm/figures/fig-1.6/visual.png` |
| Figure 1.7 | `research/1910.06389v2-llm/figures/fig-1.7/visual.png` |
| Figure 1.8 | `research/1910.06389v2-llm/figures/fig-1.8/visual.png` |
| Figure 1.9 | `research/1910.06389v2-llm/figures/fig-1.9/visual.png` |
| Figure 10.2 | `research/1910.06389v2-llm/figures/fig-10.2/visual.png` |
| Figure 10.3 | `research/1910.06389v2-llm/figures/fig-10.3/visual.png` |
| Figure 10.4 | `research/1910.06389v2-llm/figures/fig-10.4/visual.png` |
| Figure 10.5 | `research/1910.06389v2-llm/figures/fig-10.5/visual.png` |
| Figure 10.6 | `research/1910.06389v2-llm/figures/fig-10.6/visual.png` |
| Figure 10.7 | `research/1910.06389v2-llm/figures/fig-10.7/visual.png` |
| Figure 11.1 | `research/1910.06389v2-llm/figures/fig-11.1/visual.png` |
| Figure 11.4 | `research/1910.06389v2-llm/figures/fig-11.4/visual.png` |
| Figure 2.1 | `research/1910.06389v2-llm/figures/fig-2.1/visual.png` |
| Figure 2.10 | `research/1910.06389v2-llm/figures/fig-2.10/visual.png` |
| Figure 2.12 | `research/1910.06389v2-llm/figures/fig-2.12/visual.png` |
| Figure 2.13 | `research/1910.06389v2-llm/figures/fig-2.13/visual.png` |
| Figure 2.14 | `research/1910.06389v2-llm/figures/fig-2.14/visual.png` |
| Figure 2.15 | `research/1910.06389v2-llm/figures/fig-2.15/visual.png` |
| Figure 2.16 | `research/1910.06389v2-llm/figures/fig-2.16/visual.png` |
| Figure 2.17 | `research/1910.06389v2-llm/figures/fig-2.17/visual.png` |
| Figure 2.18 | `research/1910.06389v2-llm/figures/fig-2.18/visual.png` |
| Figure 2.19 | `research/1910.06389v2-llm/figures/fig-2.19/visual.png` |
| Figure 2.2 | `research/1910.06389v2-llm/figures/fig-2.2/visual.png` |
| Figure 2.20 | `research/1910.06389v2-llm/figures/fig-2.20/visual.png` |
| Figure 2.21 | `research/1910.06389v2-llm/figures/fig-2.21/visual.png` |
| Figure 2.22 | `research/1910.06389v2-llm/figures/fig-2.22/visual.png` |
| Figure 2.26 | `research/1910.06389v2-llm/figures/fig-2.26/visual.png` |
| Figure 2.3 | `research/1910.06389v2-llm/figures/fig-2.3/visual.png` |
| Figure 2.30 | `research/1910.06389v2-llm/figures/fig-2.30/visual.png` |
| Figure 2.4 | `research/1910.06389v2-llm/figures/fig-2.4/visual.png` |
| Figure 2.5 | `research/1910.06389v2-llm/figures/fig-2.5/visual.png` |
| Figure 2.6 | `research/1910.06389v2-llm/figures/fig-2.6/visual.png` |
| Figure 2.7 | `research/1910.06389v2-llm/figures/fig-2.7/visual.png` |
| Figure 2.8 | `research/1910.06389v2-llm/figures/fig-2.8/visual.png` |
| Figure 2.9 | `research/1910.06389v2-llm/figures/fig-2.9/visual.png` |
| Figure 3.1 | `research/1910.06389v2-llm/figures/fig-3.1/visual.png` |
| Figure 3.10 | `research/1910.06389v2-llm/figures/fig-3.10/visual.png` |
| Figure 3.16 | `research/1910.06389v2-llm/figures/fig-3.16/visual.png` |
| Figure 3.17 | `research/1910.06389v2-llm/figures/fig-3.17/visual.png` |
| Figure 3.2 | `research/1910.06389v2-llm/figures/fig-3.2/visual.png` |
| Figure 3.22 | `research/1910.06389v2-llm/figures/fig-3.22/visual.png` |
| Figure 3.24 | `research/1910.06389v2-llm/figures/fig-3.24/visual.png` |
| Figure 3.26 | `research/1910.06389v2-llm/figures/fig-3.26/visual.png` |
| Figure 3.27 | `research/1910.06389v2-llm/figures/fig-3.27/visual.png` |
| Figure 3.29 | `research/1910.06389v2-llm/figures/fig-3.29/visual.png` |
| Figure 3.3 | `research/1910.06389v2-llm/figures/fig-3.3/visual.png` |
| Figure 3.30 | `research/1910.06389v2-llm/figures/fig-3.30/visual.png` |
| Figure 3.31 | `research/1910.06389v2-llm/figures/fig-3.31/visual.png` |
| Figure 3.32 | `research/1910.06389v2-llm/figures/fig-3.32/visual.png` |
| Figure 3.33 | `research/1910.06389v2-llm/figures/fig-3.33/visual.png` |
| Figure 3.4 | `research/1910.06389v2-llm/figures/fig-3.4/visual.png` |
| Figure 3.5 | `research/1910.06389v2-llm/figures/fig-3.5/visual.png` |
| Figure 3.53 | `research/1910.06389v2-llm/figures/fig-3.53/visual.png` |
| Figure 3.54 | `research/1910.06389v2-llm/figures/fig-3.54/visual.png` |
| Figure 3.58 | `research/1910.06389v2-llm/figures/fig-3.58/visual.png` |
| Figure 3.6 | `research/1910.06389v2-llm/figures/fig-3.6/visual.png` |
| Figure 3.7 | `research/1910.06389v2-llm/figures/fig-3.7/visual.png` |
| Figure 3.8 | `research/1910.06389v2-llm/figures/fig-3.8/visual.png` |
| Figure 3.9 | `research/1910.06389v2-llm/figures/fig-3.9/visual.png` |
| Figure 4.10 | `research/1910.06389v2-llm/figures/fig-4.10/visual.png` |
| Figure 4.11 | `research/1910.06389v2-llm/figures/fig-4.11/visual.png` |
| Figure 4.12 | `research/1910.06389v2-llm/figures/fig-4.12/visual.png` |
| Figure 4.13 | `research/1910.06389v2-llm/figures/fig-4.13/visual.png` |
| Figure 4.15 | `research/1910.06389v2-llm/figures/fig-4.15/visual.png` |
| Figure 4.16 | `research/1910.06389v2-llm/figures/fig-4.16/visual.png` |
| Figure 4.18 | `research/1910.06389v2-llm/figures/fig-4.18/visual.png` |
| Figure 4.2 | `research/1910.06389v2-llm/figures/fig-4.2/visual.png` |
| Figure 4.24 | `research/1910.06389v2-llm/figures/fig-4.24/visual.png` |
| Figure 4.25 | `research/1910.06389v2-llm/figures/fig-4.25/visual.png` |
| Figure 4.26 | `research/1910.06389v2-llm/figures/fig-4.26/visual.png` |
| Figure 4.27 | `research/1910.06389v2-llm/figures/fig-4.27/visual.png` |
| Figure 4.3 | `research/1910.06389v2-llm/figures/fig-4.3/visual.png` |
| Figure 4.4 | `research/1910.06389v2-llm/figures/fig-4.4/visual.png` |
| Figure 4.5 | `research/1910.06389v2-llm/figures/fig-4.5/visual.png` |
| Figure 4.7 | `research/1910.06389v2-llm/figures/fig-4.7/visual.png` |
| Figure 4.8 | `research/1910.06389v2-llm/figures/fig-4.8/visual.png` |
| Figure 4.9 | `research/1910.06389v2-llm/figures/fig-4.9/visual.png` |
| Figure 6.20 | `research/1910.06389v2-llm/figures/fig-6.20/visual.png` |
| Figure 6.22 | `research/1910.06389v2-llm/figures/fig-6.22/visual.png` |
| Figure 6.3 | `research/1910.06389v2-llm/figures/fig-6.3/visual.png` |
| Figure 7.1 | `research/1910.06389v2-llm/figures/fig-7.1/visual.png` |
| Figure 7.10 | `research/1910.06389v2-llm/figures/fig-7.10/visual.png` |
| Figure 7.11 | `research/1910.06389v2-llm/figures/fig-7.11/visual.png` |
| Figure 7.2 | `research/1910.06389v2-llm/figures/fig-7.2/visual.png` |
| Figure 7.5 | `research/1910.06389v2-llm/figures/fig-7.5/visual.png` |
| Figure 7.6 | `research/1910.06389v2-llm/figures/fig-7.6/visual.png` |
| Figure 7.8 | `research/1910.06389v2-llm/figures/fig-7.8/visual.png` |
| Figure 8.1 | `research/1910.06389v2-llm/figures/fig-8.1/visual.png` |
| Figure 8.2 | `research/1910.06389v2-llm/figures/fig-8.2/visual.png` |
| Figure 9.1 | `research/1910.06389v2-llm/figures/fig-9.1/visual.png` |
| Figure 9.16 | `research/1910.06389v2-llm/figures/fig-9.16/visual.png` |
| Figure 9.17 | `research/1910.06389v2-llm/figures/fig-9.17/visual.png` |
| Figure 9.27 | `research/1910.06389v2-llm/figures/fig-9.27/visual.png` |
| Figure 9.28 | `research/1910.06389v2-llm/figures/fig-9.28/visual.png` |
| Figure 9.30 | `research/1910.06389v2-llm/figures/fig-9.30/visual.png` |
