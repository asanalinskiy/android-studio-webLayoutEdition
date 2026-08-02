// Элементы UI
const xmlInput = document.getElementById('xmlInput');
const preview = document.getElementById('preview');
const errorMessage = document.getElementById('errorMessage');
const btnFormat = document.getElementById('btnFormat');
const btnRun = document.getElementById('btnRun');
const statusText = document.getElementById('statusText');

// 🎮 ГЛОБАЛЬНЫЕ ФУНКЦИИ И СОСТОЯНИЯ ДЛЯ РАЗНЫХ XML
// -------------------------------------------------------------
// Переменные для XML Кликера:
window.crystals = 12450;
window.clickPower = 1;

// Эта функция автоматически вызовется, если в XML написано: android:onClick="onMineClick"
window.onMineClick = function(event, element) {
    window.crystals += window.clickPower;
    const scoreText = preview.querySelector('#txtScore');
    if (scoreText) {
        scoreText.textContent = `💎 ${window.crystals.toLocaleString()}`;
    }
};

// Эта функция вызовется, если в XML написано: android:onClick="onBuyUpgrade"
window.onBuyUpgrade = function(event, element) {
    if (window.crystals >= 500) {
        window.crystals -= 500;
        window.clickPower += 2;
        const scoreText = preview.querySelector('#txtScore');
        if (scoreText) scoreText.textContent = `💎 ${window.crystals.toLocaleString()}`;
        
        element.textContent = 'BOUGHT! ✓';
        element.style.backgroundColor = '#4B5563';
        setTimeout(() => {
            element.textContent = 'BUY 500 💎';
            element.style.backgroundColor = '#16A34A';
        }, 1000);
    } else {
        alert('Не хватает кристаллов!');
    }
};

// Пример функции для ЛЮБОГО другого XML (например, формы входа или настроек)
window.onCustomButtonClick = function(event, element) {
    alert(`Нажата кнопка: ${element.textContent}`);
};
// -------------------------------------------------------------


// Дефолтный XML (с добавленными android:onClick!)
const defaultXml = `<LinearLayout
    android:layout_width="match_parent"
    android:layout_height="match_parent"
    android:orientation="vertical"
    android:background="#111827"
    android:padding="20dp">

    <!-- Header Card -->
    <LinearLayout
        android:layout_width="match_parent"
        android:layout_height="wrap_content"
        android:orientation="vertical"
        android:background="#1F2937"
        android:padding="20dp"
        android:elevation="6dp">

        <TextView
            android:layout_width="wrap_content"
            android:layout_height="wrap_content"
            android:text="CRYSTAL MINER PRO"
            android:textColor="#9CA3AF"
            android:textSize="12sp"
            android:textStyle="bold" />

        <TextView
            android:id="@+id/txtScore"
            android:layout_width="wrap_content"
            android:layout_height="wrap_content"
            android:text="💎 12,450"
            android:textColor="#38BDF8"
            android:textSize="36sp"
            android:textStyle="bold"
            android:layout_marginTop="8dp" />

        <ProgressBar
            android:layout_width="match_parent"
            android:layout_height="8dp"
            android:progress="65"
            android:layout_marginTop="15dp" />
    </LinearLayout>

    <Space
        android:layout_width="match_parent"
        android:layout_height="20dp" />

    <!-- Кнопка с android:onClick="onMineClick" -->
    <Button
        android:id="@+id/btnClicker"
        android:layout_width="match_parent"
        android:layout_height="80dp"
        android:text="MINE CRYSTAL!"
        android:background="#0284C7"
        android:textColor="#FFFFFF"
        android:textSize="18sp"
        android:textStyle="bold"
        android:elevation="8dp"
        android:onClick="onMineClick" />

    <Space
        android:layout_width="match_parent"
        android:layout_height="20dp" />

    <TextView
        android:layout_width="wrap_content"
        android:layout_height="wrap_content"
        android:text="Upgrades &amp; Boosts"
        android:textColor="#F3F4F6"
        android:textSize="18sp"
        android:textStyle="bold"
        android:layout_marginBottom="12dp" />

    <!-- Upgrade Item 1 -->
    <LinearLayout
        android:layout_width="match_parent"
        android:layout_height="wrap_content"
        android:orientation="horizontal"
        android:background="#1F2937"
        android:padding="12dp"
        android:gravity="center_vertical"
        android:layout_marginBottom="10dp">

        <TextView
            android:layout_width="match_parent"
            android:layout_height="wrap_content"
            android:text="Auto Miner (v1.0)"
            android:textColor="#E5E7EB"
            android:textSize="14sp"
            android:layout_weight="1" />

        <!-- Кнопка с android:onClick="onBuyUpgrade" -->
        <Button
            android:layout_width="wrap_content"
            android:layout_height="wrap_content"
            android:text="BUY 500 💎"
            android:background="#16A34A"
            android:textColor="#FFFFFF"
            android:textSize="12sp"
            android:onClick="onBuyUpgrade" />
    </LinearLayout>

    <!-- Upgrade Item 2 -->
    <LinearLayout
        android:layout_width="match_parent"
        android:layout_height="wrap_content"
        android:orientation="horizontal"
        android:background="#1F2937"
        android:padding="12dp"
        android:gravity="center_vertical">

        <TextView
            android:layout_width="match_parent"
            android:layout_height="wrap_content"
            android:text="Super Power Click"
            android:textColor="#E5E7EB"
            android:textSize="14sp"
            android:layout_weight="1" />

        <Switch
            android:layout_width="wrap_content"
            android:layout_height="wrap_content"
            android:checked="true" />
    </LinearLayout>

</LinearLayout>`;

