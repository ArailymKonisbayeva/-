# Обложки новых произведений — 20 октября 2026

Созданы встроенным инструментом image_gen (не CLI/API). Навык imagegen использован для создания отдельных растровых иллюстраций в стиле существующих обложек. Это редакционные художественные интерпретации, не документальные портреты или оригинальные издательские обложки.

Файлы:

- `assets/works/covers/batyr-bayan.png`
- `assets/works/covers/aqqular-uiyqtaganda.png`
- `assets/works/covers/qaragoz.png`
- `assets/works/covers/qulager-poem.png`

## Точные запросы

Каждый запрос составлен из следующего шаблона с подстановками ниже:

```text
Use case: illustration-story. Asset: original vertical literary cover for a Kazakh educational website, 2:3 portrait. Cinematic realistic painterly illustration, sophisticated natural textures, warm golden light and muted teal shadows, matching a coherent premium literary poster collection. Scene: {scene} Reserve clear upper 25% for elegant ivory serif typography: author small at top, exact text "{author}", subtle thin ornamental divider, title large below, exact text "{title}". Correct Kazakh Cyrillic spelling. All lettering within generous safe margins. Full bleed art, no book mockup, no border, no publisher logo, no watermark, no extra words. Interpretive illustration, not a historical documentary portrait. Save the generated image for use as {id}.png in the local project.
```

### batyr-bayan

- author: Мағжан Жұмабаев
- title: Батыр Баян
- scene: A solemn Kazakh steppe warrior in historically inspired eighteenth-century clothing, dark horse beside him, windswept grass and distant Kokshetau hills, contemplative rather than fighting. No violence, no fantasy armor.

### aqqular-uiyqtaganda

- author: Мұқағали Мақатаев
- title: Аққулар ұйықтағанда
- scene: Two beautiful white swans quietly floating on a secluded mountain lake at dawn, reeds, soft mist, luminous reflections, wistful calm, no people, no weapons, no injury.

### qaragoz

- author: Мұхтар Әуезов
- title: Қарагөз
- scene: Portrait of a thoughtful young adult Kazakh woman wearing refined traditional cream and burgundy clothing, braided dark hair, dim yurt interior opening onto a muted evening steppe, restrained tragic emotion, no violence.

### qulager-poem

- author: Ілияс Жансүгіров
- title: Құлагер
- scene: A magnificent light bay Kazakh racehorse with dark mane standing on a rolling golden steppe, distant hills and dramatic clouds at sunset, proud but wistful mood, no rider, no injury.

## Подключение

Общий список `data/work-covers.js` подключён в `index.html`. Его используют существующие компоненты каталога и квестов (`experience.js`), страницы произведения (`work-detail.js`) и выбора произведения для игры (`national-games.js`). Прежние обложки не заменялись.
