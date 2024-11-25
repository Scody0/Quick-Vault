// ==UserScript==
// @name         Quick Vault
// @namespace    http://tampermonkey.net/
// @version      3.0
// @description  Quick access panel to sites with modern design and extra features
// @author       Scody
// @match        *://*/*
// @grant        none
// ==/UserScript==

(function () {
    'use strict';

    const STORAGE_KEY = 'quick_access_sites';
    const MAX_SLOTS = 10;
    let quickAccessSites = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];

    function saveSites() {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(quickAccessSites));
    }

    // Добавление стилей
    const style = document.createElement('style');
    style.textContent = `
        /* Панель */
        #quick-access-panel {
            position: fixed;
            top: 20px;
            right: 20px;
            width: 320px;
            background: #121212;
            border: 2px solid;
            border-image-slice: 1;
            border-image-source: linear-gradient(45deg, #ff6ec4, #7873f5);
            border-radius: 20px;
            box-shadow: 0 10px 20px rgba(0, 0, 0, 0.5);
            color: white;
            font-family: 'Arial', sans-serif;
            padding: 15px;
            z-index: 9999;
            overflow: hidden;
            transition: transform 0.5s ease, opacity 0.5s ease;
            animation: fadeIn 0.7s ease-in-out;
        }

        /* Кнопка сворачивания панели */
        #quick-access-panel .toggle-btn {
            position: absolute;
            top: 10px;
            left: 10px;
            background: none;
            border: none;
            color: white;
            font-size: 18px;
            cursor: pointer;
            transition: transform 0.3s;
        }

        #quick-access-panel .toggle-btn:hover {
            transform: rotate(180deg);
        }

        /* Перетаскиваемость панели */
        #quick-access-panel {
            cursor: move;
        }

        /* Элементы в панели */
        #quick-access-panel h3 {
            text-align: center;
            margin: 0 0 15px;
            font-size: 18px;
            letter-spacing: 1px;
            text-transform: uppercase;
            display: block;
        }

        #quick-access-panel ul {
            list-style: none;
            padding: 0;
            margin: 0;
            max-height: 300px;
            overflow-y: auto;
            scrollbar-width: none; /* Убираем полосы прокрутки в Firefox */
        }

        #quick-access-panel ul::-webkit-scrollbar {
            display: none; /* Убираем полосы прокрутки в Chrome */
        }

        #quick-access-panel li {
            display: flex;
            align-items: center;
            background: linear-gradient(45deg, #232526, #414345);
            border-radius: 10px;
            padding: 10px;
            margin-bottom: 10px;
            cursor: pointer;
            transition: transform 0.3s ease, background 0.3s ease;
        }

        #quick-access-panel li:hover {
            transform: translateX(5px);
            background: linear-gradient(45deg, #414345, #232526);
        }

        #quick-access-panel img {
            width: 40px;
            height: 40px;
            margin-right: 10px;
            border-radius: 50%;
            border: 2px solid #fff;
            transition: transform 0.3s ease;
        }

        #quick-access-panel li:hover img {
            transform: rotate(10deg) scale(1.1);
        }

        #quick-access-panel a {
            flex-grow: 1;
            text-decoration: none;
            color: white;
            font-size: 14px;
            font-weight: bold;
            transition: color 0.3s;
        }

        #quick-access-panel a:hover {
            color: #ff6ec4;
        }

        #quick-access-panel button {
            background: none;
            border: none;
            color: white;
            font-size: 16px;
            cursor: pointer;
            transition: color 0.3s ease, transform 0.3s ease;
        }

        #quick-access-panel button:hover {
            color: #ff6ec4;
            transform: scale(1.1);
        }

        #quick-access-panel #add-site-btn {
            display: block;
            width: 100%;
            padding: 12px;
            background: linear-gradient(45deg, #ff6ec4, #7873f5);
            border-radius: 12px;
            border: none;
            color: white;
            font-size: 16px;
            cursor: pointer;
            transition: background 0.3s ease, transform 0.3s ease;
        }

        #quick-access-panel #add-site-btn:hover {
            background: linear-gradient(45deg, #7873f5, #ff6ec4);
            transform: translateY(-3px);
        }

        @keyframes fadeIn {
            from {
                opacity: 0;
                transform: translateY(-20px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }
    `;
    document.head.appendChild(style);

    // Создание панели
    const panel = document.createElement('div');
    panel.id = 'quick-access-panel';
    panel.innerHTML = `
        <button class="toggle-btn">▼</button>
        <h3>Quick Vault</h3>
        <ul id="site-list"></ul>
        <button id="add-site-btn">➕ Add a website</button>
    `;
    document.body.appendChild(panel);

    // Функция для перетаскивания панели
    let isDragging = false;
    let offsetX = 0, offsetY = 0;

    panel.onmousedown = function(e) {
        isDragging = true;
        offsetX = e.clientX - panel.getBoundingClientRect().left;
        offsetY = e.clientY - panel.getBoundingClientRect().top;
        panel.style.cursor = 'move';
    };

    document.onmousemove = function(e) {
        if (isDragging) {
            panel.style.left = `${e.clientX - offsetX}px`;
            panel.style.top = `${e.clientY - offsetY}px`;
        }
    };

    document.onmouseup = function() {
        isDragging = false;
        panel.style.cursor = 'default';
    };

    // Скрытие и показ панели
    document.querySelector('.toggle-btn').onclick = function() {
        const panelContent = document.querySelector('#site-list, #add-site-btn');
        const panelTitle = document.querySelector('#quick-access-panel > h3');

        if (panelContent.style.display === 'none') {
            panelContent.style.display = 'block';
            panelTitle.style.display = 'block';
            this.textContent = '▼'; // Показать
        } else {
            panelContent.style.display = 'none';
            panelTitle.style.display = 'block';
            this.textContent = '▶'; // Скрыть
        }
    };

    // Функция рендеринга сайтов
    function renderSites() {
        const siteList = document.getElementById('site-list');
        siteList.innerHTML = '';

        quickAccessSites.forEach((site, index) => {
            const li = document.createElement('li');

            const icon = document.createElement('img');
            icon.src = site.icon || `https://www.google.com/s2/favicons?sz=64&domain_url=${site.url}`;
            icon.alt = site.name || 'icon';

            const name = document.createElement('a');
            name.textContent = site.name || site.url;
            name.href = site.url;
            name.target = '_blank';

            const editBtn = document.createElement('button');
            editBtn.textContent = '✏️';
            editBtn.onclick = () => {
                const newName = prompt('Enter a new name:', site.name || site.url);
                const newIcon = prompt('Enter a new icon URL (or leave blank for default):', site.icon || '');
                if (newName) {
                    site.name = newName;
                }
                if (newIcon) {
                    site.icon = newIcon;
                }
                saveSites();
                renderSites();
            };

            const deleteBtn = document.createElement('button');
            deleteBtn.textContent = '❌';
            deleteBtn.onclick = () => {
                if (confirm('Remove a site from the dashboard?')) {
                    quickAccessSites.splice(index, 1);
                    saveSites();
                    renderSites();
                }
            };

            li.appendChild(icon);
            li.appendChild(name);
            li.appendChild(editBtn);
            li.appendChild(deleteBtn);
            siteList.appendChild(li);
        });
    }

    // Добавление нового сайта
    document.getElementById('add-site-btn').onclick = () => {
        if (quickAccessSites.length >= MAX_SLOTS) {
            alert(`You can't add more than ${MAX_SLOTS} sites.`);
            return;
        }

        const url = prompt('Enter the site URL:');
        if (!url) return;

        const name = prompt('Enter a name for the site:');
        const icon = prompt('Enter an icon URL (optional):');

        const site = {
            url,
            name: name || url,
            icon: icon || null,
        };

        quickAccessSites.push(site);
        saveSites();
        renderSites();
    };

    renderSites();
})();
