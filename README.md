## ProseNext

`ProseNext` - библиотека-обёртка для WYSIWYG редактора [@prosemirror](https://github.com/ProseMirror).

Работа с библиотекой осуществляется через класс [ProseNext](modules/core/index.ts). 

Для удобства работы с библиотекой функции объединены в модули и модули оформлены в виде классов, реализующих интерфейс [ProseNextPlugin](modules/core/plugin.interface.ts). 

Для подключения той или иной функции достаточно добавить нужный объект класса модуля в массив `plugins` в аргументе конструктора класса `ProseNext`

### Функции, которые уже реализованы

- `BasePlugin` базовые функции маркировки текста
  - выделение полужирным
  - выделение курсивом
  - форматирование текста под заголовок
  - форматирование текста под код (фон + monospace шрифт)
  - отображение ссылок (добавляются автоматически в полученном html через `linkify`)
- `Placeholder` отображение текстового заполнителя по аналогии с HTML элементами input и textarea
- `ContextMenuPlugin` выпадающее контекстное меню при нажатии ПКМ
- `ImagePlugin` работа с изображениями
  - вставка изображений из контекстного меню
  - вставка изображений через CTRL+V
  - изменение размеров изображения
- `TablePlugin`
  - функции доступные из [официального плагина](https://github.com/ProseMirror/prosemirror-tables)
  - работа с таблицей из контекстного меню

### Функции, которые требуется реализовать

- Доработать существующий [виджет таблиц](/modules/table) 
    - изначально виджет был написа
    - за основу нужно взять последнюю версию виджета таблиц на `typescript` https://github.com/ProseMirror/prosemirror-tables
    - в проекте уже реализовано изменение размеров строк таблицы, его нужно сохранить, переписать с нуля или перенести текущую логику в последнюю версию виджета
    - контекстное меню
        - создание новых строк/столбцов
        - удаление строк/столбцов
        - объединение выделенных строк/столбцов
    - изменение размеров строк/столбцов
    - изменение размеров таблицы
    - кнопка для создания переноса строки перед/после таблицы по аналогии с редактором [cdkeditor](https://ckeditor.com/ckeditor-5)
- Добавить функции форматирования в плагин [Base](/modules/basic)
    - изменение размеров выделенного текста
    - выбор шрифта выделенного текста
    - к функциями выделения курсивом и полужирным текстом добавить функции подчеркивания/зачеркивания текста
    - выбор цвета выделенного текста
- Работа с маркированными и нумерованными списками (плагин [Base](/modules/basic))
    - возможность создания
    - форматирование списков (внешний вид маркеров)
- Добавить возможность различных вариантов отображения кнопок с доступными действиями (дополнительно к контекстному меню)
    - `BalloonBlockMenuModule` попап с иконками (появляется при выделении текста balloon-block в cke-editor)
    - `HeaderMenuModule` меню с кнопками и выпадающими списками в заголовке редактора
    - оформить в виде подключаемых модулей
    - в плагинах меню должна быть опция для указания, какие из действий мы хотим видеть и в каком порядке
    - сохранить абстракцию для вызова действий над выделенным текстом / документом / позицией курсора в документе
      - доступные действия добавляются через объекты `MenuItem` (на данный момент, плагины для этого реализуют метод `getContextMenu`, в котором возвращается список доступных действий)
- `LinkEditorModule` Добавить действие в меню для прикрепления ссылки к выделенному тексту + возможность редактирования уже добавленной ссылки (через меню)
- `ImagePlugin` Доработка функций работы с изображениями
    - добавление изображения через действие в меню
    - при изменении размеров изображения оно не должно выходить за размеры редактируемой области
- В заголовок редактора добавить выпадающий список с выбором готовых шаблонов форматирования текста
  - Доступен только если включен модуль с отображением меню в заголовке виджета
  - Header/paragraph и т.д., оставить возможность для добавления шаблонов
  - Оформить как `MenuItem` доступный только для заголовка
- Добавить возможность принимать в конфигурации библиотеки функцию - провайдер иконок
  - Принимает идентификатор иконки - возвращает объект `SVGElement`
  - Использовать этот провайдер для отоборажения иконок внутри меню

### Общие требования к разработке
- Вести разработку в рамках текущей конфигурации (`yarn`, `webpack`, `typescript`, `css|scss`).
- Использовать текущую конфигурацию `eslint` и валидировать код перед коммитами в репозиторий, предлагается использовать `husky` (для инициализации команда `yarn prepack`).
- Использовать последние версии библиотек `prosemirror`. Часть из этих скопирована в исходный код проекта и переведена на typescript.
- Перед работой ознакомиться с документацией фреимворка https://prosemirror.net/docs/.
- Работа с библиотекой осуществляется через класс [ProseNext](/modules/core/index.ts). Для удобства работы с библиотекой модули оформлены в виде классов [ProseNextPlugin](https://github.com/walkance/prosenext/blob/4fcb632474f9e923da054507008631f50a5c88c3/modules/core/plugin.interface.ts). Для подключения той или иной функции достаточно добавить нужный объект в массив `plugins`. При возможности добавлять новые функции в виде плагинов данного формата.
- При добавлении новых действий, убедиться, что для них работают команды UNDO/REDO.
- При возможности добавлять новые функции в виде плагинов [ProseNextPlugin](/modules/core/plugin.interface.ts).
- При добавлении плагинов нужно учесть, что используемые модули [ProseNextPlugin](/modules/core/plugin.interface.ts) будут подгружаться по требованию
- При добавлении новой верстки желательно убедиться, что она соответствует существующей методологии Smac/BEM и может быть легко стилизована подключением css файла с темой.

### How to develop
- mark all dependencies as `dependencies` in `package.json`
- yarn install
- yarn start
- yarn prepack - to init husky
- `lib.ts` - exports as library
- `index.ts`, `index.html` - entrypoint for development

### How to publish
- mark all dependencies as `dependencies` in `package.json`
- build project with `yarn build`
- set a new version in `package.json`
- mark all dependencies as peerDependencies in `package.json` (do not save this changes in repo)
- `yarn npm publish`
