# DATA AUDIT REPORT

Проверка выполнена по принципу `VERIFY → RECORD → CORRECT → VALIDATE`.

Проверены файлы `app.js`, `provided-literary-works.js`, `canonical-catalog.js`, `catalog-ui.js`, `integration-ui.js`, `story.js`, `game-fixes.js`, `addons.js`, `literary-kazakhstan.js`, а также все связи карты с 13 произведениями.

## CRITICAL

### Issue #1

- File: `app.js`, `canonical-catalog.js`, `addons.js`
- Object: `alpan`
- Field: `title`, `author`
- Current value: `Алпан`, в исходном массиве автор `Сәбит Мұқанов`
- Problem: название и автор не совпадают с произведением в расширенном наборе и библиографическим источником.
- Verified value: `Ұлпан`, автор `Ғабит Мүсірепов`
- Source: Әдебиет порталы — https://adebiportal.kz/kz/audiobooks/view/600 ; https://adebiportal.kz/en/authors/view/2624
- Confidence: HIGH
- Action: CORRECT

### Issue #2

- File: `app.js`, `canonical-catalog.js`, `provided-literary-works.js`
- Object: `aiqai`
- Field: `author`, `genre`
- Current value: `Шерхан Мұртаза` / `Авторын нақтылау қажет`; в импортированном наборе — `Тынышбай Нұрмағамбетов`; жанр — `Роман` немесе белгісіз.
- Problem: авторство и написание имени расходятся; надёжные литературные источники называют автора Тынымбай Нұрмағамбетов, жанр — повесть.
- Verified value: `Тынымбай Нұрмағамбетов`, `Повесть`
- Source: Қазақ әдебиеті — https://qazaqadebieti.kz/25826/b-l-aj-aj-aj-aj-aj ; ҚазҰУ — https://philart.kaznu.kz/index.php/1-FIL/ru/article/view/947
- Confidence: HIGH
- Action: CORRECT

### Issue #3

- File: `app.js`, `canonical-catalog.js`
- Object: `kozy`, `ertostik`
- Field: `author`
- Current value: `Халық эпосы`, `Халық ертегісі`, `Халықтық мұра`
- Problem: эти значения описывают вид материала, но выглядят как персональный автор и не имеют общего `authorType`.
- Verified value: `authorType: "folklore"`, `author: "Халық ауыз әдебиеті"`
- Source: внутренняя жанровая классификация проекта; персональный автор в источниках не установлен.
- Confidence: HIGH
- Action: CORRECT

## IMPORTANT

### Issue #4

- File: `literary-kazakhstan.js`
- Object: все 20 регионов
- Field: `geometry`
- Current value: вручную созданные приблизительные SVG-полигоны.
- Problem: искусственные промежутки, искажённый внешний контур и несоприкасающиеся области.
- Verified value: GeoJSON из QazGeo OGC API, 20 актуальных единиц регионального уровня.
- Source: QazGeo — https://qgeo.tech/ogc/collections/regions/items?limit=100 ; описание набора — https://qgeo.tech/ru/data/layers
- Confidence: HIGH
- Action: REPLACE

### Issue #5

- File: `literary-kazakhstan.js`
- Object: авторы карты
- Field: `currentRegionId`
- Current value: часть связей была записана без сохранённого URL-источника.
- Problem: общеизвестность не равна проверенной provenance-записи.
- Verified value: подтверждённые связи получили точный URL; остальные сохранены с `verificationStatus: "needs-review"`.
- Source: конкретные страницы Әдебиет порталы, перечисленные в данных и разделе SOURCES.
- Confidence: MIXED
- Action: VERIFY OR MARK NEEDS REVIEW

### Issue #6

- File: `literary-kazakhstan.js`
- Object: карта регионов
- Field: административное деление
- Current value: 20 элементов присутствовали, но их форма не подтверждала актуальные границы.
- Problem: после образования областей Абай, Жетісу и Ұлытау в 2022 году необходим актуальный слой.
- Verified value: 17 областей и 3 города республиканского значения.
- Source: Правительство РК — https://www.gov.kz/memleket/entities/tourism/press/news/details/559200 ; Бюро национальной статистики — https://stat.gov.kz/upload/iblock/704/vaqdfw9pbex6yys53x5pu8aid6jdlihd/%D0%92-18-16-%D0%9F%20%28%D0%B0%D0%BD%D0%B3%29.pdf
- Confidence: HIGH
- Action: CORRECT

## MINOR / TECHNICAL

### Issue #7