xmlInput.value = defaultXml;

// 1. Запрос к Python бэкенду
async function renderXml() {
    const rawXml = xmlInput.value;
    errorMessage.style.display = 'none';

    if (!rawXml.trim()) {
        preview.innerHTML = '';
        return;
    }

    try {
        statusText.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Parsing...`;

        const response = await fetch('/api/parse-xml', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ xml: rawXml })
        });

        const data = await response.json();

        if (!data.success) {
            errorMessage.textContent = data.error;
            errorMessage.style.display = 'block';
            statusText.innerHTML = `<i class="fa-solid fa-xmark" style="color:#ff4d4d"></i> XML Error`;
            return;
        }

        // Рендерим дерево
        preview.innerHTML = '';
        const nodeElement = renderJsonNode(data.tree);
        preview.appendChild(nodeElement);

        statusText.innerHTML = `<i class="fa-solid fa-check-double" style="color:#3DDC84"></i> Rendered successfully`;

    } catch (err) {
        errorMessage.textContent = "Простите, упали сервера или Python решил прикольнутся над вами..";
        errorMessage.style.display = 'block';
        statusText.innerHTML = `<i class="fa-solid fa-triangle-exclamation" style="color:#eab308"></i> Server Offline`;
    }
}

// 2. Универсальный рендерер JSON -> DOM
function renderJsonNode(node) {
    const tag = node.tag.toLowerCase();
    const attrs = node.attributes || {};
    let el;

    switch (tag) {
        case 'linearlayout':
        case 'relativelayout':
        case 'constraintlayout':
        case 'framelayout':
            el = document.createElement('div');
            el.style.display = 'flex';
            el.style.boxSizing = 'border-box';
            const orientation = attrs.orientation || attrs['android:orientation'] || 'horizontal';
            el.style.flexDirection = orientation === 'vertical' ? 'column' : 'row';

            if (tag === 'constraintlayout' || tag === 'relativelayout') {
                el.style.position = 'relative';
            }
            break;

        case 'cardview':
        case 'androidx.cardview.widget.cardview':
            el = document.createElement('div');
            el.style.display = 'flex';
            el.style.flexDirection = 'column';
            el.style.borderRadius = '12px';
            el.style.overflow = 'hidden';
            el.style.boxSizing = 'border-box';
            break;

        case 'scrollview':
            el = document.createElement('div');
            el.style.display = 'block';
            el.style.overflowY = 'auto';
            el.style.maxHeight = '100%';
            break;

        case 'space':
            el = document.createElement('div');
            break;

        case 'textview':
            el = document.createElement('div');
            el.textContent = attrs.text || attrs['android:text'] || '';
            break;

        case 'edittext':
            el = document.createElement('input');
            el.type = 'text';
            el.value = attrs.text || attrs['android:text'] || '';
            el.placeholder = attrs.hint || attrs['android:hint'] || 'Введите текст...';
            el.style.border = '1px solid #4B5563';
            el.style.backgroundColor = '#1F2937';
            el.style.color = '#FFFFFF';
            el.style.borderRadius = '6px';
            el.style.padding = '8px 12px';
            el.style.outline = 'none';
            break;

        case 'button':
            el = document.createElement('button');
            el.textContent = attrs.text || attrs['android:text'] || 'Button';
            el.style.cursor = 'pointer';
            el.style.border = 'none';
            el.style.borderRadius = '8px';
            el.style.fontWeight = '600';
            el.style.transition = 'transform 0.1s ease';

            // Нативный микро-отклик
            el.addEventListener('mousedown', () => el.style.transform = 'scale(0.96)');
            el.addEventListener('mouseup', () => el.style.transform = 'scale(1)');
            el.addEventListener('mouseleave', () => el.style.transform = 'scale(1)');

            // 🎯 ОБРАБОТКА android:onClick ДЛЯ ЛЮБОГО XML!
            const onClickHandler = attrs.onClick || attrs['android:onClick'];
            if (onClickHandler && typeof window[onClickHandler] === 'function') {
                el.addEventListener('click', (e) => window[onClickHandler](e, el));
            }
            break;

        case 'imageview':
            el = document.createElement('img');
            el.src = attrs.src || attrs['android:src'] || 'https://via.placeholder.com/150';
            el.style.objectFit = 'cover';
            break;

        case 'progressbar':
            el = document.createElement('progress');
            el.max = 100;
            el.value = attrs.progress || attrs['android:progress'] || 50;
            el.style.width = '100%';
            break;

        case 'switch':
        case 'checkbox':
            el = document.createElement('input');
            el.type = 'checkbox';
            el.checked = (attrs.checked || attrs['android:checked']) === 'true';
            el.style.cursor = 'pointer';
            el.style.width = '22px';
            el.style.height = '22px';
            el.style.accentColor = '#3DDC84';
            break;

        default:
            el = document.createElement('div');
            break;
    }

    // Сохраняем ID элемента для DOM доступа
    if (attrs.id || attrs['android:id']) {
        const rawId = attrs.id || attrs['android:id'];
        el.id = rawId.replace('@+id/', '').replace('@id/', '');
    }

    applyJsonStyles(attrs, el);

    if (node.children && node.children.length > 0) {
        node.children.forEach(childNode => {
            el.appendChild(renderJsonNode(childNode));
        });
    }

    return el;
}

// 3. Маппер атрибутов Android XML -> CSS
function applyJsonStyles(attrs, htmlEl) {
    for (let [key, val] of Object.entries(attrs)) {
        const cleanKey = key.replace('android:', '').replace('app:', '');

        if (cleanKey === 'layout_width') htmlEl.style.width = parseDimension(val);
        if (cleanKey === 'layout_height') htmlEl.style.height = parseDimension(val);
        if (cleanKey === 'layout_weight') htmlEl.style.flex = val;

        if (cleanKey === 'background' || cleanKey === 'cardBackgroundColor') {
            htmlEl.style.backgroundColor = val;
        }
        if (cleanKey === 'textColor') htmlEl.style.color = val;

        if (cleanKey === 'padding') htmlEl.style.padding = parseDimension(val);
        if (cleanKey === 'paddingTop') htmlEl.style.paddingTop = parseDimension(val);
        if (cleanKey === 'paddingBottom') htmlEl.style.paddingBottom = parseDimension(val);
        if (cleanKey === 'paddingStart' || cleanKey === 'paddingLeft') htmlEl.style.paddingLeft = parseDimension(val);
        if (cleanKey === 'paddingEnd' || cleanKey === 'paddingRight') htmlEl.style.paddingRight = parseDimension(val);

        if (cleanKey === 'layout_margin') htmlEl.style.margin = parseDimension(val);
        if (cleanKey === 'layout_marginTop') htmlEl.style.marginTop = parseDimension(val);
        if (cleanKey === 'layout_marginBottom') htmlEl.style.marginBottom = parseDimension(val);
        if (cleanKey === 'layout_marginStart' || cleanKey === 'layout_marginLeft') htmlEl.style.marginLeft = parseDimension(val);
        if (cleanKey === 'layout_marginEnd' || cleanKey === 'layout_marginRight') htmlEl.style.marginRight = parseDimension(val);

        if (cleanKey === 'textSize') htmlEl.style.fontSize = parseDimension(val);
        if (cleanKey === 'textStyle') {
            if (val.includes('bold')) htmlEl.style.fontWeight = 'bold';
            if (val.includes('italic')) htmlEl.style.fontStyle = 'italic';
        }

        if (cleanKey === 'gravity' || cleanKey === 'layout_gravity') {
            applyGravity(val, htmlEl);
        }

        if (cleanKey === 'elevation' || cleanKey === 'cardElevation') {
            const p = parseInt(val) || 4;
            htmlEl.style.boxShadow = `0px ${p}px ${p * 2}px rgba(0, 0, 0, 0.4)`;
        }

        if (cleanKey === 'cardCornerRadius') {
            htmlEl.style.borderRadius = parseDimension(val);
        }
    }
}

function applyGravity(gravityValue, el) {
    if (gravityValue.includes('center')) {
        el.style.justifyContent = 'center';
        el.style.alignItems = 'center';
    }
    if (gravityValue.includes('center_horizontal')) el.style.justifyContent = 'center';
    if (gravityValue.includes('center_vertical')) el.style.alignItems = 'center';
    if (gravityValue.includes('right') || gravityValue.includes('end')) el.style.justifyContent = 'flex-end';
}

function parseDimension(value) {
    if (value === 'match_parent' || value === 'fill_parent') return '100%';
    if (value === 'wrap_content') return 'max-content';
    if (value.endsWith('dp') || value.endsWith('sp') || value.endsWith('px')) {
        return parseInt(value) + 'px';
    }
    return value;
}

if (btnFormat) {
    btnFormat.addEventListener('click', () => {
        let xmlStr = xmlInput.value;
        let reg = /(>)(<)(\/*)/g;
        xmlStr = xmlStr.replace(reg, '$1\r\n$2$3');
        let pad = 0;
        let formatted = '';

        xmlStr.split('\r\n').forEach((node) => {
            let indent = 0;
            if (node.match(/.+<\/\w[^>]*>$/)) {
                indent = 0;
            } else if (node.match(/^<\/\w/)) {
                if (pad !== 0) pad -= 4;
            } else if (node.match(/^<\w[^>]*[^\/]>.*$/)) {
                indent = 4;
            }
            let padding = '';
            for (let i = 0; i < pad; i++) padding += ' ';
            formatted += padding + node + '\r\n';
            pad += indent;
        });
        xmlInput.value = formatted.trim();
    });
}

if (btnRun) {
    btnRun.addEventListener('click', renderXml);
}

let timeout = null;
xmlInput.addEventListener('input', () => {
    clearTimeout(timeout);
    timeout = setTimeout(renderXml, 300);
});

renderXml();
