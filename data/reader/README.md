# Reader data

The existing app routes `#read/<canonical-work-id>` through `experience.js` to
`LiteraryReader.open` in `reader.js`. `reader.css` is scoped to reader UI.
Work detail and catalogue enhancements preserve their original controls.

## Availability and provenance

`ertostik.json` contains the **complete narrative of the linked source version**:
12 reader-created sections, 159 reading blocks, approximately 5,880 words.
It runs from Ерназар's family to the final reunion with Кенжекей.
Folklore has variants; this is not a claim to include every variant.
Other canonical works now show the curated reading destinations from
`../reading-sources.js`, with explicit audio, access and verification limits.
`aiqai` remains pending; see `../../READING_SOURCES_REPORT.md`. No modern copyrighted full text is
included. The folklore text is from the cited Әдебиет порталы page; the package
records the folklore rights basis and excludes that edition's images/editorial
material. Review the specific edition and rights before adding any other text.

`ulpan.json` contains only the user-provided excerpt of Ғабит Мүсірепов's
`Ұлпан`: 851 source paragraphs and about 21,500 words. It is explicitly marked
`excerpt`, not a complete novel. Ten numbered reader sections were added only
for navigation; paragraph order and wording are preserved. Twelve curated
historical or ethnographic terms have editorial explanations, while ordinary
word clicks use the shared local Apertium Kazakh–Russian dictionary.

The source's 135 HTML paragraphs were imported in order without abridgement.
Long paragraphs were split for reading; whitespace was normalized. Letters,
punctuation and even apparent source typos were retained. `source.textSha256`
records the whitespace-normalized full narrative, verified against the source.
The first four paragraph IDs/texts and the first two chapter IDs/order remain
unchanged so previous reader positions and saved explanations remain valid.
Progress now weights text length, not paragraph count, and labels full text
as `толық мәтін` instead of `үзінді`.

Verified dictionary examples now cover twelve entries and twenty-one occurrences:
`Төрт түлік`, `Шаңырақ`, `Күлдіреуіш`, `Мосы`, `Бұйда`, `Әбзел`, `Жабы`,
`Түндік`, `Қос`, `Енші`, `Жасау`, and `Отау`.
Their source references are in `lexicon[*].source`; the additional occurrences
across the full text are grouped by paragraph ID in top-level `annotationIndex`.
Definitions are paraphrases, not copied dictionary entries. `contextualMeaning`
and `note` are explicitly labelled editorial interpretation in the UI.
Other words (including `жұт`, `түндік`, `бақыр`, `көзіне түседі`) currently
have no curated definitions and must not be silently filled with guesses.

## Adding a work

1. Confirm the exact edition, permission/public-domain basis and source URL.
2. Add a JSON package and register its canonical ID in `manifest` in `reader.js`.
3. Include `version`, `workId`, `status` (`excerpt` for incomplete text), `notice`,
   `source`, `lexicon`, and `chapters`. Do not describe an excerpt as a full work.
4. Every chapter has a stable `id`, reader-visible `title`, and `paragraphs`.
   Every paragraph has a unique stable `id`, original `text`, and `annotations`.
5. Each annotation uses `entryId`, `type` (`word`, `phrase`, `sentence`, `fragment`)
   and either exact `quote` plus zero-based `occurrence`, or UTF-16 `start`/`end`
   offsets (end exclusive). If both quote and offsets are present they must agree.
   Phrase ranges win over word ranges; overlaps are resolved before HTML rendering.
6. Lexicon entries include `id`, `term`, `type`, `category`, `basicMeaning`,
   `simpleExplanation`, `contextualMeaning`, optional `note`/`forms`, and `source`.
   Do not reuse one contextual interpretation for unrelated occurrences: create
   a separate entry ID. Unannotated lookup shows only general dictionary meaning.
7. Optional paragraph `commentary` contains `label`, `summary`, `meaning`, and
   `importance`. It is separate from the unmodified original text.

Text packages load on opening that reader (or explicitly loading its general
dictionary), never all works at startup. Only the current chapter is rendered.
Search indexes the loaded work, highlights original offsets without splitting
text on spaces, and preserves annotation buttons.

## Local persistence

Keys use `adebiet-reader-v1::<current-user-email-or-guest>::` plus `progress:<id>`
or `words`. Progress stores chapter, paragraph, relative paragraph position, font,
mode and explanation level. Saved words store source, work, meaning and context.
This is device-local storage, not account synchronization or an access-control
boundary; clearing browser storage removes it. No API or generated definitions.

## Checks

Run `node tests/reader-data.cjs` for data, source, range-priority and syntax checks.
Initial excerpt browser QA on Chrome: 1440×1000 and 390×844; all 13 library read links, phrase and
word dialogs, chapter navigation, eight search hits for Ерназар, original text
preservation, saved words and deletion, user isolation, resume, font/modes,
unavailable state, Escape dismissal, mobile width and bottom sheet. No runtime
exceptions in those flows. These checks do not constitute a full end-to-end
regression of every existing game.

Full-text update QA: compared every rendered paragraph in all 12 sections with
the data package; verified the original `p4` bookmark/font survives, final-section
resume after reload, 100% completion, search for the final sentence, the existing
phrase dialog, and mobile widths on sections 5, 9, 11 and 12. No JavaScript
exceptions in the completed test run. The two sourced dictionary entries remain
the same; importing the full narrative does not imply every word is annotated.
