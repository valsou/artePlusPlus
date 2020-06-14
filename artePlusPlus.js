// ==UserScript==
// @name         Arte++
// @version      1.1
// @description  Download videos of Arte.tv
// @downloadURL  https://github.com/valsou/artePlusPlus/blob/master/artePlusPlus.js
// @author       Valentin MEZIN
// @include      https://www.arte.tv/*
// @run-at       document-body
// @grant        GM_addStyle
// @grant        GM_setClipboard
// @noframes
// ==/UserScript==

'use strict';

GM_addStyle(`
.arte-plus-plus .row {
margin-bottom: 1.25rem;
}

.arte-plus-plus a {
color: #9f9f9f;
border: 0.05rem solid #535353;
}

.arte-plus-plus .row a,
.arte-plus-plus .row span {
font-size: 1.1rem;
padding: .3rem;
display: inline-block;
}

.arte-plus-plus .copypaste {
background-color: #535353;
color: #2F2F2F;
border: 0.05rem solid #535353;
cursor: pointer;
}

.arte-plus-plus .columns {
margin-bottom : 0.5rem;
}

.link-plus-plus {
display: inline-block;
}

.link-plus-plus .copypaste:hover,
.link-plus-plus .copypaste.copied {
background-color: white;
color: #2F2F2F;
border-color: white;
}

.link-plus-plus a:hover {
background-color: white;
color: #2F2F2F;
border-color: white;
}

.link-plus-plus a:hover .copypaste {
background-color: transparent;
color: #9f9f9f;
}`);

const ARTE_API = 'https://api.arte.tv/api/player/v1/config/';
const REGEX = /https:\/\/www.arte.tv\/(fr|de|en|es|pl|it)\/videos\/\d{6}-\d{3}-[A-Z]\//;
const ELEMENT_TO_OBSERVE = document.querySelector('body');
const PARENT_TO_APPEND = '.metas-infos';
const LOCALE = {
    'downloads': {
        'fr_FR': 'Téléchargements',
        'de_DE': 'Downloads',
        'en_EN': 'Downloads',
        'es_ES': 'Descargas',
        'pl_PL': 'Pliki do pobrania',
        'it_IT': 'Download'},
    'copy': {
        'fr_FR': 'Copier',
        'de_DE': 'Kopieren',
        'en_EN': 'Copy',
        'es_ES': 'Copiar',
        'pl_PL': 'Kopiuj',
        'it_IT': 'Copia'},
    'copied': {
        'fr_FR': 'Copié !',
        'de_DE': 'Kopiert !',
        'en_EN': 'Copied !',
        'es_ES': 'Copiado !',
        'pl_PL': 'Skopiowane !',
        'it_IT': 'Copiato !'}
};
const ICON_COPY = '&#x2398';

let last_page_viewed = "";

console.log("Arte++ is running...");

(function() {
    console.log("Observing...");

    let nodeElement = ELEMENT_TO_OBSERVE;
    let config = { attributes: true, subtree: true };

    let callback = function(mutationsList) {

        for(var mutation of mutationsList) {

            if (mutation.target.className == 'video-thumbnail') {

                if (last_page_viewed != mutation.target.baseURI) {

                    console.log("Page changed : "+ window.location.pathname);

                    if (mutation.target.baseURI.match(REGEX)) {
                        last_page_viewed = mutation.target.baseURI;
                        getJSON();
                    }

                }

            }

        }

    };

    let observer = new MutationObserver(callback);
    observer.observe(nodeElement, config);
})();

function getJSON() {
    let location = window.location.pathname.split("/");
    let lang = location[1];
    let video_id = location[3];
    let api_base_url = ARTE_API + lang + "/";
    let api_url = api_base_url + video_id;

    fetch(api_url)
        .then(
        function(response) {
            response.json().then(function(data) {
                getLinks(data);
            });
        }
    );
}

function getLinks(json) {
    let video_data = json.videoJsonPlayer.VSR;
    let video_keys = Object.keys(video_data);
    let parsed_data = [];
    let array_to_return = [];

    Array.from(video_keys).forEach((key) => {
        let data = video_data[key];

        if (data.mimeType.startsWith("video") === false) {
            return;
        }

        let keep = {
            title: data.versionLibelle,
            code: data.versionCode,
            country_code: data.versionShortLibelle,
            url: data.url,
            width: data.width,
            height: data.height,
            bitrate: data.bitrate,
            extension: data.mediaType
        };

        parsed_data.push(keep);
    });

    array_to_return.videos = parsed_data;

    // add lang of website to show right translations :)
    array_to_return.isoLang = json.videoJsonPlayer.videoIsoLang;

    showLinks(array_to_return);
}

function showLinks(data) {

    let versions = data.videos.sort(sortingByLang);
    let parent = document.querySelector(PARENT_TO_APPEND).parentElement;
    let content = document.createElement("section");
    let ul = document.createElement("div");
    let old_label = "";

    parent.after(content);

    content.insertAdjacentHTML('beforeend', '<h1><span class="program-title">'+LOCALE.downloads[data.isoLang]+'</span></h1>');
    content.classList.add("program-section", "margin-bottom-s", "arte-plus-plus");
    ul.classList.add("row");

    versions.forEach( function(element) {

        let label = element.title;

        if (label != old_label || old_label == "") {

            if (label != old_label && old_label != "") {
                content.appendChild(ul);
                ul = document.createElement("div");
                ul.classList.add("row");
            }

            let subtitle = document.createElement("h2");

            content.appendChild(subtitle);
            subtitle.insertAdjacentHTML('beforeend', '<span class="program-title small">'+label+'</span>');

            old_label = label;
        }

        ul.insertAdjacentHTML('beforeend', '<div class="columns small-12 medium-6 large-3 "><div class="link-plus-plus"><a class="copied" target="_blank" title="'+element.title+'" href="'+element.url+'">'+element.extension.toUpperCase()+' ('+element.width+'x'+element.height+')</a><span class="copypaste">'+ICON_COPY+' '+LOCALE.copy[data.isoLang]+'</span></div></div>');

    });

    content.appendChild(ul);

    let copypaste = document.querySelectorAll('.copypaste');
    let last_copied = [];

    Array.from(copypaste).forEach(link => {

        link.addEventListener('click', function(event) {
            console.log(last_copied);

            if (last_copied[0] != undefined) {
                clearTimeout(last_copied[0]);
                copied(last_copied[1], ICON_COPY+' '+LOCALE.copy[data.isoLang], false);
            }

            copied(link, ICON_COPY+' '+LOCALE.copied[data.isoLang], true);

            last_copied = [setTimeout(function(timer){
                copied(link, ICON_COPY+' '+LOCALE.copy[data.isoLang], false);
            }, 400), link];

            GM_setClipboard(link.previousSibling.href, "text")

        });
    });
}

function sortingByLang (a, b) {
    if (a.code=== b.code) {
        return b.bitrate - a.bitrate;
    }
    return a.code > b.code ? 1 : -1;
}

function copied(element, message, bool) {
    if (bool) {
        element.innerHTML = message;
        element.classList.add("copied");
    } else {
        element.innerHTML = message;
        element.classList.remove("copied");
    }
}