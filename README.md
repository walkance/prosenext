## ProseNext

![image](https://user-images.githubusercontent.com/19423413/216985377-0acfc21b-cbbe-4671-8987-472c492d8bc3.png)

`ProseNext` - библиотека-обёртка для WYSIWYG редактора [@prosemirror](https://github.com/ProseMirror).

Работа с библиотекой осуществляется через класс [ProseNext](modules/core/index.ts). 

Для удобства работы с библиотекой функции объединены в модули, которые оформлены в виде классов, реализующих интерфейс [ProseNextPlugin](modules/core/plugin.interface.ts). 

Для подключения той или иной функции достаточно добавить нужный объект класса модуля в массив `plugins` в аргументе конструктора класса `ProseNext`

```ts
const proseNext = new ProseNext({
  // ...
  plugins: [
    new BasePlugin({invertEnter: true, allowRich: true}),
    new TablePlugin(),
    new ImagePlugin({}),
    new ContextMenuPlugin(),
    new PlaceholderPlugin({text: 'Enter some value'}),
  ],
  // ...
});
```

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
  - сейчас код содержит копию старой версии виджета таблиц https://github.com/ProseMirror/prosemirror-tables на js, частично переведенного на ts
  - добавлена возможность менять высоту строк таблицы

### Функции, которые требуется реализовать

- Доработать существующий [виджет таблиц](/modules/table) 
    - за основу нужно взять последнюю версию виджета таблиц на `typescript` https://github.com/ProseMirror/prosemirror-tables
    - в проекте уже реализовано изменение размеров строк таблицы, его нужно сохранить (для этого можно переписать с нуля или перенести текущую логику в последнюю версию виджета)
    - контекстное меню
        - создание новых строк/столбцов
        - удаление строк/столбцов
        - объединение выделенных строк/столбцов
    - изменение размеров строк/столбцов
    - изменение размеров таблицы
    - кнопка для создания переноса строки перед/после таблицы по аналогии с редактором [cdkeditor](https://ckeditor.com/ckeditor-5)
      - ![image](https://user-images.githubusercontent.com/19423413/216959242-f38cf21a-85df-4818-b9f1-c577ebc1c101.png)
- Добавить функции форматирования в плагин [Base](/modules/basic)
    - изменение размеров выделенного текста
    - выбор шрифта выделенного текста
    - к функциями выделения курсивом и полужирным текстом добавить функции подчеркивания/зачеркивания текста
    - выбор цвета выделенного текста  / фона выделенного текста
- Работа с подсветкой синтаксиса кода
    - Добавить базоваую подствеку синтаксиса кода (через https://prosemirror.net/examples/codemirror/)
    - Оформить в виде модуля, в конфигурации передавать список поддерживаемых языков
    - Возможность указать язык для кода (главное - поддержка json)
    - При работе в режиме редактора должен отображаться полноценный редактор в редактирумеом поле с кодом
    - Для отображения итогового html c подсветкой синтаксиса не должно быть необходимости в подключении кода этой библиотеки
    - Для рендеринга `json` в html желательно добавить возможность подключения только модулей для подсветки синтаксиса (не для редактирования)
- Работа с маркированными и нумерованными списками (плагин [Base](/modules/basic))
    - возможность создания
    - форматирование списков (внешний вид маркеров)
- Добавить возможность различных вариантов отображения кнопок с доступными действиями (дополнительно к контекстному меню)
    - Для разработки меню можно использовать существующие библиотеки от разработчиков https://github.com/ProseMirror
    - Здесь и далее под "меню" подразумевается набор доступных действий над выделенным текстом / документом / позицией курсора в документе. Этот набор действий и способо его отображения должны быть конфигурируемы
    - `BalloonBlockMenuModule` попап с кнопками-иконками (например, появляется при выделении текста `balloon-block` в `cke-editor`)
      - ![image](https://user-images.githubusercontent.com/19423413/216954182-049acef9-6e30-4984-b5e5-96a997f0bff0.png)
    - `HeaderMenuModule` меню с кнопками (текст, иконка, текст + иконка) и выпадающими списками в заголовке редактора
      - ![image](https://user-images.githubusercontent.com/19423413/216954398-8e075ddc-9610-48f9-9f07-07fe805928dd.png)
    - оформить в виде подключаемых модулей
    - в плагинах меню должна быть опция для указания
      - какие из действий мы хотим видеть
      - в каком порядке
      - внешний вид действия (иконка/текст/иконка+текст/выпадающий список действий)
    - сохранить абстракцию для вызова действий над выделенным текстом / документом / позицией курсора в документе
      - доступные действия добавляются через объекты `MenuItem` (на данный момент, плагины для этого реализуют метод `getContextMenu`, в котором возвращается список доступных действий)
- `LinkEditorModule` Добавить действие в меню для прикрепления ссылки к выделенному тексту + возможность редактирования уже добавленной ссылки (через меню)
- `ImagePlugin` Доработка функций работы с изображениями
    - добавление изображения через действие в меню
    - добавить кнпоку переноса строки перед/после изображением по аналогии с таблицей
    - при изменении размеров изображения оно не должно выходить за размеры редактируемой области
- В заголовок редактора добавить выпадающий список с выбором готовых шаблонов форматирования текста
  - ![image](https://user-images.githubusercontent.com/19423413/216960168-9da863c7-e5c6-4371-9a7a-ebe9a1961af2.png)
  - Доступен, только если включен модуль с отображением меню в заголовке виджета (оформить через модуль соответственно)
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
- При тестировании библиотеки убедиться, что она корректно возвращает полученный пользователем html, так json объект, который может быть использован для инициализации редактора или сконвертирован с помощью него в html
- Для презентации результатов работы с библиотекой использовать `jest` тесты, примеры в папке test (для тестирования команда `yarn test`)
  - Для тестирования можно использовать библиотеку https://www.npmjs.com/package/jest-prosemirror и ей подобные
- Вести разработку последовательно для возможности отслеживания прогресса выполнения задач

### Шаги для начала разработки
- Установить `nodejs` версии `18.14.0`, например, через `nvm` (`nvm install`)
- Отметить все зависимости нашего пакета как `dependencies` в `package.json`
- Выполнить в консоли следущий набор команд
 - `yarn install // установка пакетов`
 - `yarn prepack // инициализация хуков husky`
 - `yarn start // запуск webpack-dev-server сервера`
 
Точки входа
- `lib.ts` - точка входа для экспортирования кода как библиотеки  (используется при вызове `yarn build`)
- `index.ts`, `index.html` - точки входа для разработки и отладки (используются при вызове `yarn start`)

Для инициализации библиотеки можно использовать одно из двух полей `doc` и `fromJSON`. `doc` принимает HTML вершину с контентом, который может быть скомипилирован в состояние prosemirror. `fromJSON` принимает состояние prosemirror, которое можно получить через `editorView.state.doc`

Описание основных методов

| Метод                                     | Описание                                                                        |
|-------------------------------------------|---------------------------------------------------------------------------------|
| ```getViewHTMLFromJson(json: object): string;``` | Возвращает HTML строку на основе json объекта переданного состояния prosemirror |
| `getHTMLFromState(): string;`                | Возвращает HTML строку на основе текущего состояния prosemirror                 |
|`getJSONFromState(): string;`|  Возвращает JSON текущего состояния prosemirror |
| `reset(input: HTMLElement): void;`           | Заменяет текущее состояние на состояние переданное через HTML элемент           |
| `ImagePlugin.replaceImageUrlsAsync(getNewUrl: (node: Node) => Promise<string>): Promise<void[]>;`         | Обновляет url в нодах с изобаржениями, с помощью асинзронного колбека           |
| `ImagePlugin.replaceImageUrls(getNewUrl: (node: Node) => string): void;` | То же, что и предыдущий метод, но синхронно |

### Как опубликовать пакет в локальный репозиторий
- Отметить все зависимости как `dependencies` в `package.json`
- Собрать проект командой `yarn build`
- Указать новую версию в `package.json` в соответствии с семантическим версионированием
- Заполнить `.npmignore`
- Проверить всё ли верно получилось с помощью `npm pack`
- Отметить все зависимости из раздела `dependecies` как `peerDependencies` в `package.json` (не сохранять именно эти изменения в репозитории)
- Вызвать команду `yarn npm publish`