- File: `canonical-catalog.js`, `provided-literary-works.js`
- Object: ID aliases
- Field: `id`
- Current value: основной ID `alpan`, импортированный `ulpan`; другие записи также используют разные транслитерации.
- Problem: переименование основного ID сейчас сломает сохранённый прогресс и маршруты.
- Verified value: оставить стабильные внутренние ID и использовать централизованный alias-map.
- Confidence: HIGH
- Action: KEEP ID, CORRECT DISPLAY DATA

### Issue #8

- File: `literary-kazakhstan.js`
- Object: изображения авторов
- Field: `portrait`
- Current value: достоверные локальные лицензированные файлы отсутствуют.
- Problem: нельзя подменять реальную фотографию AI-изображением или случайной фотографией.
- Verified value: нейтральная монограмма и явный `aria-label`.
- Confidence: HIGH
- Action: USE PLACEHOLDER

## CORRECTIONS APPLIED

1. `Алпан / Сәбит Мұқанов` → `Ұлпан / Ғабит Мүсірепов` → исправлены каталог, карточки и игровой distractor.
2. `Айқай / Шерхан Мұртаза` и `Тынышбай` → `Айқай / Тынымбай Нұрмағамбетов` → жанр исправлен на `Повесть`.
3. Фольклорные произведения → добавлен `authorType: "folklore"`; фиктивное место рождения не создаётся.
4. Approximate SVG → QazGeo GeoJSON; области соприкасаются, stroke уменьшен до 1.8 px, transform геометрии при hover удалён.
5. Добавлены отдельные provenance-поля и `needs-review` для неподтверждённых записей.

## NEEDS REVIEW

- Полные сюжеты, персонажи и темы большинства импортированных произведений остаются пользовательскими данными без внешней построчной проверки.
- Жанровая граница `әңгіме / повесть / хикаят` для части произведений в источниках может различаться; существующие статусы `PARTIALLY_VERIFIED` сохранены.
- Региональные связи авторов `Абай Құнанбайұлы`, `Оралхан Бөкей`, `Жұбан Молдағалиев`, `Махамбет Өтемісұлы`, `Ғабит Мүсірепов`, `Сәкен Сейфуллин`, `Жүсіпбек Аймауытов`, `Әбдіжәміл Нұрпейісов`, `Ілияс Жансүгіров` требуют добавления конкретной страницы-источника в локальную provenance-запись; они помечены `needs-review`.
- Для Астана, Алматы и Шымкент авторы не добавлялись только по факту учёбы, работы или проживания: критерий карты — место рождения.
- Для регионов без проверенной карточки достопримечательности показано честное состояние пополнения данных.

## SOURCES

- QazGeo OGC regions: https://qgeo.tech/ogc/collections/regions/items?limit=100
- QazGeo dataset passport: https://qgeo.tech/ru/data/layers
- Правительство РК, новая карта: https://www.gov.kz/memleket/entities/tourism/press/news/details/559200
- Әбіш Кекілбайұлы: https://adebiportal.kz/kz/authors/view/3352
- Мұхтар Әуезов: https://adebiportal.kz/en/authors/view/2625
- Сайын Мұратбеков: https://adebiportal.kz/kz/authors/view/1819
- Шерхан Мұртаза: https://adebiportal.kz/kz/authors/view/1163
- Бауыржан Момышұлы: https://adebiportal.kz/kz/authors/view/1171
- Бердібек Соқпақбаев: https://adebiportal.kz/ru/authors/view/320
- Тахауи Ахтанов: https://adebiportal.kz/kz/authors/view/1272
- Ыбырай Алтынсарин: https://adebiportal.kz/kz/authors/view/1166
- Ілияс Есенберлин: https://adebiportal.kz/kz/authors/view/2229
- Мұхтар Шаханов: https://adebiportal.kz/kz/authors/view/933
- Ұлпан: https://adebiportal.kz/kz/audiobooks/view/600
- Айқай: https://qazaqadebieti.kz/25826/b-l-aj-aj-aj-aj-aj
- Қызыл жебе: https://adebiportal.kz/kz/books/view/qyzyl-zebe__4186
- Маңғыстау нысандары: https://kazakhstan.travel/kz/routes/mangystau-04-11
- Қожа Ахмет Ясауи кесенесі: https://kazakhstan.travel/en/attractions/371
- Шарын шатқалы: https://kazakhstan.travel/kz/attractions/54
- Бурабай: https://altynorda.kazakhstan.travel/kz/routes-item/36
